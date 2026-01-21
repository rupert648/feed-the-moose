<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main>
	<h1>Welcome, {data.user?.name}!</h1>
	<p>Feeding windows will appear here.</p>
</main>

<style>
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
	}

	h1 {
		font-size: 1.75rem;
		margin-bottom: 1rem;
	}

	p {
		color: var(--color-text-muted);
	}
</style>
