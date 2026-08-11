import { Plugin, PluginKey } from '@tiptap/pm/state';
import { MentionDialog } from './mention-dialog';

export const MENTION_TRIGGER_KEY = new PluginKey('noteMentionTrigger');

// Characters that open the mention dialog. Both behave identically; '+' is an
// alternative trigger to '@'.
const TRIGGER_CHARS = ['@', '+'];

/**
 * Returns true if the ProseMirror node at the given position is inside a code block
 * or any other atomic/leaf node where we should not trigger the mention dialog.
 *
 * @param {import('@tiptap/pm/state').EditorState} state
 * @param {number} pos
 * @returns {boolean}
 */
function isInsideCodeBlockOrAtom(state, pos)
{
	const $pos = state.doc.resolve(pos);
	for (let depth = $pos.depth; depth >= 0; depth--)
	{
		const node = $pos.node(depth);
		if (node.type.spec.code || (node.isLeaf && node.isAtom && node.type.name !== 'noteMention'))
		{
			return true;
		}
	}

	return false;
}

/**
 * Finds the trigger character ('@' or '+') immediately before the cursor along
 * with any query text typed after it. The query MAY contain spaces so multi-word
 * titles (documents / knowledge bases) are searched as a whole phrase, matching
 * the standard quick search — a single-word query only ever found the first token.
 * The mention ends on selection, Escape, or a new trigger character. Returns null
 * when not in trigger state.
 *
 * @param {import('@tiptap/pm/state').EditorState} state
 * @returns {{ from: number, to: number, query: string } | null}
 */
function findTriggerRange(state)
{
	const { selection } = state;
	if (!selection.empty)
	{
		return null;
	}

	const { $from } = selection;
	const textBefore = $from.parent.textBetween(
		Math.max(0, $from.parentOffset - 100),
		$from.parentOffset,
		'\x00',
		'\x00',
	);

	// Query grows until the caret and may include spaces; it stops only at another
	// trigger character ('@' / '+') or a block boundary ('\x00'), so a fresh
	// trigger starts a new mention.
	const match = /(?:^|[\s\x00])([@+]([^@+\x00]*))$/.exec(textBefore);
	if (!match)
	{
		return null;
	}

	const fullMatch = match[1]; // '@query' or '+query'
	const query = match[2]; // 'query' (everything after the trigger, spaces allowed)

	const to = $from.pos;
	const from = to - fullMatch.length;

	return { from, to, query };
}

/**
 * Creates the ProseMirror plugin that detects '@' / '+' input and opens MentionDialog.
 *
 * @param {Object} options
 * @param {import('@tiptap/core').Editor} options.editor - TipTap editor instance.
 * @param {Function} options.insertMention - Called with { entityType, id, from, to } to insert the node.
 * @returns {Plugin}
 */
export function createMentionTriggerPlugin({ editor, insertMention })
{
	// Single MentionDialog wrapper — recreates the underlying Dialog on each suggestion open.
	const dialog = new MentionDialog({
		onSelect: ({ entityType, id }) => {
			if (!triggerRange)
			{
				return;
			}

			const { from, to } = triggerRange;
			insertMention({ from, to, entityType, id });
			closeDialog();
		},
	});

	let triggerRange = null;

	const closeDialog = () => {
		dialog.hide();
		triggerRange = null;
	};

	const destroyAll = () => {
		dialog.destroy();
		triggerRange = null;
	};

	return new Plugin({
		key: MENTION_TRIGGER_KEY,

		view()
		{
			return {
				destroy()
				{
					destroyAll();
				},
			};
		},

		props: {
			handleTextInput(view, _from, _to, text)
			{
				if (!editor.isEditable)
				{
					return false;
				}

				if (!TRIGGER_CHARS.includes(text))
				{
					return false;
				}

				// Let ProseMirror insert the trigger character first, then check the state.
				// We use a microtask so the transaction has been committed.
				Promise.resolve().then(() => {
					if (!editor.isEditable)
					{
						return;
					}

					const state = editor.state;

					if (isInsideCodeBlockOrAtom(state, state.selection.from))
					{
						return;
					}

					const range = findTriggerRange(state);
					if (!range)
					{
						return;
					}

					// Viewport-relative caret coordinates for the popup anchor marker.
					const coords = editor.view.coordsAtPos(range.to);

					triggerRange = range;

					// showSuggestion always creates a fresh Dialog — fixes stale anchor and stale selection.
					// getCaretRect lets the dialog reposition itself to the live caret on scroll,
					// since it has no access to the editor view or the trigger range.
					dialog.showSuggestion({
						caretRect: { left: coords.left, top: coords.top, bottom: coords.bottom },
						query: range.query,
						getCaretRect: () => {
							if (!triggerRange)
							{
								return null;
							}

							const c = editor.view.coordsAtPos(triggerRange.to);

							return { left: c.left, top: c.top, bottom: c.bottom };
						},
					});
				});

				return false;
			},

			handleKeyDown(view, event)
			{
				if (!dialog.isOpen())
				{
					return false;
				}

				if (event.key === 'Escape')
				{
					closeDialog();

					return true;
				}

				// Intercept navigation keys when the suggestion popup is open (model A only).
				// Return true so ProseMirror does NOT move the caret or insert a newline,
				// but do NOT call stopPropagation so the document-level Navigation handler
				// inside entity-selector still processes the event and moves focus/selects.
				if (
					dialog.isSuggestionMode()
					&& (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter')
				)
				{
					return true;
				}

				return false;
			},
		},

		// Track state changes to keep triggerRange in sync and close dialog when
		// the cursor moves away from the trigger position.
		state: {
			init()
			{
				return { active: false };
			},
			apply(tr, value, _oldState, newState)
			{
				// React to caret moves too (selectionSet), not just edits: an arrow/mouse
				// move out of the trigger range must close the stale popup instead of
				// leaving it anchored to the old position.
				if ((tr.docChanged || tr.selectionSet) && triggerRange)
				{
					// Use newState (post-transaction) so the query includes the latest character.
					const range = findTriggerRange(newState);
					if (range)
					{
						triggerRange = range;
						// Re-run the search only when the text changed; a pure caret move
						// keeps the same query and does not need a new lookup.
						if (tr.docChanged)
						{
							dialog.search(range.query);
						}
					}
					else
					{
						// Cursor moved out of the trigger — close without selection.
						closeDialog();
					}
				}

				return value;
			},
		},
	});
}
