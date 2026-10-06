import { ZIndexManager } from 'main.core';

// main.core has no named type exports, so the component type is derived from the ZIndexManager signatures.
type Component = NonNullable<ReturnType<typeof ZIndexManager.getComponent>>;

export type Layer = { node: HTMLElement; comp: Component };

// Passive service layers excluded from the cross-layer arbitration. An allowlist of root classes
// and NOT getAlwaysOnTop(): the platform marks interactive menus alwaysOnTop too, and those do take part.
const PASSIVE_LAYER_SELECTORS = '.ui-notification-balloon, .side-panel-toolbar';

// Empty rects drop both display: none and degenerate service layers such as the platform connection-status
// bar - a full-width, zero-height strip that would otherwise block closing on any real portal page. The
// visibility check keeps hidden layers (our own --measuring / --anchor-hidden included) out of the way.
export function isVisible(element: Element | null): boolean
{
	if (element === null || !element.isConnected)
	{
		return false;
	}

	if (!hasPaintedRect(element))
	{
		return false;
	}

	return getComputedStyle(element).visibility === 'visible';
}

// The collection is read in place: this runs for every layer of a stack on every click, and a spread would
// copy every rect of every one of them only to drop the copy on the next line.
function hasPaintedRect(element: Element): boolean
{
	for (const rect of element.getClientRects())
	{
		if (rect.width > 0 && rect.height > 0)
		{
			return true;
		}
	}

	return false;
}

function isPassive(comp: Component): boolean
{
	const element = comp.getElement();

	return element !== null && element.matches(PASSIVE_LAYER_SELECTORS);
}

// Layer links from documentElement down to el; non-layer nodes are skipped.
export function layerChain(el: Element | null): Layer[]
{
	const chain: Layer[] = [];
	let node: Element | null = el;

	while (node !== null)
	{
		const comp = ZIndexManager.getComponent(node as HTMLElement);
		if (comp)
		{
			chain.unshift({ node: node as HTMLElement, comp });
		}

		node = node.parentElement;
	}

	return chain;
}

function bodyStack(): NonNullable<ReturnType<typeof ZIndexManager.getStack>> | null
{
	return ZIndexManager.getStack(document.body) ?? null;
}

function stackHasVisibleLayer(stack: NonNullable<ReturnType<typeof ZIndexManager.getStack>>): boolean
{
	return stack.getComponents().some((comp) => !isPassive(comp) && isVisible(comp.getElement()));
}

// z-index values are only ever compared within one stack.
function visibleAbove(comp: Component): boolean
{
	const stack = comp.getStack();
	if (!stack)
	{
		return false;
	}

	const zIndex = comp.getZIndex();

	// The z-index comes first of the three: it is a number the stack already holds, while isPassive and
	// isVisible both go to the DOM. Everything at or below the popover is then answered for without a single
	// measurement, and on a portal page that is most of the stack.
	return stack.getComponents().some((other) => {
		return other !== comp
			&& other.getZIndex() > zIndex
			&& !isPassive(other)
			&& isVisible(other.getElement());
	});
}

function nodeHasVisibleLayer(node: Element): boolean
{
	const stack = ZIndexManager.getStack(node as HTMLElement);

	return stack ? stackHasVisibleLayer(stack) : false;
}

// A layer mounted inside the popover registers in the stack of its own parent, so the ancestor chain never
// sees it. The stack registry is a WeakMap and cannot be enumerated, hence the subtree walk. The walk is on
// the click path and the subtree is the content of the consumer, so nothing is materialised along the way:
// a TreeWalker hands the descendants over one at a time and the first hit ends the walk, where a list of the
// whole subtree would have been built in full before the first of them was even looked at.
function hasVisibleSubtreeLayer(popoverEl: HTMLElement): boolean
{
	if (nodeHasVisibleLayer(popoverEl))
	{
		return true;
	}

	// The walker belongs to the document of the popover: a mount container may live in another one.
	const walker = popoverEl.ownerDocument.createTreeWalker(popoverEl, NodeFilter.SHOW_ELEMENT);

	for (let node = walker.nextNode(); node !== null; node = walker.nextNode())
	{
		if (nodeHasVisibleLayer(node as Element))
		{
			return true;
		}
	}

	return false;
}

// A rule of the component and not a detail of this implementation: both Escape and click close the popover
// only while it is the top layer. The chain of the popover may be handed over by a caller that has it
// already - one click asks the same question twice, and the chain is the same answer both times.
export function hasVisibleLayerAbove(popoverEl: HTMLElement, popoverChain?: Layer[]): boolean
{
	if (hasVisibleSubtreeLayer(popoverEl))
	{
		return true;
	}

	const chain = popoverChain ?? layerChain(popoverEl);
	if (chain.some(({ comp }) => visibleAbove(comp)))
	{
		return true;
	}

	// Outside the body layer tree z-index values of different stacks are incomparable, so any visible
	// non-passive layer of the body stack is conservatively treated as being above.
	const stack = bodyStack();
	const inBodyStack = stack !== null && chain.some(({ comp }) => comp.getStack() === stack);
	if (!inBodyStack)
	{
		return stack !== null && stackHasVisibleLayer(stack);
	}

	return false;
}

export function isInBodyLayerTree(popoverEl: HTMLElement): boolean
{
	const stack = bodyStack();

	return stack !== null && layerChain(popoverEl).some(({ comp }) => comp.getStack() === stack);
}

// null means one chain is a prefix of the other, so they never diverge.
function firstDivergingPair(a: Layer[], b: Layer[]): [Layer, Layer] | null
{
	const length = Math.min(a.length, b.length);
	for (let index = 0; index < length; index++)
	{
		if (a[index].node !== b[index].node)
		{
			return [a[index], b[index]];
		}
	}

	return null;
}

// True for a click on a layer that is not above the popover - the bare page or an ancestor layer. The chain
// of the popover may be handed over, exactly as in hasVisibleLayerAbove above.
export function isClosingClick(popoverEl: HTMLElement, target: Element, popoverChain?: Layer[]): boolean
{
	const targetChain = layerChain(target);
	const layer = targetChain.length > 0 ? targetChain[targetChain.length - 1] : null;

	if (layer === null || layer.node.contains(popoverEl))
	{
		return true;
	}

	const pair = firstDivergingPair(targetChain, popoverChain ?? layerChain(popoverEl));
	if (pair === null)
	{
		return false;
	}

	const [a, b] = pair;
	if (a.comp.getStack() !== b.comp.getStack())
	{
		// Incomparable stacks: conservatively not an outside click.
		return false;
	}

	return a.comp.getZIndex() <= b.comp.getZIndex();
}
