import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, getSessionCookie } from '$lib/server/auth';
import { getOrCreateUser } from '$lib/server/db';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		if (!platform?.env) {
			return fail(500, { error: 'Server configuration error' });
		}

		const formData = await request.formData();
		const secret = formData.get('secret')?.toString().trim();
		const name = formData.get('name')?.toString().trim();

		if (!secret || !name) {
			return fail(400, { error: 'Secret and name are required' });
		}

		if (secret !== platform.env.SHARED_SECRET) {
			return fail(401, { error: 'Invalid secret' });
		}

		if (name.length < 1 || name.length > 50) {
			return fail(400, { error: 'Name must be between 1 and 50 characters' });
		}

		const user = await getOrCreateUser(platform.env.DB, name);
		const token = await createSession(user.id, user.name, platform.env.SHARED_SECRET);

		cookies.set('moose_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/');
	}
};
