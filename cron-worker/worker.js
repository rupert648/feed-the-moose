export default {
	async scheduled(event, env, ctx) {
		const response = await fetch(`${env.APP_URL}/api/cron/check-feedings`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${env.SHARED_SECRET}`
			}
		});
		
		const result = await response.json();
		console.log('Cron result:', JSON.stringify(result));
	}
};
