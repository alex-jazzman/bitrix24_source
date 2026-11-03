import { Dom } from 'main.core';

// Must match the 480px limit of .crm-stage-final-transition-dialog in final-transition.css.
export const DIALOG_WIDTH: number = 480;

export const DIALOG_TITLE_CLASS: string = 'crm-stage-final-transition__title';

/** Puts the full title into a native hint only when the two-line clamp crops it. */
export function syncTitleHint(titleNode: HTMLElement): void
{
	if (titleNode.scrollHeight > titleNode.clientHeight)
	{
		titleNode.setAttribute('title', titleNode.textContent ?? '');
	}
	else
	{
		titleNode.removeAttribute('title');
	}
}

/**
 * Centers the dialog horizontally in the visible page width.
 * The popup centers it in window.innerWidth, which includes the page scrollbar and shifts the dialog to the right.
 */
export function centerInVisibleWidth(container: HTMLElement): void
{
	const visibleWidth = document.documentElement.clientWidth;
	const left = window.scrollX + Math.max(0, (visibleWidth - container.offsetWidth) / 2);
	Dom.style(container, 'left', `${left}px`);
}
