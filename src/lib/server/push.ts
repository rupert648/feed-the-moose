import { buildPushHTTPRequest } from '@pushforge/builder';
import type { D1Database } from '@cloudflare/workers-types';
import { log } from './logger';

interface PushSubscription {
	id: number;
	user_id: number;
	endpoint: string;
	key_p256dh: string;
	key_auth: string;
}

interface PushPayload {
	title: string;
	body: string;
	url?: string;
}

export async function savePushSubscription(
	db: D1Database,
	userId: number,
	endpoint: string,
	p256dh: string,
	auth: string
): Promise<void> {
	log.push.info('Saving subscription', { userId, endpoint: endpoint.slice(0, 50) });
	await db
		.prepare(
			`INSERT INTO push_subscriptions (user_id, endpoint, key_p256dh, key_auth)
			 VALUES (?, ?, ?, ?)
			 ON CONFLICT(endpoint) DO UPDATE SET
			 user_id = excluded.user_id,
			 key_p256dh = excluded.key_p256dh,
			 key_auth = excluded.key_auth`
		)
		.bind(userId, endpoint, p256dh, auth)
		.run();
	log.push.info('Subscription saved', { userId });
}

export async function removePushSubscription(db: D1Database, endpoint: string): Promise<void> {
	await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
}

export async function getAllSubscriptions(db: D1Database): Promise<PushSubscription[]> {
	const result = await db
		.prepare('SELECT id, user_id, endpoint, key_p256dh, key_auth FROM push_subscriptions')
		.all<PushSubscription>();
	return result.results;
}

export async function sendPushToAll(
	db: D1Database,
	privateJWK: string,
	subject: string,
	payload: PushPayload
): Promise<{ sent: number; failed: number; total: number }> {
	const subscriptions = await getAllSubscriptions(db);
	log.push.info('Found subscriptions', { count: subscriptions.length });

	if (subscriptions.length === 0) {
		log.push.warn('No subscriptions to send to');
		return { sent: 0, failed: 0, total: 0 };
	}

	let sent = 0;
	let failed = 0;

	const sendPromises = subscriptions.map(async (sub) => {
		log.push.info('Sending to subscription', { subId: sub.id, endpoint: sub.endpoint.slice(0, 50) });
		try {
			const { endpoint, headers, body } = await buildPushHTTPRequest({
				privateJWK,
				message: {
					payload: {
						title: payload.title,
						body: payload.body,
						data: { url: payload.url || '/' }
					},
					options: {
						ttl: 86400,
						urgency: 'normal'
					},
					adminContact: subject
				},
				subscription: {
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.key_p256dh,
						auth: sub.key_auth
					}
				}
			});

			log.push.debug('Built request, posting to push service', { subId: sub.id });

			const response = await fetch(endpoint, {
				method: 'POST',
				headers,
				body
			});

			log.push.info('Push response', { subId: sub.id, status: response.status, statusText: response.statusText });

			if (response.status === 410 || response.status === 404) {
				log.push.warn('Subscription stale, removing', { subId: sub.id });
				await removePushSubscription(db, sub.endpoint);
				failed++;
			} else if (response.status >= 200 && response.status < 300) {
				sent++;
			} else {
				const text = await response.text();
				log.push.error('Unexpected response', { subId: sub.id, status: response.status, body: text });
				failed++;
			}
		} catch (e) {
			log.push.error('Failed to send push', { subId: sub.id, error: String(e) });
			failed++;
		}
	});

	await Promise.allSettled(sendPromises);
	log.push.info('Push batch complete', { sent, failed, total: subscriptions.length });
	return { sent, failed, total: subscriptions.length };
}
