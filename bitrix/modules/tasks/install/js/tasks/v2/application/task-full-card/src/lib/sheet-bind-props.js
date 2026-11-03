type SheetRefs = {
	main: HTMLElement,
	title: ?HTMLElement,
};

type SheetBindProps = {
	getBindElement: () => SheetAnchor,
	getTargetContainer: () => HTMLElement,
};

type SheetAnchor = {
	left: number,
	top: number,
	bottom: number,
};

export function createSheetBindProps(refs: SheetRefs): SheetBindProps
{
	return {
		// main.popup places the sheet below the anchor bottom, so the anchor bottom is
		// the sticky header height: it keeps the task title visible and, unlike the header
		// offsetTop, does not move while the card is scrolled.
		getBindElement: () => ({ left: 0, top: 0, bottom: refs.title?.offsetHeight ?? 0 }),
		getTargetContainer: () => refs.main,
	};
}
