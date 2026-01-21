import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { savePushSubscription, removePushSubscription } from '$lib/server/push';
import { verifySession, COOKIE_NAME } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const body = (await request.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
	const { endpoint, keys } = body;

	if (!endpoint || !keys?.p256dh || !keys?.auth) {
		throw error(400, 'Invalid subscription data');
	}

	await savePushSubscription(platform.env.DB, session.userId, endpoint, keys.p256dh, keys.auth);

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request, platform, cookies }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const body = (await request.json()) as { endpoint?: string };
	const { endpoint } = body;

	if (!endpoint) {
		throw error(400, 'Endpoint is required');
	}

	await removePushSubscription(platform.env.DB, endpoint);

	return json({ success: true });
};
