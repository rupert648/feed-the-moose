<script lang="ts">
	let { onCapture, onCancel }: { onCapture: (file: File) => void; onCancel: () => void } = $props();

	let videoEl: HTMLVideoElement;
	let canvasEl: HTMLCanvasElement;
	let stream: MediaStream | null = $state(null);
	let error: string | null = $state(null);
	let previewUrl: string | null = $state(null);

	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false
			});
			videoEl.srcObject = stream;
			await videoEl.play();
		} catch (e) {
			error = 'Could not access camera. Please grant permission.';
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
	}

	function capture() {
		const ctx = canvasEl.getContext('2d');
		if (!ctx || !videoEl) return;

		canvasEl.width = videoEl.videoWidth;
		canvasEl.height = videoEl.videoHeight;
		ctx.drawImage(videoEl, 0, 0);
		previewUrl = canvasEl.toDataURL('image/jpeg', 0.85);
		stopCamera();
	}

	function retake() {
		previewUrl = null;
		startCamera();
	}

	function confirm() {
		canvasEl.toBlob(
			(blob) => {
				if (blob) {
					const file = new File([blob], 'feeding.jpg', { type: 'image/jpeg' });
					onCapture(file);
				}
			},
			'image/jpeg',
			0.85
		);
	}

	function handleCancel() {
		stopCamera();
		onCancel();
	}

	$effect(() => {
		startCamera();
		return () => stopCamera();
	});
</script>

<div class="camera-overlay">
	<div class="camera-container">
		{#if error}
			<div class="error-state">
				<p>{error}</p>
				<button class="btn-primary" onclick={handleCancel}>Close</button>
			</div>
		{:else if previewUrl}
			<img src={previewUrl} alt="Preview" class="preview" />
			<div class="controls">
				<button class="btn-secondary" onclick={retake}>Retake</button>
				<button class="btn-primary" onclick={confirm}>Use Photo</button>
			</div>
		{:else}
			<video bind:this={videoEl} playsinline muted class="video-feed"></video>
			<div class="controls">
				<button class="btn-secondary" onclick={handleCancel}>Cancel</button>
				<button class="btn-primary capture-btn" onclick={capture} aria-label="Take photo">
					<span class="capture-icon"></span>
				</button>
			</div>
		{/if}
		<canvas bind:this={canvasEl} style="display: none;"></canvas>
	</div>
</div>

<style>
	.camera-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.95);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.camera-container {
		width: 100%;
		max-width: 500px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.video-feed {
		width: 100%;
		border-radius: var(--radius);
		background: #000;
	}

	.preview {
		width: 100%;
		border-radius: var(--radius);
	}

	.controls {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.capture-btn {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.capture-icon {
		width: 56px;
		height: 56px;
		background: white;
		border-radius: 50%;
		border: 3px solid var(--color-primary-dark);
	}

	.error-state {
		text-align: center;
		color: white;
		padding: 2rem;
	}

	.error-state p {
		margin-bottom: 1rem;
	}
</style>
