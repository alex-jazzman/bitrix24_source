import type { BlockTargets } from './types';

// the full domain auto-class set (targets of ALG-01); the picker additionally
// keeps its own narrower "tracked node" pattern — text/link/img without icon —
// because tracked nodes own their clicks while icons are picked here
const AI_NODE_CLASS_PATTERN = /^ai-node-(?:text|link|img|icon)-\d+$/;
const AI_ICON_CLASS_PATTERN = /^ai-node-icon-\d+$/;

// editor-injected elements that are absent in the saved block HTML must not
// shift :nth-child numbering; the set comes from the Q-1 audit of every
// insertion point into block.content reachable in the AI mode
const SERVICE_CLASS_PREFIX = 'landing-ui-';
const SERVICE_CLASSES = new Set([
	'landing-highlight-border',
	'landing-designer-block-pseudo-last',
	'main-ui-loader',
	'landing__copilot-skeleton_animated-text',
	'landing-block-user-action',
]);

// containers whose live subtree never matches the saved HTML (widgets are
// rendered inside at runtime): no target may be published at or inside them
const QUARANTINE_CLASSES = new Set(['bitrix24forms']);

export function isServiceElement(element: Element): boolean
{
	if (element.tagName === 'SCRIPT')
	{
		return true;
	}

	const classList = [...element.classList];
	if (classList.length === 0)
	{
		// tmpContent: a bare hidden div appended into the content root by the editor
		return element.hasAttribute('hidden');
	}

	return classList.some(
		(className) => className.startsWith(SERVICE_CLASS_PREFIX) || SERVICE_CLASSES.has(className),
	);
}

export function isQuarantineContainer(element: Element): boolean
{
	return [...element.classList].some((className) => QUARANTINE_CLASSES.has(className));
}

/**
 * Direct element children of the node with editor service elements filtered
 * out. Position numbering of the selector grammar (DTO-01) and the fingerprint
 * childCount (DTO-02) are both defined over this list. Every element counts —
 * including foreign content like svg/math — because the backend resolver
 * numbers all element children of the saved HTML.
 */
export function contentElementChildren(node: Element): Element[]
{
	return [...node.children].filter((child) => !isServiceElement(child));
}

function isAiNodeElement(element: Element): boolean
{
	return [...element.classList].some((className) => AI_NODE_CLASS_PATTERN.test(className));
}

/**
 * The icon auto-class of the element, or null when the element is not an icon;
 * the class doubles as the published icon selector (".ai-node-icon-N").
 */
export function findAiIconClass(element: Element): string | null
{
	return [...element.classList].find((className) => AI_ICON_CLASS_PATTERN.test(className)) ?? null;
}

/**
 * Computes the selectable targets of one block (ALG-01): AI nodes, icons,
 * LCA group containers with at least two nodes in distinct child subtrees,
 * and the whole-block target (the content root itself).
 *
 * Pure computation over the DOM subtree: no caching, no global state.
 * The caller (picker) owns caching and invalidation.
 */
export function collectTargets(contentRoot: Element): BlockTargets
{
	const nodes: Element[] = [];
	const icons: Element[] = [];
	const groups: Element[] = [];

	// single post-order pass: returns the count of AI nodes in the subtree
	const walk = (element: Element, insideNode: boolean): number => {
		const isNode = isAiNodeElement(element);
		if (findAiIconClass(element) !== null)
		{
			icons.push(element);
		}
		if (isNode)
		{
			nodes.push(element);
		}

		if (isQuarantineContainer(element))
		{
			// opaque subtree: its live content never matches the saved HTML
			return isNode ? 1 : 0;
		}

		let subtreeCount = isNode ? 1 : 0;
		let childMax = 0;
		for (const child of contentElementChildren(element))
		{
			const childCount = walk(child, insideNode || isNode);
			subtreeCount += childCount;
			childMax = Math.max(childMax, childCount);
		}

		const isGroup = (
			element !== contentRoot
			&& !isNode
			&& !insideNode
			&& subtreeCount >= 2
			// a wrapper whose single child subtree holds every node is not a group
			&& childMax < subtreeCount
		);
		if (isGroup)
		{
			groups.push(element);
		}

		return subtreeCount;
	};

	walk(contentRoot, false);

	return { nodes, icons, groups, blockTarget: contentRoot };
}
