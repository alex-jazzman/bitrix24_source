import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

// Containers whose nested headings are plain (see heading-slug): opaque to the
// section structure, so a heading inside them must not end a collapsed range or
// become the insert position for a new sibling heading.
const OPAQUE_CONTAINERS = new Set(['table', 'blockquote', 'callout']);

// Top-level heading nodes as { pos, level }, in document order. Mirrors the
// traversal `computeHeadingEntries` does, minus the slug work — this command
// only needs positions and levels, so it stays free of the slug/translit deps.
function headingEntries(doc: Object): Array<{ pos: number, level: number }>
{
	const entries = [];
	doc.descendants((node, pos) => {
		if (OPAQUE_CONTAINERS.has(node?.type?.name))
		{
			return false;
		}

		if (node?.type?.name === 'heading')
		{
			entries.push({ pos, level: Number(node.attrs?.level) || 1 });

			// Headings hold inline content only — no need to descend.
			return false;
		}

		return undefined;
	});

	return entries;
}

// Enter inside a COLLAPSED heading must not drop a block into the hidden
// section (the default split inserts it right after the heading, inside the
// collapse mask, so it stays invisible). Instead we create a new empty heading
// of the same level right after the collapsed subtree — a sibling that ends the
// collapse range and is therefore visible — and move the caret into it. The
// original heading stays collapsed and its hidden blocks stay hidden.
//
// Mirrors Outline's behaviour. Expanded headings (and non-empty selections, or
// carets outside a heading) are left to the default split: returning false lets
// the next keymap handler run.
export function splitCollapsedHeading(state: Object, dispatch: ((tr: Object) => void) | null): boolean
{
	const { selection } = state;
	if (!selection.empty)
	{
		return false;
	}

	const { $from } = selection;
	const heading = $from.parent;
	if (heading.type.name !== 'heading' || !heading.attrs?.collapsed)
	{
		return false;
	}

	const headingPos = $from.before($from.depth);
	const entries = headingEntries(state.doc);
	const index = entries.findIndex((entry) => entry.pos === headingPos);
	if (index === -1)
	{
		return false;
	}

	const current = entries[index];
	let insertPos = state.doc.content.size;
	for (let next = index + 1; next < entries.length; next++)
	{
		if (entries[next].level <= current.level)
		{
			insertPos = entries[next].pos;
			break;
		}
	}

	if (dispatch)
	{
		const newHeading = heading.type.create({ level: current.level, collapsed: false });
		const tr = state.tr.insert(insertPos, newHeading);
		// The new heading starts exactly at insertPos; its inner caret is +1.
		tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
		tr.scrollIntoView();
		dispatch(tr);
	}

	return true;
}

// Standalone extension that binds Enter to the command above. It is a plain
// Extension (not the heading Node) on purpose: a high priority guarantees this
// Enter handler's keymap plugin runs before the core `keymap` extension's
// default split (priority 100) — and when the command returns false (expanded
// heading, non-empty selection, caret outside a heading) ProseMirror falls
// through to that default. Raising the Node's priority instead would reorder
// the schema's node list and risk changing the default block type.
export const HeadingCollapseEnter = Extension.create({
	name: 'headingCollapseEnter',
	priority: 1000,
	addKeyboardShortcuts()
	{
		return {
			Enter: ({ editor }) => splitCollapsedHeading(editor.state, editor.view.dispatch),
		};
	},
});
