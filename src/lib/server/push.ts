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
	console.log(`[push] Saving subscription for user ${userId}, endpoint: ${endpoint.slice(0, 50)}...`);
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
	console.log(`[push] Subscription saved for user ${userId}`);
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
	console.log(`[push] Found ${subscriptions.length} subscriptions`);

	if (subscriptions.length === 0) {
		console.log('[push] No subscriptions to send to');
		return { sent: 0, failed: 0, total: 0 };
	}

	let sent = 0;
	let failed = 0;

	const sendPromises = subscriptions.map(async (sub) => {
		console.log(`[push] Sending to subscription ${sub.id}, endpoint: ${sub.endpoint.slice(0, 50)}...`);
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

			console.log(`[push] Built request for ${sub.id}, posting to push service...`);

			const response = await fetch(endpoint, {
				method: 'POST',
				headers,
				body
			});

			console.log(`[push] Response for ${sub.id}: ${response.status} ${response.statusText}`);

			if (response.status === 410 || response.status === 404) {
				console.log(`[push] Subscription ${sub.id} is stale, removing`);
				await removePushSubscription(db, sub.endpoint);
				failed++;
			} else if (response.status >= 200 && response.status < 300) {
				sent++;
			} else {
				const text = await response.text();
				console.error(`[push] Unexpected response for ${sub.id}: ${response.status} - ${text}`);
				failed++;
			}
		} catch (e) {
			console.error(`[push] Failed to send push to ${sub.id}:`, e);
			failed++;
		}
	});

	await Promise.allSettled(sendPromises);
	console.log(`[push] Done. Sent: ${sent}, Failed: ${failed}, Total: ${subscriptions.length}`);
	return { sent, failed, total: subscriptions.length };
}
