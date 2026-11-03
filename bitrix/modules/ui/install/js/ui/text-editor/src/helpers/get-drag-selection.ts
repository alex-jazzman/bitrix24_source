interface DragEvent extends globalThis.DragEvent
{
	rangeOffset?: number;
	rangeParent?: Node;
}

export function getDragSelection(event: DragEvent): Range | null
{
	const target: Element | Document | null = event.target as Element | Document | null;
	let targetWindow = null;
	if (target !== null)
	{
		targetWindow = target.nodeType === 9
			? (target as Document).defaultView
			: (target as Element).ownerDocument.defaultView;
	}

	// both point lookups resolve against the top-level document, not the target window document:
	// the editor is not mounted into a nested document, where the two would diverge
	if (document.caretRangeFromPoint)
	{
		return document.caretRangeFromPoint(event.clientX, event.clientY);
	}

	// the standard method, kept below the legacy one so that engines having both keep their path
	if (document.caretPositionFromPoint)
	{
		const position = document.caretPositionFromPoint(event.clientX, event.clientY);
		if (position !== null)
		{
			const range = document.createRange();
			range.setStart(position.offsetNode, position.offset);
			range.collapse(true);

			return range;
		}
	}

	const domSelection = (targetWindow || window).getSelection();
	if (event.rangeParent && domSelection !== null)
	{
		domSelection.collapse(event.rangeParent, event.rangeOffset || 0);

		return domSelection.getRangeAt(0);
	}

	throw new Error('Cannot get the selection when dragging');
}
