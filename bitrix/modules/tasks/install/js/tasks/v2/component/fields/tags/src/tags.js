import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { AddButton } from 'tasks.v2.component.elements.add-button';
import { FieldAdd } from 'tasks.v2.component.elements.field-add';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { tagsMeta } from './tags-meta';
import { tagsDialog } from './tags-dialog';
import './tags.css';

// @vue/component
export const Tags = {
	components: {
		BIcon,
		AddButton,
		FieldAdd,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			tagsMeta,
		};
	},
	data(): Object
	{
		return {
			isDialogShown: false,
			tagsIndexes: {},
			isHovered: false,
		};
	},
	computed: {
		tags(): string[]
		{
			return [...this.task.tags].sort((a, b) => this.tagsIndexes[a] - this.tagsIndexes[b]);
		},
		isFilled(): boolean
		{
			return this.tags.length > 0;
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		isAddActive(): boolean
		{
			return !this.readonly && this.isFilled;
		},
		isAddVisible(): boolean
		{
			return this.isDialogShown || this.isHovered;
		},
	},
	created(): void
	{
		this.rememberTagsIndexes(this.tags);
	},
	methods: {
		handleClick(): void
		{
			if (this.readonly)
			{
				return;
			}

			tagsDialog.show({
				targetNode: this.$refs.anchor,
				taskId: this.taskId,
				onClose: this.handleDialogClose,
			});

			this.isDialogShown = true;
		},
		handleDialogClose(tags: string[]): void
		{
			this.isDialogShown = false;
			this.rememberTagsIndexes(tags);
		},
		handleCrossClick(tag: string): void
		{
			const tags = this.tags.filter((it) => it !== tag);
			void taskService.update(this.taskId, { tags });
		},
		rememberTagsIndexes(tags: string[]): void
		{
			this.tagsIndexes = tags.reduce((acc, tag, index) => {
				acc[tag] = index;

				return acc;
			}, {});
		},
	},
	template: `
		<div
			class="tasks-field-tags"
			:class="{ '--empty': !isFilled }"
			:data-task-id="taskId"
			:data-task-field-id="tagsMeta.id"
			:data-task-field-value="task.tags.join(',')"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<AddButton v-if="isAddActive" :isVisible="isAddVisible" @click="handleClick"/>
			<template v-for="tag in tags" :key="tag">
				<div class="tasks-field-tag">
					<span>{{ tag }}</span>
					<div v-if="!readonly" class="tasks-field-tag-cross" @click.capture.stop="handleCrossClick(tag)">
						<BIcon :name="Outline.CROSS_L" hoverable/>
					</div>
				</div>
			</template>
			<FieldAdd v-if="!isFilled" :icon="Outline.TAG" @click="handleClick"/>
			<div class="tasks-field-tags-anchor" ref="anchor"/>
		</div>
	`,
};
