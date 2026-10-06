import {Dom, Type} from 'main.core';
import {type Property, type RenderedControl} from '../../const/type';
import {insertWhereNodeWas} from '../../lib/node-position/node-position';
import {isSelectable} from '../../lib/property/property';

export type SelectionContext = {
	documentType?: string[],
	extra?: Record<string, unknown>,
};

export interface SelectionProvider
{
	isAvailable(): boolean;

	supports(property: Property): boolean;

	/**
	 * Wraps the given control node into the provider's own markup and returns the wrapper.
	 *
	 * The node handed in has to come back inside the result: either that very node, or a copy
	 * that kept its attributes. The core marks the node before the call and finds it again by
	 * that marker, because after decoration it is the copy - not the original - the field's
	 * value is read from and written to. Markup built around neither leaves the core no live
	 * node to work with; such a decoration is dropped rather than let the value drift away from
	 * what is on screen.
	 */
	decorate(
		controlNode: HTMLElement,
		property: Property,
		context: SelectionContext,
	): HTMLElement;

	decorateByRole(
		role: string,
		controlNode: HTMLElement,
		property: Property,
		context: SelectionContext,
	): HTMLElement;
}

/**
 * Signature of applySelectionDecorator below. Layers that may not import the domain at
 * runtime take the decorator as a parameter typed by this.
 */
export type SelectionDecorator = (
	control: RenderedControl,
	property: Property,
	provider: SelectionProvider,
	context: SelectionContext,
) => RenderedControl;

/**
 * Rides on the value node while the provider decorates it. A provider wraps a deep
 * copy of the node it is given (InlineSelector.renderWith clones through
 * Runtime.clone) and writes inserted values into that copy, so the copy - not the
 * original - is the live value node afterwards. The marker is how we hand the copy
 * back to the caller without guessing it by tag name.
 */
const VALUE_NODE_MARKER = 'data-bizproc-field-value-node';

/**
 * Whether the decorator below would do anything at all. Asked on its own by the core,
 * which decides before rendering whether a type has to draw its own insert button.
 */
export function canApplySelectionDecorator(property: Property, provider: SelectionProvider): boolean
{
	return isSelectable(property) && provider.isAvailable() && provider.supports(property);
}

/**
 * Lets the selection provider decorate the control, keeping the root and the value
 * node apart: the provider decorates the node insertion attaches to, the result is
 * spliced back into the root, and the decorated pair is returned so the core never has
 * to rediscover the live node.
 *
 * Which node that is decides everything else, hence the two branches: a type that
 * declared an insert anchor of its own gets that node wrapped and nothing else moved,
 * while a type that declared none has its value node wrapped - and then the live value
 * node is the copy inside the wrapper, which is what the marker dance below recovers.
 */
export function applySelectionDecorator(
	control: RenderedControl,
	property: Property,
	provider: SelectionProvider,
	context: SelectionContext,
): RenderedControl
{
	if (!canApplySelectionDecorator(property, provider))
	{
		return control;
	}

	const anchor = control.insertAnchor;

	if (!Type.isUndefined(anchor) && isDecoratableAnchor(anchor, control))
	{
		return decorateInsertAnchor(control, anchor, property, provider, context);
	}

	return decorateValueNode(control, property, provider, context);
}

/**
 * Whether the anchor may be handed to the provider. Decoration puts the wrapper in the
 * anchor's place, so a node the core keeps working with must not sit inside it. An anchor
 * holding the value node (the value node itself included) would hand the provider the very
 * node whose live copy has to be recovered - that is what the value node branch is for. A
 * named node inside the anchor is the same trap with no recovery at all: it would simply
 * leave the document, and the field would lose what names and focuses it.
 */
function isDecoratableAnchor(anchor: HTMLElement, control: RenderedControl): boolean
{
	if (anchor.contains(control.valueNode))
	{
		return false;
	}

	return Type.isUndefined(control.namedNode) || !anchor.contains(control.namedNode);
}

function decorateInsertAnchor(
	control: RenderedControl,
	anchor: HTMLElement,
	property: Property,
	provider: SelectionProvider,
	context: SelectionContext,
): RenderedControl
{
	// Taken before the provider runs: a provider that wraps the anchor by moving it leaves
	// nothing at this position to splice the decoration in against afterwards.
	const parent = anchor.parentElement;
	const next = anchor.nextElementSibling;

	const decorated = provider.decorate(anchor, property, context);

	if (decorated === anchor)
	{
		return control;
	}

	if (decorated.contains(anchor))
	{
		insertWhereNodeWas(decorated, parent, next);
	}
	else
	{
		Dom.replace(anchor, decorated);
	}

	// The anchor role ends here: it is consumed by this decoration, and the pair the core
	// keeps working with is the untouched one.
	return {root: control.root, valueNode: control.valueNode, namedNode: control.namedNode};
}

function decorateValueNode(
	control: RenderedControl,
	property: Property,
	provider: SelectionProvider,
	context: SelectionContext,
): RenderedControl
{
	// Taken before the provider runs: a provider that moves the node instead of copying it
	// leaves nothing at this position to splice the decoration in against afterwards.
	const parent = control.valueNode.parentElement;
	const next = control.valueNode.nextElementSibling;

	Dom.attr(control.valueNode, VALUE_NODE_MARKER, '');
	const decorated = provider.decorate(control.valueNode, property, context);
	Dom.attr(control.valueNode, VALUE_NODE_MARKER, null);

	if (decorated === control.valueNode)
	{
		return control;
	}

	// Moved, not copied: the marker was stripped off the original above, so it is no longer
	// findable - but it is the live node all the same, just somewhere else now.
	const moved = decorated.contains(control.valueNode);
	const marked = findValueNode(decorated);

	if (Type.isNull(marked) && !moved)
	{
		// Neither the node nor a copy of it came back, so there is no telling which node the
		// field now writes to. Splicing this in would leave the manager reading a node outside
		// the document while the user types into another one: the button is worth less than that.
		console.error(
			'[bizproc.fields] selection provider returned markup holding neither the control node '
			+ 'nor a copy of it; the decoration is dropped, see SelectionProvider.decorate',
		);

		return control;
	}

	const valueNode = marked ?? control.valueNode;
	Dom.attr(valueNode, VALUE_NODE_MARKER, null);

	if (control.valueNode === control.root)
	{
		// The new root is handed back for the caller to put in place of the old one, but a caller
		// that cannot do that keeps the node it already has (BackendRenderer in public mode, where
		// the root is the placeholder it gave away) - and a moved root has left the document with
		// the provider by now. A root still detached, as every registered type has it here, has no
		// parent and nothing is inserted.
		if (moved)
		{
			insertWhereNodeWas(decorated, parent, next);
		}

		return {root: decorated, valueNode, namedNode: control.namedNode};
	}

	if (moved)
	{
		insertWhereNodeWas(decorated, parent, next);
	}
	else
	{
		Dom.replace(control.valueNode, decorated);
	}

	return {
		root: control.root,
		valueNode,
		// A type that named the value node explicitly must follow it to the live copy.
		namedNode: control.namedNode === control.valueNode ? valueNode : control.namedNode,
	};
}

function findValueNode(decorated: HTMLElement): HTMLElement | null
{
	if (decorated.matches(`[${VALUE_NODE_MARKER}]`))
	{
		return decorated;
	}

	const found = decorated.querySelector(`[${VALUE_NODE_MARKER}]`);

	return Type.isElementNode(found) ? found : null;
}
