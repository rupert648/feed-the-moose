import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { D1Database } from '@cloudflare/workers-types';
import { getFeedingSchedule, isWindowAlreadyFed } from '$lib/server/feedings';
import { sendPushToAll } from '$lib/server/push';

function getCurrentTimeUTC(): string {
	const now = new Date();
	const hours = now.getUTCHours().toString().padStart(2, '0');
	const minutes = now.getUTCMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
}

function getTodayDateString(): string {
	return new Date().toISOString().split('T')[0];
}

async function hasNotificationBeenSent(db: D1Database, windowTime: string): Promise<boolean> {
	const today = getTodayDateString();
	const result = await db
		.prepare('SELECT id FROM notification_log WHERE window_time = ? AND notification_date = ?')
		.bind(windowTime, today)
		.first();
	return !!result;
}

async function markNotificationSent(db: D1Database, windowTime: string): Promise<void> {
	const today = getTodayDateString();
	await db
		.prepare('INSERT OR IGNORE INTO notification_log (window_time, notification_date) VALUES (?, ?)')
		.bind(windowTime, today)
		.run();
}

export const GET: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const authHeader = request.headers.get('Authorization');
	const expectedToken = `Bearer ${platform.env.SHARED_SECRET}`;

	if (authHeader !== expectedToken) {
		throw error(401, 'Unauthorized');
	}

	const schedule = await getFeedingSchedule(platform.env.DB);
	const currentTime = getCurrentTimeUTC();
	let notificationsSent = 0;

	for (const window of schedule) {
		if (window.time <= currentTime) {
			const alreadyFed = await isWindowAlreadyFed(platform.env.DB, window.time);
			const alreadyNotified = await hasNotificationBeenSent(platform.env.DB, window.time);

			if (!alreadyFed && !alreadyNotified) {
				const label = window.label || window.time;
				await sendPushToAll(
					platform.env.DB,
					platform.env.VAPID_PRIVATE_KEY,
					platform.env.VAPID_SUBJECT,
					{
						title: 'Time to feed Moose!',
						body: `${label} feeding time has arrived`,
						url: '/'
					}
				);
				await markNotificationSent(platform.env.DB, window.time);
				notificationsSent++;
			}
		}
	}

	return json({ success: true, notificationsSent });
};
