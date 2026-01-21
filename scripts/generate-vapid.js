#!/usr/bin/env node

import { webcrypto } from 'node:crypto';

const keyPair = await webcrypto.subtle.generateKey(
	{ name: 'ECDSA', namedCurve: 'P-256' },
	true,
	['sign', 'verify']
);

const publicKeyBuffer = await webcrypto.subtle.exportKey('raw', keyPair.publicKey);
const publicKey = Buffer.from(publicKeyBuffer).toString('base64url');

const privateJwk = await webcrypto.subtle.exportKey('jwk', keyPair.privateKey);

console.log('# Add these to your .dev.vars file:\n');
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${JSON.stringify(privateJwk)}`);
console.log('VAPID_SUBJECT=mailto:you@example.com');
