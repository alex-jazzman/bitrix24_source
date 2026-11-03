import { Dom, Type } from 'main.core';
import { type Popup } from 'main.popup';
import { $getSelection, $isRangeSelection } from 'ui.lexical.core';

import { type TextEditor } from '../text-editor';
import { getPopupOffsetLeft } from './get-popup-offset-left';
import { $getSelectionPosition, type SelectionPosition } from './get-selection-position';

const lastPositionMap: WeakMap<Popup, 'top' | 'bottom'> = new WeakMap();

export function $adjustDialogPosition(
	popup: Popup,
	editor: TextEditor,
	initPosition?: (selectionPosition: SelectionPosition) => string,
): boolean
{
	const selection = $getSelection();
	if (!$isRangeSelection(selection))
	{
		return false;
	}

	// for an embedded popup: document.body -> editor.getScrollerContainer()
	const selectionPosition = $getSelectionPosition(editor, selection, document.body);
	if (selectionPosition === null)
	{
		return false;
	}

	const { top, left, bottom, isBackward } = selectionPosition;
	const scrollerRect: DOMRect = Dom.getPosition(editor.getScrollerContainer());
	const popupRect: DOMRect = Dom.getPosition(popup.getPopupContainer());

	// Try to fit a popup within a scroll area
	const offsetLeft: number = getPopupOffsetLeft(editor, scrollerRect, left, popupRect.width);

	// Popup.setOffset() handles partial params at runtime, but its type requires both offsets
	popup.setOffset({ offsetLeft: -offsetLeft } as { offsetTop: number, offsetLeft: number });

	if (bottom < scrollerRect.top || top > scrollerRect.bottom)
	{
		// hide our popup
		Dom.style(popup.getPopupContainer(), { left: '-9999px', top: '-9999px' });
	}
	else
	{
		const initialPosition = Type.isFunction(initPosition)
			? initPosition(selectionPosition)
			: (isBackward
				? 'top'
				: 'bottom');
		const lastPosition = lastPositionMap.get(popup) || null;
		let position = lastPosition === null ? initialPosition : lastPosition;
		if (top + popupRect.height > scrollerRect.bottom && scrollerRect.top < top - popupRect.height)
		{
			position = 'top';
		}
		else if (top - popupRect.height < scrollerRect.top)
		{
			position = 'bottom';
		}

		lastPositionMap.set(popup, position as 'top' | 'bottom');

		// Popup.setBindElement() supports 'bottom' at runtime, but its type omits it
		popup.setBindElement({ left, top, bottom } as { left: number, top: number });
		popup.adjustPosition({ position: position as 'top' | 'bottom', forceBindPosition: true });
	}

	return true;
}

export function clearDialogPosition(popup: Popup): void
{
	lastPositionMap.delete(popup);
}
