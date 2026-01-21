export default {
	async scheduled(event, env, ctx) {
		console.log('Cron triggered, calling main app via service binding');
		
		const response = await env.MAIN_APP.fetch(
			new Request('https://internal/api/cron/check-feedings', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${env.SHARED_SECRET}`
				}
			})
		);
		
		const text = await response.text();
		console.log('Cron response:', response.status, text);
		
		if (!response.ok) {
			throw new Error(`Cron failed: ${response.status} ${text}`);
		}
	}
};
