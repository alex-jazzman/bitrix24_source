import { Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel, TimerModel } from 'tasks.v2.model.tasks';
import { showLimit } from 'tasks.v2.lib.show-limit';

import { TaskTrackingPopup } from './popup/time-tracking-popup';
import { TimeTrackingSheet } from './sheet/time-tracking-sheet';
import { TimeTrackingTimer } from './timer/time-tracking-timer';
import { timeTrackingMeta } from './time-tracking-meta';

import './time-tracking.css';

// @vue/component
export const TimeTracking = {
	name: 'TasksTimeTracking',
	components: {
		BIcon,
		HoverPill,
		TextMd,
		TaskTrackingPopup,
		TimeTrackingSheet,
		TimeTrackingTimer,
	},
	inject: {
		task: {},
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
		readonly(): boolean
		{
			return this.isTemplate || !this.isEdit;
		},
		timeSpent(): number
		{
			const currentTs = Math.floor(Date.now() / 1000);
			const timerStartedTs = this.timer?.startedAtTs ?? 0;

			const timeSpent = (
				timerStartedTs === 0
					? this.task.timeSpent
					: this.task.timeSpent + currentTs - timerStartedTs
			);

			return Type.isNumber(timeSpent) ? timeSpent : 0;
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.timeTracking.available;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isLocked)
			{
				this.showLimit();

				return;
			}

			if (!this.readonly)
			{
				this.setSheetShown(true);
			}
		},
		handleClosePopup(): void
		{
			this.isPopupShown = false;

			this.highlightField();
		},
		handleTimerUpdate(currentTime: number): void
		{
			this.localTimeSpent = currentTime;
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(timeTrackingMeta.id);
		},
		popupShown(): void
		{
			if (this.isLocked)
			{
				this.showLimit();

				return;
			}

			this.isPopupShown = true;
		},
		showLimit(): void
		{
			void showLimit({
				featureId: Core.getParams().restrictions.timeTracking.featureId,
			});
		},
	},
	template: `
		<div class="tasks-task-time-tracking" :data-task-field-id="timeTrackingMeta.id">
			<HoverPill
				ref="timer"
				:withSettings="task.rights.edit"
				:readonly
				@click="handleClick"
				@settings="popupShown"
			>
				<BIcon class="tasks-task-time-tracking-icon" :name="Outline.TIMER"/>
				<TimeTrackingTimer
					:timeSpent
					:totalTime="task.estimatedTime"
					:isRunning="Boolean(timer)"
					@update="handleTimerUpdate"
				/>
			</HoverPill>
		</div>
		<TaskTrackingPopup
			v-if="isPopupShown"
			:bindElement="$refs.timer.$el"
			:timeSpent
			@close="handleClosePopup"
		/>
		<TimeTrackingSheet
			v-if="isSheetShown"
			:sheetBindProps
			:timeSpent
			:isTimerRunning="Boolean(timer)"
			@close="setSheetShown(false)"
		/>
	`,
};
