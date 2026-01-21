import type { PageServerLoad } from './$types';
import { getFeedingWindowStatuses, getLatestFeedingWithPhoto } from '$lib/server/feedings';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform?.env || !user) {
		return { user, windows: [], latestFeeding: null };
	}

	const windows = await getFeedingWindowStatuses(platform.env.DB);
	const latestFeeding = await getLatestFeedingWithPhoto(platform.env.DB);

	return { user, windows, latestFeeding };
};
