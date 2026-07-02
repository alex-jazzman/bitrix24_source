import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon } from '../ui/icons';

export const ToolbarAlignGroupComponent = {
	name: 'NoteToolbarAlignGroup',
	components: {
		AlignLeftIcon,
		AlignCenterIcon,
		AlignRightIcon,
		AlignJustifyIcon,
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
	methods: {
		isAlignActive(align: string): boolean
		{
			return this.editor?.isActive({ textAlign: align }) === true;
		},
		isLeftActive(): boolean
		{
			if (this.isAlignActive('left'))
			{
				return true;
			}

			return !this.isAlignActive('center')
				&& !this.isAlignActive('right')
				&& !this.isAlignActive('justify');
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group" :data-editor-tick="editorTick">
			<button type="button" class="note-editor-toolbar-button"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_LEFT')"
					:data-note-editor-active="isLeftActive()" :disabled="!editor?.isEditable"
					@click="editor?.commands.setTextAlign('left')">
				<AlignLeftIcon/>
			</button>
			<button type="button" class="note-editor-toolbar-button"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_CENTER')"
					:data-note-editor-active="isAlignActive('center')" :disabled="!editor?.isEditable"
					@click="editor?.commands.setTextAlign('center')">
				<AlignCenterIcon/>
			</button>
			<button type="button" class="note-editor-toolbar-button"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_RIGHT')"
					:data-note-editor-active="isAlignActive('right')" :disabled="!editor?.isEditable"
					@click="editor?.commands.setTextAlign('right')">
				<AlignRightIcon/>
			</button>
			<button type="button" class="note-editor-toolbar-button"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_JUSTIFY')"
					:data-note-editor-active="isAlignActive('justify')" :disabled="!editor?.isEditable"
					@click="editor?.commands.setTextAlign('justify')">
				<AlignJustifyIcon/>
			</button>
		</div>
	`,
};
