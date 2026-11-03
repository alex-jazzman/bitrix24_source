export const isItemInListView = (list: HTMLElement, item: HTMLElement): boolean => {
	const itemRect = item.getBoundingClientRect();
	const listRect = list.getBoundingClientRect();

	return itemRect.bottom > listRect.top && itemRect.top < listRect.bottom;
};

// From the centre of the tile the popup is bound to down to the centre of the part of the frame the list shows.
export const getFramePointerShift = (list: HTMLElement, frame: HTMLElement, tile: HTMLElement): number => {
	const listRect = list.getBoundingClientRect();
	const frameRect = frame.getBoundingClientRect();
	const tileRect = tile.getBoundingClientRect();
	const visibleTop = Math.max(frameRect.top, listRect.top);
	const visibleBottom = Math.min(frameRect.bottom, listRect.bottom);

	return ((visibleTop + visibleBottom) - (tileRect.top + tileRect.bottom)) / 2;
};
