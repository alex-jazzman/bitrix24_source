import { Type, Event } from 'main.core';

import { mapGetters } from 'ui.vue3.vuex';
import { TextEditor } from 'ui.text-editor';
import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model, EventName, ResultStatus } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import { resultService } from 'tasks.v2.provider.service.result-service';
import { fileService, EntityTypes, type FileService } from 'tasks.v2.provider.service.file-service';
import { EntityTextArea, EntityTextTypes, entityTextEditor, type EntityTextEditor } from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { ResultModel } from 'tasks.v2.model.results';
import type { UserModel } from 'tasks.v2.model.users';

import { resultsMeta } from '../../results-meta';
import { ResultsActionButton } from '../../results-action-button';

import './result-editor-sheet.css';

// @vue/component
export const ResultEditor = {
	name: 'TaskResultEditor',
	components: {
		BIcon,
		UiButton,
		EntityTextArea,
		ResultsActionButton,
	},
	inject: {
		taskId: {},
		task: {},
	},
	props: {
		resultId: {
			type: [Number, String],
			required: true,
		},
		content: {
			type: String,
			default: '',
		},
		isResized: {
			type: Boolean,
			default: false,
		},
		showResize: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['close', 'resize'],
	setup(props): { task: TaskModel, fileService: FileService, entityTextEditor: EntityTextEditor }
	{
		return {
			ButtonSize,
			ButtonColor,
			Outline,
			EntityTypes,
			EntityTextTypes,
			fileService: fileService.get(props.resultId, EntityTypes.Result),
			entityTextEditor: entityTextEditor.get(
				props.resultId,
				EntityTextTypes.Result,
				{
					content: props.content,
					blockSpaceInline: 'var(--ui-space-stack-xl)',
				},
			),
		};
	},
	data(): Object
	{
		return {
			isSaving: false,
			hasChanges: false,
			hasFilesChanges: false,
			buttonDisabled: !Type.isStringFilled(this.content),
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		result(): ResultModel | null
		{
			return this.$store.getters[`${Model.Results}/getById`](this.resultId);
		},
		currentUser(): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.currentUserId);
		},
		isEdit(): boolean
		{
			return Type.isNumber(this.resultId) && this.resultId > 0;
		},
		resultDate(): string
		{
			if (!this.result.createdAtTs)
			{
				return '';
			}

			return calendar.formatDateTime(this.result.createdAtTs);
		},
		title(): string
		{
			if (this.isEdit)
			{
				return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
					'#DATE#': this.resultDate,
				});
			}

			return this.loc('TASKS_V2_RESULT_ADD');
		},
		buttonTitle(): string
		{
			return this.isEdit
				? this.loc('TASKS_V2_RESULT_BUTTON_SAVE')
				: this.loc('TASKS_V2_RESULT_BUTTON_SEND')
			;
		},
		readonly(): boolean
		{
			if (!this.result)
			{
				return !this.task?.rights?.read;
			}

			return !this.result?.rights?.edit;
		},
		editor(): TextEditor
		{
			return this.entityTextEditor.getEditor();
		},
		copilotIconColor(): String
		{
			return 'var(--ui-color-copilot-primary)';
		},
		hasEditorChanges(): boolean
		{
			return this.hasChanges || this.hasFilesChanges;
		},
		resizeIcon(): string
		{
			return this.isResized ? Outline.COLLAPSE_L : Outline.EXPAND_L;
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
		if (!this.task.filledFields[resultsMeta.id])
		{
			void this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
				id: this.taskId,
				fieldName: resultsMeta.id,
			});
		}

		if (!Type.isStringFilled(this.content) || this.resultId === 0)
		{
			setTimeout(this.focusToEnd, 400);
		}
	},
	unmounted(): void
	{
		if (!this.isEdit && !this.isSaving)
		{
			void this.$store.dispatch(`${Model.Results}/delete`, this.resultId);

			fileService.delete(this.resultId, EntityTypes.Result);
			entityTextEditor.delete(this.resultId, EntityTextTypes.Result);
		}
	},
	methods: {
		handleEditButtonClick(): void
		{
			if (this.isEdit)
			{
				this.handleClose();
			}
			else
			{
				this.handleAddResult();
			}
		},
		handleAddResult(): void
		{
			this.isSaving = true;

			const result = {
				...this.result,
				text: this.editor.getText(),
				author: this.currentUser,
				status: ResultStatus.Open,
				createdAtTs: Date.now(),
				updatedAtTs: Date.now(),
			};

			void resultService.add(this.taskId, result);

			this.handleClose();

			Event.EventEmitter.emit(EventName.ResultAdded, { taskId: this.taskId });
		},
		handleUpdateResult(): void
		{
			if (!this.hasEditorChanges)
			{
				return;
			}

			const fields = {
				text: this.editor.getText(),
				updatedAtTs: Date.now() / 1000,
				status: ResultStatus.Open,
			};

			void resultService.update(this.resultId, fields);

			this.hasChanges = false;
			this.hasFilesChanges = false;

			Event.EventEmitter.emit(EventName.ResultUpdated, { taskId: this.taskId, resultId: this.resultId });
		},
		handleEditorChange(): void
		{
			const preparedOldText = this.getPreparedText(this.content);
			const preparedNewText = this.getPreparedText(this.editor?.getText());

			this.hasChanges = preparedOldText !== preparedNewText;
			this.buttonDisabled = !Type.isStringFilled(preparedNewText);
		},
		getPreparedText(text): string | null
		{
			return text
				.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '')
				.trim()
			;
		},
		focusToEnd(): void
		{
			this.editor?.focus(null, { defaultSelection: 'rootEnd' });
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
				bindElement: this.$refs.attachBtn.$el,
				onHideCallback: this.onFileBrowserClose,
			});
		},
		onFileBrowserClose(): void
		{
			this.fileService.setFileBrowserClosed(false);
		},
		handleClose(): void
		{
			if (this.isEdit)
			{
				this.handleUpdateResult();
			}

			this.$emit('close');
		},
	},
	template: `
		<div class="tasks-result-editor-wrapper" ref="wrapper">
			<div class="tasks-result-editor-header" ref="resultHeader">
				<div class="tasks-result-editor-title">{{ title }}</div>
				<div class="tasks-result-editor-field-actions">
					<BIcon
						v-if="showResize"
						class="tasks-result-editor-field-icon"
						:name="resizeIcon"
						hoverable
						@click="$emit('resize')"
					/>
					<BIcon
						:name="Outline.CROSS_L"
						hoverable
						class="tasks-result-editor-field-icon"
						@click="handleClose"
					/>
				</div>
			</div>
			<div class="tasks-result-editor-container">
				<EntityTextArea
					:entityId="resultId"
					:entityType="EntityTextTypes.Result"
					:readonly
					:removeFromServer="!isEdit"
					ref="resultTextArea"
					@change="handleEditorChange"
					@filesChange="hasFilesChanges = true"
				/>
			</div>
			<div v-if="!readonly" class="tasks-result-editor-footer" ref="resultActions">
				<div class="tasks-result-editor-action-list">
					<ResultsActionButton
						v-if="isCopilotEnabled"
						:iconName="Outline.COPILOT"
						:title="loc('TASKS_V2_RESULT_ACTION_COPILOT_TITLE')"
						:iconColor="copilotIconColor"
						@click="handleCopilotButtonClick"
					/>
					<ResultsActionButton
						v-if="isDiskModuleInstalled"
						ref="attachBtn"
						:iconName="Outline.ATTACH"
						:title="loc('TASKS_V2_RESULT_ACTION_ATTACH_TITLE')"
						@click="handleAttachButtonClick"
					/>
					<ResultsActionButton
						:iconName="Outline.MENTION"
						:title="loc('TASKS_V2_RESULT_ACTION_MENTION_TITLE')"
						@click="handleMentionButtonClick"
					/>
				</div>
				<div class="tasks-result-editor-footer-buttons">
					<UiButton
						:text="buttonTitle"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="buttonDisabled || isSaving"
						@click="handleEditButtonClick"
					/>
				</div>
			</div>
		</div>
	`,
};
