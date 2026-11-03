import { Dom, Type } from 'main.core';

function getVisibleScrollTop(element: HTMLElement, topTarget: HTMLElement, scrollContainer: HTMLElement): number
{
	// Both positions are page-relative, so the difference between them is the distance to scroll. The
	// offsets are measured against the scroll area itself and never against the window.
	const containerPosition = Dom.getPosition(scrollContainer);
	const topTargetPosition = Dom.getPosition(topTarget);
	const elementPosition = Dom.getPosition(element);

	if (topTargetPosition.top < containerPosition.top)
	{
		return scrollContainer.scrollTop - (containerPosition.top - topTargetPosition.top);
	}

	if (elementPosition.bottom > containerPosition.bottom)
	{
		return scrollContainer.scrollTop + (elementPosition.bottom - containerPosition.bottom);
	}

	return scrollContainer.scrollTop;
}

/**
 * Brings the item holding the given traversal index into the visible part of the search results.
 *
 * The item is looked up inside the scroll area of `ScrollWithGradient`, because the results container is
 * rendered in its slot; an item that is already fully visible leaves the scroll position untouched.
 */
export function scrollToActiveItem(scrollContainer: ?HTMLElement, navIndex: ?number): void
{
	if (!Type.isElementNode(scrollContainer) || !Type.isNumber(navIndex))
	{
		return;
	}

	// The results are rebuilt on every change of the query, so a missing node is a normal state and not an
	// error: the scroll is silently skipped.
	const activeItem = scrollContainer.querySelector(`[data-nav-index="${navIndex}"]`);
	if (!activeItem)
	{
		return;
	}

	// Upwards the scroll aims at the node its section starts with and not at the item alone: that node
	// holds the title of the section and carries no traversal index, so aligning the item with the top edge
	// would leave the title above it. The view marks the head of a section with the indexes of the items
	// standing in its first row; for every other item nothing is found and the item is its own target.
	// Downwards the target stays the item: a whole section is not expected to fit the screen.
	const sectionHead = scrollContainer.querySelector(`[data-nav-section-head~="${navIndex}"]`);

	scrollContainer.scrollTo({ top: getVisibleScrollTop(activeItem, sectionHead ?? activeItem, scrollContainer) });
}
