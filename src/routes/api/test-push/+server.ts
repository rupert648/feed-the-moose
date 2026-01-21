import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushToAll } from '$lib/server/push';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request, platform }) => {
	log.api.info('Test push request received');

	if (!platform?.env) {
		log.api.error('No platform env');
		throw error(500, 'Server configuration error');
	}

	const authHeader = request.headers.get('Authorization');
	const expectedToken = `Bearer ${platform.env.SHARED_SECRET}`;

	if (authHeader !== expectedToken) {
		log.api.error('Unauthorized - invalid token');
		throw error(401, 'Unauthorized');
	}

	log.api.info('Auth OK, sending push', {
		vapidSubject: platform.env.VAPID_SUBJECT,
		vapidKeyExists: !!platform.env.VAPID_PRIVATE_KEY,
		vapidKeyLength: platform.env.VAPID_PRIVATE_KEY?.length
	});

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

	log.api.info('Test push complete', result);

	return json({
		success: true,
		message: 'Test notification sent',
		...result
	});
};
