import { FileStatus } from 'ui.uploader.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { Animated, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { filesMeta } from './files-meta';
import './files.css';

// @vue/component
export const Files = {
	name: 'TaskFiles',
	components: {
		BIcon,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['open'],
	setup(): Object
	{
		return {
			Animated,
			Outline,
			filesMeta,
		};
	},
	data(): Object
	{
		return {
			files: fileService.get(this.taskId).getFiles(),
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		filesCount(): number
		{
			return this.task.fileIds.length;
		},
		textFormatted(): string
		{
			if (this.filesCount > 0)
			{
				return this.loc('TASKS_V2_FILES_COUNT', {
					'#COUNT#': this.filesCount,
				});
			}

			return this.loc('TASKS_V2_FILES_ADD');
		},
		isUploading(): boolean
		{
			return this.files.some(({ status }) => [FileStatus.UPLOADING, FileStatus.LOADING].includes(status));
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
	},
	methods: {
		handleAddClick(): void
		{
			fileService.get(this.taskId).browse({
				bindElement: this.$refs.add.$el,
			});
		},
	},
	template: `
		<div
			class="tasks-field-files"
			:data-task-id="taskId"
			:data-task-field-id="filesMeta.id"
			:data-task-files-count="filesCount"
		>
			<div
				class="tasks-field-files-main"
				data-task-files-open
				@click="$emit('open')"
			>
				<template v-if="isUploading">
					<BIcon class="tasks-field-files-icon" :name="Animated.LOADER_WAIT"/>
					<div class="tasks-field-files-text">{{ loc('TASKS_V2_FILES_LOADING') }}</div>
				</template>
				<template v-else>
					<BIcon class="tasks-field-files-icon" :name="Outline.ATTACH"/>
					<div class="tasks-field-files-text" :class="{ '--add': filesCount === 0 }">
						{{ textFormatted }}
					</div>
				</template>
			</div>
			<BIcon
				v-if="!readonly"
				class="tasks-field-files-add"
				:name="Outline.PLUS_L"
				data-task-files-plus
				ref="add"
				@click="handleAddClick"
			/>
		</div>
	`,
};
