import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifySession, COOKIE_NAME } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params, platform, cookies }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const key = decodeURIComponent(params.key);
	const object = await platform.env.PHOTOS.get(key);

	if (!object) {
		throw error(404, 'Photo not found');
	}

	const headers = new Headers();
	headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(object.body as ReadableStream, { headers });
};
