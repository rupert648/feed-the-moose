<script lang="ts">
	import type { Feeding } from '$lib/server/feedings';

	let { feeding }: { feeding: Feeding } = $props();

	function formatDateTime(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const isToday = d.toDateString() === now.toDateString();
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		const isYesterday = d.toDateString() === yesterday.toDateString();
		const isPreviousYear = d.getFullYear() < now.getFullYear();

		const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

		if (isToday) return time;
		if (isYesterday) return `Yesterday ${time}`;
		
		const dateOpts: Intl.DateTimeFormatOptions = isPreviousYear
			? { month: 'short', day: 'numeric', year: 'numeric' }
			: { month: 'short', day: 'numeric' };
		return d.toLocaleDateString(undefined, dateOpts) + ` ${time}`;
	}

	const formatted = $derived(formatDateTime(feeding.fed_at));
	const photoUrl = $derived(feeding.photo_key ? `/api/photos/${encodeURIComponent(feeding.photo_key)}` : null);
</script>

<article class="feeding-card">
	{#if photoUrl}
		<div class="photo">
			<img src={photoUrl} alt="Moose being fed" loading="lazy" />
			<div class="overlay">
				<span class="who">{feeding.user_name}</span>
				<span class="when">{formatted}</span>
			</div>
		</div>
	{:else}
		<div class="no-photo">
			<span class="no-photo-icon">📷</span>
			<span class="no-photo-text">No photo</span>
			<div class="overlay">
				<span class="who">{feeding.user_name}</span>
				<span class="when">{formatted}</span>
			</div>
		</div>
	{/if}
</article>

<style>
	.feeding-card {
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: var(--shadow);
	}

	.photo {
		position: relative;
		width: 100%;
		aspect-ratio: 4/3;
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-photo {
		position: relative;
		width: 100%;
		aspect-ratio: 4/3;
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.no-photo-icon {
		font-size: 2.5rem;
		opacity: 0.4;
	}

	.no-photo-text {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		opacity: 0.6;
	}

	.overlay {
		position: absolute;
		top: 12px;
		left: 12px;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 8px 12px;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.who {
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.when {
		font-size: 0.8125rem;
		opacity: 0.9;
	}
</style>
