<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Feeding } from '$lib/server/feedings';
	import FeedingWindow from '$lib/components/FeedingWindow.svelte';
	import FeedingCard from '$lib/components/FeedingCard.svelte';
	import CameraCapture from '$lib/components/CameraCapture.svelte';

	let { data }: { data: PageData } = $props();

	let showCamera = $state(false);
	let selectedWindow: string | null = $state(null);
	let isSubmitting = $state(false);
	let feedings = $state<Feeding[]>(data.feedings);
	let hasMore = $state(data.hasMore);
	let isLoadingMore = $state(false);
	let page = $state(1);
	let sentinelEl: HTMLDivElement;

	// Reset feedings when data changes (e.g., after invalidateAll)
	$effect(() => {
		feedings = data.feedings;
		hasMore = data.hasMore;
		page = 1;
	});

	function handleFeed(windowTime: string) {
		selectedWindow = windowTime;
		showCamera = true;
	}

	function handleCancelCamera() {
		showCamera = false;
		selectedWindow = null;
	}

	async function handleCapture(photo: File) {
		if (!selectedWindow) return;

		isSubmitting = true;

		try {
			const formData = new FormData();
			formData.append('windowTime', selectedWindow);
			formData.append('photo', photo);

			const response = await fetch('/api/feedings', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const err = (await response.json()) as { message?: string };
				alert(err.message || 'Failed to record feeding');
				return;
			}

			showCamera = false;
			selectedWindow = null;
			await invalidateAll();
		} catch (e) {
			alert('Failed to record feeding. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	async function loadMore() {
		if (isLoadingMore || !hasMore) return;

		isLoadingMore = true;
		try {
			const nextPage = page + 1;
			const response = await fetch(`/api/feedings?page=${nextPage}`);
			if (!response.ok) return;

			const result = (await response.json()) as { feedings: Feeding[]; hasMore: boolean };
			feedings = [...feedings, ...result.feedings];
			hasMore = result.hasMore;
			page = nextPage;
		} finally {
			isLoadingMore = false;
		}
	}

	// Intersection observer for infinite scroll
	$effect(() => {
		if (!sentinelEl) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(sentinelEl);
		return () => observer.disconnect();
	});
</script>

<main>
	{#if feedings.length === 0}
		<div class="empty-state">
			<span class="empty-icon">🐱</span>
			<p>No feedings yet!</p>
			<p class="hint">Use the buttons below to record a feeding</p>
		</div>
	{:else}
		<div class="feed">
			{#each feedings as feeding (feeding.id)}
				<FeedingCard {feeding} />
			{/each}
		</div>

		<div bind:this={sentinelEl} class="sentinel">
			{#if isLoadingMore}
				<div class="loading">Loading more...</div>
			{/if}
		</div>
	{/if}
</main>

<div class="bottom-overlay">
	<div class="overlay-content">
		{#if data.windows.length === 0}
			<a href="/settings" class="setup-link">Set up feeding times</a>
		{:else}
			<div class="windows">
				{#each data.windows as window (window.time)}
					<FeedingWindow {window} onFeed={handleFeed} compact />
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if showCamera}
	<CameraCapture onCapture={handleCapture} onCancel={handleCancelCamera} />
{/if}

<style>
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
		padding-bottom: 140px; /* Space for bottom overlay */
	}

	.empty-state {
		text-align: center;
		padding: 4rem 1rem;
	}

	.empty-icon {
		font-size: 5rem;
		display: block;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: var(--color-text-muted);
		margin: 0.25rem 0;
	}

	.empty-state .hint {
		font-size: 0.875rem;
	}

	.feed {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.sentinel {
		height: 20px;
		margin-top: 1rem;
	}

	.loading {
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		padding: 1rem;
	}

	.bottom-overlay {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-bg);
		border-top: 1px solid var(--color-border);
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	.overlay-content {
		max-width: 600px;
		margin: 0 auto;
		padding: 12px 20px;
		padding-bottom: max(12px, env(safe-area-inset-bottom));
	}

	.windows {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.setup-link {
		display: block;
		text-align: center;
		color: var(--color-primary);
		padding: 0.5rem;
	}
</style>
