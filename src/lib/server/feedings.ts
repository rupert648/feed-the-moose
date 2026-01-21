import type { D1Database } from '@cloudflare/workers-types';

export interface FeedingWindow {
	time: string;
	label: string | null;
}

export interface FeedingStatus {
	time: string;
	label: string | null;
	isFed: boolean;
	isActive: boolean;
	fedBy: string | null;
	fedAt: string | null;
	photoKey: string | null;
}

export interface Feeding {
	id: number;
	user_id: number;
	user_name: string;
	window_time: string;
	photo_key: string | null;
	fed_at: string;
}

function getTodayDateString(): string {
	return new Date().toISOString().split('T')[0];
}

function getCurrentUTCTimeMinutes(): number {
	const now = new Date();
	return now.getUTCHours() * 60 + now.getUTCMinutes();
}

function timeStringToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

const ACTIVE_WINDOW_BEFORE_MINUTES = 60;

function isWindowActive(windowTime: string): boolean {
	const currentMinutes = getCurrentUTCTimeMinutes();
	const windowMinutes = timeStringToMinutes(windowTime);
	const activeStart = windowMinutes - ACTIVE_WINDOW_BEFORE_MINUTES;
	return currentMinutes >= activeStart;
}

export async function getFeedingSchedule(db: D1Database): Promise<FeedingWindow[]> {
	const result = await db
		.prepare('SELECT time, label FROM feeding_schedule ORDER BY time')
		.all<FeedingWindow>();
	return result.results;
}

export async function getTodaysFeedings(db: D1Database): Promise<Feeding[]> {
	const today = getTodayDateString();
	const result = await db
		.prepare(
			`SELECT f.id, f.user_id, u.name as user_name, f.window_time, f.photo_key, f.fed_at
			 FROM feedings f
			 JOIN users u ON f.user_id = u.id
			 WHERE date(f.fed_at) = ?
			 ORDER BY f.fed_at DESC`
		)
		.bind(today)
		.all<Feeding>();
	return result.results;
}

export async function getFeedingWindowStatuses(db: D1Database): Promise<FeedingStatus[]> {
	const schedule = await getFeedingSchedule(db);
	const todaysFeedings = await getTodaysFeedings(db);

	return schedule.map((window) => {
		const feeding = todaysFeedings.find((f) => f.window_time === window.time);
		return {
			time: window.time,
			label: window.label,
			isFed: !!feeding,
			isActive: isWindowActive(window.time),
			fedBy: feeding?.user_name ?? null,
			fedAt: feeding?.fed_at ?? null,
			photoKey: feeding?.photo_key ?? null
		};
	});
}

export async function recordFeeding(
	db: D1Database,
	userId: number,
	windowTime: string,
	photoKey: string | null
): Promise<void> {
	await db
		.prepare('INSERT INTO feedings (user_id, window_time, photo_key) VALUES (?, ?, ?)')
		.bind(userId, windowTime, photoKey)
		.run();
}

export async function isWindowAlreadyFed(db: D1Database, windowTime: string): Promise<boolean> {
	const today = getTodayDateString();
	const result = await db
		.prepare('SELECT id FROM feedings WHERE window_time = ? AND date(fed_at) = ? LIMIT 1')
		.bind(windowTime, today)
		.first();
	return !!result;
}

export async function getFeedingHistory(
	db: D1Database,
	limit: number = 20,
	offset: number = 0
): Promise<{ feedings: Feeding[]; total: number }> {
	const countResult = await db.prepare('SELECT COUNT(*) as count FROM feedings').first<{ count: number }>();
	const total = countResult?.count ?? 0;

	const result = await db
		.prepare(
			`SELECT f.id, f.user_id, u.name as user_name, f.window_time, f.photo_key, f.fed_at
			 FROM feedings f
			 JOIN users u ON f.user_id = u.id
			 ORDER BY f.fed_at DESC
			 LIMIT ? OFFSET ?`
		)
		.bind(limit, offset)
		.all<Feeding>();

	return { feedings: result.results, total };
}

export async function getLatestFeedingWithPhoto(db: D1Database): Promise<Feeding | null> {
	const result = await db
		.prepare(
			`SELECT f.id, f.user_id, u.name as user_name, f.window_time, f.photo_key, f.fed_at
			 FROM feedings f
			 JOIN users u ON f.user_id = u.id
			 WHERE f.photo_key IS NOT NULL
			 ORDER BY f.fed_at DESC
			 LIMIT 1`
		)
		.first<Feeding>();
	return result ?? null;
}
