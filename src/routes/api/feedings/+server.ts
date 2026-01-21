import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordFeeding, isWindowAlreadyFed, getFeedingHistory } from '$lib/server/feedings';
import { uploadPhoto } from '$lib/server/r2';
import { verifySession, COOKIE_NAME } from '$lib/server/auth';
import { sendPushToAll } from '$lib/server/push';

const PAGE_SIZE = 20;

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const offset = (page - 1) * PAGE_SIZE;

	const { feedings, total } = await getFeedingHistory(platform.env.DB, PAGE_SIZE, offset);

	return json({
		feedings,
		total,
		page,
		pageSize: PAGE_SIZE,
		hasMore: offset + feedings.length < total
	});
};

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	if (!platform?.env) {
		throw error(500, 'Server configuration error');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const windowTime = formData.get('windowTime')?.toString();
	const photo = formData.get('photo') as File | null;

	if (!windowTime) {
		throw error(400, 'Window time is required');
	}

	const alreadyFed = await isWindowAlreadyFed(platform.env.DB, windowTime);
	if (alreadyFed) {
		throw error(409, 'This feeding window has already been marked as fed');
	}

	let photoKey: string | null = null;
	if (photo && photo.size > 0) {
		const buffer = await photo.arrayBuffer();
		photoKey = await uploadPhoto(platform.env.PHOTOS, buffer, photo.type || 'image/jpeg');
	}

	await recordFeeding(platform.env.DB, session.userId, windowTime, photoKey);

	platform.context.waitUntil(
		sendPushToAll(
			platform.env.DB,
			platform.env.VAPID_PRIVATE_KEY,
			platform.env.VAPID_SUBJECT,
			{
				title: 'Moose has been fed!',
				body: `${session.name} fed Moose`,
				url: '/'
			}
		)
	);

	return json({ success: true, photoKey });
};
