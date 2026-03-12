import { Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel, TimerModel } from 'tasks.v2.model.tasks';
import { showLimit } from 'tasks.v2.lib.show-limit';

import { TaskTrackingPopup } from './popup/time-tracking-popup';
import { TimeTrackingSheet } from './sheet/time-tracking-sheet';
import { timeTrackingMeta } from './time-tracking-meta';

// @vue/component
export const TimeTrackingChip = {
	components: {
		Chip,
		TaskTrackingPopup,
		TimeTrackingSheet,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
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
			timeTrackingMeta,
		};
	},
	data(): Object
	{
		return {
			isPopupShown: false,
			localTimeSpent: 0,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		timer(): ?TimerModel
		{
			return this.task.timers?.find((timer: TimerModel) => timer.userId === this.currentUserId);
		},
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.allowsTimeTracking || this.task.numberOfElapsedTimes;
		},
		readonly(): boolean
		{
			return this.isTemplate || !this.isEdit;
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.timeElapsed.available;
		},
		isTimeTrackingLocked(): boolean
		{
			return !Core.getParams().restrictions.timeTracking.available;
		},
	},
	created(): void
	{
		const currentTs = Math.floor(Date.now() / 1000);
		const timerStartedTs = this.timer?.startedAtTs ?? 0;

		const localTimeSpent = (
			timerStartedTs === 0
				? this.task.timeSpent
				: this.task.timeSpent + currentTs - timerStartedTs
		);

		this.localTimeSpent = Type.isNumber(localTimeSpent) ? localTimeSpent : 0;
	},
	methods: {
		handleClick(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.timeElapsed.featureId,
				});

				return;
			}

			if (this.canOnlyAddFirstElapsedTime())
			{
				this.setSheetShown(true);

				return;
			}

			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			if (this.isTimeTrackingLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.timeTracking.featureId,
				});

				return;
			}

			this.isPopupShown = true;
		},
		handleClosePopup(): void
		{
			this.isPopupShown = false;

			this.highlightField();
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(timeTrackingMeta.id);
		},
		canOnlyAddFirstElapsedTime(): boolean
		{
			return (
				(!this.task.rights.edit || this.isTimeTrackingLocked)
				&& this.task.rights.elapsedTime
				&& !this.task.numberOfElapsedTimes
				&& !this.readonly
			);
		},
	},
	template: `
		<Chip
			v-if="isSelected || task.rights.elapsedTime"
			ref="chip"
			:design
			:icon="Outline.TIMER"
			:text="loc('TASKS_V2_TIME_TRACKING_CHIP_TITLE')"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="timeTrackingMeta.id"
			@click="handleClick"
		/>
		<TaskTrackingPopup
			v-if="isPopupShown"
			:bindElement="$refs.chip.$el"
			:timeSpent="localTimeSpent"
			@close="handleClosePopup"
		/>
		<TimeTrackingSheet
			v-if="isSheetShown"
			:sheetBindProps
			:timeSpent="localTimeSpent"
			:isTimerRunning="Boolean(timer)"
			@close="setSheetShown(false)"
		/>
	`,
};
