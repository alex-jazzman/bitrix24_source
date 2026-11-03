export function createReadyNotifier(onReady?: () => void): () => void
{
	let isNotified = false;

	return (): void => {
		if (isNotified)
		{
			return;
		}

		isNotified = true;
		onReady?.();
	};
}
