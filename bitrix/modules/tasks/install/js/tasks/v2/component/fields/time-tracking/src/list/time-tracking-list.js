import { Text } from 'main.core';

import { Model } from 'tasks.v2.const';
import { timeTrackingService } from 'tasks.v2.provider.service.time-tracking-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TimeTrackingListEmpty } from './time-tracking-list-empty';
import { TimeTrackingListHeader } from './time-tracking-list-header';
import { TimeTrackingListItem } from './time-tracking-list-item';
import { TimeTrackingListItemSkeleton } from './time-tracking-list-item-skeleton';

import './time-tracking-list.css';

// @vue/component
export const TimeTrackingList = {
	name: 'TasksTimeTrackingList',
	components: {
		TimeTrackingListEmpty,
		TimeTrackingListHeader,
		TimeTrackingListItem,
		TimeTrackingListItemSkeleton,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		numbers: {
			type: Number,
			required: true,
		},
		loading: {
			type: Boolean,
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			io: null,
			pageLoading: false,
			adding: false,
			editingElapsedId: null,
		};
	},
	computed: {
		elapsedIds(): number[]
		{
			return this.$store.getters[`${Model.ElapsedTimes}/getIds`](this.taskId);
		},
		addBtnDisabled(): boolean
		{
			return (
				this.loading
				|| this.adding
				|| Boolean(this.editingElapsedId)
				|| !this.task.rights.elapsedTime
			);
		},
	},
	mounted(): void
	{
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill
		this.io = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && this.numbers > 19)
				{
					void timeTrackingService.list(this.taskId);
					this.pageLoading = timeTrackingService.isLoading(this.taskId);
				}
			});
		}, { root: null, rootMargin: '0px', threshold: 0.1 });

		if (this.$refs && this.$refs.sentinel)
		{
			this.io.observe(this.$refs.sentinel);
		}
	},
	beforeUnmount()
	{
		if (this.io)
		{
			this.io.disconnect();
			this.io = null;
		}
	},
	methods: {
		handleAdd(): void
		{
			this.adding = true;

			this.cancelEditing();
		},
		handleEdit(elapsedId: number): void
		{
			this.adding = false;

			this.editingElapsedId = elapsedId;
		},
		generateNewId(): string
		{
			return Text.getRandom();
		},
		cancelAdding(): void
		{
			this.adding = false;

			this.cancelEditing();
		},
		cancelEditing(): void
		{
			this.editingElapsedId = null;
		},
	},
	template: `
		<div class="tasks-time-tracking-list">
			<div class="tasks-time-tracking-list-header">
				<TimeTrackingListHeader :empty="numbers === 0" :addBtnDisabled @add="handleAdd"/>
			</div>
			<div class="tasks-time-tracking-list-content">
				<template v-if="numbers === 0 && !adding">
					<TimeTrackingListEmpty @add="handleAdd"/>
				</template>
				<template v-if="loading">
					<TimeTrackingListItemSkeleton v-for="index in numbers" :key="index"/>
				</template>
				<template v-if="adding">
					<TimeTrackingListItem
						:elapsedId="generateNewId()"
						editMode
						@save="cancelAdding"
						@edit="handleEdit"
						@cancel="cancelAdding"
					/>
				</template>
				<template v-if="!loading" v-for="elapsedId in elapsedIds" :key="elapsedId">
					<TimeTrackingListItem
						:elapsedId
						:editMode="editingElapsedId === elapsedId"
						@edit="handleEdit"
						@cancel="cancelEditing"
						@save="cancelEditing"
					/>
				</template>
				<TimeTrackingListItemSkeleton v-if="pageLoading"/>
				<div v-show="!loading && numbers > 19" ref="sentinel" style="height: 1px; width: 100%"/>
			</div>
		</div>
	`,
};
