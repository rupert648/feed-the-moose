<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<main>
	<h1>Settings</h1>

	<section class="card">
		<h2>Feeding Times</h2>
		<p class="description">Set when Moose should be fed. You'll get notifications at these times.</p>

		{#if data.feedingTimes.length === 0}
			<p class="empty">No feeding times set.</p>
		{:else}
			<ul class="feeding-times">
				{#each data.feedingTimes as ft (ft.time)}
					<li>
						<div class="time-info">
							<span class="time">{ft.time}</span>
							{#if ft.label}
								<span class="label">{ft.label}</span>
							{/if}
						</div>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="time" value={ft.time} />
							<button type="submit" class="btn-remove" aria-label="Remove {ft.time}">
								&times;
							</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}

		<form method="POST" action="?/add" use:enhance class="add-form">
			{#if form?.error}
				<div class="error">{form.error}</div>
			{/if}

			<div class="form-row">
				<div class="field">
					<label for="time">Time</label>
					<input type="time" id="time" name="time" required />
				</div>
				<div class="field">
					<label for="label">Label (optional)</label>
					<input type="text" id="label" name="label" placeholder="e.g., Morning" maxlength="20" />
				</div>
			</div>

			<button type="submit" class="btn-primary">Add Feeding Time</button>
		</form>
	</section>
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

	h2 {
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
	}

	.description {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.empty {
		color: var(--color-text-muted);
		font-style: italic;
		margin-bottom: 1.5rem;
	}

	.feeding-times {
		list-style: none;
		margin-bottom: 1.5rem;
	}

	.feeding-times li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid var(--color-border);
	}

	.feeding-times li:last-child {
		border-bottom: none;
	}

	.time-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.time {
		font-size: 1.125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		background: var(--color-bg);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.btn-remove {
		background: none;
		color: var(--color-error);
		font-size: 1.5rem;
		padding: 4px 8px;
		line-height: 1;
	}

	.btn-remove:hover {
		background: #fef2f2;
	}

	.add-form {
		border-top: 1px solid var(--color-border);
		padding-top: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px;
		border-radius: var(--radius);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 480px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
