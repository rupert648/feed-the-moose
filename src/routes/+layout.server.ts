import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { verifySession, COOKIE_NAME } from '$lib/server/auth';

const PUBLIC_PATHS = ['/login'];

export const load: LayoutServerLoad = async ({ cookies, url, platform }) => {
	const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname.startsWith(path));

	if (!platform?.env) {
		if (isPublicPath) return { user: null };
		throw redirect(303, '/login');
	}

	const token = cookies.get(COOKIE_NAME);
	const session = await verifySession(token, platform.env.SHARED_SECRET);

	if (!session && !isPublicPath) {
		throw redirect(303, '/login');
	}

	return {
		user: session
	};
};
