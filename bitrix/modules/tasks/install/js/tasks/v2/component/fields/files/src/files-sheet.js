import { mapGetters } from 'ui.vue3.vuex';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import { UserFieldWidgetComponent, type UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';
import { Model } from 'tasks.v2.const';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { UploadButton } from './component/upload-button';

// @vue/component
export const FilesSheet = {
	name: 'TaskFilesSheet',
	components: {
		UserFieldWidgetComponent,
		UploadButton,
		BottomSheet,
		BIcon,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isShown: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['close'],
	setup(props): { uploaderAdapter: VueUploaderAdapter }
	{
		return {
			Outline,
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			files: [],
		};
	},
	computed: {
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
		}),
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				tileWidgetOptions: {
					compact: true,
				},
			};
		},
	},
	watch: {
		isShown(): void
		{
			if (!this.isShown)
			{
				return;
			}

			void this.loadFiles();
		},
		titleFieldOffsetHeight(): void
		{
			this.$refs.bottomSheet?.adjustPosition();
		},
	},
	methods: {
		async loadFiles(): Promise<void>
		{
			this.files = await fileService.get(this.taskId).list(this.task.fileIds);
		},
	},
	template: `
		<BottomSheet :isShown="isShown" ref="bottomSheet">
			<div class="tasks-field-files-sheet" :data-task-id="taskId">
				<div class="tasks-field-files-header">
					<div class="tasks-field-files-title">{{ loc('TASKS_V2_FILES_TITLE') }}</div>
					<BIcon :name="Outline.CROSS_L" data-task-files-close @click="$emit('close')"/>
				</div>
				<div class="tasks-field-files-list">
					<UserFieldWidgetComponent :uploaderAdapter="uploaderAdapter" :widgetOptions="widgetOptions"/>
				</div>
				<div class="tasks-field-files-footer" v-if="!readonly">
					<UploadButton :taskId="taskId"/>
				</div>
			</div>
		</BottomSheet>
	`,
};
