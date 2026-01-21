const COOKIE_NAME = 'moose_session';
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_MAX_AGE = THIRTY_DAYS_IN_SECONDS;

interface SessionPayload {
	userId: number;
	name: string;
	exp: number;
}

async function sign(payload: SessionPayload, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = JSON.stringify(payload);
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
	return `${btoa(data)}.${signatureBase64}`;
}

async function verify(token: string, secret: string): Promise<SessionPayload | null> {
	try {
		const [dataBase64, signatureBase64] = token.split('.');
		if (!dataBase64 || !signatureBase64) return null;

		const data = atob(dataBase64);
		const signature = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));

		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);

		const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
		if (!valid) return null;

		const payload = JSON.parse(data) as SessionPayload;
		if (payload.exp < Date.now()) return null;

		return payload;
	} catch {
		return null;
	}
}

export async function createSession(
	userId: number,
	name: string,
	secret: string
): Promise<string> {
	const payload: SessionPayload = {
		userId,
		name,
		exp: Date.now() + COOKIE_MAX_AGE * 1000
	};
	return sign(payload, secret);
}

export async function verifySession(
	token: string | undefined,
	secret: string
): Promise<{ userId: number; name: string } | null> {
	if (!token) return null;
	const payload = await verify(token, secret);
	if (!payload) return null;
	return { userId: payload.userId, name: payload.name };
}

export function getSessionCookie(token: string): string {
	return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearSessionCookie(): string {
	return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };
