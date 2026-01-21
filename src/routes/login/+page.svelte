<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<main>
	<div class="login-container">
		<h1>Feed the Moose</h1>
		<p class="subtitle">Enter the secret and your name to continue</p>

		<form method="POST" use:enhance>
			{#if form?.error}
				<div class="error">{form.error}</div>
			{/if}

			<div class="field">
				<label for="secret">Secret</label>
				<input
					type="password"
					id="secret"
					name="secret"
					required
					autocomplete="current-password"
				/>
			</div>

			<div class="field">
				<label for="name">Your Name</label>
				<input
					type="text"
					id="name"
					name="name"
					required
					autocomplete="name"
					minlength="1"
					maxlength="50"
				/>
			</div>

			<button type="submit" class="btn-primary">Enter</button>
		</form>
	</div>
</main>

<style>
	main {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.login-container {
		width: 100%;
		max-width: 360px;
	}

	h1 {
		font-size: 2rem;
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		text-align: center;
		color: var(--color-text-muted);
		margin-bottom: 2rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px;
		border-radius: var(--radius);
		font-size: 0.875rem;
	}

	button {
		margin-top: 0.5rem;
		width: 100%;
	}
</style>
