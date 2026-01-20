import { Event, Type } from 'main.core';

import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { Hint } from 'tasks.v2.component.elements.hint';
import { Model, TaskField } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { userFieldsManager } from 'tasks.v2.component.fields.user-fields';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserFieldScheme } from 'tasks.v2.model.interface';

import './add-task-button.css';

// @vue/component
export const AddTaskButton = {
	name: 'AddTaskButton',
	components: {
		UiButton,
		Hint,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	props: {
		size: {
			type: String,
			default: ButtonSize.LARGE,
		},
		hasError: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'addTask',
		'copyTask',
		'fromTemplate',
		'update:hasError',
	],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			fieldContainer: null,
			isPopupShown: false,
			isLoading: false,
			errorReason: null,
		};
	},
	computed: {
		...mapGetters({
			taskUserFieldScheme: `${Model.Interface}/taskUserFieldScheme`,
			templateUserFieldScheme: `${Model.Interface}/templateUserFieldScheme`,
		}),
		isUploading(): boolean
		{
			return fileService.get(this.taskId).isUploading();
		},
		isCheckListUploading(): boolean
		{
			return this.task.checklist?.some((itemId) => {
				return fileService.get(itemId, EntityTypes.CheckListItem).isUploading();
			});
		},
		userFieldScheme(): UserFieldScheme[]
		{
			return this.isTemplate
				? this.templateUserFieldScheme
				: this.taskUserFieldScheme
			;
		},
		hasUnfilledMandatoryUserFields(): boolean
		{
			return userFieldsManager.hasUnfilledMandatoryFields(this.task.userFields, this.userFieldScheme);
		},
		isDisabled(): boolean
		{
			return (
				this.task.title.trim() === ''
				|| this.isUploading
				|| this.isCheckListUploading
				|| this.hasUnfilledMandatoryUserFields
				|| this.isLoading
			);
		},
	},
	watch: {
		hasError(value: boolean): void
		{
			if (value === true)
			{
				this.isLoading = false;
			}
		},
	},
	methods: {
		async handleClick(): Promise<void>
		{
			if (this.isDisabled)
			{
				this.handleDisabledClick();

				return;
			}

			this.isLoading = true;
			this.$emit('update:hasError', false);

			if (this.task.copiedFromId)
			{
				const result = await this.handleCopyTask();

				if (!result)
				{
					this.isLoading = false;
				}

				return;
			}

			if (this.task.templateId)
			{
				const result = await this.handleCreateTaskFromTemplate();

				if (!result)
				{
					this.isLoading = false;
				}

				return;
			}

			this.$emit('addTask');
		},
		async handleCopyTask(): Promise<boolean>
		{
			let withSubTasks = false;

			if (this.task.containsSubTasks)
			{
				const captions = {
					title: this.loc('TASKS_V2_COPY_POPUP_TITLE'),
					message: this.loc('TASKS_V2_COPY_POPUP_MESSAGE'),
					yesCaption: this.loc('TASKS_V2_COPY_POPUP_YES'),
					noCaption: this.loc('TASKS_V2_COPY_POPUP_NO'),
				};

				withSubTasks = await this.askPopup(captions);

				if (Type.isNull(withSubTasks))
				{
					return false;
				}
			}

			this.$emit('copyTask', { withSubTasks });

			return true;
		},
		async handleCreateTaskFromTemplate(): Promise<boolean>
		{
			let withSubTasks = false;

			if (this.task.containsSubTasks)
			{
				const captions = {
					title: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_TITLE'),
					message: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_MESSAGE'),
					yesCaption: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_YES'),
					noCaption: this.loc('TASKS_V2_CREATE_SUBTASKS_POPUP_NO'),
				};

				withSubTasks = await this.askPopup(captions);

				if (Type.isNull(withSubTasks))
				{
					return false;
				}
			}

			this.$emit('fromTemplate', { withSubTasks });

			return true;
		},
		handleDisabledClick(): void
		{
			if (this.task.title.trim() === '')
			{
				setTimeout(() => this.highlightTitle());
			}
			else if (this.isUploading)
			{
				setTimeout(() => this.highlightFiles());
			}
			else if (this.isCheckListUploading)
			{
				setTimeout(() => this.highlightChecklist());
			}
			else if (this.hasUnfilledMandatoryUserFields)
			{
				setTimeout(() => this.highlightUserFields());
			}
		},
		highlightTitle(): void
		{
			this.errorReason = this.loc(this.isTemplate ? 'TASKS_V2_TEMPLATE_TITLE_IS_EMPTY' : 'TASKS_V2_TITLE_IS_EMPTY');

			this.fieldContainer = fieldHighlighter
				.setContainer(this.$root.$el)
				.addHighlight(TaskField.Title)
				.getFieldContainer(TaskField.Title)
			;

			this.fieldContainer.querySelector('textarea').focus();

			this.showPopup();
		},
		highlightFiles(): void
		{
			this.errorReason = this.loc('TASKS_V2_FILE_IS_UPLOADING');

			this.fieldContainer = fieldHighlighter
				.setContainer(this.$root.$el)
				.addChipHighlight(TaskField.Files)
				.getChipContainer(TaskField.Files)
			;

			this.showPopup();
		},
		highlightChecklist(): void
		{
			this.errorReason = this.loc('TASKS_V2_FILE_IS_UPLOADING');

			this.fieldContainer = fieldHighlighter
				.setContainer(this.$root.$el)
				.addChipHighlight(TaskField.CheckList)
				.getChipContainer(TaskField.CheckList)
			;

			this.showPopup();
		},
		highlightUserFields(): void
		{
			this.errorReason = this.loc('TASKS_V2_NOT_FILLED_MANDATORY_USER_FIELDS');

			this.fieldContainer = fieldHighlighter
				.setContainer(this.$root.$el)
				.addHighlight(TaskField.UserFields)
				.scrollToField(TaskField.UserFields)
				.getFieldContainer(TaskField.UserFields)
			;

			this.showPopup();
		},
		showPopup(): void
		{
			const removeHighlight = () => {
				this.isPopupShown = false;
				Event.unbind(window, 'keydown', removeHighlight);
			};
			Event.bind(window, 'keydown', removeHighlight);

			this.isPopupShown = true;
		},
		askPopup(captions: Object): Promise<boolean>
		{
			return new Promise((resolve) => {
				let result = null;

				MessageBox.show({
					...captions,
					useAirDesign: true,
					buttons: MessageBoxButtons.YES_NO,
					onYes: (box) => {
						result = true;
						box.close();
					},
					onNo: (box) => {
						result = false;
						box.close();
					},
					popupOptions: {
						events: {
							onClose: () => {
								resolve(result);
							},
						},
					},
				});
			});
		},
	},
	template: `
		<div
			class="tasks-add-task-button-container"
			:data-task-id="taskId"
			data-task-button-id="create"
			@click="handleClick"
		>
			<UiButton
				class="tasks-add-task-button"
				:text="loc('TASKS_V2_ADD_TASK')"
				:size
				:loading="isLoading && !hasError"
			/>
		</div>
		<Hint
			v-if="isPopupShown"
			:bindElement="fieldContainer"
			@close="isPopupShown = false"
		>
			{{ errorReason }}
		</Hint>
	`,
};
