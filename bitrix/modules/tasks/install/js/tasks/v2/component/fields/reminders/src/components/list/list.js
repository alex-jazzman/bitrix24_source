import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';

import { ListHeader } from './list-header';
import { ListItem } from './list-item';
import { ListItemSkeleton } from './list-item-skeleton';

import './list.css';

// @vue/component
export const List = {
	name: 'TasksRemindersList',
	components: {
		ListHeader,
		ListItem,
		ListItemSkeleton,
	},
	inject: {
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
	computed: {
		remindersIds(): number[]
		{
			return this.$store.getters[`${Model.Reminders}/getIds`](this.taskId, Core.getParams().currentUser.id);
		},
	},
	template: `
		<div class="tasks-field-reminders-list">
			<div class="tasks-field-reminders-list-header">
				<ListHeader/>
			</div>
			<div class="tasks-field-reminders-list-content">
				<template v-if="loading">
					<ListItemSkeleton v-for="key in numbers" :key/>
				</template>
				<template v-else v-for="reminderId in remindersIds" :key="reminderId">
					<ListItem :reminderId :sheetBindProps/>
				</template>
			</div>
		</div>
	`,
};
