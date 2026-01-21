<script lang="ts">
	import type { FeedingStatus } from '$lib/server/feedings';

	let {
		window,
		onFeed
	}: {
		window: FeedingStatus;
		onFeed: (windowTime: string) => void;
	} = $props();

	function formatTime(time: string): string {
		const [hours, minutes] = time.split(':');
		const h = parseInt(hours);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h % 12 || 12;
		return `${h12}:${minutes} ${ampm}`;
	}

	function formatFedAt(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}
</script>

<div class="feeding-window" class:fed={window.isFed}>
	<div class="window-info">
		<div class="time">{formatTime(window.time)}</div>
		{#if window.label}
			<div class="label">{window.label}</div>
		{/if}
	</div>

	<div class="window-status">
		{#if window.isFed}
			<div class="fed-info">
				<span class="check">✓</span>
				<span>Fed by {window.fedBy} at {formatFedAt(window.fedAt!)}</span>
			</div>
		{:else}
			<button class="btn-primary feed-btn" onclick={() => onFeed(window.time)}>
				Feed Moose
			</button>
		{/if}
	</div>
</div>

<style>
	.feeding-window {
		background: var(--color-surface);
		border-radius: var(--radius);
		padding: 16px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: var(--shadow);
		border: 2px solid transparent;
	}

	.feeding-window.fed {
		border-color: var(--color-success);
		background: #f0fdf4;
	}

	.window-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.time {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.fed-info {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		color: var(--color-success);
	}

	.check {
		font-weight: 700;
		font-size: 1rem;
	}

	.feed-btn {
		padding: 10px 20px;
	}
</style>
