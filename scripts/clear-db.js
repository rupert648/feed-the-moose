#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const isRemote = process.argv.includes('--remote');
const env = isRemote ? 'PRODUCTION' : 'LOCAL';

const rl = createInterface({
	input: process.stdin,
	output: process.stdout
});

console.log(`\n⚠️  WARNING: This will delete ALL data from the ${env} database:`);
console.log('   - All feedings');
console.log('   - All push subscriptions');
console.log('   - All notification logs');
console.log('   - All users\n');

rl.question(`Type "DELETE ${env}" to confirm: `, (answer) => {
	if (answer !== `DELETE ${env}`) {
		console.log('Aborted.');
		process.exit(1);
	}

	const flag = isRemote ? '--remote' : '--local';
	const commands = [
		'DELETE FROM feedings',
		'DELETE FROM push_subscriptions', 
		'DELETE FROM notification_log',
		'DELETE FROM users'
	];

	console.log(`\nClearing ${env} database...`);

	for (const sql of commands) {
		execSync(`wrangler d1 execute feed-the-moose-db ${flag} --command "${sql}"`, {
			stdio: 'inherit'
		});
	}

	console.log(`\n✅ ${env} database cleared.`);
	rl.close();
});
