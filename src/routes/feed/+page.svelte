<script lang="ts">
	import type { PageData } from './$types';
	import FeedingCard from '$lib/components/FeedingCard.svelte';

	let { data }: { data: PageData } = $props();

	const totalPages = $derived(Math.ceil(data.total / data.pageSize));
</script>

<main>
	<h1>Feeding History</h1>

	{#if data.feedings.length === 0}
		<div class="empty-state">
			<p>No feedings recorded yet.</p>
			<a href="/" class="btn-primary">Go Feed Moose</a>
		</div>
	{:else}
		<div class="feed-list">
			{#each data.feedings as feeding (feeding.id)}
				<FeedingCard {feeding} />
			{/each}
		</div>

		{#if totalPages > 1}
			<nav class="pagination">
				{#if data.page > 1}
					<a href="/feed?page={data.page - 1}" class="btn-secondary">Previous</a>
				{/if}
				<span class="page-info">Page {data.page} of {totalPages}</span>
				{#if data.page < totalPages}
					<a href="/feed?page={data.page + 1}" class="btn-secondary">Next</a>
				{/if}
			</nav>
		{/if}
	{/if}
</main>

<style>
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.feed-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
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

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
	}

	.pagination a {
		text-decoration: none;
	}

	.page-info {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}
</style>
