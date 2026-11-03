// Whether an edit mode anchored on `content` should end, judged by where focus actually LANDED
// rather than by a focusout's `relatedTarget`.
//
// The distinction is not academic. Opening the passport's edit mode removes the pencil button, and
// Chrome blurs it on the way out — that arrives as a focusout with `relatedTarget: null`, which at
// dispatch time is indistinguishable from a click on inert background. Asking `document.activeElement`
// one macrotask later separates them: by then the caret is already inside `content`.
export function shouldEndEditing(content: Node | null | undefined, focused: Node | null): boolean
{
	if (!content || !focused)
	{
		return true;
	}

	return !content.contains(focused);
}
