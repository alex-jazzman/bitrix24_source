const MAX_CONCURRENT_PREVIEWS = 2;

type PreviewTask = {
	url: string,
	onLoad: (image: HTMLImageElement) => void,
	// Runs whichever way the load ends, and on cancellation too: callers that put something on
	// screen for the duration of the load need a point at which to take it away again.
	onSettle: (() => void) | null,
	image: HTMLImageElement | null,
	settled: boolean,
	// A preview that belongs to the picked set rather than to the feed. The feed change
	// drops the rows that asked for their thumbnails and nothing asks again, but the
	// picked set outlives it and stays on screen, so its work is carried over.
	keepOnFeedChange: boolean,
};

const pending: PreviewTask[] = [];
const active = new Set<PreviewTask>();
let paused = false;

function detach(previewImage: HTMLImageElement): void
{
	const image = previewImage;
	image.onload = null;
	image.onerror = null;
}

function removePending(task: PreviewTask): void
{
	const index = pending.indexOf(task);
	if (index >= 0)
	{
		pending.splice(index, 1);
	}
}

function settle(previewTask: PreviewTask, loaded: boolean): void
{
	const task = previewTask;
	if (task.settled)
	{
		return;
	}

	task.settled = true;
	active.delete(task);
	const image = task.image;
	if (image !== null)
	{
		detach(image);
	}

	try
	{
		if (loaded && image !== null)
		{
			task.onLoad(image);
		}

		task.onSettle?.();
	}
	finally
	{
		startPending();
	}
}

function start(previewTask: PreviewTask): void
{
	const task = previewTask;
	const image = new Image();
	task.image = image;
	active.add(task);
	image.onload = () => settle(task, true);
	image.onerror = () => settle(task, false);
	image.src = task.url;
}

function startPending(): void
{
	if (paused)
	{
		return;
	}

	while (active.size < MAX_CONCURRENT_PREVIEWS && pending.length > 0)
	{
		const task = pending.shift();
		if (task !== undefined && !task.settled)
		{
			start(task);
		}
	}
}

function cancel(previewTask: PreviewTask): void
{
	const task = previewTask;
	if (task.settled)
	{
		return;
	}

	task.settled = true;
	removePending(task);
	if (task.image !== null)
	{
		detach(task.image);
		task.image.src = '';
	}
	active.delete(task);
	task.onSettle?.();
	startPending();
}

export function enqueuePreview(
	url: string,
	onLoad: (image: HTMLImageElement) => void,
	onSettle: (() => void) | null = null,
	keepOnFeedChange: boolean = false,
): () => void
{
	const task: PreviewTask = {
		url,
		onLoad,
		onSettle,
		image: null,
		settled: false,
		keepOnFeedChange,
	};
	pending.push(task);
	startPending();

	return () => cancel(task);
}

export function pauseAndClearPreviews(): void
{
	paused = true;
	[...pending, ...active]
		.filter((task) => !task.keepOnFeedChange)
		.forEach((task) => cancel(task));
}

export function resumePreviews(): void
{
	paused = false;
	startPending();
}

export function resetPreviews(): void
{
	paused = true;
	[...pending, ...active].forEach((task) => cancel(task));
	paused = false;
}
