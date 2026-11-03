import { BX } from './internal/global';
import { isNodeHidden, isNodeInDom } from './dom-traverse';

/**
 * Focus, hover decoration, selectability and the caret (MOD-01).
 *
 * The group has no shared state; what holds it together is that every function writes a marker
 * onto the node it is given - a class plus a `BXHOVER`/`BXFOCUS` property - and that the whole
 * set is the deprecated half of the old focus API.
 *
 * Note that `focusEvents` binds to the pointer entering and leaving, not to focus and blur,
 * despite its name. That is carried over as it is: the map it returns is what consumers pass to
 * `BX.adjust`.
 */

export function focus(el: any): boolean
{
	try
	{
		el.focus();

		return true;
	}
	catch (e)
	{
		// swallows everything, a missing node included
		return false;
	}
}

/**
 * @deprecated
 * @param el
 * @return {*}
 */
export function hoverEvents(el?: any): any
{
	if (el)
	{
		return BX.adjust(el, { events: hoverEvents() });
	}

	return { mouseover: hoverEventsHover, mouseout: hoverEventsHout };
}

/**
 * @deprecated
 */
export function hoverEventsHover(this: any): void
{
	BX.addClass(this, 'bx-hover');
	this.BXHOVER = true;
}

/**
 * @deprecated
 */
export function hoverEventsHout(this: any): void
{
	BX.removeClass(this, 'bx-hover');
	this.BXHOVER = false;
}

/**
 * @deprecated
 */
export function focusEvents(el?: any): any
{
	if (el)
	{
		return BX.adjust(el, { events: focusEvents() });
	}

	// the pointer, not focus and blur - the name is misleading and stays that way
	return { mouseover: focusEventsFocus, mouseout: focusEventsBlur };
}

/**
 * @deprecated
 */
export function focusEventsFocus(this: any): void
{
	BX.addClass(this, 'bx-focus');
	this.BXFOCUS = true;
}

/**
 * @deprecated
 */
export function focusEventsBlur(this: any): void
{
	BX.removeClass(this, 'bx-focus');
	this.BXFOCUS = false;
}

export function setUnselectable(node: any): void
{
	BX.style(node, {
		userSelect: 'none',
		MozUserSelect: 'none',
		WebkitUserSelect: 'none',
		KhtmlUserSelect: 'none',
	});
	node.setAttribute('unSelectable', 'on');
}

export function setSelectable(node: any): void
{
	BX.style(node, {
		userSelect: null,
		MozUserSelect: null,
		WebkitUserSelect: null,
		KhtmlUserSelect: null,
	});
	node.removeAttribute('unSelectable');
}

export function getCaretPosition(node: any): number
{
	let pos = 0;

	if (node.selectionStart || node.selectionStart == 0)
	{
		pos = node.selectionStart;
	}
	else if ((document as any).selection)
	{
		node.focus();
		const selection = (document as any).selection.createRange();
		selection.moveStart('character', -node.value.length);
		pos = selection.text.length;
	}

	return pos;
}

export function setCaretPosition(node: any, pos: any): void
{
	if (!isNodeInDom(node) || isNodeHidden(node) || node.disabled)
	{
		return;
	}

	if (node.setSelectionRange)
	{
		node.focus();
		node.setSelectionRange(pos, pos);
	}
	else if (node.createTextRange)
	{
		const range = node.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
}
