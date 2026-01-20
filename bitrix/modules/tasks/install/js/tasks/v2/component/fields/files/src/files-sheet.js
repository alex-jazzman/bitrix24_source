import { Text } from 'main.core';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import type { VueUploaderAdapter } from 'ui.uploader.vue';
import 'ui.icon-set.outline';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { DropZone } from 'tasks.v2.component.drop-zone';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { fileService, EntityTypes, type FileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { UploadButton } from './component/upload-button';
import { DownloadArchiveButton } from './component/download-archive-button';

// @vue/component
export const FilesSheet = {
	name: 'TaskFilesSheet',
	components: {
		UploadButton,
		DownloadArchiveButton,
		BottomSheet,
		BIcon,
		DropZone,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
	},
	inject: {
		task: {},
		isEdit: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(props): { task: TaskModel, fileService: FileService, uploaderAdapter: VueUploaderAdapter }
	{
		return {
			Outline,
			EntityTypes,
			fileService: fileService.get(props.taskId),
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			uniqueKey: Text.getRandom(),
			files: this.fileService.getFiles(),
		};
	},
	computed: {
		canAttachFiles(): boolean
		{
			return this.task.rights.attachFile || this.task.rights.edit;
		},
		filesCount(): number
		{
			return this.files.length;
		},
		archiveLink(): ?string
		{
			return this.task.archiveLink;
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				tileWidgetOptions: {
					compact: true,
					autoCollapse: false,
					readonly: !this.canAttachFiles,
					enableDropzone: false,
					hideDropArea: true,
					removeFromServer: !this.isEdit,
					forceDisableSelection: true,
				},
			};
		},
		showFooter(): boolean
		{
			return this.filesCount > 1 || this.canAttachFiles;
		},
		canDownloadArchive(): boolean
		{
			return this.filesCount > 1 && this.archiveLink;
		},
		bottomSheetContainer(): HTMLElement | null
		{
			return document.getElementById(`b24-bottom-sheet-${this.uniqueKey}`) || null;
		},
	},
	template: `
		<BottomSheet
			:sheetBindProps
			:padding="0"
			:uniqueKey
			@close="$emit('close')"
		>
			<div class="tasks-field-files-sheet" :data-task-id="taskId" ref="content">
				<div class="tasks-field-files-header">
					<div class="tasks-field-files-title">{{ loc('TASKS_V2_FILES_TITLE') }}</div>
					<BIcon
						data-task-files-close
						class="tasks-field-files-close"
						hoverable
						:name="Outline.CROSS_L"
						@click="$emit('close')"
					/>
				</div>
				<div class="tasks-field-files-list">
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
				<div
					v-if="showFooter"
					class="tasks-field-files-footer"
					:class="{ '--with-archive': canDownloadArchive }"
				>
					<DownloadArchiveButton v-if="canDownloadArchive" :files/>
					<UploadButton v-if="canAttachFiles"/>
				</div>
			</div>
			<DropZone
				v-if="canAttachFiles"
				:container="bottomSheetContainer || {}"
				:entityId="taskId"
				:entityType="EntityTypes.Task"
			/>
		</BottomSheet>
	`,
};
