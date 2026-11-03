import { Type } from 'main.core';

// Focusing whatever a template ref happens to hold, and dropping the caret at the END of it.
//
// The passport now edits its name in place — the heading itself becomes contenteditable — while the
// description stays a BInput. Those two need opposite treatment and a single `ref.focus?.()` cannot
// serve both:
//
//   - a component that exposes focus() knows where its own caret goes (BInput reaches past its
//     wrapper into the real <input>); asking its $el instead would focus the wrapper div;
//   - a contenteditable node has no focus() of its own worth calling — focus() lands the caret at
//     the START in Chrome, so an editor opened by the pencil would type backwards into its own name.
//
// Hence: exposed focus() wins, a raw element is used as is, and only then does $el come into play.
export type FocusTarget = HTMLElement | { focus?: () => void, $el?: unknown } | null | undefined;

// DOM node behind a template ref: the ref of a single-root component is its public instance, not its
// element. Returns null for anything that is not an element, so callers never guess.
export function resolveEditableElement(target: FocusTarget): HTMLElement | null
{
	if (!target)
	{
		return null;
	}

	if (isElement(target))
	{
		return target;
	}

	const host = (target as { $el?: unknown }).$el;

	return isElement(host) ? host : null;
}

export function focusEditable(target: FocusTarget): void
{
	if (!target)
	{
		return;
	}

	if (!isElement(target) && Type.isFunction((target as { focus?: () => void }).focus))
	{
		(target as { focus: () => void }).focus();

		return;
	}

	const element = resolveEditableElement(target);
	if (!element)
	{
		return;
	}

	element.focus();

	if (element.isContentEditable)
	{
		placeCaretAtEnd(element);
	}
}

// `instanceof HTMLElement` alone is not safe here: the node may come from another document (the hub
// is drawn inside a slider iframe), and each document has its own HTMLElement constructor.
function isElement(value: unknown): value is HTMLElement
{
	return Type.isElementNode(value);
}

function placeCaretAtEnd(element: HTMLElement): void
{
	const document = element.ownerDocument;
	const selection = document?.defaultView?.getSelection?.();
	if (!selection)
	{
		return;
	}

	const range = document.createRange();
	range.selectNodeContents(element);
	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
}
