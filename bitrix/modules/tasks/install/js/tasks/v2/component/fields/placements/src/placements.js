import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Animated } from 'ui.icon-set.api.vue';
import 'ui.icon-set.animated';

import { Type } from 'main.core';
import { Model } from 'tasks.v2.const';
import { placementService } from 'tasks.v2.provider.service.placement-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { PlacementModel } from 'tasks.v2.model.placements';

import { PlacementsList } from './components/placements-list/placements-list';
import { placementsMeta } from './placements-meta';

import './placements.css';

// @vue/component
export const Placements = {
	name: 'TaskPlacements',
	components: {
		BIcon,
		TextMd,
		PlacementsList,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			placementsMeta,
			Animated,
		};
	},
	data(): Object
	{
		return {
			isLoading: false,
		};
	},
	computed: {
		placementIds(): ?number[]
		{
			return this.task.placementIds;
		},
		hasPlacements(): boolean
		{
			return Type.isArrayFilled(this.task.placementIds);
		},
		placements(): PlacementModel[]
		{
			if (!this.hasPlacements)
			{
				return [];
			}

			return this.$store.getters[`${Model.Placements}/getByIds`](this.placementIds);
		},
		shouldLoadPlacements(): boolean
		{
			return this.task.containsPlacements && Type.isNull(this.placementIds);
		},
	},
	async created(): void
	{
		if (!this.shouldLoadPlacements)
		{
			return;
		}

		await this.loadPlacements();
	},
	methods: {
		async loadPlacements(): Promise<void>
		{
			this.isLoading = true;

			try
			{
				await placementService.get(this.taskId);
			}
			catch (error)
			{
				console.error('Failed to load placements', {
					taskId: this.taskId,
					error,
				});
			}
			finally
			{
				this.isLoading = false;
			}
		},
	},
	template: `
		<div
			class="tasks-field-placements"
			:data-task-id="taskId"
			:data-task-field-id="placementsMeta.id"
			data-field-container
		>
			<template v-if="isLoading">
				<div class="tasks-field-placements-empty-container">
					<BIcon :name="Animated.LOADER_WAIT"/>
					<TextMd accent>{{ loc('TASKS_V2_PLACEMENT_TITLE_LOADING') }}</TextMd>
				</div>
			</template>
			<PlacementsList v-else-if="hasPlacements" :placements/>
		</div>
	`,
};
