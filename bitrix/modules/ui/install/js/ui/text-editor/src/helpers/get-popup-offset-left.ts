import { type TextEditor } from '../text-editor';
import { getEditorPaddings } from './get-editor-paddings';

/**
 * How far left of the anchor point a popup of `popupWidth` starts.
 *
 * It is centered on the anchor and then pushed back inside the editor's scroll area by whatever
 * it overflows on the side it hit, plus that side's editor padding.
 */
export function getPopupOffsetLeft(
	editor: TextEditor,
	scrollerRect: DOMRect,
	left: number,
	popupWidth: number,
): number
{
	let offsetLeft: number = popupWidth / 2;
	const editorPaddings = getEditorPaddings(editor);

	if (left - offsetLeft < scrollerRect.left)
	{
		// Left boundary
		const overflow = scrollerRect.left - (left - offsetLeft);
		offsetLeft -= overflow + editorPaddings.left;
	}
	else if (scrollerRect.right < left + popupWidth - offsetLeft)
	{
		// Right boundary
		offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + editorPaddings.right;
	}

	return offsetLeft;
}
