import { Extension } from '@tiptap/core';
import { getHotkeyDescriptor, getEditorHotkeys } from '../../../ui/hotkeys/src/descriptor';
import { buildHotkeyShortcuts } from './hotkeys-bindings';

// Keymap for the note-added editor hotkeys. Bindings are built dynamically from the descriptor
// (single source of truth: note/install/js/note/ui/hotkeys/src/descriptor.js) so the map can't
// drift from the help popup / tests. The descriptor is imported by source path, not via the
// `note.ui.hotkeys` bundle name, on purpose: pulling that bundle into the editor's static graph
// breaks every unit test that imports the extension registry (the harness can't resolve Bitrix
// bundle namespaces). descriptor.js is dependency-free, so it inlines cleanly.
// The command -> editor-call logic lives in hotkeys-bindings.js (also bitrix-import-free, so it's
// unit-testable). Default priority: these combos don't overlap the reserved Tab/Esc/Enter/table/
// mention contracts, so they don't need to pre-empt them (contrast heading-enter-command.js).
export const NoteHotkeys = Extension.create({
	name: 'noteHotkeys',

	addKeyboardShortcuts()
	{
		return buildHotkeyShortcuts({
			editorHotkeys: getEditorHotkeys(),
			descriptor: getHotkeyDescriptor(),
		});
	},
});
