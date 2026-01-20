import { Dom } from 'main.core';

export function getNewScrollPosition(element: HTMLElement, scrollContainer: HTMLElement, marginTop: number): number
{
	const containerPosition = Dom.getPosition(scrollContainer);
	const targetElementPosition = Dom.getPosition(element);

	const shouldScrollUp = targetElementPosition.top < containerPosition.top;
	const shouldScrollDown = targetElementPosition.bottom > containerPosition.bottom;

	let newScrollTop = scrollContainer.scrollTop;

	if (shouldScrollUp)
	{
		newScrollTop -= containerPosition.top - targetElementPosition.top + marginTop;
	}
	else if (shouldScrollDown)
	{
		newScrollTop += targetElementPosition.bottom - containerPosition.bottom + marginTop;
	}

	return newScrollTop;
}

export function getMarginTop(element: HTMLElement): number
{
	return parseFloat(window.getComputedStyle(element).marginTop);
}
