import type { D1Database } from '@cloudflare/workers-types';
import type { FeedingWindow } from './feedings';

export async function addFeedingTime(
	db: D1Database,
	time: string,
	label: string | null
): Promise<void> {
	await db
		.prepare('INSERT OR IGNORE INTO feeding_schedule (time, label) VALUES (?, ?)')
		.bind(time, label)
		.run();
}

export async function removeFeedingTime(db: D1Database, time: string): Promise<void> {
	await db.prepare('DELETE FROM feeding_schedule WHERE time = ?').bind(time).run();
}

export async function updateFeedingLabel(
	db: D1Database,
	time: string,
	label: string | null
): Promise<void> {
	await db
		.prepare('UPDATE feeding_schedule SET label = ? WHERE time = ?')
		.bind(label, time)
		.run();
}

export async function getAllFeedingTimes(db: D1Database): Promise<FeedingWindow[]> {
	const result = await db
		.prepare('SELECT time, label FROM feeding_schedule ORDER BY time')
		.all<FeedingWindow>();
	return result.results;
}
