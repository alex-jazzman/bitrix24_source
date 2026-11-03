export function releaseOnce(callback: () => void): () => void
{
	let isReleased = false;

	return () => {
		if (isReleased)
		{
			return;
		}

		isReleased = true;
		callback();
	};
}
