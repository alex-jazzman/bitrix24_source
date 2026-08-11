import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const TAB_INDENT_PLUGIN_KEY = new PluginKey('noteTabIndent');

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

// 4 non-breaking spaces — survives markdown roundtrip; plain spaces collapse or
// trigger indented-code-block in marked(gfm).
const INDENT = '\u00a0\u00a0\u00a0\u00a0';

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable="true"]',
	'audio[controls]',
	'video[controls]',
	'summary',
].join(',');

// DOM-order approximation of tab sequence; positive tabindex reordering not accounted for
// (none expected in this UI by a11y convention).
function focusableOutsideEditor(root, direction)
{
	const all = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR));
	const visible = all.filter((el) => {
		if (root.contains(el) || el.getClientRects().length === 0)
		{
			return false;
		}

		// Skip visibility:hidden / inert / aria-hidden elements — browsers won't focus them,
		// so target.focus() would be a no-op and the focus trap would persist.
		if (el.closest('[hidden], [inert], [aria-hidden="true"]'))
		{
			return false;
		}

		if (window.getComputedStyle(el).visibility === 'hidden')
		{
			return false;
		}

		return true;
	});

	if (direction === 'forward')
	{
		return visible.find(
			(el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
		) ?? null;
	}

	// backward: last element preceding the root in DOM order
	let result = null;
	for (const el of visible)
	{
		if (root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)
		{
			result = el;
		}
	}

	return result;
}

export const TabIndent = Extension.create({
	name: 'tabIndent',

	addStorage()
	{
		return {
			armed: false,
		};
	},

	addKeyboardShortcuts()
	{
		return {
			Tab: ({ editor }) => {
				// armed check FIRST: Esc in list/table/code should still escape the editor (D-3).
				if (this.storage.armed)
				{
					this.storage.armed = false;
					const root = editor.view.dom.closest('.note-editor-root') || editor.view.dom;
					const target = focusableOutsideEditor(root, 'forward');
					if (target)
					{
						target.focus();
					}
					else
					{
						editor.view.dom.blur();
					}

					return true; // preventDefault — prevents browser/PM from navigating inside
				}

				// AC-017: Tab must never move focus out of editable content; always consume in lists.
				if (editor.isActive('listItem')) { editor.commands.sinkListItem('listItem'); return true; }
				if (editor.isActive('taskItem')) { editor.commands.sinkListItem('taskItem'); return true; }
				if (editor.isActive('codeBlock') || editor.isActive('tableCell') || editor.isActive('tableHeader'))
				{
					// Delegate to code-block / table-next-cell handling (these don't leak focus).
					return false;
				}

				const { selection } = editor.state;
				if (!selection.empty)
				{
					return true; // no-op on non-collapsed selection (D-2)
				}

				editor.commands.insertContent(INDENT);

				return true;
			},

			'Shift-Tab': ({ editor }) => {
				// armed check FIRST: Esc in list/table/code should still escape the editor (D-3).
				if (this.storage.armed)
				{
					this.storage.armed = false;
					const root = editor.view.dom.closest('.note-editor-root') || editor.view.dom;
					const target = focusableOutsideEditor(root, 'backward');
					if (target)
					{
						target.focus();
					}
					else
					{
						editor.view.dom.blur();
					}

					return true; // preventDefault — prevents browser/PM from navigating inside
				}

				// AC-017: Shift-Tab must never move focus out of editable content; always consume in lists.
				if (editor.isActive('listItem')) { editor.commands.liftListItem('listItem'); return true; }
				if (editor.isActive('taskItem')) { editor.commands.liftListItem('taskItem'); return true; }
				if (editor.isActive('codeBlock') || editor.isActive('tableCell') || editor.isActive('tableHeader'))
				{
					// Delegate to code-block dedent / table-prev-cell handling (these don't leak focus).
					return false;
				}

				const { selection } = editor.state;
				if (!selection.empty)
				{
					return true; // no-op on non-collapsed selection (D-2)
				}

				const { $from } = selection;
				const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '￼');

				// Count trailing nbsp run, capped at 4.
				let n = 0;
				for (let i = textBefore.length - 1; i >= 0 && n < 4; i--)
				{
					if (textBefore[i] === '\u00a0')
					{
						n++;
					}
					else
					{
						break;
					}
				}

				if (n > 0)
				{
					const absPos = $from.pos;
					editor.commands.deleteRange({ from: absPos - n, to: absPos });
				}

				// Always return true (D-1): no leading nbsp => swallow, keep focus.
				return true;
			},
		};
	},

	onCreate()
	{
		// Named handler so it can be removed in onDestroy (D-3 one-shot reset).
		// Also wired to pointerdown: clicking inside an already-focused editor
		// does not re-fire focus, so armed would survive until the next Tab.
		this._resetArmed = () => {
			this.storage.armed = false;
		};

		this.editor.on('focus', this._resetArmed);
		this.editor.on('blur', this._resetArmed);
		this.editor.view.dom.addEventListener('pointerdown', this._resetArmed);
	},

	onDestroy()
	{
		this.editor.off('focus', this._resetArmed);
		this.editor.off('blur', this._resetArmed);
		this.editor.view.dom.removeEventListener('pointerdown', this._resetArmed);
	},

	addProseMirrorPlugins()
	{
		const storage = this.storage;

		return [
			new Plugin({
				key: TAB_INDENT_PLUGIN_KEY,
				props: {
					handleKeyDown(_view, event)
					{
						if (event.key === 'Escape')
						{
							// Skip if a popup already handled this (preventDefault in capture).
							if (event.defaultPrevented)
							{
								return false;
							}

							if (storage.armed)
							{
								return false;
							}

							storage.armed = true;

							// Prevent default so the editor doesn't do anything else on Esc.
							event.preventDefault();

							return true;
						}

						// Modifier keydown precedes Tab in Shift+Tab, so exclude modifiers from disarming.
						if (event.key !== 'Tab' && event.key !== 'Escape' && !MODIFIER_KEYS.has(event.key))
						{
							storage.armed = false;
						}

						return false;
					},
				},
			}),
		];
	},
});
