import {
	CalloutIcon,
	CalloutInfoIcon,
	CalloutSuccessIcon,
	CalloutWarningIcon,
	CalloutTipIcon,
} from '../ui/icons';

export const ToolbarCalloutGroupComponent = {
	name: 'NoteToolbarCalloutGroup',
	components: {
		CalloutIcon,
		CalloutInfoIcon,
		CalloutSuccessIcon,
		CalloutWarningIcon,
		CalloutTipIcon,
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
	},
	methods: {
		toggle(type: string): void
		{
			this.editor?.commands.toggleCallout({ type });
			this.onCloseMenu?.();
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
					data-note-menu-anchor="callout"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CALLOUT')"
					:data-note-editor-active="editor?.isActive('callout')"
					:disabled="!editor?.isEditable"
					@click="onToggleMenu?.('callout')"
				><CalloutIcon /></button>
				<teleport to="#note-editor-app">
					<div
						v-if="isOpen"
						class="note-editor-popover"
						:data-note-toolbar-owner="popoverOwnerId"
						data-note-menu="callout"
					>
						<div class="note-editor-popover-card">
							<div class="note-editor-popover-row">
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CALLOUT_INFO')" :data-note-editor-active="editor?.isActive('callout', { type: 'info' })" :disabled="!editor?.isEditable" @click="toggle('info')"><CalloutInfoIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CALLOUT_SUCCESS')" :data-note-editor-active="editor?.isActive('callout', { type: 'success' })" :disabled="!editor?.isEditable" @click="toggle('success')"><CalloutSuccessIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CALLOUT_WARNING')" :data-note-editor-active="editor?.isActive('callout', { type: 'warning' })" :disabled="!editor?.isEditable" @click="toggle('warning')"><CalloutWarningIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_CALLOUT_TIP')" :data-note-editor-active="editor?.isActive('callout', { type: 'tip' })" :disabled="!editor?.isEditable" @click="toggle('tip')"><CalloutTipIcon /></button>
							</div>
						</div>
					</div>
				</teleport>
			</div>
		</div>
	`,
};
