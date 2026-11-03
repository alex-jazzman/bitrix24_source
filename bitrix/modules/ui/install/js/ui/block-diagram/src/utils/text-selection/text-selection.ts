import { Type } from 'main.core';

/**
 * The document's own text selection, but only when it holds text. Both questions this file answers
 * start here, so "there is a text selection" means the same thing to the guard that reads it and to
 * the press that drops it.
 *
 * A caret carries no text, and neither does a run of whitespace: both read as no selection. A
 * browser without the Selection API reads the same way, so the caller never has to guard the call.
 */
function getNonEmptyTextSelection()
{
	const selection = Type.isFunction(window.getSelection) ? window.getSelection() : null;

	if (Type.isNil(selection) || selection.rangeCount === 0 || selection.isCollapsed)
	{
		return null;
	}

	return Type.isStringFilled(selection.toString().trim()) ? selection : null;
}

/**
 * Answers one question: does the document hold a non-empty text selection lying outside the given
 * boundary element? The function is pure - nothing is cached, nothing is subscribed to - so it is
 * asked at the moment a key is handled.
 *
 * A boundary that is not an element - missing, or a reference to a node that has not mounted yet -
 * means "not outside": with nothing to measure against, the answer stays with the caller.
 */
export function hasTextSelectionOutside(boundaryElement)
{
	if (!Type.isElementNode(boundaryElement))
	{
		return false;
	}

	const selection = getNonEmptyTextSelection();

	if (Type.isNil(selection))
	{
		return false;
	}

	const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;

	return !Type.isNil(commonAncestor) && !boundaryElement.contains(commonAncestor);
}

/**
 * Drops the text selection of the document, if there is one to drop. A caret is left where it
 * stands: it is a cursor, not a selection.
 */
export function clearTextSelection()
{
	getNonEmptyTextSelection()?.removeAllRanges();
}
