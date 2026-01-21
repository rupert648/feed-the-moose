<script lang="ts">
	import type { Feeding } from '$lib/server/feedings';

	let { feeding }: { feeding: Feeding } = $props();

	function formatDateTime(dateStr: string): { date: string; time: string } {
		const d = new Date(dateStr);
		const date = d.toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
		const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		return { date, time };
	}

	const formatted = $derived(formatDateTime(feeding.fed_at));
	const photoUrl = $derived(feeding.photo_key ? `/api/photos/${encodeURIComponent(feeding.photo_key)}` : null);
</script>

<article class="feeding-card">
	{#if photoUrl}
		<div class="photo">
			<img src={photoUrl} alt="Moose being fed" loading="lazy" />
		</div>
	{/if}
	<div class="details">
		<div class="who">{feeding.user_name} fed Moose</div>
		<div class="when">
			<span class="date">{formatted.date}</span>
			<span class="time">{formatted.time}</span>
		</div>
	</div>
</article>

<style>
	.feeding-card {
		background: var(--color-surface);
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: var(--shadow);
	}

	.photo {
		width: 100%;
		aspect-ratio: 4/3;
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.details {
		padding: 16px;
	}

	.who {
		font-weight: 600;
		margin-bottom: 4px;
	}

	.when {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		display: flex;
		gap: 8px;
	}

	.time {
		color: var(--color-text-muted);
	}
</style>
