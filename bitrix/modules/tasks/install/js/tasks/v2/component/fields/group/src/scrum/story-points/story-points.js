import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';

import { taskService } from 'tasks.v2.provider.service.task-service';
import { groupService } from 'tasks.v2.provider.service.group-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './story-points.css';

// @vue/component
export const StoryPoints = {
	components: {
		TextXs,
		BLine,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			isFocused: false,
			hasScrumInfo: groupService.hasScrumInfo(this.taskId),
		};
	},
	computed: {
		storyPoints(): string
		{
			return this.task.storyPoints?.trim();
		},
	},
	async mounted(): Promise<void>
	{
		await groupService.getScrumInfo(this.taskId);

		this.hasScrumInfo = groupService.hasScrumInfo(this.taskId);
	},
	methods: {
		async handleClick(): Promise<void>
		{
			this.isFocused = true;

			await this.$nextTick();

			this.$refs.input.focus();
		},
		handleBlur(): void
		{
			this.isFocused = false;

			void taskService.update(this.taskId, {
				storyPoints: this.$refs.input.value.trim(),
			});
		},
	},
	template: `
		<div v-if="hasScrumInfo" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<input
				v-if="isFocused"
				class="tasks-field-story-points-input"
				:value="storyPoints"
				ref="input"
				@blur="handleBlur"
			/>
			<TextXs
				v-else
				className="tasks-field-story-points-text"
				@click="handleClick"
			>
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else class="tasks-field-story-points-loader">
			<BLine :width="30" :height="10"/>
		</div>
	`,
};
