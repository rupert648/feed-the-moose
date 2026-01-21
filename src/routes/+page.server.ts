import type { PageServerLoad } from './$types';
import { getFeedingWindowStatuses, getFeedingHistory } from '$lib/server/feedings';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform?.env || !user) {
		return { user, windows: [], feedings: [], total: 0, hasMore: false };
	}

	const windows = await getFeedingWindowStatuses(platform.env.DB);
	const { feedings, total } = await getFeedingHistory(platform.env.DB, PAGE_SIZE, 0);

	return {
		user,
		windows,
		feedings,
		total,
		hasMore: feedings.length < total
	};
};
