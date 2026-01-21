export default {
	async scheduled(event, env, ctx) {
		console.log('ENV APP_URL:', env.APP_URL);
		console.log('ENV SHARED_SECRET exists:', !!env.SHARED_SECRET);
		console.log('ENV SHARED_SECRET length:', env.SHARED_SECRET?.length);
		
		const url = `${env.APP_URL}/api/cron/check-feedings`;
		console.log('Cron calling:', url);
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${env.SHARED_SECRET}`,
				'User-Agent': 'feed-the-moose-cron/1.0',
				'Accept': 'application/json'
			}
		});
		
		const text = await response.text();
		console.log('Cron response:', response.status, text);
		
		if (!response.ok) {
			throw new Error(`Cron failed: ${response.status} ${text}`);
		}
	}
};
