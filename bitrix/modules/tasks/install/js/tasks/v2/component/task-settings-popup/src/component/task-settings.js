import { DurationFormat } from 'main.date';

import { mapGetters } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskSetting } from './setting/task-setting';
import { TaskDeadlineDefaultSetting } from './setting/task-deadline-default-setting';
import { TaskDeadlineSettings } from './setting/task-deadline-settings';

import './task-settings.css';

// @vue/component
export const TaskSettings = {
	name: 'TasksTaskSettings',
	components: {
		TaskSetting,
		TaskDeadlineDefaultSetting,
		TaskDeadlineSettings,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	emits: [
		'updateFlags',
		'updateDeadlineUserOption',
		'freeze',
		'unfreeze',
	],
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			localFlags: {
				needsControl: false,
				matchesWorkTime: false,
			},
			localDeadlineUserOption: {
				defaultDeadlineInSeconds: 0,
				canChangeDeadline: false,
				maxDeadlineChangeDate: null,
				maxDeadlineChanges: null,
			},
			localAutocompleteSubTasks: false,
		};
	},
	computed: {
		...mapGetters({
			stateFlags: `${Model.Interface}/stateFlags`,
			deadlineUserOption: `${Model.Interface}/deadlineUserOption`,
		}),
		isDefaultDeadlineActive: {
			get(): boolean
			{
				return this.localDeadlineUserOption.defaultDeadlineInSeconds > 0;
			},
			set(value: boolean): void
			{
				this.localDeadlineUserOption.defaultDeadlineInSeconds = value ? this.defaultDeadlineSeconds : 0;
				this.emitDeadlineUserOptionUpdate({
					defaultDeadlineInSeconds: this.localDeadlineUserOption.defaultDeadlineInSeconds,
				});
			},
		},
		defaultDeadlineSeconds: {
			get(): number
			{
				if (!this.localDeadlineUserOption.defaultDeadlineInSeconds)
				{
					const unitDurations = DurationFormat.getUnitDurations();

					return unitDurations.d * 5 / 1000;
				}

				return this.localDeadlineUserOption.defaultDeadlineInSeconds;
			},
			set(value: number): void
			{
				this.localDeadlineUserOption.defaultDeadlineInSeconds = value;

				this.emitDeadlineUserOptionUpdate({
					defaultDeadlineInSeconds: this.localDeadlineUserOption.defaultDeadlineInSeconds,
				});
			},
		},
		autocompleteSubTasks: {
			get(): boolean
			{
				return this.localAutocompleteSubTasks === true;
			},
			set(value: boolean): void
			{
				this.localAutocompleteSubTasks = value;

				this.emitFlagsUpdate({ autocompleteSubTasks: value });
			},
		},
		taskControl: {
			get(): boolean
			{
				return this.localFlags.needsControl === true;
			},
			set(value: boolean): void
			{
				this.localFlags.needsControl = value;
				this.emitFlagsUpdate({ needsControl: value });
			},
		},
		canChangeDeadline: {
			get(): boolean
			{
				return this.localDeadlineUserOption.canChangeDeadline === true;
			},
			set(value: boolean): void
			{
				this.localDeadlineUserOption.canChangeDeadline = value;
				if (!value)
				{
					this.localDeadlineUserOption.maxDeadlineChangeDate = null;
					this.localDeadlineUserOption.maxDeadlineChanges = null;
				}

				this.emitDeadlineUserOptionUpdate({
					allowsChangeDeadline: value,
					canChangeDeadline: value,
					maxDeadlineChangeDate: null,
					maxDeadlineChanges: null,
				});
			},
		},
		matchesWorkTime: {
			get(): boolean
			{
				return this.localFlags.matchesWorkTime === true;
			},
			set(value: boolean): void
			{
				this.localFlags.matchesWorkTime = value;
				this.emitFlagsUpdate({ matchesWorkTime: value });
			},
		},
		isMatchesWorkTimeLocked(): boolean
		{
			return !Core.getParams().restrictions.skipWeekends.available;
		},
		matchesWorkTimeFeatureId(): string
		{
			return Core.getParams().restrictions.skipWeekends.featureId;
		},
		isTaskControlLocked(): boolean
		{
			return !Core.getParams().restrictions.control.available;
		},
		taskControlFeatureId(): string
		{
			return Core.getParams().restrictions.control.featureId;
		},
		isAutocompleteSubTasksLocked(): boolean
		{
			return !Core.getParams().restrictions.relatedSubtaskDeadlines.available;
		},
		autocompleteSubTasksFeatureId(): string
		{
			return Core.getParams().restrictions.relatedSubtaskDeadlines.featureId;
		},
	},
	created(): void
	{
		this.localDeadlineUserOption.defaultDeadlineInSeconds = this.deadlineUserOption.defaultDeadlineInSeconds;

		if (this.isEdit)
		{
			this.localFlags.needsControl = this.isTaskControlLocked ? false : this.task.needsControl;
			this.localFlags.matchesWorkTime = this.isMatchesWorkTimeLocked ? false : this.task.matchesWorkTime;

			this.localDeadlineUserOption.canChangeDeadline = this.task.allowsChangeDeadline;
			this.localDeadlineUserOption.maxDeadlineChangeDate = this.task.maxDeadlineChangeDate;
			this.localDeadlineUserOption.maxDeadlineChanges = this.task.maxDeadlineChanges;
		}
		else
		{
			this.localFlags.needsControl = this.stateFlags.needsControl;
			this.localFlags.matchesWorkTime = this.stateFlags.matchesWorkTime;

			this.localDeadlineUserOption.canChangeDeadline = this.deadlineUserOption.canChangeDeadline;
			this.localDeadlineUserOption.maxDeadlineChangeDate = this.deadlineUserOption.maxDeadlineChangeDate;
			this.localDeadlineUserOption.maxDeadlineChanges = this.deadlineUserOption.maxDeadlineChanges;
		}

		this.localAutocompleteSubTasks = this.task.autocompleteSubTasks;
	},
	methods: {
		emitFlagsUpdate(updatedData: Object): void
		{
			this.$emit('updateFlags', updatedData);
		},
		emitDeadlineUserOptionUpdate(updatedData: Object): void
		{
			this.$emit('updateDeadlineUserOption', updatedData);
		},
	},
	template: `
		<div class="tasks-task-settings">
			<TaskSetting
				v-model="taskControl"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_CONTROL_LABEL')"
				:questionMarkHint="loc('TASKS_V2_TASK_SETTINGS_POPUP_CONTROL_HINT')"
				:lock="isTaskControlLocked"
				:featureId="taskControlFeatureId"
			/>
			<TaskSetting
				v-model="isDefaultDeadlineActive"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_LABEL')"
			>
				<TaskDeadlineDefaultSetting
					v-if="isDefaultDeadlineActive"
					v-model="defaultDeadlineSeconds"
					@updateDeadlineUserOption="(data) => $emit('updateDeadlineUserOption', data)"
				/>
			</TaskSetting>
			<TaskSetting
				v-model="canChangeDeadline"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINES_LABEL')"
			>
				<TaskDeadlineSettings
					v-if="canChangeDeadline"
					@updateDeadlineUserOption="(data) => $emit('updateDeadlineUserOption', data)"
					@freeze="$emit('freeze')"
					@unfreeze="$emit('unfreeze')"
				/>
			</TaskSetting>
			<TaskSetting
				v-model="matchesWorkTime"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_WORK_TIME_LABEL')"
				:questionMarkHint="loc('TASKS_V2_TASK_SETTINGS_POPUP_WORK_TIME_HINT')"
				:lock="isMatchesWorkTimeLocked"
				:featureId="matchesWorkTimeFeatureId"
			/>
			<TaskSetting
				v-model="autocompleteSubTasks"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_AUTO_COMPLETE_SUBTASKS_LABEL')"
				:lock="isAutocompleteSubTasksLocked"
				:featureId="autocompleteSubTasksFeatureId"
			/>
		</div>
	`,
};
