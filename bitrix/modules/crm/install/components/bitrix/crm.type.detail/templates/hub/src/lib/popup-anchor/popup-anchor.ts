// Anything that ends up as a main.popup bindElement - BMenu's `bindElement` before this control was
// reworked onto ui.entity-selector, that Dialog's `targetNode` now (both eventually reach
// Popup.setBindElement, which calls `getBoundingClientRect` on it directly) - hits the same trap. A
// vue3 component's `$el` is not guaranteed to be an element: ui.vue3.components.button's template
// root is `<button v-if="!isMounted" ref="button">`, and `mounted()` flips `isMounted` and inserts
// the real button as a raw DOM sibling (`this.$refs.button.after(button)`) — so once mounted, the
// component's root, and therefore its `$el`, stays the v-if placeholder comment node.
// `Type.isDomNode` (main.core) is true for a comment too, so main.popup accepts it and only then
// crashes inside `Dom.getPosition` on `comment.getBoundingClientRect is not a function`
// (task-9a-brief.md). Resolving through this helper instead of reading `$refs` directly keeps that
// failure mode out of every call site: only a genuine element is ever handed back — a comment, a
// text node, an unmounted component or a missing ref all resolve to null so the caller can skip
// opening an unanchored popup instead of crashing. Renamed from resolveMenuAnchor (task-9b-brief.md)
// once BMenu left the component: nothing here was ever menu-specific.
export function resolvePopupAnchor(source: unknown): HTMLElement | null
{
	if (isElementNode(source))
	{
		return source;
	}

	const element = (source as { $el?: unknown } | null | undefined)?.$el;
	if (isElementNode(element))
	{
		return element;
	}

	return null;
}

function isElementNode(value: unknown): value is HTMLElement
{
	return (value as Node | null | undefined)?.nodeType === Node.ELEMENT_NODE;
}
