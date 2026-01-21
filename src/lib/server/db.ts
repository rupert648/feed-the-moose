import type { D1Database } from '@cloudflare/workers-types';

export interface User {
	id: number;
	name: string;
	created_at: string;
}

export async function getUserByName(db: D1Database, name: string): Promise<User | null> {
	const result = await db.prepare('SELECT * FROM users WHERE name = ?').bind(name).first<User>();
	return result ?? null;
}

export async function createUser(db: D1Database, name: string): Promise<User> {
	const result = await db
		.prepare('INSERT INTO users (name) VALUES (?) RETURNING *')
		.bind(name)
		.first<User>();
	if (!result) throw new Error('Failed to create user');
	return result;
}

export async function getOrCreateUser(db: D1Database, name: string): Promise<User> {
	const existing = await getUserByName(db, name);
	if (existing) return existing;
	return createUser(db, name);
}
