import { BlockquoteIcon, CodeBlockIcon } from '../ui/icons';

export const ToolbarBlockGroupComponent = {
	name: 'NoteToolbarBlockGroup',
	components: {
		BlockquoteIcon,
		CodeBlockIcon,
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
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_BLOCKQUOTE')" :data-note-editor-active="editor?.isActive('blockquote')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleBlockquote()"><BlockquoteIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CODE_BLOCK')" :data-note-editor-active="editor?.isActive('codeBlock')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleCodeBlock()"><CodeBlockIcon /></button>
		</div>
	`,
};
