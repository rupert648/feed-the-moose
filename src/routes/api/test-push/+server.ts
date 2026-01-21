import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushToAll } from '$lib/server/push';

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const authHeader = request.headers.get('Authorization');
	const expectedToken = `Bearer ${platform.env.SHARED_SECRET}`;

	if (authHeader !== expectedToken) {
		throw error(401, 'Unauthorized');
	}

	await sendPushToAll(
		platform.env.DB,
		platform.env.VAPID_PRIVATE_KEY,
		platform.env.VAPID_SUBJECT,
		{
			title: 'Test notification',
			body: 'Push notifications are working!',
			url: '/'
		}
	);

	return json({ success: true, message: 'Test notification sent' });
};
