export default {
	async scheduled(event, env, ctx) {
		const url = `${env.APP_URL}/api/cron/check-feedings`;
		console.log('Cron calling:', url);
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${env.SHARED_SECRET}`
			}
		});
		
		const text = await response.text();
		console.log('Cron response:', response.status, text);
		
		if (!response.ok) {
			throw new Error(`Cron failed: ${response.status} ${text}`);
		}
	}
};
