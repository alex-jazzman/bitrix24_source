import { HorizontalRuleIcon, ListIcon, ListBulletedIcon, ListOrderedIcon, ListTaskIcon } from '../ui/icons';
import { Type } from 'main.core';

export const ToolbarInsertGroupComponent = {
	name: 'NoteToolbarInsertGroup',
	components: {
		HorizontalRuleIcon,
		ListIcon,
		ListBulletedIcon,
		ListOrderedIcon,
		ListTaskIcon,
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
		listIsActive: {
			type: Boolean,
			default: false,
		},
		isListOpen: {
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
		toggleAndClose(commandName: string): void
		{
			if (!this.editor)
			{
				return;
			}

			const command = this.editor.commands?.[commandName];
			if (Type.isFunction(command))
			{
				command();
			}
			this.onCloseMenu?.();
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-toolbar-group" :data-editor-tick="editorTick">
			<button type="button" class="note-editor-toolbar-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_HORIZONTAL_RULE')" :disabled="!editor?.isEditable" @click="editor?.commands.setHorizontalRule()"><HorizontalRuleIcon /></button>
			<div class="note-editor-toolbar-item">
				<button
					type="button"
					class="note-editor-toolbar-button"
					:data-note-toolbar-owner="popoverOwnerId"
					data-note-menu-anchor="list"
					:title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_LISTS')"
					:data-note-editor-active="listIsActive"
					:disabled="!editor?.isEditable"
					@click="onToggleMenu?.('list')"
				><ListIcon /></button>
				<teleport to="#note-editor-app">
					<div
						v-if="isListOpen"
						class="note-editor-popover"
						:data-note-toolbar-owner="popoverOwnerId"
						data-note-menu="list"
					>
						<div class="note-editor-popover-card">
							<div class="note-editor-popover-row">
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_LIST_BULLETED')" :data-note-editor-active="editor?.isActive('bulletList')" :disabled="!editor?.isEditable" @click="toggleAndClose('toggleBulletList')"><ListBulletedIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_LIST_ORDERED')" :data-note-editor-active="editor?.isActive('orderedList')" :disabled="!editor?.isEditable" @click="toggleAndClose('toggleOrderedList')"><ListOrderedIcon /></button>
								<button type="button" class="note-editor-popover-button" :title="$Bitrix.Loc.getMessage('NOTE_EDITOR_TOOLBAR_LIST_TASK')" :data-note-editor-active="editor?.isActive('taskList')" :disabled="!editor?.isEditable" @click="toggleAndClose('toggleTaskList')"><ListTaskIcon /></button>
							</div>
						</div>
					</div>
				</teleport>
			</div>
		</div>
	`,
};
