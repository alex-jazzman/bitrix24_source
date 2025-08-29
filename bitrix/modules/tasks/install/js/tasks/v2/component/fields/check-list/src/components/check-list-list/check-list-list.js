import { BIcon } from 'ui.icon-set.api.vue';
import { Animated, Outline } from 'ui.icon-set.api.core';

import { Model } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { CheckListManager } from '../../lib/check-list-manager';
import { checkListMeta } from '../../lib/check-list-meta';

import './check-list-list.css';

// @vue/component
export const CheckListList = {
	name: 'TaskCheckListList',
	components: {
		BIcon,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['open', 'addFastCheckList'],
	setup(): Object
	{
		return {
			Animated,
			Outline,
			checkListMeta,
		};
	},
	data(): Object
	{
		return {
			checkListManager: null,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isLoading(): boolean
		{
			return this.checkLists.length === 0;
		},
		containsChecklist(): boolean
		{
			return this.task.containsChecklist;
		},
	},
	async created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});

		if (this.containsChecklist)
		{
			void this.loadData();
		}
	},
	methods: {
		async loadData(): Promise<void>
		{
			await checkListService.load(this.taskId);
		},
	},
	template: `
		<div
			:data-task-field-id="checkListMeta.id"
			class="tasks-check-list-list"
			:class="{ '--default': isLoading }"
		>
			<div
				class="tasks-check-list-list-content"
				:class="{ '--default': isLoading }"
			>
				<template v-if="isLoading">
					<div class="tasks-check-list-list-content-row">
						<BIcon :name="Animated.LOADER_WAIT"/>
						<div class="tasks-check-list-list-content-text">
							{{ loc('TASKS_V2_CHECK_LIST_LOADING') }}
						</div>
					</div>
				</template>
				<template v-else>
					<slot></slot>
					<div class="tasks-check-list-list-content-row --footer">
						<div
							class="tasks-check-list-list-content-btn"
							@click="$emit('addFastCheckList')"
						>
							<BIcon :name="Outline.PLUS_L"/>
							<div class="tasks-check-list-list-content-btn-text">
								{{ loc('TASKS_V2_CHECK_LIST_ADD_LABEL') }}
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>
	`,
};
