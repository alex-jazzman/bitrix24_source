import { Dom } from 'main.core';

export function syncPopoverPositions({
	toolbarRoot,
	toolbarId,
	viewportPadding = 12,
	popoverGap = 12,
	boundaryPadding = 8,
}: {
	toolbarRoot: HTMLElement | null,
	toolbarId: string,
	viewportPadding?: number,
	popoverGap?: number,
	boundaryPadding?: number,
}): void
{
	if (!(toolbarRoot instanceof HTMLElement))
	{
		return;
	}

	const selector = `.note-editor-popover[data-note-toolbar-owner="${toolbarId}"]`;
	const popovers = document.querySelectorAll(selector);
	const editorRoot = toolbarRoot.closest('.note-editor-root');
	const contentBoundary = editorRoot instanceof HTMLElement
		? editorRoot.querySelector('.note-editor-content')
		: null
	;
	const boundaryRect = contentBoundary instanceof HTMLElement
		? contentBoundary.getBoundingClientRect()
		: null
	;
	const minHorizontalBound = Math.max(
		viewportPadding,
		Math.round((boundaryRect?.left ?? viewportPadding) + boundaryPadding),
	);
	const maxHorizontalBound = Math.min(
		window.innerWidth - viewportPadding,
		Math.round((boundaryRect?.right ?? (window.innerWidth - viewportPadding)) - boundaryPadding),
	);
	popovers.forEach((popover) => {
		if (!(popover instanceof HTMLElement))
		{
			return;
		}

		const menu = String(popover.dataset.noteMenu || '');
		if (menu === '')
		{
			return;
		}

		const anchorSelector = `[data-note-toolbar-owner="${toolbarId}"][data-note-menu-anchor="${menu}"]`;
		const anchor = toolbarRoot.querySelector(anchorSelector);
		if (!(anchor instanceof HTMLElement))
		{
			return;
		}

		const anchorRect = anchor.getBoundingClientRect();
		Dom.style(popover, '--note-editor-popover-top', `${Math.round(anchorRect.bottom + popoverGap)}px`);
		Dom.style(popover, '--note-editor-popover-left', `${Math.round(anchorRect.left)}px`);
		Dom.style(popover, '--note-editor-popover-shift', '0px');
		let rect = popover.getBoundingClientRect();
		const overflowBottom = rect.bottom - (window.innerHeight - viewportPadding);
		if (overflowBottom > 0)
		{
			const nextTop = Math.max(
				viewportPadding,
				Math.round(anchorRect.top - rect.height - popoverGap),
			);
			Dom.style(popover, '--note-editor-popover-top', `${nextTop}px`);
			rect = popover.getBoundingClientRect();
		}

		let shift = 0;
		if (rect.right > maxHorizontalBound)
		{
			shift += maxHorizontalBound - rect.right;
		}

		if (rect.left + shift < minHorizontalBound)
		{
			shift += minHorizontalBound - (rect.left + shift);
		}

		Dom.style(popover, '--note-editor-popover-shift', `${Math.round(shift)}px`);
	});
}

export function clearPopoverOffsets(toolbarId: string): void
{
	const selector = `.note-editor-popover[data-note-toolbar-owner="${toolbarId}"]`;
	const popovers = document.querySelectorAll(selector);
	popovers.forEach((popover) => {
		if (popover instanceof HTMLElement)
		{
			Dom.style(popover, '--note-editor-popover-shift', null);
			Dom.style(popover, '--note-editor-popover-top', null);
			Dom.style(popover, '--note-editor-popover-left', null);
		}
	});
}
