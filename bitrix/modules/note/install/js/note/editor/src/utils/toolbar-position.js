export function resolveToolbarTop(defaultTop: number = 10, scope: HTMLElement | null = null): number
{
	let top = defaultTop;

	const pageHeader = document.querySelector('.note-page-header');
	if (pageHeader instanceof HTMLElement)
	{
		const headerRect = pageHeader.getBoundingClientRect();
		if (headerRect.bottom > 0)
		{
			top = Math.max(top, Math.round(headerRect.bottom) + 8);
		}
	}

	const actionsRoot = scope instanceof HTMLElement ? scope : document;
	const actions = actionsRoot.querySelector('.note-page-document-actions');
	if (actions instanceof HTMLElement)
	{
		const actionsRect = actions.getBoundingClientRect();
		// Actions sticks above the toolbar in the same scroll container; pin the toolbar right below it.
		if (actionsRect.bottom > 0)
		{
			top = Math.max(top, Math.round(actionsRect.bottom) + 8);
		}
	}

	return top;
}

type ToolbarPositionResult = {
	shouldFix: boolean,
	toolbarMaxWidth: number,
	toolbarLeft: number,
};

export function calculateToolbarPosition({ root, anchor, toolbarTop, viewportPadding = 12 }: {
	root: HTMLElement,
	anchor: HTMLElement,
	toolbarTop: number,
	viewportPadding?: number,
}): ToolbarPositionResult
{
	const rootRect = root.getBoundingClientRect();
	const anchorRect = anchor.getBoundingClientRect();
	const shouldFix = anchorRect.top <= toolbarTop && rootRect.bottom > (toolbarTop + 110);
	const maxViewportWidth = Math.max(0, window.innerWidth - (viewportPadding * 2));
	const toolbarMaxWidth = Math.max(1, Math.min(rootRect.width, maxViewportWidth));
	const center = rootRect.left + (rootRect.width / 2);
	const halfWidth = toolbarMaxWidth / 2;
	const minLeft = rootRect.left + halfWidth;
	const maxLeft = rootRect.right - halfWidth;
	const toolbarLeft = minLeft <= maxLeft
		? Math.min(maxLeft, Math.max(minLeft, center))
		: center
	;

	return {
		shouldFix,
		toolbarMaxWidth,
		toolbarLeft,
	};
}
