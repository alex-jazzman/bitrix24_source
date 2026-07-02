import { SubscriptIcon, SuperscriptIcon } from '../ui/icons';

export const ToolbarScriptGroupComponent = {
	name: 'NoteToolbarScriptGroup',
	components: {
		SubscriptIcon,
		SuperscriptIcon,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group" :data-editor-tick="editorTick">
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_SUBSCRIPT')" :data-note-editor-active="editor?.isActive('subscript')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleSubscript()"><SubscriptIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_SUPERSCRIPT')" :data-note-editor-active="editor?.isActive('superscript')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleSuperscript()"><SuperscriptIcon /></button>
		</div>
	`,
};
