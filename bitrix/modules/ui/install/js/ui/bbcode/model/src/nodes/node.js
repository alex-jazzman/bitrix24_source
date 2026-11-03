import { Type } from 'main.core';
import type { BBCodeEncoder } from 'ui.bbcode.encoder';
import { getByIndex } from '../../../shared';
import { typeof BBCodeElementNode } from './element-node';
import { typeof BBCodeTextNode } from './text-node';
import { typeof BBCodeNewLineNode } from './new-line-node';
import { typeof BBCodeTabNode } from './tab-node';
import { typeof BBCodeRootNode } from './root-node';
import { typeof BBCodeFragmentNode } from './fragment-node';
import { typeof BBCodeScheme } from '../scheme/bbcode-scheme';
import { type BBCodeNodeScheme } from '../scheme/node-schemes/node-scheme';

export type BBCodeSpecialCharNode = BBCodeNewLineNode | BBCodeTabNode;
export type BBCodeContentNode = BBCodeElementNode | BBCodeTextNode | BBCodeSpecialCharNode;
export type BBCodeParentNode = BBCodeRootNode | BBCodeElementNode | BBCodeFragmentNode;

export type BBCodeNodeOptions = {
	name?: string,
	parent?: BBCodeParentNode | null,
	children?: Array<BBCodeContentNode | BBCodeFragmentNode>,
	scheme: BBCodeScheme,
};

export type SerializedBBCodeNode = {
	name: string,
	children: Array<SerializedBBCodeNode>,
};

type PrivateMapKey = BBCodeNode | BBCodeContentNode | BBCodeRootNode | BBCodeFragmentNode;
type PrivateStorage = {[key: string]: any};

export const privateMap: WeakMap<PrivateMapKey, PrivateStorage> = new WeakMap();
export const nameSymbol: Symbol = Symbol('name');

/**
 * Detaches one child of a node and returns the children it keeps. The list is returned rather than
 * assigned here so that the node whose list it is stays the one that replaces it -- and a new list
 * is built rather than the current one filtered in place, because replaceChild holds a reference to
 * the current one as its snapshot.
 */
function childrenWithout(parentNode: BBCodeParentNode, target: BBCodeContentNode): Array<BBCodeContentNode>
{
	const keptChildren = [];

	parentNode.children.forEach((node: BBCodeContentNode) => {
		if (node === target)
		{
			node.setParent(null);
		}
		else
		{
			keptChildren.push(node);
		}
	});

	return keptChildren;
}

/**
 * The same for a whole batch of children, in one walk of the list. Takes the batch as an array
 * instead of a list of arguments: spreading a batch of every child of a node hits the limit on the
 * number of arguments of the engine, which is an order of magnitude lower than the number of
 * children a document may hold.
 */
function childrenWithoutBatch(
	parentNode: BBCodeParentNode,
	nodes: Array<BBCodeContentNode>,
): Array<BBCodeContentNode>
{
	// one node is the common case, through remove(), and a set of one costs more than it saves
	if (nodes.length === 1)
	{
		return childrenWithout(parentNode, nodes[0]);
	}

	const targets: Set<BBCodeContentNode> = new Set(nodes);
	const keptChildren = [];

	parentNode.children.forEach((node: BBCodeContentNode) => {
		if (targets.has(node))
		{
			node.setParent(null);
		}
		else
		{
			keptChildren.push(node);
		}
	});

	return keptChildren;
}

/**
 * Detaches a batch of nodes from their current parents, one call per parent instead of one per
 * node: removing children one by one walks the whole child list of the parent every time, which
 * costs a square of the batch size. The per-node remove() the callers still run afterwards fires
 * only for a node passed twice in the same call, whose parent by then is the target node itself.
 * The map is built on the first node that has a parent: most batches have none at all.
 */
export function detachFromParents(nodes: Array<BBCodeContentNode>)
{
	// a batch of one is the most common batch of all -- appending a single node -- and grouping it
	// by parent would build a map to hold the one parent it already has
	if (nodes.length === 1)
	{
		const parentNode: BBCodeParentNode | null = nodes[0].getParent();
		if (parentNode)
		{
			parentNode.children = childrenWithout(parentNode, nodes[0]);
		}

		return;
	}

	let groups: ?Map<BBCodeParentNode, Array<BBCodeContentNode>> = null;

	nodes.forEach((node: BBCodeContentNode) => {
		const parentNode: BBCodeParentNode | null = node.getParent();
		if (!parentNode)
		{
			return;
		}

		if (groups === null)
		{
			groups = new Map();
		}

		const group: ?Array<BBCodeContentNode> = groups.get(parentNode);
		if (group)
		{
			group.push(node);
		}
		else
		{
			groups.set(parentNode, [node]);
		}
	});

	if (groups === null)
	{
		return;
	}

	for (const [parentNode, group] of groups)
	{
		parentNode.children = childrenWithoutBatch(parentNode, group);
	}
}

/**
 * The place a node holds among the children of its parent, or the end of that list while the node
 * is not in it. A node is parented before it is put into the list -- appendChild calls setParent
 * first and pushes afterwards -- so a node that hoists its delayed children on mount looks for
 * itself in a list it has yet to enter. Its place there is the end, where the push is about to put
 * it. What the place must never be is -1: splice counts a negative index from the end of the list,
 * which lands the children in a position that has nothing to do with the node.
 */
function positionInList(children: Array<BBCodeContentNode>, node: BBCodeNode): number
{
	const index: number = children.indexOf(node);

	return index === -1 ? children.length : index;
}

export class BBCodeNode
{
	[nameSymbol]: string = '#unknown';
	children: Array<BBCodeContentNode | BBCodeFragmentNode> = [];

	constructor(options: BBCodeNodeOptions = {})
	{
		privateMap.set(this, {
			delayedChildren: [],
		});

		this.setName(options.name);
		privateMap.get(this).scheme = options.scheme;
		this.setParent(options.parent);
		this.setChildren(options.children);
	}

	static get ELEMENT_NODE(): number
	{
		return 1;
	}

	static get TEXT_NODE(): number
	{
		return 2;
	}

	static get ROOT_NODE(): number
	{
		return 3;
	}

	static get FRAGMENT_NODE(): number
	{
		return 4;
	}

	static freezeProperty(node: BBCodeNode, property: string, value: any, enumerable: boolean = true)
	{
		Object.defineProperty(node, property, {
			value,
			writable: false,
			configurable: false,
			enumerable,
		});
	}

	static makeNonEnumerableProperty(node: BBCodeNode, property: string)
	{
		Object.defineProperty(node, property, {
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}

	static flattenChildren(children: Array<BBCodeContentNode | BBCodeFragmentNode>): Array<BBCodeContentNode>
	{
		if (Type.isArrayFilled(children))
		{
			return children.flatMap((node: BBCodeContentNode | BBCodeFragmentNode) => {
				if (node.getType() === BBCodeNode.FRAGMENT_NODE)
				{
					return node.getChildren();
				}

				return node;
			});
		}

		return [];
	}

	setScheme(scheme: BBCodeScheme, onUnknown: (node: BBCodeContentNode) => any)
	{
		privateMap.get(this).scheme = scheme;
	}

	getScheme(): BBCodeScheme
	{
		return privateMap.get(this).scheme;
	}

	getTagScheme(): BBCodeNodeScheme
	{
		return this.getScheme().getTagScheme(this.getName());
	}

	getEncoder(): BBCodeEncoder
	{
		return this.getScheme().getEncoder();
	}

	prepareCase(value: string): string
	{
		const scheme: BBCodeScheme = this.getScheme();
		const currentCase = scheme.getOutputTagCase();
		if (currentCase === 'upper')
		{
			return value.toUpperCase();
		}

		return value.toLowerCase();
	}

	setName(name: string)
	{
		if (Type.isString(name))
		{
			this[nameSymbol] = name.toLowerCase();
		}
	}

	getName(): string
	{
		return this[nameSymbol];
	}

	getDisplayedName(): string
	{
		return this.prepareCase(this.getName());
	}

	setParent(parent: BBCodeParentNode | null = null)
	{
		const mounted = !this.hasParent() && parent;
		privateMap.get(this).parent = parent;

		if (mounted)
		{
			this.onNodeDidMount();
		}
	}

	getParent(): BBCodeParentNode | null
	{
		return privateMap.get(this).parent;
	}

	getType(): number
	{
		return privateMap.get(this).type;
	}

	hasParent(): boolean
	{
		return Boolean(privateMap.get(this).parent);
	}

	remove()
	{
		if (this.hasParent())
		{
			this.getParent().removeChild(this);
		}
	}

	setChildren(children: Array<BBCodeContentNode | BBCodeFragmentNode>)
	{
		if (Type.isArray(children))
		{
			// the current children are detached before the list is dropped, not by appendChild
			// afterwards: by then the grouped detach walks an empty list, finds none of them and
			// leaves every one of them parented here, which costs appendChild a square again.
			// Every one of them is a child of this node by definition, so grouping them by parent
			// would build a map, a set and a copy of the list to arrive at the list itself
			this.children.forEach((node: BBCodeContentNode) => {
				node.setParent(null);
			});

			this.children = [];
			this.appendChild(...children);
		}
	}

	getChildren(): Array<BBCodeContentNode>
	{
		return [...this.children];
	}

	getLastChild(): ?BBCodeContentNode
	{
		return getByIndex(this.getChildren(), -1);
	}

	getLastChildOfType(type: number): ?BBCodeContentNode
	{
		return this.getChildren().reverse().find((node: BBCodeContentNode) => {
			return node.getType() === type;
		});
	}

	getLastChildOfName(name: string): ?BBCodeContentNode
	{
		return this.getChildren().reverse().find((node: BBCodeContentNode) => {
			return node.getType() === BBCodeNode.ELEMENT_NODE && node.getName() === name;
		});
	}

	getFirstChild(): ?BBCodeContentNode
	{
		return getByIndex(this.getChildren(), 0);
	}

	getFirstChildOfType(type: number): ?BBCodeContentNode
	{
		return this.getChildren().find((node: BBCodeContentNode) => {
			return node.getType() === type;
		});
	}

	getFirstChildOfName(name: string): ?BBCodeContentNode
	{
		return this.getChildren().find((node: BBCodeContentNode) => {
			return node.getType() === BBCodeNode.ELEMENT_NODE && node.getName() === name;
		});
	}

	getPreviewsSibling(): ?BBCodeContentNode
	{
		if (this.hasParent())
		{
			const parentChildren: Array<BBCodeContentNode> = this.getParent().getChildren();
			const currentIndex: number = parentChildren.indexOf(this);
			if (currentIndex > 0)
			{
				return getByIndex(parentChildren, currentIndex - 1);
			}
		}

		return null;
	}

	getPreviewsSiblings(): ?Array<BBCodeContentNode>
	{
		if (this.hasParent())
		{
			const parentChildren: Array<BBCodeContentNode> = this.getParent().getChildren();
			const currentIndex: number = parentChildren.indexOf(this);

			return parentChildren.filter((child: BBCodeContentNode, index) => {
				return index < currentIndex;
			});
		}

		return null;
	}

	getNextSibling(): ?BBCodeContentNode
	{
		if (this.hasParent())
		{
			const parentChildren: Array<BBCodeContentNode> = this.getParent().getChildren();
			const currentIndex: number = parentChildren.indexOf(this);
			if (currentIndex !== -1 && currentIndex !== parentChildren.length)
			{
				return getByIndex(parentChildren, currentIndex + 1);
			}
		}

		return null;
	}

	getNextSiblings(): ?Array<BBCodeContentNode>
	{
		if (this.hasParent())
		{
			const parentChildren: Array<BBCodeContentNode> = this.getParent().getChildren();
			const currentIndex: number = parentChildren.indexOf(this);

			return parentChildren.filter((child: BBCodeContentNode, index) => {
				return index > currentIndex;
			});
		}

		return null;
	}

	getChildrenCount(): number
	{
		return this.children.length;
	}

	hasChildren(): boolean
	{
		return this.getChildrenCount() > 0;
	}

	isEmpty(): boolean
	{
		return this.getChildrenCount() === 0;
	}

	adjustChildren()
	{
		this.setChildren(this.getChildren());
	}

	setDelayedChildren(children: Array<BBCodeContentNode>)
	{
		if (Type.isArray(children))
		{
			privateMap.get(this).delayedChildren = children;
		}
	}

	addDelayedChildren(children: Array<BBCodeContentNode>)
	{
		if (Type.isArrayFilled(children))
		{
			this.setDelayedChildren([
				...this.getDelayedChildren(),
				...children,
			]);
		}
	}

	hasDelayedChildren(): boolean
	{
		return privateMap.get(this).delayedChildren.length > 0;
	}

	getDelayedChildren(): Array<BBCodeContentNode>
	{
		return [...privateMap.get(this).delayedChildren];
	}

	appendChild(...children: Array<BBCodeContentNode | BBCodeFragmentNode>)
	{
		const flattenedChildren: Array<BBCodeContentNode> = BBCodeNode.flattenChildren(children);

		detachFromParents(flattenedChildren);

		flattenedChildren.forEach((node: BBCodeContentNode) => {
			node.remove();
			node.setParent(this);
			this.children.push(node);
		});
	}

	prependChild(...children: Array<BBCodeContentNode | BBCodeFragmentNode>)
	{
		const flattenedChildren: Array<BBCodeContentNode> = BBCodeNode.flattenChildren(children);

		detachFromParents(flattenedChildren);

		flattenedChildren.forEach((node: BBCodeContentNode) => {
			node.remove();
			node.setParent(this);
			this.children.unshift(node);
		});
	}

	insertBefore(...nodes: Array<BBCodeContentNode>)
	{
		if (this.hasParent() && Type.isArrayFilled(nodes))
		{
			const parent: BBCodeContentNode = this.getParent();
			const parentChildren: Array<BBCodeContentNode> = parent.getChildren();
			const currentNodeIndex: number = positionInList(parentChildren, this);

			const deleteCount: number = 0;
			parentChildren.splice(currentNodeIndex, deleteCount, ...nodes);

			parent.setChildren(parentChildren);
		}
	}

	insertAfter(...nodes: Array<BBCodeContentNode>)
	{
		if (this.hasParent() && Type.isArrayFilled(nodes))
		{
			const parent: BBCodeContentNode = this.getParent();
			const parentChildren: Array<BBCodeContentNode> = parent.getChildren();
			const currentNodeIndex: number = positionInList(parentChildren, this);

			const startIndex: number = Math.min(currentNodeIndex + 1, parentChildren.length);
			const deleteCount: number = 0;
			parentChildren.splice(startIndex, deleteCount, ...nodes);

			parent.setChildren(parentChildren);
		}
	}

	propagateChild(...children: Array<BBCodeContentNode>)
	{
		if (this.hasParent())
		{
			this.insertBefore(
				...children.filter((child: BBCodeContentNode) => {
					return !['#linebreak', '#tab'].includes(child.getName());
				}),
			);
		}
		else
		{
			this.addDelayedChildren(children);
		}
	}

	onNodeDidMount()
	{
		const delayedChildren = this.getDelayedChildren();
		if (Type.isArrayFilled(delayedChildren))
		{
			this.propagateChild(...delayedChildren);
			this.setDelayedChildren([]);
		}
	}

	removeChild(...children: Array<BBCodeContentNode>)
	{
		this.children = childrenWithoutBatch(this, children);
	}

	replaceChild(targetNode: BBCodeContentNode, ...children: Array<BBCodeContentNode | BBCodeFragmentNode>)
	{
		// the snapshot is taken before the detach: detaching an own child reassigns this.children
		const snapshot: Array<BBCodeContentNode> = this.children;

		this.children = snapshot.flatMap((node: BBCodeContentNode) => {
			if (node === targetNode)
			{
				node.setParent(null);

				// everything below happens only once the target is found: a replacement that does
				// not happen must leave the new children with the parents they had
				const flattenedChildren: Array<BBCodeContentNode> = BBCodeNode.flattenChildren(children);

				detachFromParents(flattenedChildren);

				flattenedChildren.forEach((child: BBCodeContentNode) => {
					child.setParent(this);
				});

				return flattenedChildren;
			}

			return node;
		});
	}

	replace(...children: Array<BBCodeContentNode | BBCodeFragmentNode>)
	{
		if (this.hasParent())
		{
			const parent = this.getParent();
			parent.replaceChild(this, ...children);
		}
	}

	clone(options: { deep: boolean } = {}): BBCodeNode
	{
		const children = (() => {
			if (options.deep)
			{
				return this.getChildren().map((child) => {
					return child.clone(options);
				});
			}

			return [];
		})();

		return this.getScheme().createNode({
			name: this.getName(),
			parent: this.getParent(),
			children,
		});
	}

	toPlainText(): string
	{
		return this.getChildren().map((child) => {
			return child.toPlainText();
		}).join('');
	}

	getTextContent(): string
	{
		return this.toPlainText();
	}

	getPlainTextLength(): number
	{
		return this.toPlainText().length;
	}

	removePreviewsSiblings()
	{
		const removePreviewsSiblings = (node: BBCodeContentNode) => {
			const previewsSiblings = node.getPreviewsSiblings();
			if (Type.isArray(previewsSiblings))
			{
				previewsSiblings.forEach((sibling: BBCodeContentNode) => {
					sibling.remove();
				});
			}

			const parent = node.getParent();
			if (parent)
			{
				removePreviewsSiblings(parent);
			}
		};

		removePreviewsSiblings(this);
	}

	removeNextSiblings()
	{
		const removeNextSiblings = (node: BBCodeContentNode) => {
			const nextSiblings = node.getNextSiblings();
			if (Type.isArray(nextSiblings))
			{
				nextSiblings.forEach((sibling: BBCodeContentNode) => {
					sibling.remove();
				});
			}

			const parent = node.getParent();
			if (parent)
			{
				removeNextSiblings(parent);
			}
		};

		removeNextSiblings(this);
	}

	findByTextIndex(index: number): ?{ node: BBCodeTextNode, startIndex: number, endIndex: number }
	{
		let currentIndex = 0;
		let startIndex = 0;
		let endIndex = 0;

		const node = BBCodeNode.flattenAst(this).find((child: BBCodeContentNode) => {
			if (
				child.getName() === '#text'
				|| child.getName() === '#linebreak'
				|| child.getName() === '#tab'
			)
			{
				startIndex = currentIndex;
				endIndex = startIndex + child.getLength();
				currentIndex = endIndex;

				return index >= startIndex && endIndex >= index;
			}

			return false;
		});

		if (node)
		{
			return { node, startIndex, endIndex };
		}

		return null;
	}

	split(options: { offset: number, byWord?: boolean}): Array<BBCodeContentNode>
	{
		const { offset, byWord = false } = options;
		const plainTextLength = this.getPlainTextLength();

		const leftTree = (() => {
			if (plainTextLength === offset)
			{
				return this.clone({ deep: true });
			}

			if (offset <= 0 || offset > plainTextLength)
			{
				return null;
			}

			const tree = this.clone({ deep: true });
			const { node, startIndex } = tree.findByTextIndex(offset);
			const [leftNode, rightNode] = node.split({ offset: offset - startIndex, byWord });
			if (leftNode)
			{
				node.replace(leftNode);
				leftNode.removeNextSiblings();
			}
			else if (rightNode)
			{
				rightNode.removeNextSiblings();
				rightNode.remove();
			}

			return tree;
		})();

		const rightTree = (() => {
			if (plainTextLength === offset)
			{
				return null;
			}

			if (offset === 0)
			{
				return this.clone({ deep: true });
			}

			const tree = this.clone({ deep: true });
			const { node, startIndex } = tree.findByTextIndex(offset);
			const [leftNode, rightNode] = node.split({ offset: offset - startIndex, byWord });
			if (rightNode)
			{
				node.replace(rightNode);
				rightNode.removePreviewsSiblings();
			}
			else if (leftNode)
			{
				leftNode.removePreviewsSiblings();
				if (leftNode.hasParent())
				{
					const parent = leftNode.getParent();
					leftNode.remove();
					if (parent.getChildrenCount() === 0)
					{
						parent.remove();
					}
				}
			}

			return tree;
		})();

		return [leftTree, rightTree];
	}

	static flattenAst(ast): Array<any>
	{
		const flat = [];

		const traverse = (node: BBCodeContentNode) => {
			flat.push(node);
			if (node.hasChildren())
			{
				node.getChildren().forEach((child: BBCodeContentNode) => {
					traverse(child);
				});
			}
		};

		if (ast.hasChildren())
		{
			ast.getChildren().forEach((child: BBCodeContentNode) => {
				traverse(child);
			});
		}

		return flat;
	}

	toJSON(): SerializedBBCodeNode
	{
		return {
			name: this.getName(),
			children: this.getChildren().map((child: BBCodeContentNode) => {
				return child.toJSON();
			}),
		};
	}
}
