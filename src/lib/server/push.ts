import { buildPushHTTPRequest } from '@pushforge/builder';
import type { D1Database } from '@cloudflare/workers-types';

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
): Promise<void> {
	const subscriptions = await getAllSubscriptions(db);

	const sendPromises = subscriptions.map(async (sub) => {
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

			const response = await fetch(endpoint, {
				method: 'POST',
				headers,
				body
			});

			if (response.status === 410 || response.status === 404) {
				await removePushSubscription(db, sub.endpoint);
			}
		} catch (e) {
			console.error('Failed to send push to', sub.endpoint, e);
		}
	});

	await Promise.allSettled(sendPromises);
}
