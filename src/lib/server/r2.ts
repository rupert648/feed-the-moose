import type { R2Bucket } from '@cloudflare/workers-types';

export async function uploadPhoto(
	bucket: R2Bucket,
	data: ArrayBuffer,
	contentType: string
): Promise<string> {
	const key = `feedings/${Date.now()}-${crypto.randomUUID()}.jpg`;
	await bucket.put(key, data, {
		httpMetadata: { contentType }
	});
	return key;
}

export async function getPhotoUrl(bucket: R2Bucket, key: string): Promise<string | null> {
	const object = await bucket.head(key);
	if (!object) return null;
	return `/api/photos/${encodeURIComponent(key)}`;
}
