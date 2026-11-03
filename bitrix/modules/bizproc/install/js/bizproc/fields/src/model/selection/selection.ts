import {Dom, Type} from 'main.core';
import {type Property, type RenderedControl} from '../../const/type';
import {insertWhereNodeWas} from '../../lib/node-position/node-position';
import {isReadOnly, isSelectable} from '../../lib/property/property';
import {isWriteTarget, type WriteTarget} from '../../lib/write-target/write-target';

export type SelectionContext = {
	documentType?: string[],
	extra?: Record<string, unknown>,
	/**
	 * The name the framework runs this field under. A provider serving a whole form at once tells
	 * a decoration of one field from a decoration of another by it: the markup names nothing that
	 * holds for every type - the dropdown of a list never names the control insertion attaches to -
	 * and the property carries no name of its own.
	 */
	fieldName?: string,
	/**
	 * The node an inserted value goes into: the one the type declared for this very decoration,
	 * the expression companion where it carried one and the value node otherwise. The provider is
	 * told which node that is instead of looking for it in the markup it is handed - the type is
	 * the only one that knows the shape of its own control. Absent where the declared node is none
	 * a selector can write into (see isWriteTarget), and a provider without a target writes nowhere.
	 */
	writeTarget?: WriteTarget,
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

	/**
	 * Takes down what the provider holds outside the fields it decorated - markup of its own, a
	 * window standing in the body. Called when the manager is destroyed and not when a single
	 * field is released: one provider serves every field of a manager, so there is nothing here
	 * that belongs to one of them. A provider holding nothing outside the fields declares none.
	 */
	release?(): void;
}

/**
 * Rides on the value node while the provider decorates it. A provider wraps a deep
 * copy of the node it is given (InlineSelector.renderWith clones through
 * Runtime.clone) and writes inserted values into that copy, so the copy - not the
 * original - is the live value node afterwards. The marker is how we hand the copy
 * back to the caller without guessing it by tag name.
 */
const VALUE_NODE_MARKER = 'data-bizproc-field-value-node';

/**
 * The same ride for the expression node, and for the same reason: it is the one node of the pair
 * the core may find inside a decorated anchor, so it comes back from the decoration as a copy the
 * expression is typed into afterwards.
 */
const EXPRESSION_NODE_MARKER = 'data-bizproc-field-expression-node';

/**
 * Whether the decorator below would do anything at all. Asked on its own by the core,
 * which decides before rendering whether a type has to draw its own insert button, and by
 * the backend-rendered fallback path, which has no registered type to gate it with its own
 * isReadOnly() check the way BaseField.decoratesSelection() does.
 */
export function canApplySelectionDecorator(property: Property, provider: SelectionProvider): boolean
{
	return !isReadOnly(property) && isSelectable(property) && provider.isAvailable() && provider.supports(property);
}

/**
 * Lets the selection provider decorate the control, keeping the root and the value
 * node apart: the provider decorates the node insertion attaches to, the result is
 * spliced back into the root, and the decorated pair is returned so the core never has
 * to rediscover the live node.
 *
 * Which node that is decides everything else, hence the two branches: a type that
 * declared an insert anchor of its own gets that node wrapped, leaving the value node
 * alone, while a type that declared none has its value node wrapped. Either way the live
 * node is the copy inside the wrapper, which is what the marker dance below recovers -
 * the value node in one branch, the expression node the anchor carried in the other.
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
 *
 * The expression node is the exception the anchor branch is built around: an anchor that is it,
 * or holds it, is decorated all the same, because that node is recovered by the same marker
 * scheme the value node uses (see decorateInsertAnchor).
 */
function isDecoratableAnchor(anchor: HTMLElement, control: RenderedControl): boolean
{
	if (anchor.contains(control.valueNode))
	{
		return false;
	}

	return Type.isUndefined(control.namedNode) || !anchor.contains(control.namedNode);
}

/**
 * The context this decoration is run with: the one the caller passed, plus the node the write has
 * to reach. Built anew rather than filled in - the caller keeps the object it handed over, and a
 * field decorates every row of a multiple control with one and the same context.
 */
function withWriteTarget(context: SelectionContext, node: HTMLElement): SelectionContext
{
	return isWriteTarget(node) ? {...context, writeTarget: node} : context;
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

	const tracked = trackedExpressionNode(control, anchor);

	if (!Type.isNull(tracked))
	{
		Dom.attr(tracked, EXPRESSION_NODE_MARKER, '');
	}

	// The companion the anchor carries is what the expression is typed into; where the type
	// declared none, the anchor itself is the node offered for the write.
	const decorated = provider.decorate(anchor, property, withWriteTarget(context, tracked ?? anchor));

	if (!Type.isNull(tracked))
	{
		Dom.attr(tracked, EXPRESSION_NODE_MARKER, null);
	}

	if (decorated === anchor)
	{
		return control;
	}

	// Moved, not copied: the marker was stripped off the original above, so it is no longer
	// findable - but it is the live node all the same, just somewhere else now.
	const moved = decorated.contains(anchor);
	const marked = Type.isNull(tracked) ? null : findMarkedNode(decorated, EXPRESSION_NODE_MARKER);

	if (!Type.isNull(tracked) && Type.isNull(marked) && !moved)
	{
		// The anchor carried a value of the field, and neither it nor a copy of it came back: the
		// same loss the value node branch refuses to splice in, so the decoration is dropped here
		// too rather than leaving the field writing into a node outside the document.
		console.error(
			'[bizproc.fields] selection provider returned markup holding neither the anchor node '
			+ 'nor a copy of it; the decoration is dropped, see SelectionProvider.decorate',
		);

		return control;
	}

	if (moved)
	{
		insertWhereNodeWas(decorated, parent, next);
	}
	else
	{
		Dom.replace(anchor, decorated);
	}

	if (!Type.isNull(marked))
	{
		Dom.attr(marked, EXPRESSION_NODE_MARKER, null);
	}

	// The anchor role itself ends here - it is consumed by this decoration - and the rest of the
	// pair is the untouched one, save for the expression node the decoration carried away.
	return {
		root: control.root,
		valueNode: control.valueNode,
		namedNode: control.namedNode,
		expressionNode: Type.isNull(tracked) ? control.expressionNode : (marked ?? tracked),
	};
}

/**
 * The expression node this decoration has to recover, or nothing: a node declared outside the
 * anchor is left where it is, and a type that declared none has nothing to recover.
 */
function trackedExpressionNode(control: RenderedControl, anchor: HTMLElement): HTMLElement | null
{
	const expressionNode = control.expressionNode;

	if (Type.isUndefined(expressionNode) || !anchor.contains(expressionNode))
	{
		return null;
	}

	return expressionNode;
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
	const decorated = provider.decorate(
		control.valueNode,
		property,
		withWriteTarget(context, control.valueNode),
	);
	Dom.attr(control.valueNode, VALUE_NODE_MARKER, null);

	if (decorated === control.valueNode)
	{
		return control;
	}

	// Moved, not copied: the marker was stripped off the original above, so it is no longer
	// findable - but it is the live node all the same, just somewhere else now.
	const moved = decorated.contains(control.valueNode);
	const marked = findMarkedNode(decorated, VALUE_NODE_MARKER);

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

		return {
			root: decorated,
			valueNode,
			namedNode: control.namedNode,
			expressionNode: control.expressionNode,
		};
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
		// The expression node lives beside the value node, never inside it, so the decoration
		// of this branch leaves it where the type put it.
		expressionNode: control.expressionNode,
	};
}

function findMarkedNode(decorated: HTMLElement, marker: string): HTMLElement | null
{
	if (decorated.matches(`[${marker}]`))
	{
		return decorated;
	}

	const found = decorated.querySelector(`[${marker}]`);

	return Type.isElementNode(found) ? found : null;
}
