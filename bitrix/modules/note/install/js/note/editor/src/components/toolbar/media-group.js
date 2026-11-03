import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { FilePlusIcon, ImagePlusIcon, VideoIcon } from '../ui/icons';

export const ToolbarMediaGroupComponent = {
	name: 'NoteToolbarMediaGroup',
	components: {
		BIcon,
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
		// Own entry point for a file that already lives on Disk. Hidden when the feature is off, so the
		// group stays exactly as it was.
		diskAttachmentsEnabled: {
			type: Boolean,
			default: false,
		},
		onPickDiskFile: {
			type: Function,
			default: null,
		},
	},
	data()
	{
		return {
			Outline,
		};
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group">
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_FILE')" :disabled="!editor?.isEditable" @click="onInsertFile"><FilePlusIcon /></button>
			<button v-if="diskAttachmentsEnabled" type="button" class="note-editor-toolbar-button" data-testid="note-editor-file-from-disk" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_FILE_FROM_DISK')" :disabled="!editor?.isEditable" @click="onPickDiskFile"><BIcon :name="Outline.STORAGE" :size="24" /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_IMAGE')" :disabled="!editor?.isEditable" @click="onInsertImage"><ImagePlusIcon /></button>
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_VIDEO')" :disabled="!editor?.isEditable" @click="onInsertVideo"><VideoIcon /></button>
		</div>
	`,
};
