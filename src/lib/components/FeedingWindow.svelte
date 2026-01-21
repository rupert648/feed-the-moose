<script lang="ts">
	import type { FeedingStatus } from '$lib/server/feedings';

	let {
		window,
		onFeed,
		compact = false
	}: {
		window: FeedingStatus;
		onFeed: (windowTime: string) => void;
		compact?: boolean;
	} = $props();

	let showOverride = $state(false);

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

	function handleFeed() {
		onFeed(window.time);
		showOverride = false;
	}
</script>

<div class="feeding-window" class:fed={window.isFed} class:inactive={!window.isActive && !window.isFed} class:compact>
	<img src="/moose-7.png" alt="" class="bullet-moose" />
	<div class="window-info">
		<div class="time">
			{formatTime(window.time)}
			{#if !compact}<span class="utc-label">UTC</span>{/if}
		</div>
		{#if window.label}<div class="label">{window.label}</div>{/if}
	</div>

	<div class="window-status">
		{#if window.isFed}
			<div class="fed-info">
				<span class="check">✓</span>
				{#if compact}
					<span>{window.fedBy}</span>
				{:else}
					<span>Fed by {window.fedBy} at {formatFedAt(window.fedAt!)}</span>
				{/if}
			</div>
		{:else if window.isActive}
			<button class="btn-primary feed-btn" onclick={handleFeed}>
				{compact ? 'Feed' : 'Feed Moose'}
			</button>
		{:else if showOverride}
			<div class="override-confirm">
				<button class="btn-secondary" onclick={() => showOverride = false}>Cancel</button>
				<button class="btn-primary feed-btn" onclick={handleFeed}>Feed</button>
			</div>
		{:else}
			<div class="not-yet">
				<span class="waiting">Not yet</span>
				<button class="btn-link override-btn" onclick={() => showOverride = true}>
					Early?
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.feeding-window {
		background: var(--color-surface);
		border-radius: var(--radius);
		padding: 16px 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: var(--shadow);
		border: 2px solid transparent;
	}

	.bullet-moose {
		width: 70px;
		height: 50px;
		object-fit: cover;
		object-position: center;
		flex-shrink: 0;
		margin: -5px -10px;
	}

	.compact .bullet-moose {
		width: 60px;
		height: 45px;
		margin: -5px -8px;
	}

	.window-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.feeding-window.compact {
		padding: 10px 14px;
		box-shadow: none;
		border-radius: 8px;
	}

	.feeding-window.fed {
		border-color: var(--color-success);
		background: #f0fdf4;
	}

	.feeding-window.inactive {
		opacity: 0.6;
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

	.compact .time {
		font-size: 1rem;
	}

	.utc-label {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		font-weight: 400;
		vertical-align: super;
	}

	.label {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.fed-info {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		color: var(--color-success);
	}

	.compact .fed-info {
		font-size: 0.8125rem;
		gap: 4px;
	}

	.check {
		font-weight: 700;
		font-size: 1rem;
	}

	.compact .check {
		font-size: 0.875rem;
	}

	.feed-btn {
		padding: 10px 20px;
	}

	.compact .feed-btn {
		padding: 8px 16px;
		font-size: 0.875rem;
	}

	.not-yet {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}

	.compact .not-yet {
		flex-direction: row;
		gap: 8px;
		align-items: center;
	}

	.waiting {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.compact .waiting {
		font-size: 0.8125rem;
	}

	.override-btn {
		font-size: 0.75rem;
		color: var(--color-primary);
		background: none;
		padding: 0;
		text-decoration: underline;
	}

	.override-confirm {
		display: flex;
		gap: 8px;
	}

	.override-confirm .btn-secondary {
		padding: 8px 12px;
		font-size: 0.875rem;
	}

	.compact .override-confirm .btn-secondary {
		padding: 6px 10px;
		font-size: 0.8125rem;
	}

	.override-confirm .feed-btn {
		padding: 8px 12px;
		font-size: 0.875rem;
	}

	.compact .override-confirm .feed-btn {
		padding: 6px 10px;
		font-size: 0.8125rem;
	}
</style>
