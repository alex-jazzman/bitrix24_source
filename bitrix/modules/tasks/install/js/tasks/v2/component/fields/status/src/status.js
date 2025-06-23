import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { Model, TaskStatus } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { StatusPopup } from './status-popup/status-popup';
import { statusMeta } from './status-meta';
import './status.css';

// @vue/component
export const Status = {
	components: {
		BIcon,
		StatusPopup,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(): Object
	{
		return {
			statusMeta,
		};
	},
	data(): Object
	{
		return {
			nowTs: Date.now(),
			isPopupShown: false,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		isExpired(): number
		{
			return this.task.deadlineTs && this.nowTs > this.task.deadlineTs;
		},
		icon(): string
		{
			const statuses = {
				[TaskStatus.Pending]: Outline.HOURGLASS,
				[TaskStatus.InProgress]: Outline.NEXT,
				[TaskStatus.SupposedlyCompleted]: Outline.REFRESH,
				[TaskStatus.Completed]: Outline.SENDED,
				[TaskStatus.Deferred]: Outline.PAUSE_L,
			};

			return statuses[this.task.status] ?? Outline.HOURGLASS;
		},
		statusFormatted(): string
		{
			const statuses = {
				[TaskStatus.Pending]: this.loc('TASKS_V2_STATUS_PENDING'),
				[TaskStatus.InProgress]: this.loc('TASKS_V2_STATUS_IN_PROGRESS'),
				[TaskStatus.SupposedlyCompleted]: this.loc('TASKS_V2_STATUS_SUPPOSEDLY_COMPLETED'),
				[TaskStatus.Completed]: this.loc('TASKS_V2_STATUS_COMPLETED'),
				[TaskStatus.Deferred]: this.loc('TASKS_V2_STATUS_DEFERRED'),
			};

			return statuses[this.task.status] ?? this.loc('TASKS_V2_STATUS_PENDING');
		},
	},
	mounted(): void
	{
		this.nowTsInterval = setInterval(() => {
			this.nowTs = Date.now();
		}, 1000);
	},
	beforeUnmount(): void
	{
		clearInterval(this.nowTsInterval);
	},
	methods: {
		handleClick(): void
		{
			this.clearTimeouts();
			if (this.isPopupShown)
			{
				this.closePopup();
			}
			else
			{
				this.showPopup();
			}
		},
		handleMouseEnter(): void
		{
			this.clearTimeouts();
			this.showTimeout = setTimeout(() => this.showPopup(), 100);
		},
		handleMouseLeave(): void
		{
			this.clearTimeouts();
			this.closePopup();
		},
		showPopup(): void
		{
			this.clearTimeouts();
			this.isPopupShown = true;
		},
		closePopup(): void
		{
			this.clearTimeouts();
			this.isPopupShown = false;
		},
		clearTimeouts(): void
		{
			clearTimeout(this.showTimeout);
		},
	},
	template: `
		<div
			class="tasks-field-status"
			:data-task-id="taskId"
			:data-task-field-id="statusMeta.id"
			:data-task-field-value="task.status"
			:data-task-created-ts="task.createdTs"
			:data-task-status-changes-ts="task.statusChangedTs"
			ref="container"
			@click="handleClick"
			@mouseenter="handleMouseEnter"
			@mouseleave="handleMouseLeave"
		>
			<BIcon class="tasks-field-status-icon" :name="icon"/>
			<div class="tasks-field-status-text">{{ statusFormatted }}</div>
		</div>
		<StatusPopup
			v-if="isPopupShown"
			:taskId="taskId"
			:bindElement="$refs.container"
			@close="closePopup"
		/>
	`,
};
