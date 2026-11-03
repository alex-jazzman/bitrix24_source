import { Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';

import { FieldList } from 'tasks.v2.component.elements.field-list';
import { FieldHoverButton } from 'tasks.v2.component.elements.field-hover-button';
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
		FieldHoverButton,
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
			Outline,
			datePlanMeta,
		};
	},
	data(): Object
	{
		return {
			isHovered: false,
		};
	},
	computed: {
		fields(): string[]
		{
			if (this.isTemplate)
			{
				if (this.isEmpty)
				{
					return [{
						title: datePlanMeta.title,
						component: DatePlanContent,
						props: {
							isSheetShown: this.isSheetShown,
						},
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

			if (this.isEmpty && (this.task.filledFields[datePlanMeta.id] || this.task.matchesSubTasksTime))
			{
				return [{
					title: datePlanMeta.title,
					component: DatePlanContent,
					props: {
						isSheetShown: this.isSheetShown,
					},
				}];
			}

			return [
				{
					title: this.loc('TASKS_V2_DATE_PLAN_FIELD_START'),
					component: DatePlanDate,
					props: {
						dateTs: this.task.startPlanTs,
					},
				},
				{
					title: this.loc('TASKS_V2_DATE_PLAN_FIELD_END'),
					component: DatePlanDate,
					props: {
						dateTs: this.task.endPlanTs,
					},
				},
			].filter(({ props: { dateTs } }) => dateTs);
		},
		isEmpty(): boolean
		{
			if (this.isTemplate)
			{
				return !this.task.startDatePlanAfter && !this.task.endDatePlanAfter;
			}

			return !this.task.startPlanTs && !this.task.endPlanTs;
		},
		readonly(): boolean
		{
			return !this.task.rights.datePlan;
		},
		dependsOnSubTasks(): boolean
		{
			return !this.isTemplate && Boolean(this.task.matchesSubTasksTime);
		},
		isEditActive(): boolean
		{
			return !this.readonly && (!this.isEmpty || this.dependsOnSubTasks);
		},
	},
	methods: {
		handleClick(event: MouseEvent): void
		{
			if (!this.readonly)
			{
				this.getOpener(event)?.focus({ preventScroll: true });
				this.setSheetShown(true);
			}
		},
		getOpener(event: MouseEvent): ?HTMLElement
		{
			if (Type.isElementNode(event.target))
			{
				const eventTrigger = event.target.closest('button, [role="button"]');
				if (eventTrigger && this.$refs.container?.contains(eventTrigger))
				{
					return eventTrigger;
				}
			}

			return this.$refs.editButton?.$el
				?? this.$refs.field?.querySelector('button, [role="button"]')
				?? null
			;
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<div
			ref="container"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<FieldHoverButton
				v-if="isEditActive"
				ref="editButton"
				:icon="Outline.EDIT_L"
				:isVisible="isHovered || isSheetShown"
				:ariaLabel="loc('TASKS_V2_DATE_PLAN_ARIA_LABEL')"
				:ariaHaspopup="'dialog'"
				:ariaExpanded="isSheetShown"
				data-testid="tasks-date-plan-edit-btn"
				@click="handleClick"
			/>
			<div
				ref="field"
				class="tasks-field-date-plan"
				data-testid="tasks-date-plan"
				:class="{ '--readonly': readonly }"
				:data-task-id="taskId"
				:data-task-field-id="datePlanMeta.id"
				:data-task-plan-start="task.startPlanTs"
				:data-task-plan-end="task.endPlanTs"
				@click="handleClick"
			>
				<FieldList :fields/>
			</div>
		</div>
		<DatePlanSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
	`,
};
