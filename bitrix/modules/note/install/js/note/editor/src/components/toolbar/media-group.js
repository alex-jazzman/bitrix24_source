import { FilePlusIcon, ImagePlusIcon, VideoIcon } from '../ui/icons';

export const ToolbarMediaGroupComponent = {
	name: 'NoteToolbarMediaGroup',
	components: {
		FilePlusIcon,
		ImagePlusIcon,
		VideoIcon,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		onInsertFile: {
			type: Function,
			default: null,
		},
		onInsertImage: {
			type: Function,
			default: null,
		},
		onInsertVideo: {
			type: Function,
			default: null,
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group">
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_FILE')" :disabled="!editor?.isEditable" @click="onInsertFile"><FilePlusIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_IMAGE')" :disabled="!editor?.isEditable" @click="onInsertImage"><ImagePlusIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_VIDEO')" :disabled="!editor?.isEditable" @click="onInsertVideo"><VideoIcon /></button>
		</div>
	`,
};
