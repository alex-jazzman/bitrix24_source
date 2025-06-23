import { Text } from 'main.core';

import { BIcon } from 'ui.icon-set.api.vue';
import { Animated, Outline } from 'ui.icon-set.api.core';

import { Model } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { CheckListMixin } from './check-list-mixin';
import { checkListMeta } from './check-list-meta';
import './check-list.css';

// @vue/component
export const CheckList = {
	name: 'TaskCheckList',
	components: {
		BIcon,
	},
	mixins: [CheckListMixin],
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
			checkListMeta,
		};
	},
	data(): Object
	{
		return {};
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
		parentCheckLists(): CheckListModel[]
		{
			return this.checkLists.filter((checkList: CheckListModel) => checkList.parentId === 0);
		},
	},
	async created(): void
	{
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
		getCompletedCount(parentId: number): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === parentId && checklist.isComplete;
			}).length;
		},
		getTotalCount(parentId: number): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.parentId === parentId;
			}).length;
		},
		showCheckList(checkListId: number): void
		{
			this.$emit('open', checkListId);
		},
		renderCheckListStatus(checkListId: number | string): Object
		{
			return this.loc('TASKS_V2_CHECK_LIST_STATUS_LABEL', {
				'#completed#': this.getCompletedCount(checkListId),
				'#total#': this.getTotalCount(checkListId),
			});
		},
	},
	template: `
		<div
			:data-task-field-id="checkListMeta.id"
			class="tasks-field-check-list"
			:class="{ '--default': isLoading }"
		>
			<div
				class="tasks-field-check-list-content"
				:class="{ '--default': isLoading }"
			>
				<template v-if="isLoading">
					<div class="tasks-field-check-list-content-row">
						<BIcon :name="Animated.LOADER_WAIT"/>
						<div class="tasks-field-check-list-content-text">
							{{ loc('TASKS_V2_CHECK_LIST_LOADING') }}
						</div>
					</div>
				</template>
				<template v-else>
					<div class="tasks-field-check-list-content-list">
						<div
							v-for="checklist in parentCheckLists"
							:key="checklist.id"
							class="tasks-field-check-list-content-list-item"
							@click="() => this.showCheckList(checklist.id)"
						>
							<div class="tasks-field-check-list-content-list-item-icon">
								<BIcon :name="Outline.CHECK_LIST"/>
							</div>
							<div class="tasks-field-check-list-content-list-item-title">
								{{ checklist.title }}
							</div>
							<div
								class="tasks-field-check-list-content-list-item-status"
								v-html="renderCheckListStatus(checklist.id)"
							>
							</div>
							<div class="tasks-field-check-list-content-list-item-arrow">
								<BIcon :name="Outline.CHEVRON_RIGHT_L"/>
							</div>
						</div>
					</div>
					<div class="tasks-field-check-list-content-row --footer">
						<div
							class="tasks-field-check-list-content-btn"
							@click="addFastCheckList"
						>
							<BIcon :name="Outline.PLUS_L"/>
							<div class="tasks-field-check-list-content-btn-text">
								{{ loc('TASKS_V2_CHECK_LIST_ADD_LABEL') }}
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>
	`,
};
