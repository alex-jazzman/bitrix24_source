export type CompositeNavigationKey = 'ArrowDown' | 'ArrowUp' | 'Home' | 'End' | 'PageDown' | 'PageUp';

export function resolveCompositeNavigationIndex(
	currentIndex: number,
	itemCount: number,
	key: CompositeNavigationKey,
	pageSize: number,
): number
{
	if (itemCount === 0)
	{
		return -1;
	}

	const lastIndex = itemCount - 1;
	const current = Math.min(Math.max(currentIndex, 0), lastIndex);
	const page = Math.max(1, pageSize);

	switch (key)
	{
		case 'ArrowDown':
			return Math.min(current + 1, lastIndex);
		case 'ArrowUp':
			return Math.max(current - 1, 0);
		case 'Home':
			return 0;
		case 'End':
			return lastIndex;
		case 'PageDown':
			return Math.min(current + page, lastIndex);
		case 'PageUp':
			return Math.max(current - page, 0);
		default:
			return current;
	}
}

export function scrollOffsetForEntry(
	entryTop: number,
	entryHeight: number,
	scrollTop: number,
	viewportHeight: number,
): number
{
	if (entryTop < scrollTop)
	{
		return entryTop;
	}

	const entryBottom = entryTop + entryHeight;
	if (entryBottom > scrollTop + viewportHeight)
	{
		return Math.max(0, entryBottom - viewportHeight);
	}

	return scrollTop;
}

export function focusCompositeItem(root: HTMLElement, id: number | string): boolean
{
	const item = root.querySelector<HTMLElement>(`[data-composite-id="${String(id)}"]`);
	item?.focus();

	return item !== null;
}
