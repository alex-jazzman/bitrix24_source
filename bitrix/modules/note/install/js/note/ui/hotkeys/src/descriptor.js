// Single source of truth for the editor hotkey map. Consumed by the keymap
// extension (phase 2), the app-level listener (phase 3), the help popup and tests.
// Combos are stored in TipTap mod-notation (Mod = Cmd on macOS, Ctrl elsewhere),
// never pre-rendered — rendering per OS is the job of format-shortcut.js.

// Fills DTO-01 defaults so records below can omit the boilerplate fields.
function entry(record)
{
	return Object.freeze({
		aliases: [],
		command: null,
		editorScoped: true,
		...record,
	});
}

const HOTKEYS = Object.freeze([
	// Group: format — all provided by official TipTap packages (binding: builtin).
	entry({ id: 'bold', group: 'format', combo: 'Mod-b', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_BOLD' }),
	entry({ id: 'italic', group: 'format', combo: 'Mod-i', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_ITALIC' }),
	entry({ id: 'underline', group: 'format', combo: 'Mod-u', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_UNDERLINE' }),
	entry({ id: 'strike', group: 'format', combo: 'Mod-Shift-s', aliases: ['Ctrl-Shift-x'], binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_STRIKE' }),
	entry({ id: 'inlineCode', group: 'format', combo: 'Mod-e', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_INLINE_CODE' }),
	entry({ id: 'highlight', group: 'format', combo: 'Mod-Shift-h', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_HIGHLIGHT' }),
	entry({ id: 'superscript', group: 'format', combo: 'Mod-.', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_SUPERSCRIPT' }),
	entry({ id: 'subscript', group: 'format', combo: 'Mod-,', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_SUBSCRIPT' }),

	// Group: headings — paragraph reset is note-added, H1..H4 come from the heading package.
	entry({ id: 'paragraph', group: 'headings', combo: 'Mod-Alt-0', binding: 'new', command: 'setParagraph', labelKey: 'NOTE_HOTKEYS_ACTION_PARAGRAPH' }),
	entry({ id: 'heading1', group: 'headings', combo: 'Mod-Alt-1', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_1' }),
	entry({ id: 'heading2', group: 'headings', combo: 'Mod-Alt-2', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_2' }),
	entry({ id: 'heading3', group: 'headings', combo: 'Mod-Alt-3', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_3' }),
	entry({ id: 'heading4', group: 'headings', combo: 'Mod-Alt-4', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_HEADING_4' }),

	// Group: lists — all from TipTap list packages.
	entry({ id: 'bulletList', group: 'lists', combo: 'Mod-Shift-8', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_BULLET_LIST' }),
	entry({ id: 'orderedList', group: 'lists', combo: 'Mod-Shift-7', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_ORDERED_LIST' }),
	entry({ id: 'taskList', group: 'lists', combo: 'Mod-Shift-9', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_TASK_LIST' }),

	// Group: blocks — callout is note-specific (default type "info"), the rest are builtin.
	entry({ id: 'blockquote', group: 'blocks', combo: 'Mod-Shift-b', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_BLOCKQUOTE' }),
	entry({ id: 'codeBlock', group: 'blocks', combo: 'Mod-Alt-c', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_CODE_BLOCK' }),
	entry({ id: 'callout', group: 'blocks', combo: 'Mod-Alt-b', binding: 'new', command: 'toggleCallout:info', labelKey: 'NOTE_HOTKEYS_ACTION_CALLOUT' }),

	// Group: align — all note-added.
	entry({ id: 'alignLeft', group: 'align', combo: 'Mod-Shift-l', binding: 'new', command: 'setTextAlign:left', labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_LEFT' }),
	entry({ id: 'alignCenter', group: 'align', combo: 'Mod-Shift-e', binding: 'new', command: 'setTextAlign:center', labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_CENTER' }),
	entry({ id: 'alignRight', group: 'align', combo: 'Mod-Shift-r', binding: 'new', command: 'setTextAlign:right', labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_RIGHT' }),
	entry({ id: 'alignJustify', group: 'align', combo: 'Mod-Shift-j', binding: 'new', command: 'setTextAlign:justify', labelKey: 'NOTE_HOTKEYS_ACTION_ALIGN_JUSTIFY' }),

	// Group: insert — named actions resolved by the keymap extension in phase 2.
	entry({ id: 'link', group: 'insert', combo: 'Mod-k', binding: 'new', command: 'openLinkPopup', labelKey: 'NOTE_HOTKEYS_ACTION_LINK' }),
	entry({ id: 'attachments', group: 'insert', combo: 'Mod-Shift-u', binding: 'new', command: 'insertFileNode', labelKey: 'NOTE_HOTKEYS_ACTION_ATTACHMENTS' }),

	// Group: history — from the TipTap history package.
	entry({ id: 'undo', group: 'history', combo: 'Mod-z', binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_UNDO' }),
	entry({ id: 'redo', group: 'history', combo: 'Mod-Shift-z', aliases: ['Ctrl-y'], binding: 'builtin', labelKey: 'NOTE_HOTKEYS_ACTION_REDO' }),

	// Group: global — the help popup itself; bound outside the editor by an app listener (phase 3).
	entry({ id: 'helpOpen', group: 'global', combo: '?', aliases: ['Mod-/'], binding: 'app', command: 'helpOpen', labelKey: 'NOTE_HOTKEYS_ACTION_HELP_OPEN', editorScoped: false }),
]);

export function getHotkeyDescriptor(): Array<Object>
{
	return HOTKEYS;
}

export function getEditorHotkeys(): Array<Object>
{
	return HOTKEYS.filter((item) => item.binding === 'new' && item.editorScoped === true);
}
