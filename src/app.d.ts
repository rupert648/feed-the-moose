import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				name: string;
			} | null;
		}

		interface Platform {
			env: {
				DB: D1Database;
				PHOTOS: R2Bucket;
				SHARED_SECRET: string;
				VAPID_PUBLIC_KEY: string;
				VAPID_PRIVATE_KEY: string;
				VAPID_SUBJECT: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage;
		}
	}
}

export {};
