import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifySession, COOKIE_NAME } from '$lib/server/auth';

export const GET: RequestHandler = async ({ platform, cookies }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	if (!platform.env.VAPID_PUBLIC_KEY) {
		throw error(500, 'VAPID public key not configured');
	}

	return json({ publicKey: platform.env.VAPID_PUBLIC_KEY });
};
