import { Type } from 'main.core';

import { TextEditor } from 'ui.text-editor';
import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { entityTextEditor, type EntityTextEditor } from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { DescriptionMixin } from './description-mixin';
import { CheckList } from './actions/check-list';
import { Copilot } from './actions/copilot';
import { Attach } from './actions/attach';
import { Mention } from './actions/mention';

import './description.css';

// @vue/component
export const DescriptionEditor = {
	name: 'TaskDescriptionContent',
	components: {
		BIcon,
		UiButton,
		CheckList,
		Copilot,
		Attach,
		Mention,
	},
	mixins: [
		DescriptionMixin,
	],
	inject: {
		task: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		enableSaveButton: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close', 'show'],
	setup(props): { task: TaskModel, fileService: FileService, entityTextEditor: EntityTextEditor }
	{
		return {
			ButtonSize,
			ButtonColor,
			Outline,
			fileService: fileService.get(props.taskId),
			entityTextEditor: entityTextEditor.get(props.taskId),
		};
	},
	computed: {
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		editor(): TextEditor
		{
			return this.entityTextEditor.getEditor();
		},
		isDiskModuleInstalled(): boolean
		{
			return Core.getParams().features.disk;
		},
		isCopilotEnabled(): boolean
		{
			return Core.getParams().features.isCopilotEnabled;
		},
	},
	mounted(): void
	{
		this.$emit('show');

		if (!Type.isStringFilled(this.task.description) || this.taskId === 0)
		{
			setTimeout(this.focusToEnd, 500);
		}
	},
	methods: {
		focusToEnd(): void
		{
			this.editor.focus(null, { defaultSelection: 'rootEnd' });
		},
		handleCopilotButtonClick(): void
		{
			if (!this.isCopilotEnabled)
			{
				return;
			}

			this.editor.focus(
				() => {
					this.editor.dispatchCommand(
						BX.UI.TextEditor.Plugins.Copilot.INSERT_COPILOT_DIALOG_COMMAND,
					);
				},
				{ defaultSelection: 'rootEnd' },
			);
		},
		handleMentionButtonClick(): void
		{
			this.editor.focus(
				() => {
					this.editor.dispatchCommand(
						BX.UI.TextEditor.Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND,
					);
				},
				{ defaultSelection: 'rootEnd' },
			);
		},
		handleAttachButtonClick(): void
		{
			this.fileService.browse({
				bindElement: this.$refs.attach.$el,
				onHideCallback: this.onFileBrowserClose,
			});
		},
		onFileBrowserClose(): void
		{
			this.fileService.setFileBrowserClosed(false);
		},
	},
	template: `
		<div class="tasks-card-description-wrapper" ref="wrapper">
			<div class="tasks-card-description-header" ref="descriptionHeader">
				<div class="tasks-card-description-title">
					{{ loc('TASKS_V2_CHANGE_DESCRIPTION') }}
				</div>
				<BIcon
					:name="Outline.CROSS_L"
					hoverable
					class="tasks-card-description-field-icon"
					@click="handleClose"
				/>
			</div>
			<div class="tasks-card-description-editor-wrapper" id="descriptionTextAreaDestination"/>
			<div v-if="!readonly" class="tasks-card-description-editor-footer" ref="descriptionActions">
				<div class="tasks-card-description-action-list">
					<Copilot
						v-if="isCopilotEnabled"
						@click="handleCopilotButtonClick"
					/>
					<Attach
						v-if="isDiskModuleInstalled"
						ref="attach"
						@click="handleAttachButtonClick"
					/>
					<Mention @click="handleMentionButtonClick"/>
					<CheckList
						v-if="isCopilotEnabled"
						:loading="isAiCommandProcessing"
						@click="handleCheckListButtonClick"
					/>
				</div>
				<div class="tasks-card-description-footer-buttons">
					<UiButton
						:text="loc('TASKS_V2_DESCRIPTION_BUTTON_SAVE')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="!enableSaveButton"
						@click="handleClose"
					/>
				</div>
			</div>
		</div>
	`,
};
