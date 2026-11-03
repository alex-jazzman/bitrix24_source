export type CompositeNavigationKey =
	| 'ArrowDown'
	| 'ArrowUp'
	| 'ArrowLeft'
	| 'ArrowRight'
	| 'Home'
	| 'End'
	| 'PageDown'
	| 'PageUp';

export type CompositeItemId = number | string;

export type DeferredFocus = {
	id: CompositeItemId,
	version: string,
};

// Each clause is a separate `:not([disabled])`, not just the tag-specific ones: the
// catch-all `[tabindex]` clause must not re-admit a disabled control through the back
// door. The design-system Button leaves a stray `tabindex="0"` on its native `<button>`
// even while `disabled` is set, so without this a disabled Confirm would still match
// here, `.focus()` on it would silently no-op (browsers refuse to focus a disabled
// control), and focus would end up nowhere instead of on the next reachable control.
const FOCUSABLE_SELECTOR = [
	'a[href]:not([disabled])',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(',');

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
		case 'ArrowRight':
			return Math.min(current + 1, lastIndex);
		case 'ArrowUp':
		case 'ArrowLeft':
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

// ALG-01: the same id if still present, else the row now at the old position, else
// the last one. Null sends the caller to the group's stable point.
export function resolveFallbackId(
	ids: CompositeItemId[],
	preferredId: CompositeItemId | null,
	previousIndex: number,
): CompositeItemId | null
{
	if (ids.length === 0)
	{
		return null;
	}

	if (preferredId !== null && ids.includes(preferredId))
	{
		return preferredId;
	}

	if (previousIndex < 0)
	{
		return ids[0];
	}

	return ids[Math.min(previousIndex, ids.length - 1)];
}

// ALG-02: a deferred focus issued for another version is dropped.
export function takeCurrentFocus(pending: DeferredFocus | null, version: string): DeferredFocus | null
{
	return pending !== null && pending.version === version ? pending : null;
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

export function focusCompositeItem(root: HTMLElement, id: CompositeItemId): boolean
{
	const item = root.querySelector<HTMLElement>(`[data-composite-id="${String(id)}"]`);
	item?.focus();

	return item !== null;
}

// Visible, enabled controls of a group in DOM order.
export function listFocusableControls(root: HTMLElement): HTMLElement[]
{
	return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
		.filter((element) => element.offsetParent !== null || element === document.activeElement);
}

export function isTextEntryTarget(target: EventTarget | null): boolean
{
	return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

// One step along a horizontal group, no wrap; false when focus is not on a control.
export function moveHorizontalFocus(root: HTMLElement, key: 'ArrowLeft' | 'ArrowRight'): boolean
{
	const controls = listFocusableControls(root);
	const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
	if (currentIndex < 0)
	{
		return false;
	}

	const nextIndex = resolveCompositeNavigationIndex(currentIndex, controls.length, key, 1);
	controls[nextIndex]?.focus();

	return true;
}
