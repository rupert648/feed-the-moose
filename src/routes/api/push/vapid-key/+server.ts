import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.VAPID_PUBLIC_KEY) {
		throw error(500, 'VAPID public key not configured');
	}

	return json({ publicKey: platform.env.VAPID_PUBLIC_KEY });
};
