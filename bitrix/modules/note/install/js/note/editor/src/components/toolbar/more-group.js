import {
	PlusIcon,
	LinkIcon,
	TableIcon,
	FilePlusIcon,
	ImagePlusIcon,
	VideoIcon,
} from '../ui/icons';
import { LinkEditFormComponent } from './link-edit-form';

export const ToolbarMoreGroupComponent = {
	name: 'NoteToolbarMoreGroup',
	components: {
		PlusIcon,
		LinkIcon,
		TableIcon,
		FilePlusIcon,
		ImagePlusIcon,
		VideoIcon,
		LinkEditForm: LinkEditFormComponent,
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
		isOpen: {
			type: Boolean,
			default: false,
		},
		subMode: {
			type: String,
			default: 'menu',
		},
		insertTableDisabled: {
			type: Boolean,
			default: false,
		},
		linkValue: {
			type: String,
			default: '',
		},
		linkIsActive: {
			type: Boolean,
			default: false,
		},
		// Set when the link form was opened from the keyboard (Mod+K): the URL field takes focus so the
		// next keystroke goes into it instead of the document. Opening by click leaves focus alone.
		linkAutofocus: {
			type: Boolean,
			default: false,
		},
		popoverOwnerId: {
			type: String,
			default: '',
		},
		onToggleMenu: {
			type: Function,
			default: null,
		},
		onCloseMenu: {
			type: Function,
			default: null,
		},
		onSetSubMode: {
			type: Function,
			default: null,
		},
		onApplyLink: {
			type: Function,
			default: null,
		},
		onUnsetLink: {
			type: Function,
			default: null,
		},
		onLinkValueChange: {
			type: Function,
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
	computed: {
		showLinkRow(): boolean
		{
			return this.subMode === 'link';
		},
	},
	methods: {
		insertTable(): void
		{
			if (this.insertTableDisabled)
			{
				return;
			}

			this.editor?.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: false });
			this.onCloseMenu?.();
		},
		insertFile(): void
		{
			this.onInsertFile?.();
			this.onCloseMenu?.();
		},
		insertImage(): void
		{
			this.onInsertImage?.();
			this.onCloseMenu?.();
		},
		insertVideo(): void
		{
			this.onInsertVideo?.();
			this.onCloseMenu?.();
		},
		switchToLink(): void
		{
			this.onSetSubMode?.('link');
		},
		setLinkValue(value: string): void
		{
			this.onLinkValueChange?.(value);
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group" :data-editor-tick="editorTick">
			<div class="note-editor-toolbar-item">
				<button
					type="button"
					class="note-editor-toolbar-button"
					:data-note-toolbar-owner="popoverOwnerId"
					data-note-menu-anchor="more"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_INSERT')"
					:disabled="!editor?.isEditable"
					@click="onToggleMenu?.('more')"
				><PlusIcon /></button>
				<teleport to="#note-editor-app">
					<div
						v-if="isOpen"
						class="note-editor-popover"
						:data-note-toolbar-owner="popoverOwnerId"
						data-note-menu="more"
					>
						<div class="note-editor-popover-card">
							<div v-if="!showLinkRow" class="note-editor-popover-row">
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_LINK')" :data-note-editor-active="linkIsActive" :disabled="!editor?.isEditable" @click="switchToLink"><LinkIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_INSERT_TABLE')" :disabled="insertTableDisabled" @click="insertTable"><TableIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_FILE')" :disabled="!editor?.isEditable" @click="insertFile"><FilePlusIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_IMAGE')" :disabled="!editor?.isEditable" @click="insertImage"><ImagePlusIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_VIDEO')" :disabled="!editor?.isEditable" @click="insertVideo"><VideoIcon /></button>
							</div>
							<LinkEditForm
								v-else
								:editor="editor"
								:editor-tick="editorTick"
								:link-value="linkValue"
								:link-is-active="linkIsActive"
								:autofocus="linkAutofocus"
								:show-apply="false"
								@update:link-value="setLinkValue"
								@apply="onApplyLink?.()"
								@unset="onUnsetLink?.()"
							/>
						</div>
					</div>
				</teleport>
			</div>
		</div>
	`,
};
