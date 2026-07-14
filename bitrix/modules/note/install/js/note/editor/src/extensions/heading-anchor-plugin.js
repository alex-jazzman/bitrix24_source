import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { computeHeadingEntries } from '../utils/heading-slug';
import type { HeadingEntry } from '../utils/heading-slug';

export const headingAnchorPluginKey = new PluginKey('note-heading-anchor');

// End of the collapsed section for entries[i]: the next heading of the same or
// shallower level *in the same container*, or that container's content end. Only
// a same-container sibling can cut a section short — a heading nested in a
// blockquote/callout inside the section is a different scope and is hidden whole
// with its container, never terminating the outer range. Plain headings (table,
// blockquote, callout) take no part in the mechanic: such a container folds as
// one block of its own section.
function sectionEnd(entries: HeadingEntry[], i: number): number
{
	const entry = entries[i];
	for (let j = i + 1; j < entries.length; j++)
	{
		const next = entries[j];
		if (next.plain || next.containerKey !== entry.containerKey)
		{
			continue;
		}

		if (next.level <= entry.level)
		{
			return next.pos;
		}
	}

	return entry.containerEnd;
}

// For every collapsed heading, returns the [start, end) document range whose
// blocks must be hidden: everything after the heading up to the section end
// (see sectionEnd). `revealed` holds heading positions force-expanded locally
// (anchor navigation in view mode) — they are treated as expanded so nothing of
// theirs is masked, without touching the persisted `collapsed` attribute.
function collectCollapsedRanges(
	entries: HeadingEntry[],
	revealed: Set<number> | null,
): Array<{ from: number, to: number }>
{
	const ranges = [];
	for (let i = 0; i < entries.length; i++)
	{
		const entry = entries[i];
		if (!entry.collapsed || entry.plain || (revealed !== null && revealed.has(entry.pos)))
		{
			continue;
		}

		const to = sectionEnd(entries, i);
		if (to > entry.endPos)
		{
			ranges.push({ from: entry.endPos, to });
		}
	}

	return ranges;
}

export function buildHeadingDecorationSet(doc: Object, revealed: Set<number> | null = null): Object
{
	const entries = computeHeadingEntries(doc);
	if (entries.length === 0)
	{
		return DecorationSet.empty;
	}

	const decorations = [];

	// Anchor id on every heading node.
	for (const entry of entries)
	{
		decorations.push(Decoration.node(entry.pos, entry.endPos, { id: entry.slug }));
	}

	// Hide blocks that live under a collapsed heading.
	const ranges = collectCollapsedRanges(entries, revealed);
	for (const range of ranges)
	{
		doc.nodesBetween(range.from, range.to, (node, pos) => {
			if (pos < range.from)
			{
				return true;
			}

			decorations.push(Decoration.node(pos, pos + node.nodeSize, {
				class: 'note-heading-collapsed-block',
			}));

			// Top-level blocks only — no need to descend into their children.
			return false;
		});
	}

	return DecorationSet.create(doc, decorations);
}

// When the selection lands inside a collapsed section (e.g. cursor moved in,
// search, remote edit), reveal it by expanding the covering collapsed headings.
function expandSelectionAncestors(transactions, newState): Object | null
{
	// Only react to pure caret moves. Skipping doc changes avoids fighting an
	// explicit collapse toggle and a collaborator collapsing a section the local
	// caret happens to sit in (both arrive as document changes).
	if (transactions.some((tr) => tr.docChanged))
	{
		return null;
	}

	if (!transactions.some((tr) => tr.selectionSet))
	{
		return null;
	}

	const entries = computeHeadingEntries(newState.doc);
	const selectionPos = newState.selection.from;
	let tr = null;

	for (let i = 0; i < entries.length; i++)
	{
		const entry = entries[i];
		if (!entry.collapsed || entry.plain)
		{
			continue;
		}

		const rangeEnd = sectionEnd(entries, i);
		if (selectionPos > entry.endPos && selectionPos < rangeEnd)
		{
			const node = newState.doc.nodeAt(entry.pos);
			if (node)
			{
				tr = tr ?? newState.tr;
				tr.setNodeMarkup(entry.pos, undefined, { ...node.attrs, collapsed: false });
			}
		}
	}

	return tr;
}

export function headingAnchorPlugin(): Object
{
	return new Plugin({
		key: headingAnchorPluginKey,
		state: {
			// Plugin state = { revealed: Set<pos>, decorations }. `revealed` are
			// heading positions force-expanded locally (anchor navigation in view
			// mode) — a non-persisted override of the collapse mask. It is fed via
			// a meta transaction that carries no document steps, so nothing syncs.
			init(_config, state)
			{
				return { revealed: new Set(), decorations: buildHeadingDecorationSet(state.doc) };
			},
			apply(tr, prev, _oldState, newState)
			{
				let revealed = prev.revealed;
				let changed = false;

				if (tr.docChanged)
				{
					const mapped = new Set();
					prev.revealed.forEach((pos) => {
						const result = tr.mapping.mapResult(pos);
						if (!result.deleted)
						{
							mapped.add(result.pos);
						}
					});
					revealed = mapped;
					changed = true;
				}

				const meta = tr.getMeta(headingAnchorPluginKey);
				if (meta && Array.isArray(meta.reveal) && meta.reveal.length > 0)
				{
					revealed = new Set(revealed);
					meta.reveal.forEach((pos) => revealed.add(pos));
					changed = true;
				}

				if (!changed)
				{
					return prev;
				}

				return {
					revealed,
					decorations: buildHeadingDecorationSet(newState.doc, revealed),
				};
			},
		},
		appendTransaction(transactions, _oldState, newState)
		{
			return expandSelectionAncestors(transactions, newState);
		},
		props: {
			decorations(state)
			{
				return headingAnchorPluginKey.getState(state).decorations;
			},
		},
	});
}
