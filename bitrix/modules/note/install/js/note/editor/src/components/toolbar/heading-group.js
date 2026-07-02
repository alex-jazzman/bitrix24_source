import {
	HeadingIcon,
	ParagraphIcon,
	HeadingOneIcon,
	HeadingTwoIcon,
	HeadingThreeIcon,
	HeadingFourIcon,
} from '../ui/icons';

export const ToolbarHeadingGroupComponent = {
	name: 'NoteToolbarHeadingGroup',
	components: {
		HeadingIcon,
		ParagraphIcon,
		HeadingOneIcon,
		HeadingTwoIcon,
		HeadingThreeIcon,
		HeadingFourIcon,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		headingLevel: {
			type: Number,
			default: 0,
		},
		isOpen: {
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
		onToggleHeading: {
			type: Function,
			default: null,
		},
	},
	methods: {
		toggle(level: number): void
		{
			this.onToggleHeading?.(level);
			this.onCloseMenu?.();
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group">
			<div class="note-editor-toolbar-item">
				<button
					type="button"
					class="note-editor-toolbar-button"
					:data-note-toolbar-owner="popoverOwnerId"
					data-note-menu-anchor="heading"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HEADINGS')"
					:data-note-editor-active="headingLevel > 0"
					:disabled="!editor?.isEditable"
					@click="onToggleMenu?.('heading')"
				><HeadingIcon /></button>
				<teleport to="#note-editor-app">
					<div
						v-if="isOpen"
						class="note-editor-popover"
						:data-note-toolbar-owner="popoverOwnerId"
						data-note-menu="heading"
					>
						<div class="note-editor-popover-card">
							<div class="note-editor-popover-row">
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_PARAGRAPH')" :data-note-editor-active="headingLevel === 0" @click="toggle(0)"><ParagraphIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HEADING_1')" :data-note-editor-active="headingLevel === 1" :disabled="!editor?.isEditable" @click="toggle(1)"><HeadingOneIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HEADING_2')" :data-note-editor-active="headingLevel === 2" :disabled="!editor?.isEditable" @click="toggle(2)"><HeadingTwoIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HEADING_3')" :data-note-editor-active="headingLevel === 3" :disabled="!editor?.isEditable" @click="toggle(3)"><HeadingThreeIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HEADING_4')" :data-note-editor-active="headingLevel === 4" :disabled="!editor?.isEditable" @click="toggle(4)"><HeadingFourIcon /></button>
							</div>
						</div>
					</div>
				</teleport>
			</div>
		</div>
	`,
};
