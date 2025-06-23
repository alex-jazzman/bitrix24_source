import { DateTimeFormat, DurationFormat } from 'main.date';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { timezone } from 'tasks.v2.lib.timezone';
import { heightTransition } from 'tasks.v2.lib.height-transition';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { DeadlinePopup } from './deadline-popup/deadline-popup';
import { deadlineMeta } from './deadline-meta';
import './deadline.css';

// @vue/component
export const Deadline = {
	components: {
		BIcon,
		DeadlinePopup,
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
			deadlineMeta,
			Outline,
		};
	},
	data(): Object
	{
		return {
			nowTs: Date.now(),
			isPopupShown: false,
			selectingDeadlineTs: null,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		deadlineTs(): number
		{
			return this.selectingDeadlineTs ?? this.task.deadlineTs;
		},
		expiredDuration(): number
		{
			if (!this.deadlineTs)
			{
				return 0;
			}

			return this.nowTs - this.deadlineTs;
		},
		isExpired(): boolean
		{
			return this.expiredDuration > 0 && !this.isFlowFilledOnAdd;
		},
		expiredFormatted(): string
		{
			return this.loc('TASKS_V2_DEADLINE_EXPIRED', {
				'#EXPIRED_DURATION#': new DurationFormat(this.expiredDuration).formatClosest(),
			});
		},
		deadlineFormatted(): string
		{
			if (this.isFlowFilledOnAdd)
			{
				return this.loc('TASKS_V2_DEADLINE_AUTO');
			}

			if (!this.deadlineTs)
			{
				return this.loc('TASKS_V2_DEADLINE_EMPTY');
			}

			const isThisYear = new Date(this.deadlineTs).getFullYear() === new Date().getFullYear();
			const dateFormat = DateTimeFormat.getFormat(isThisYear ? 'DAY_MONTH_FORMAT' : 'LONG_DATE_FORMAT');
			const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const offset = timezone.getOffset(this.deadlineTs);

			return DateTimeFormat.format(`${dateFormat} ${timeFormat}`, (this.deadlineTs + offset) / 1000);
		},
		iconName(): string
		{
			if (this.isFlowFilledOnAdd)
			{
				return Outline.BOTTLENECK;
			}

			return Outline.CALENDAR_WITH_SLOTS;
		},
		isEdit(): boolean
		{
			return Number.isInteger(this.taskId) && this.taskId > 0;
		},
		isFlowFilledOnAdd(): boolean
		{
			return this.task.flowId > 0 && !this.isEdit;
		},
		readonly(): boolean
		{
			return !this.task.rights.deadline || this.isFlowFilledOnAdd;
		},
	},
	mounted(): void
	{
		heightTransition.animate(this.$refs.container);
		this.nowTsInterval = setInterval(() => {
			this.nowTs = Date.now();
		}, 1000);
	},
	updated(): void
	{
		heightTransition.animate(this.$refs.container);
	},
	beforeUnmount(): void
	{
		clearInterval(this.nowTsInterval);
	},
	methods: {
		handleClick(): void
		{
			if (this.readonly)
			{
				return;
			}

			this.isPopupShown = true;
		},
		handleCrossClick(event: MouseEvent): void
		{
			event.stopPropagation();

			this.$refs.popup?.clear();

			void taskService.update(
				this.taskId,
				{
					deadlineTs: 0,
				},
			);
		},
		handleUpdate(selectingDeadlineTs: number): void
		{
			this.selectingDeadlineTs = selectingDeadlineTs;
		},
		handleClose(): void
		{
			this.isPopupShown = false;
			this.selectingDeadlineTs = null;
			this.$refs.deadline?.focus();
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey))
			{
				void this.handleClick();
			}
		},
	},
	template: `
		<div
			class="tasks-field-deadline"
			:class="{ '--expired': isExpired }"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			ref="container"
		>
			<div
				class="tasks-field-deadline-main"
				:class="{ '--readonly': readonly }"
				ref="deadline"
				tabindex="0"
				@click="handleClick"
				@keydown="handleKeydown"
			>
				<BIcon class="tasks-field-deadline-icon" :name="iconName"/>
				<div class="tasks-field-deadline-text">{{ deadlineFormatted }}</div>
				<BIcon
					v-if="deadlineTs && !readonly"
					class="tasks-field-deadline-cross"
					:name="Outline.CROSS_L"
					@click.capture="handleCrossClick"
				/>
			</div>
			<div v-if="isExpired" class="tasks-field-deadline-expired">{{ expiredFormatted }}</div>
		</div>
		<DeadlinePopup
			v-if="isPopupShown"
			:taskId="taskId"
			:bindElement="$refs.deadline"
			ref="popup"
			@update="handleUpdate"
			@close="handleClose"
		/>
	`,
};
