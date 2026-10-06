// Pure keymap-building logic for the note editor hotkeys, split out from the TipTap extension so
// it can be unit-tested without importing the `note.ui.hotkeys` bundle (the unit harness can't
// resolve Bitrix extension namespaces). The extension (hotkeys-extension.js) feeds the descriptor
// in; this module owns the command -> editor-call mapping and returns the {combo: handler} map.

// Maps a descriptor `command` to the editor call its toolbar button makes. Each returns true when
// the key was consumed (ProseMirror preventDefault), false to let the event fall through the keymap
// chain / to the browser. Parity target: the matching button in
// note/install/js/note/editor/src/components/toolbar/*.
const EDITOR_COMMANDS = {
	// heading-group: reset to paragraph (editor.commands.setParagraph()).
	setParagraph: (editor) => {
		editor.chain().focus().setParagraph().run();

		return true;
	},

	// align-group: editor.commands.setTextAlign(<value>). Mod-Shift-R / Mod-Shift-J also trigger
	// browser reload / DevTools, so consume the key only where the alignment can actually apply;
	// otherwise return false and let the browser default run (don't swallow the key for nothing).
	setTextAlign: (editor, value) => {
		if (!editor.can().setTextAlign(value))
		{
			return false;
		}

		editor.chain().focus().setTextAlign(value).run();

		return true;
	},

	// callout-group. A single on/off toggle, like every other block formatting: inside any callout the
	// hotkey removes it, outside it wraps the block with the default type — regardless of the current
	// callout's type. (The per-type toolbar buttons switch type instead; the hotkey has just one type,
	// so switching-then-removing on a non-default callout would feel wrong.)
	toggleCallout: (editor, type) => {
		if (editor.isActive('callout'))
		{
			editor.chain().focus().unsetCallout().run();
		}
		else
		{
			editor.chain().focus().toggleCallout({ type }).run();
		}

		return true;
	},

	// The link popup and the attachment menu are host-owned UI (editor-toolbar.js openMenu state /
	// the system file dialog), not editor commands — the keymap can't open them directly. It emits
	// an intent on the shared editor event bus that the host layer turns into the same UI the button
	// opens. Mod-K also focuses the browser address bar: consume it only where a link is applicable
	// (the link mark is excluded inside code), otherwise pass the key through.
	openLinkPopup: (editor) => {
		if (!editor.can().setLink({ href: 'https://example.com' }))
		{
			return false;
		}

		editor.emit('note:hotkey', { action: 'openLinkPopup' });

		return true;
	},

	// Unlike the link popup, attachments no longer open the toolbar menu: the hotkey drops a file
	// upload tile at the caret (handled by note-editor.js, which owns the document/collection
	// context) and selects it — click to browse, arrow away to skip. A direct edit, not a menu.
	insertFileNode: (editor) => {
		editor.emit('note:hotkey', { action: 'insertFileNode' });

		return true;
	},
};

// Builtin combos are bound by the official TipTap packages; only the extra aliases the descriptor
// adds need binding here. A builtin entry's `command` is null (the package owns it), so alias-bearing
// builtin ids are mapped to their editor call explicitly.
const BUILTIN_ALIAS_COMMANDS = {
	strike: (editor) => editor.chain().focus().toggleStrike().run(),
	redo: (editor) => editor.chain().focus().redo().run(),
};

function resolveHandler(command: string | null): Function | null
{
	const [name, arg] = String(command).split(':');
	const run = EDITOR_COMMANDS[name];
	if (!run)
	{
		return null;
	}

	return ({ editor }) => run(editor, arg);
}

// Builds the TipTap keyboard-shortcuts map from the hotkey descriptor (single source of truth).
// `editorHotkeys` are the note-added `binding:'new'` editor-scoped entries; `descriptor` is the
// full list, used only to pick up the extra aliases on builtin entries. Builtin primary combos are
// intentionally NOT rebound here (one keymap per key) — the TipTap packages own them.
export function buildHotkeyShortcuts({ editorHotkeys, descriptor }: {
	editorHotkeys: Array<Object>,
	descriptor: Array<Object>,
}): Object
{
	const shortcuts = {};

	for (const { combo, command } of editorHotkeys)
	{
		const handler = resolveHandler(command);
		if (handler)
		{
			shortcuts[combo] = handler;
		}
	}

	for (const entry of descriptor)
	{
		const run = BUILTIN_ALIAS_COMMANDS[entry.id];
		if (entry.binding !== 'builtin' || !run || entry.aliases.length === 0)
		{
			continue;
		}

		for (const alias of entry.aliases)
		{
			shortcuts[alias] = ({ editor }) => {
				run(editor);

				return true;
			};
		}
	}

	return shortcuts;
}
