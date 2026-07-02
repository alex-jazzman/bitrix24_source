import { BoldIcon, ItalicIcon, UnderlineIcon, StrikeIcon, CodeIcon } from '../ui/icons';

export const ToolbarTextStyleGroupComponent = {
	name: 'NoteToolbarTextStyleGroup',
	components: {
		BoldIcon,
		ItalicIcon,
		UnderlineIcon,
		StrikeIcon,
		CodeIcon,
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
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_BOLD')" :data-note-editor-active="editor?.isActive('bold')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleBold()"><BoldIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_ITALIC')" :data-note-editor-active="editor?.isActive('italic')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleItalic()"><ItalicIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_UNDERLINE')" :data-note-editor-active="editor?.isActive('underline')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleUnderline()"><UnderlineIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_STRIKE')" :data-note-editor-active="editor?.isActive('strike')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleStrike()"><StrikeIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CODE')" :data-note-editor-active="editor?.isActive('code')" :disabled="!editor?.isEditable" @click="editor?.commands.toggleCode()"><CodeIcon /></button>
		</div>
	`,
};
