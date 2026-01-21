<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isPushSupported,
		getCurrentSubscription,
		subscribeToPush,
		unsubscribeFromPush
	} from '$lib/push-client';

	let supported = $state(false);
	let subscribed = $state(false);
	let loading = $state(true);

	onMount(async () => {
		supported = isPushSupported();
		if (supported) {
			const sub = await getCurrentSubscription();
			subscribed = !!sub;
		}
		loading = false;
	});

	async function handleToggle() {
		loading = true;
		try {
			if (subscribed) {
				await unsubscribeFromPush();
				subscribed = false;
			} else {
				const sub = await subscribeToPush();
				subscribed = !!sub;
			}
		} catch (e) {
			console.error('Failed to toggle notifications:', e);
			alert('Failed to toggle notifications. Please try again.');
		} finally {
			loading = false;
		}
	}
</script>

<div class="notification-toggle">
	{#if !supported}
		<p class="not-supported">Push notifications are not supported on this device/browser.</p>
	{:else}
		<div class="toggle-row">
			<div class="toggle-info">
				<span class="toggle-label">Push Notifications</span>
				<span class="toggle-description">Get notified when it's feeding time</span>
			</div>
		<button
			class="toggle-btn"
			class:active={subscribed}
			onclick={handleToggle}
			disabled={loading}
			aria-pressed={subscribed}
			aria-label="Toggle push notifications"
		>
				<span class="toggle-track">
					<span class="toggle-thumb"></span>
				</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.notification-toggle {
		margin-bottom: 1.5rem;
	}

	.not-supported {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-style: italic;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
	}

	.toggle-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.toggle-label {
		font-weight: 500;
	}

	.toggle-description {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.toggle-btn {
		background: none;
		padding: 4px;
		border-radius: 999px;
	}

	.toggle-track {
		display: block;
		width: 48px;
		height: 28px;
		background: var(--color-border);
		border-radius: 999px;
		position: relative;
		transition: background 0.2s;
	}

	.toggle-btn.active .toggle-track {
		background: var(--color-primary);
	}

	.toggle-thumb {
		display: block;
		width: 22px;
		height: 22px;
		background: white;
		border-radius: 50%;
		position: absolute;
		top: 3px;
		left: 3px;
		transition: transform 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-btn.active .toggle-thumb {
		transform: translateX(20px);
	}

	.toggle-btn:disabled {
		opacity: 0.5;
	}
</style>
