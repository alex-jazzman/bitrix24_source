import { UndoIcon, RedoIcon } from '../ui/icons';

export const ToolbarHistoryGroupComponent = {
	name: 'NoteToolbarHistoryGroup',
	components: {
		UndoIcon,
		RedoIcon,
	},
	props: {
		canUndo: {
			type: Boolean,
			default: false,
		},
		canRedo: {
			type: Boolean,
			default: false,
		},
		onUndo: {
			type: Function,
			default: null,
		},
		onRedo: {
			type: Function,
			default: null,
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group">
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_UNDO')" :disabled="!canUndo" @click="onUndo"><UndoIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_REDO')" :disabled="!canRedo" @click="onRedo"><RedoIcon /></button>
		</div>
	`,
};
