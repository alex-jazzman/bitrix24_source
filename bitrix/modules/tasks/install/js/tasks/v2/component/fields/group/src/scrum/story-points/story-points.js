import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { groupService } from 'tasks.v2.provider.service.group-service';
import type { EpicModel } from 'tasks.v2.model.epics';
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
			scrumInfoState: typeof groupService.getScrumInfoState === 'function'
				? groupService.getScrumInfoState(this.taskId)
				: 'loaded',
			unsubscribeScrumInfoState: null,
		};
	},
	computed: {
		epic(): ?EpicModel
		{
			return Core.getStore()?.getters?.[`${Model.Epics}/getById`]?.(this.task.epicId);
		},
		storyPoints(): string
		{
			return this.task.storyPoints?.trim();
		},
		canUpdateScrumFields(): boolean
		{
			return typeof this.taskId !== 'number' || this.task.canUpdateScrumFields !== false;
		},
	},
	watch: {
		taskId: async function onTaskIdChange(): Promise<void>
		{
			this.subscribeScrumInfoState?.(this.taskId);
			await this.loadScrumInfo();
		},
		'task.groupId': function onGroupChange(): void
		{
			void this.updateScrumInfoState();
		},
	},
	async mounted(): Promise<void>
	{
		this.subscribeScrumInfoState(this.taskId);
		await this.updateScrumInfoState();
	},
	beforeUnmount(): void
	{
		this.unsubscribeScrumInfoState?.();
	},
	methods: {
		subscribeScrumInfoState(taskId: number | string): void
		{
			this.unsubscribeScrumInfoState?.();
			this.unsubscribeScrumInfoState = groupService.subscribeScrumInfoState?.(
				taskId,
				(state) => { this.scrumInfoState = state; },
			);
		},
		async updateScrumInfoState(): Promise<void>
		{
			let request = groupService.getScrumInfo(this.taskId);
			this.scrumInfoState = groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
			await request;

			// A group change can finish the old request before the update flow starts its force refetch.
			// Start or join the current generation instead of accepting the stale loading state.
			if (groupService.getScrumInfoState?.(this.taskId) === 'loading')
			{
				request = groupService.getScrumInfo(this.taskId);
				this.scrumInfoState = groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
				await request;
			}

			this.scrumInfoState = groupService.getScrumInfoState?.(this.taskId) ?? 'loaded';
		},
		async loadScrumInfo(): Promise<void>
		{
			if (typeof this.updateScrumInfoState !== 'function')
			{
				await groupService.getScrumInfo(this.taskId);
				this.hasScrumInfo = groupService.hasScrumInfo(this.taskId);

				return;
			}

			await this.updateScrumInfoState();
		},
		async handleClick(): Promise<void>
		{
			if (!this.canUpdateScrumFields)
			{
				return;
			}

			this.isFocused = true;

			await this.$nextTick();

			this.$refs.input.focus();
		},
		handleBlur(): void
		{
			this.isFocused = false;

			if (!this.canUpdateScrumFields)
			{
				return;
			}

			void taskService.update(this.taskId, {
				storyPoints: this.$refs.input.value.trim(),
			});
		},
	},
	template: `
		<div
			v-if="scrumInfoState === 'loaded' && epic?.isRestricted"
			class="tasks-field-story-points --restricted print-background-white"
			:class="{ '--filled': storyPoints }"
		>
			<TextXs className="tasks-field-story-points-text print-background-white print-font-color-base-1">
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loaded' && canUpdateScrumFields" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<input
				v-if="isFocused"
				class="tasks-field-story-points-input"
				:value="storyPoints"
				:aria-label="loc('TASKS_V2_GROUP_STORY_POINTS_ARIA_LABEL')"
				ref="input"
				@blur="handleBlur"
			/>
			<TextXs
				v-else
				tag="button"
				type="button"
				className="tasks-field-story-points-text print-background-white print-font-color-base-1"
				:aria-label="loc('TASKS_V2_GROUP_STORY_POINTS_ARIA_LABEL')"
				@click="handleClick"
			>
				{{ storyPoints || '-' }}
			</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loaded'" class="tasks-field-story-points" :class="{ '--filled': storyPoints }">
			<TextXs className="tasks-field-story-points-text print-font-color-base-1">{{ storyPoints || '-' }}</TextXs>
		</div>
		<div v-else-if="scrumInfoState === 'loading'" class="tasks-field-story-points-loader">
			<BLine :width="30" :height="10"/>
		</div>
	`,
};
