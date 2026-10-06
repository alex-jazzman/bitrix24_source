import { buildFingerprint } from './fingerprint';
import { contentElementChildren, isQuarantineContainer, isServiceElement } from './target-model';
import type { PublishedTarget } from './types';

// tag or tag:nth-child(N); the same segment grammar as the backend resolver
const SEGMENT_REGEX = /^([a-z][a-z0-9-]*)(?::nth-child\((\d+)\))?$/i;

/**
 * Builds the positional selector of the target (ALG-02, grammar DTO-01):
 * the full direct-descendant path from the content root, ":nth-child(N)" only
 * where same-tag siblings exist, the first segment always bare. Numbering runs
 * over contentElementChildren() — editor service elements do not shift it.
 *
 * Returns null when the element is not addressable: detached from the root
 * subtree or filtered out as an editor service element.
 */
export function buildSelector(element: Element, contentRoot: Element): string | null
{
	const path: string[] = [];
	let current = element;
	while (current !== contentRoot)
	{
		const parent = current.parentElement;
		if (!parent)
		{
			return null;
		}

		const siblings = contentElementChildren(parent);
		const index = siblings.indexOf(current);
		if (index === -1)
		{
			return null;
		}

		const tag = current.tagName.toLowerCase();
		const hasSameTagSibling = siblings.some(
			(sibling) => sibling !== current && sibling.tagName.toLowerCase() === tag,
		);
		path.unshift(hasSameTagSibling ? `${tag}:nth-child(${index + 1})` : tag);
		current = parent;
	}

	// the first segment is always bare: the block wrapper is addressed by its own
	// id and the content root is its only content element, so root siblings are
	// outside of the resolve scope
	path.unshift(contentRoot.tagName.toLowerCase());

	return path.join(' > ');
}

/**
 * Front-side walk resolve (ALG-04). Differs from the backend ALG-03 in two
 * mandatory ways: the first segment is checked against the content root itself
 * (not searched among wrapper children), and sibling lists are filtered from
 * editor service elements — by the same contentElementChildren() the builder uses.
 */
export function walkResolve(contentRoot: Element, selector: string): Element | null
{
	const segments = selector.split('>').map((segment) => segment.trim());
	const parsedRoot = parseSegment(segments[0]);
	if (!parsedRoot || parsedRoot.position !== null || contentRoot.tagName.toLowerCase() !== parsedRoot.tag)
	{
		return null;
	}

	let node = contentRoot;
	for (const segment of segments.slice(1))
	{
		const parsed = parseSegment(segment);
		if (!parsed)
		{
			return null;
		}

		const children = contentElementChildren(node);
		if (parsed.position !== null)
		{
			const candidate = children[parsed.position - 1];
			if (!candidate || candidate.tagName.toLowerCase() !== parsed.tag)
			{
				return null;
			}
			node = candidate;
		}
		else
		{
			const matched = children.filter((child) => child.tagName.toLowerCase() === parsed.tag);
			if (matched.length !== 1)
			{
				return null;
			}
			node = matched[0];
		}
	}

	return node;
}

/**
 * Resolves the publishable target for the element (ALG-02): builds the selector,
 * verifies it with the deterministic walk resolve and, when the element itself is
 * not unambiguously addressable, lifts to the nearest resolvable ancestor up to
 * the content root. Targets at or inside quarantine containers are lifted above
 * them. The returned element is the actual published target — the frame must
 * highlight it, not the original element.
 */
export function resolvePublishedTarget(
	element: Element,
	contentRoot: Element,
): PublishedTarget | null
{
	let current: Element | null = element;
	while (current)
	{
		if (
			isServiceElement(current)
			|| isQuarantineContainer(current)
			|| hasQuarantineAncestor(current, contentRoot)
		)
		{
			current = current === contentRoot ? null : current.parentElement;
			continue;
		}

		const selector = buildSelector(current, contentRoot);
		if (selector !== null && walkResolve(contentRoot, selector) === current)
		{
			return {
				element: current,
				selector,
				fingerprint: buildFingerprint(current),
			};
		}

		current = current === contentRoot ? null : current.parentElement;
	}

	return null;
}

function hasQuarantineAncestor(element: Element, contentRoot: Element): boolean
{
	let current = element.parentElement;
	while (current && current !== contentRoot.parentElement)
	{
		if (isQuarantineContainer(current))
		{
			return true;
		}
		if (current === contentRoot)
		{
			return false;
		}
		current = current.parentElement;
	}

	return false;
}

function parseSegment(segment: string): { tag: string; position: number | null } | null
{
	const match = SEGMENT_REGEX.exec(segment);
	if (!match)
	{
		return null;
	}

	return {
		tag: match[1].toLowerCase(),
		position: match[2] === undefined ? null : Number.parseInt(match[2], 10),
	};
}
