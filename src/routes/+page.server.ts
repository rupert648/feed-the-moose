import type { PageServerLoad } from './$types';
import { getFeedingWindowStatuses } from '$lib/server/feedings';
import { getRandomFeedingPhoto } from '$lib/server/r2';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform?.env || !user) {
		return { user, windows: [], heroPhoto: null };
	}

	const windows = await getFeedingWindowStatuses(platform.env.DB);
	const heroPhoto = await getRandomFeedingPhoto(platform.env.PHOTOS);

	return { user, windows, heroPhoto };
};
