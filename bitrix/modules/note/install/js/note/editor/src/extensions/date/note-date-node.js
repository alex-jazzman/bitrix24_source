import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, NodeSelection } from '@tiptap/pm/state';
import { DateTimeFormat } from 'main.date';

import {
	buildDateToken,
	findDateTokenStart,
	matchDateToken,
	normalizeDateString,
	normalizeDateValue,
} from './note-date-parser';
import { NoteDatePickerOwner } from './note-date-picker-owner';

// The stable DOM anchor of the node: styles, e2e and the click handler below all key off it.
const DOM_TYPE_ATTRIBUTE = 'data-note-date';

// [version-diff] The same classes the attachment and mention node views paint. The date has no node
// view of its own - its visible part is a single line of text, and a per-date Vue app would cost one
// application per date in the document - so renderHTML paints them itself.
const DIFF_STATE_CLASS = Object.freeze({
	added: 'note-version-diff-node--added',
	removed: 'note-version-diff-node--removed',
});

/**
 * The caption: always a concrete date in the portal's culture format, never a relative wording.
 * The year is dropped while the date sits in the current year and printed once it leaves it - the
 * only rule borrowed from the document history hub, whose own helper cannot be reused because every
 * API it exports glues a time and a relative day onto the day part.
 */
export function formatDateCaption(value: string): string
{
	const [year, month, day] = value.split('-').map(Number);
	const isCurrentYear = year === new Date().getFullYear();
	const format = isCurrentYear
		? DateTimeFormat.getFormat('DAY_MONTH_FORMAT')
		: DateTimeFormat.getFormat('LONG_DATE_FORMAT');

	// The value is a calendar date, so its parts are printed from the UTC fields they were built
	// from; local getters would shift the day west of Greenwich. Only "current year" above is local.
	return DateTimeFormat.format(format, new Date(Date.UTC(year, month - 1, day)), null, true);
}

// The calendar day the author sees, not UTC's - a hotkey pressed near midnight lands on the date
// still showing on their clock.
function todayDateValue(): string
{
	const today = new Date();

	return normalizeDateValue(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

/**
 * Locates a noteDate node touching the caret: a NodeSelection already on one, or an atom right
 * before/after an empty caret. `editor.isActive('noteDate')` and `deleteNode` both miss an inline
 * atom - this is the by-hand replacement both toggleDate and the hotkey binding rely on.
 */
// Whether the schema lets an inline atom stand where the caret is. A code block holds raw text and
// admits no atom at all: without this the insert lands nowhere and the NodeSelection below is built
// on a position that holds no node. Asking the schema covers every such context, not just code.
function canInsertDate(state: Object): boolean
{
	const { $from } = state.selection;
	const type = state.schema.nodes.noteDate;
	for (let depth = $from.depth; depth >= 0; depth--)
	{
		const index = $from.index(depth);
		if ($from.node(depth).canReplaceWith(index, index, type))
		{
			return true;
		}
	}

	return false;
}

function findDateAtCaret(state: Object): { pos: number, size: number } | null
{
	const { selection } = state;
	if (selection instanceof NodeSelection && selection.node.type.name === 'noteDate')
	{
		return { pos: selection.from, size: selection.node.nodeSize };
	}

	const { $from } = selection;
	if ($from.nodeAfter?.type.name === 'noteDate')
	{
		return { pos: $from.pos, size: $from.nodeAfter.nodeSize };
	}

	if ($from.nodeBefore?.type.name === 'noteDate')
	{
		return { pos: $from.pos - $from.nodeBefore.nodeSize, size: $from.nodeBefore.nodeSize };
	}

	return null;
}

/**
 * The position of a date node the selection covers whole - either as a node selection or as a text
 * range that happens to span exactly it, which is what shift-arrow over an inline atom produces.
 * Selecting a date and pressing Enter is the keyboard way into the calendar, so both shapes of
 * "this date is selected" have to be recognized.
 */
function findSelectedDateNode(state: Object): number | null
{
	const { selection, doc } = state;
	if (selection instanceof NodeSelection)
	{
		return selection.node.type.name === 'noteDate' ? selection.from : null;
	}

	const node = doc.nodeAt(selection.from);

	return node?.type.name === 'noteDate' && selection.to - selection.from === node.nodeSize
		? selection.from
		: null;
}

/**
 * TipTap inline-atom node for a calendar date inside a phrase.
 *
 * Persisted attribute: value, a normalized `YYYY-MM-DD` string - the node carries nothing else, a
 * date being a value and not an entity. The transient version-diff attribute is declared so the
 * schema knows it, but is never written to markdown.
 *
 * renderText is deliberately absent: copying a document out goes through "Copy markdown", which
 * takes the document's markdown whole, so the date lands in the clipboard as its own token. A
 * human-readable form is the export pass's job, as it is for mentions.
 *
 * atom:true makes Backspace/Delete remove the node as a whole without a custom keymap.
 */
export const NoteDateNode = Node.create({
	name: 'noteDate',

	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,

	addStorage()
	{
		return {
			// One calendar per editor - created on first click, see note-date-picker-owner.js.
			pickerOwner: null,
		};
	},

	onCreate()
	{
		this.storage.pickerOwner = new NoteDatePickerOwner(this.editor);
	},

	onDestroy()
	{
		this.storage.pickerOwner?.destroy();
		this.storage.pickerOwner = null;
	},

	addAttributes()
	{
		return {
			// --- persisted ---
			value: {
				default: null,
				parseHTML: (element) => normalizeDateString(element.getAttribute('data-note-date-value')),
				renderHTML: (attrs) => ({ 'data-note-date-value': normalizeDateString(attrs.value) ?? '' }),
			},

			// --- transient (version-diff tag, not serialised to markdown) ---
			diffState: {
				default: null,
				rendered: false,
			},
		};
	},

	parseHTML()
	{
		return [
			{
				tag: 'span[data-note-date]',
			},
		];
	},

	renderHTML({ node, HTMLAttributes })
	{
		// Both the caption and the DOM value come from the normalized value, never from whatever
		// string the attribute holds: a value that arrived through the collaborative state without
		// passing normalization renders empty rather than half-trusted.
		const value = normalizeDateString(node.attrs.value);

		return [
			'span',
			mergeAttributes(HTMLAttributes, {
				[DOM_TYPE_ATTRIBUTE]: '',
				class: DIFF_STATE_CLASS[node.attrs.diffState] ?? null,
				contenteditable: 'false',
			}),
			value === null ? '' : formatDateCaption(value),
		];
	},

	/**
	 * Enter on a selected date opens the calendar - the keyboard counterpart of the click. Without it
	 * a date already in the text can only be replaced by removing it and inserting today's again:
	 * Mod-; deliberately never opens the calendar, and Enter would otherwise just split the line.
	 *
	 * Unlike the click path this can show the popup straight away: a keypress has no trailing click
	 * for main.popup's outside-click watcher to catch.
	 */
	addKeyboardShortcuts()
	{
		return {
			Enter: () => {
				const { editor } = this;
				const pos = findSelectedDateNode(editor.state);
				if (pos === null || !editor.isEditable)
				{
					return false;
				}

				// The picker owner reads its target from a node selection; a text range covering the
				// node is narrowed to one first.
				if (!(editor.state.selection instanceof NodeSelection))
				{
					editor.view.dispatch(editor.state.tr.setSelection(
						NodeSelection.create(editor.state.doc, pos),
					));
				}

				this.storage.pickerOwner?.open();

				return true;
			},
		};
	},

	addCommands()
	{
		return {
			// Drops today's date at the caret and selects it as a NodeSelection. Used by the "+" menu
			// item (note-editor.js), whose handler opens the calendar on that same selection right after
			// - see NoteDatePickerOwner.open(), which reads its target from the current NodeSelection.
			insertDate: () => ({ tr, dispatch, state }) => {
				if (!canInsertDate(state))
				{
					return false;
				}

				if (dispatch)
				{
					const pos = tr.selection.from;
					const node = state.schema.nodes.noteDate.create({ value: todayDateValue() });
					tr.replaceSelectionWith(node, false);
					tr.setSelection(NodeSelection.create(tr.doc, pos));
				}

				return true;
			},

			// The calendar is the extension's to open: the "+" menu item (note-editor.js) asks for it
			// through the command API instead of reaching into editor.storage itself. Runs after the
			// insert has been dispatched, since the owner reads its target from the live selection.
			openDatePicker: () => ({ editor }) => {
				editor.storage.noteDate?.pickerOwner?.open();

				return true;
			},

			// The Mod-; toggle: removes the date under the caret, or inserts today's without opening
			// the calendar - picking another value stays a click away.
			toggleDate: () => ({ tr, dispatch, state }) => {
				if (!canInsertDate(state))
				{
					return false;
				}

				// Only a caret (or the node picked out on its own) toggles the date away. Over a text
				// range the date is one of the selected things, and dropping just it would leave the
				// rest of the selection standing - there the toggle inserts, replacing the selection.
				const found = state.selection.empty || state.selection instanceof NodeSelection
					? findDateAtCaret(state)
					: null;
				if (found)
				{
					if (dispatch)
					{
						tr.delete(found.pos, found.pos + found.size);
					}

					return true;
				}

				if (dispatch)
				{
					const node = state.schema.nodes.noteDate.create({ value: todayDateValue() });
					tr.replaceSelectionWith(node, false);
				}

				return true;
			},
		};
	},

	/**
	 * A click on the node, in edit mode, opens the calendar to change its value.
	 *
	 * The calendar is opened from the native `click`, not from ProseMirror's own `handleClickOn`,
	 * which runs on `mouseup`. Showing a popup there registers main.popup's outside-click watcher
	 * (popup.ts, bindAutoHide) in the document capture phase before the browser dispatches the
	 * trailing `click` of the very same gesture - the watcher then reads that click as one landing
	 * outside and closes the calendar the instant it appeared. Running on the click itself puts the
	 * watcher in place after the document capture phase for this event has already passed, which is
	 * why opening from the toolbar (a Vue `@click`) never had the problem.
	 *
	 * The node selection the picker owner reads is left to ProseMirror: its default mouseup handling
	 * selects a clicked leaf on its own, and mouseup precedes click.
	 */
	addProseMirrorPlugins()
	{
		const { storage } = this;

		return [
			new Plugin({
				props: {
					handleDOMEvents: {
						click(view, event)
						{
							if (!view.editable || !(event.target instanceof HTMLElement))
							{
								return false;
							}

							if (event.target.closest(`[${DOM_TYPE_ATTRIBUTE}]`) === null)
							{
								return false;
							}

							storage.pickerOwner?.open();

							// The event is not consumed: the selection ProseMirror placed on mouseup stays.
							return false;
						},
					},
				},
			}),
		];
	},

	/**
	 * Inline markdown tokenizer for the `[[date YYYY-MM-DD]]` token.
	 *
	 * The `[[` delimiter is shared with the block-level attachment tokenizers, which claim their own
	 * keywords (`image|file|video`, `disk`, `video-embed`); a foreign grammar is turned away by the
	 * strictness of the pattern in note-date-parser.js, not by the order of registration.
	 */
	markdownTokenizer: {
		name: 'noteDate',
		level: 'inline',

		start(src)
		{
			return findDateTokenStart(src);
		},

		tokenize(src)
		{
			const match = matchDateToken(src);
			if (!match)
			{
				return null;
			}

			return {
				type: 'noteDate',
				raw: match.raw,
				value: match.value,
			};
		},
	},

	parseMarkdown(token)
	{
		return {
			type: 'noteDate',
			attrs: {
				value: token.value,
			},
		};
	},

	/**
	 * Serialises the node back to the canonical token - exactly what the tokenizer accepts, so the
	 * round trip cannot lose the node at the next reader.
	 */
	renderMarkdown(node)
	{
		const value = normalizeDateString(node?.attrs?.value);

		return value === null ? '' : buildDateToken(value);
	},
});
