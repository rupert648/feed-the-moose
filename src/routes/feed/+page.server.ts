import type { PageServerLoad } from './$types';
import { getFeedingHistory } from '$lib/server/feedings';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url, platform }) => {
	if (!platform?.env) {
		return { feedings: [], total: 0, page: 1, pageSize: PAGE_SIZE };
	}

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const offset = (page - 1) * PAGE_SIZE;

	const { feedings, total } = await getFeedingHistory(platform.env.DB, PAGE_SIZE, offset);

	return {
		feedings,
		total,
		page,
		pageSize: PAGE_SIZE
	};
};
