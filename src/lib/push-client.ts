function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export async function getVapidPublicKey(): Promise<string> {
	const response = await fetch('/api/push/vapid-key');
	if (!response.ok) throw new Error('Failed to get VAPID key');
	const data = (await response.json()) as { publicKey: string };
	return data.publicKey;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		console.warn('Push notifications not supported');
		return null;
	}

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		console.warn('Notification permission denied');
		return null;
	}

	const registration = await navigator.serviceWorker.ready;
	const vapidPublicKey = await getVapidPublicKey();

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
	});

	const subJson = subscription.toJSON();
	await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			endpoint: subJson.endpoint,
			keys: subJson.keys
		})
	});

	return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
	if (!('serviceWorker' in navigator)) return;

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();

	if (subscription) {
		await fetch('/api/push/subscribe', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ endpoint: subscription.endpoint })
		});
		await subscription.unsubscribe();
	}
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
	if (!('serviceWorker' in navigator)) return null;

	const registration = await navigator.serviceWorker.ready;
	return registration.pushManager.getSubscription();
}

export function isPushSupported(): boolean {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
