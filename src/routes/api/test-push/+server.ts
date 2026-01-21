import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushToAll } from '$lib/server/push';

export const POST: RequestHandler = async ({ request, platform }) => {
	console.log('[test-push] Received test push request');

	if (!platform?.env) {
		console.error('[test-push] No platform env');
		throw error(500, 'Server configuration error');
	}

	const authHeader = request.headers.get('Authorization');
	const expectedToken = `Bearer ${platform.env.SHARED_SECRET}`;

	if (authHeader !== expectedToken) {
		console.error('[test-push] Unauthorized - invalid token');
		throw error(401, 'Unauthorized');
	}

	console.log('[test-push] Auth OK, sending push...');
	console.log('[test-push] VAPID_SUBJECT:', platform.env.VAPID_SUBJECT);
	console.log('[test-push] VAPID_PRIVATE_KEY exists:', !!platform.env.VAPID_PRIVATE_KEY);
	console.log('[test-push] VAPID_PRIVATE_KEY length:', platform.env.VAPID_PRIVATE_KEY?.length);

	const result = await sendPushToAll(
		platform.env.DB,
		platform.env.VAPID_PRIVATE_KEY,
		platform.env.VAPID_SUBJECT,
		{
			title: 'Test notification',
			body: 'Push notifications are working!',
			url: '/'
		}
	);

	console.log('[test-push] Result:', result);

	return json({
		success: true,
		message: 'Test notification sent',
		...result
	});
};
