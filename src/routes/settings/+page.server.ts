import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getAllFeedingTimes, addFeedingTime, removeFeedingTime } from '$lib/server/settings';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env) {
		return { feedingTimes: [] };
	}

	const feedingTimes = await getAllFeedingTimes(platform.env.DB);
	return { feedingTimes };
};

export const actions: Actions = {
	add: async ({ request, platform }) => {
		if (!platform?.env) {
			return fail(500, { error: 'Server configuration error' });
		}

		const formData = await request.formData();
		const time = formData.get('time')?.toString();
		const label = formData.get('label')?.toString() || null;

		if (!time) {
			return fail(400, { error: 'Time is required' });
		}

		const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(time)) {
			return fail(400, { error: 'Invalid time format' });
		}

		await addFeedingTime(platform.env.DB, time, label);
		return { success: true };
	},

	remove: async ({ request, platform }) => {
		if (!platform?.env) {
			return fail(500, { error: 'Server configuration error' });
		}

		const formData = await request.formData();
		const time = formData.get('time')?.toString();

		if (!time) {
			return fail(400, { error: 'Time is required' });
		}

		await removeFeedingTime(platform.env.DB, time);
		return { success: true };
	}
};
