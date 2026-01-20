import { FieldList } from 'tasks.v2.component.elements.field-list';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { datePlanMeta } from './date-plan-meta';
import { DatePlanDate } from './components/date-plan-date';
import { DatePlanDuration } from './components/date-plan-duration';
import { DatePlanContent } from './components/date-plan-content';
import { DatePlanSheet } from './date-plan-sheet';
import './date-plan.css';

// @vue/component
export const DatePlan = {
	components: {
		FieldList,
		DatePlanSheet,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:isSheetShown'],
	setup(): { task: TaskModel }
	{
		return {
			datePlanMeta,
		};
	},
	computed: {
		fields(): string[]
		{
			if (this.isTemplate)
			{
				const isEmpty = !this.task.startDatePlanAfter && !this.task.endDatePlanAfter;
				if (isEmpty)
				{
					return [{
						title: datePlanMeta.title,
						component: DatePlanContent,
					}];
				}

				return [
					{
						title: this.loc('TASKS_V2_DATE_PLAN_START_AFTER'),
						component: DatePlanDuration,
						props: {
							dateTs: this.task.startDatePlanAfter,
							matchWorkTime: this.task.matchesWorkTime,
							readonly: this.readonly,
						},
					},
					{
						title: this.loc('TASKS_V2_DATE_PLAN_DURATION'),
						component: DatePlanDuration,
						props: {
							dateTs: this.task.endDatePlanAfter - this.task.startDatePlanAfter,
							matchWorkTime: this.task.matchesWorkTime,
							readonly: this.readonly,
						},
					},
				].filter(({ props: { dateTs } }) => dateTs);
			}

			const isEmpty = !this.task.startPlanTs && !this.task.endPlanTs;
			if (isEmpty && (this.task.filledFields[datePlanMeta.id] || this.task.matchesSubTasksTime))
			{
				return [{
					title: datePlanMeta.title,
					component: DatePlanContent,
				}];
			}

			return [
				{
					title: this.loc('TASKS_V2_DATE_PLAN_FIELD_START'),
					component: DatePlanDate,
					props: {
						dateTs: this.task.startPlanTs,
						readonly: this.readonly,
					},
				},
				{
					title: this.loc('TASKS_V2_DATE_PLAN_FIELD_END'),
					component: DatePlanDate,
					props: {
						dateTs: this.task.endPlanTs,
						readonly: this.readonly,
					},
				},
			].filter(({ props: { dateTs } }) => dateTs);
		},
		readonly(): boolean
		{
			return !this.task.rights.datePlan;
		},
	},
	methods: {
		handleClick(): void
		{
			if (!this.readonly)
			{
				this.setSheetShown(true);
			}
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<div
			class="tasks-field-date-plan"
			:class="{ '--readonly': readonly }"
			:data-task-id="taskId"
			:data-task-field-id="datePlanMeta.id"
			:data-task-plan-start="task.startPlanTs"
			:data-task-plan-end="task.endPlanTs"
			@click="handleClick"
		>
			<FieldList :fields/>
		</div>
		<DatePlanSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
	`,
};
