<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import FeedingWindow from '$lib/components/FeedingWindow.svelte';
	import CameraCapture from '$lib/components/CameraCapture.svelte';

	let { data }: { data: PageData } = $props();

	let showCamera = $state(false);
	let selectedWindow: string | null = $state(null);
	let isSubmitting = $state(false);

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
</script>

<main>
	{#if data.heroPhoto}
		<div class="hero-photo">
			<img src={data.heroPhoto} alt="Moose" />
		</div>
	{:else}
		<div class="hero-placeholder">
			<span>🐱</span>
			<p>Photos will appear here once you start feeding!</p>
		</div>
	{/if}

	<h1>Hi {data.user?.name}!</h1>

	{#if data.windows.length === 0}
		<div class="empty-state">
			<p>No feeding times configured yet.</p>
			<a href="/settings" class="btn-primary">Set Up Feeding Times</a>
		</div>
	{:else}
		<div class="windows">
			{#each data.windows as window (window.time)}
				<FeedingWindow {window} onFeed={handleFeed} />
			{/each}
		</div>
	{/if}
</main>

{#if showCamera}
	<CameraCapture onCapture={handleCapture} onCancel={handleCancelCamera} />
{/if}

<style>
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
	}

	.hero-photo {
		width: 100%;
		aspect-ratio: 4/3;
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.hero-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-placeholder {
		width: 100%;
		aspect-ratio: 4/3;
		border-radius: var(--radius);
		background: var(--color-surface);
		border: 2px dashed var(--color-border);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
		color: var(--color-text-muted);
	}

	.hero-placeholder span {
		font-size: 4rem;
		margin-bottom: 0.5rem;
	}

	.hero-placeholder p {
		font-size: 0.875rem;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.windows {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		background: var(--color-surface);
		border-radius: var(--radius);
	}

	.empty-state p {
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.empty-state .btn-primary {
		display: inline-block;
		text-decoration: none;
	}
</style>
