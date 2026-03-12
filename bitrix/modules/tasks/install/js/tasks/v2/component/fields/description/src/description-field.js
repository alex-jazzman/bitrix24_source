import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import type { VueUploaderAdapter } from 'ui.uploader.vue';
import type { TextEditor } from 'ui.text-editor';

import { Endpoint, EventName } from 'tasks.v2.const';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { entityTextEditor, type EntityTextEditor } from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserModel } from 'tasks.v2.model.users';
import type { FileService } from 'tasks.v2.provider.service.file-service';

import { MiniFormButton } from './mini-form-button.js';
import { MiniForm } from './mini-form.js';
import { DescriptionPreview } from './description-preview';
import { DescriptionSheet } from './description-sheet';

import './description.css';

// @vue/component
export const DescriptionField = {
	name: 'TaskDescriptionField',
	components: {
		MiniFormButton,
		MiniForm,
		DescriptionPreview,
		DescriptionSheet,
	},
	expose: ['save'],
	inject: {
		task: {},
		isEdit: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			required: true,
		},
		taskId: {
			type: [Number, String],
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	// eslint-disable-next-line max-len
	setup(props): { task: TaskModel, fileService: FileService, uploaderAdapter: VueUploaderAdapter, entityTextEditor: EntityTextEditor }
	{
		return {
			fileService: fileService.get(props.taskId),
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
			entityTextEditor: entityTextEditor.get(props.taskId),
		};
	},
	data(): Object
	{
		return {
			checksum: '',
			isSaving: false,
			isMiniFormShown: false,
			enableSaveButton: false,
			hasFilesChanges: false,
			files: this.fileService.getFiles(),
		};
	},
	computed: {
		taskDescription(): string
		{
			return this.task.description ?? '';
		},
		taskDescriptionChecksum(): string
		{
			return this.task.descriptionChecksum ?? '';
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		filesCount(): number
		{
			return this.files.length;
		},
		shouldShowDescriptionField(): boolean
		{
			return !this.readonly
				|| this.taskDescription.length > 0
				|| (this.filesCount > 0 && !this.readonly)
			;
		},
		shouldShowMiniForm(): boolean
		{
			if (this.readonly)
			{
				return false;
			}

			if (!this.isEdit)
			{
				return this.isMiniFormShown || this.task.description.length > 0;
			}

			return true;
		},
		shouldShowMiniFormButton(): boolean
		{
			return this.taskDescription.length === 0
				&& (
					(!this.isEdit && !this.isMiniFormShown)
					|| (this.isEdit && this.filesCount === 0)
				)
			;
		},
		shouldShowDescriptionPreview(): boolean
		{
			return this.isEdit && (this.taskDescription.length > 0 || this.filesCount > 0);
		},
		miniFormStyle(): Object | null
		{
			if (this.isEdit)
			{
				return { display: 'none' };
			}

			return null;
		},
		editor(): TextEditor
		{
			return this.entityTextEditor.getEditor();
		},
	},
	watch: {
		taskDescriptionChecksum: {
			handler(): void
			{
				if (this.editor && this.isSheetShown && !this.hasChanges())
				{
					this.updateChecksum();
				}
			},
			deep: true,
		},
	},
	mounted(): void
	{
		this.entityTextEditor.setEditorText(this.taskDescription);
		this.updateChecksum();
	},
	methods: {
		expandDescription(): void
		{
			this.setSheetShown(true);
		},
		openEditMode(): void
		{
			if (this.editor && this.hasChanges() && !this.isSaving)
			{
				this.entityTextEditor.setEditorText(this.taskDescription);
			}

			this.updateChecksum();

			this.setSheetShown(true);
		},
		async closeEditMode(): void
		{
			this.setSheetShown(false);

			this.hasFilesChanges = false;
			this.enableSaveButton = false;

			await this.handleSave();
		},
		async addCheckListFromSheet(checklistString: string): void
		{
			await this.closeEditMode();

			this.addCheckList(checklistString);
		},
		handleMiniFormButtonClick(): void
		{
			if (this.isEdit)
			{
				this.openEditMode();
			}
			else
			{
				this.isMiniFormShown = true;
			}
		},
		async handleTextChanges(): void
		{
			if (this.isEdit)
			{
				if (this.hasFilesChanges)
				{
					return;
				}

				this.enableSaveButton = this.hasChanges();
			}
			else
			{
				this.enableSaveButton = true;

				await this.save();
			}
		},
		async addCheckListFromMiniForm(checklistString: string): void
		{
			await this.handleTextChanges();

			this.addCheckList(checklistString);
		},
		addCheckList(checklistString: string): void
		{
			this.$bitrix.eventEmitter.emit(EventName.AddCheckListFromText, checklistString);
		},
		handleFilesChanges(): void
		{
			if (!this.isSheetShown)
			{
				return;
			}

			this.hasFilesChanges = true;
			this.enableSaveButton = true;
		},
		async handleSave(): void
		{
			if (!this.editor || !this.hasChanges())
			{
				return;
			}

			this.isSaving = true;

			taskService.setSilentErrorMode(true);

			const result = await this.save();

			taskService.setSilentErrorMode(false);

			if (result?.[Endpoint.TaskDescriptionUpdate]?.length > 0)
			{
				const errorData = result[Endpoint.TaskDescriptionUpdate][0];

				const { customData } = errorData;

				if (customData && customData.changed && customData.changedBy)
				{
					this.showDescriptionChangedAlert(customData.changedBy);
				}
				else
				{
					console.error('Error saving description:', errorData);
				}
			}

			this.isSaving = false;
		},
		async save(forceUpdateDescription = false): Promise
		{
			return taskService.update(this.taskId, {
				forceUpdateDescription,
				description: this.editor.getText(),
				descriptionChecksum: this.checksum,
			});
		},
		hasChanges(): boolean
		{
			const preparedOldText = this.getPreparedText(this.taskDescription);
			const preparedNewText = this.getPreparedText(this.editor?.getText());

			return preparedOldText !== preparedNewText;
		},
		getPreparedText(text): string | null
		{
			return text
				.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '')
				.trim()
			;
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		showDescriptionChangedAlert(changedBy: UserModel): string
		{
			MessageBox.show({
				useAirDesign: true,
				title: this.loc('TASKS_V2_DESCRIPTION_CHECKSUM_ERROR_TITLE'),
				message: this.loc(`TASKS_V2_DESCRIPTION_CHECKSUM_ERROR_DESC_${changedBy.gender.toUpperCase()}`, {
					'#NAME#': changedBy.name,
				}),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: this.loc('TASKS_V2_DESCRIPTION_CHECKSUM_ERROR_BUTTON_OK'),
				onOk: (dialog) => this.onOkDescriptionChangedAlert(dialog),
				popupOptions: {
					closeByEsc: false,
					autoHide: false,
					events: {
						onClose: () => this.onCloseDescriptionChangedAlert(),
					},
				},
			});
		},
		async onOkDescriptionChangedAlert(dialog): void
		{
			dialog.close();

			await this.save(true);
		},
		onCloseDescriptionChangedAlert(): void
		{
			this.updateChecksum();
		},
		updateChecksum(): void
		{
			this.checksum = this.taskDescriptionChecksum;
		},
	},
	template: `
		<div
			v-if="shouldShowDescriptionField"
			class="tasks-card-description-field"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
		>
			<MiniFormButton
				v-if="shouldShowMiniFormButton"
				:filesCount
				@click="handleMiniFormButtonClick"
			/>
			<MiniForm
				v-if="shouldShowMiniForm"
				:taskId
				:isSheetShown
				:style="miniFormStyle"
				@expand="expandDescription"
				@change="handleTextChanges"
				@filesChange="handleFilesChanges"
				@addCheckList="addCheckListFromMiniForm"
			/>
			<DescriptionPreview
				v-if="shouldShowDescriptionPreview"
				:taskId
				:files
				:isMiniFormShown
				@editButtonClick="openEditMode"
			/>
		</div>
		<DescriptionSheet
			v-if="isSheetShown"
			:sheetBindProps
			:enableSaveButton
			@close="closeEditMode"
			@addCheckList="addCheckListFromSheet"
		/>
	`,
};
