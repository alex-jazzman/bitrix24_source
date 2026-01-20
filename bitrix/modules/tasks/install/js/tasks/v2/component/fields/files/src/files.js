import { FileStatus } from 'ui.uploader.core';
import { BIcon, Animated, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { tooltip } from 'tasks.v2.component.elements.hint';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { filesMeta } from './files-meta';
import { FilesSheet } from './files-sheet';
import './files.css';

// @vue/component
export const Files = {
	name: 'TaskFiles',
	components: {
		BIcon,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
		FilesSheet,
	},
	directives: { hint },
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
	emits: ['update:isSheetShown'],
	setup(props): { task: TaskModel, uploaderAdapter: VueUploaderAdapter, fileService: FileService }
	{
		return {
			Animated,
			Outline,
			filesMeta,
			fileService: fileService.get(props.taskId),
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			files: this.fileService.getFiles(),
			isFilesScrollable: false,
			showPreview: false,
		};
	},
	computed: {
		filesCount(): number
		{
			return this.files.length;
		},
		textFormatted(): string
		{
			if (this.filesCount > 0)
			{
				return this.loc('TASKS_V2_FILES_COUNT', {
					'#COUNT#': this.filesCount,
				});
			}

			return this.loc('TASKS_V2_FILES_TITLE');
		},
		isUploading(): boolean
		{
			return this.files.some(({ status }) => [
				FileStatus.UPLOADING,
				FileStatus.LOADING,
			].includes(status));
		},
		canAttachFiles(): boolean
		{
			return this.task.rights.attachFile || this.task.rights.edit;
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				tileWidgetOptions: {
					compact: true,
					hideDropArea: true,
					enableDropzone: false,
					readonly: !this.canAttachFiles,
					autoCollapse: false,
					removeFromServer: !this.isEdit,
					forceDisableSelection: true,
				},
			};
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_FILES_ADD'),
				popupOptions: {
					offsetLeft: this.$refs.add.$el.offsetWidth / 2,
				},
			});
		},
	},
	watch: {
		files: {
			handler(newFiles): void
			{
				if (newFiles.length > 0 && this.fileService.isFileBrowserClosed())
				{
					this.showPreview = true;
					this.fileService.resetFileBrowserClosedState();
				}
				this.handleFilesScrollable();
			},
			deep: true,
		},
	},
	mounted(): void
	{
		this.showPreview = this.isEdit;

		this.fileService.subscribe('onFileAdd', this.handleFilesScrollable);
		this.fileService.subscribe('onFileRemove', this.handleFilesScrollable);
	},
	beforeUnmount(): void
	{
		this.fileService.unsubscribe('onFileAdd', this.handleFilesScrollable);
		this.fileService.unsubscribe('onFileRemove', this.handleFilesScrollable);
	},
	methods: {
		handleAddClick(): void
		{
			this.fileService.browse({
				bindElement: this.$refs.add.$el,
				onHideCallback: this.onFileBrowserClose,
			});
		},
		handleOpenClick(): void
		{
			if (this.filesCount === 0)
			{
				this.fileService.browse({
					bindElement: this.$refs.title,
					onHideCallback: this.onFileBrowserClose,
				});
			}
			else
			{
				this.setSheetShown(true);
			}
		},
		async handleFilesScrollable(): void
		{
			await this.$nextTick();

			this.checkFilesScrollable();
		},
		checkFilesScrollable(): void
		{
			if (this.$refs.files)
			{
				this.isFilesScrollable = this.$refs.files.scrollHeight > this.$refs.files.clientHeight;
			}
		},
		onFileBrowserClose(): void
		{
			this.fileService.setFileBrowserClosed(true);
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<div
			class="tasks-field-files"
			:data-task-id="taskId"
			:data-task-field-id="filesMeta.id"
			:data-task-files-count="filesCount"
		>
			<div class="tasks-field-files-title">
				<div
					class="tasks-field-files-main"
					data-task-files-open
					@click="handleOpenClick"
					ref="title"
				>
					<template v-if="isUploading">
						<BIcon class="tasks-field-files-icon" :name="Animated.LOADER_WAIT"/>
						<div class="tasks-field-files-text">{{ loc('TASKS_V2_FILES_LOADING') }}</div>
					</template>
					<template v-else>
						<BIcon class="tasks-field-files-icon" :name="Outline.ATTACH"/>
						<div class="tasks-field-files-text">{{ textFormatted }}</div>
					</template>
				</div>
				<div v-if="canAttachFiles" class="tasks-field-files-add-container" v-hint="tooltip">
					<BIcon
						class="tasks-field-files-add"
						:name="Outline.PLUS_L"
						hoverable
						data-task-files-plus
						@click="handleAddClick"
						ref="add"
					/>
				</div>
			</div>
			<div
				v-if="showPreview && filesCount > 0"
				class="tasks-field-files-list --card"
				ref="files"
			>
				<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
			</div>
			<template v-if="isFilesScrollable">
				<div class="tasks-field-files-shadow">
					<div class="tasks-field-files-shadow-white"/>
				</div>
				<div
					class="tasks-field-files-more-button"
					@click="setSheetShown(true)"
				>
					<div class="tasks-field-files-more-button-text">{{ loc('TASKS_V2_FILES_MORE') }}</div>
				</div>
			</template>
		</div>
		<FilesSheet
			v-if="isSheetShown"
			:taskId
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`,
};
