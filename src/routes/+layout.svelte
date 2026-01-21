<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js').catch((err) => {
				console.warn('Service worker registration failed:', err);
			});
		}
	});
</script>

{#if data.user}
	<header>
		<nav>
			<a href="/" class="logo">
				<img src="/moose-4.png" alt="" class="logo-img" />
				Feed the Moose
			</a>
			<div class="nav-links">
				<a href="/settings">Settings</a>
				<form method="POST" action="/logout" style="display: inline;">
					<button type="submit" class="btn-link">Logout</button>
				</form>
			</div>
		</nav>
	</header>
{/if}

<div class="content">
	{@render children()}
</div>

<style>
	header {
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		padding: 12px 20px;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	nav {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-weight: 700;
		font-size: 1.125rem;
		color: var(--color-primary);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-img {
		width: 80px;
		height: 50px;
		object-fit: cover;
		object-position: center;
		margin: -10px -15px;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-links a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.nav-links a:hover {
		color: var(--color-text);
	}

	.btn-link {
		background: none;
		padding: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-weight: normal;
	}

	.btn-link:hover {
		color: var(--color-text);
	}

	.content {
		min-height: calc(100vh - 60px);
		min-height: calc(100dvh - 60px);
	}
</style>
