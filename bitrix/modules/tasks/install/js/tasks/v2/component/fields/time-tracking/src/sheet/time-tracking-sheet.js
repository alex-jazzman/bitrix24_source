import { BLine } from 'ui.system.skeleton.vue';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineSm } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { UserAvatarList } from 'tasks.v2.component.elements.user-avatar-list';
import { timeTrackingService } from 'tasks.v2.provider.service.time-tracking-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TimeTrackingInvoiceHint } from '../hint/time-tracking-invoice-hint';
import { TimeTrackingList } from '../list/time-tracking-list';
import { TimeTrackingParticipantsPopup } from './time-tracking-paticipants-popup';
import { TaskTrackingPopup } from '../popup/time-tracking-popup';
import { TimeTrackingTimer } from '../timer/time-tracking-timer';

import './time-tracking-sheet.css';

// @vue/component
export const TimeTrackingSheet = {
	name: 'TasksTimeTrackingSheet',
	components: {
		BIcon,
		BLine,
		BottomSheet,
		HeadlineSm,
		UiButton,
		UserAvatarList,
		TimeTrackingInvoiceHint,
		TimeTrackingList,
		TimeTrackingParticipantsPopup,
		TaskTrackingPopup,
		TimeTrackingTimer,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		sheetBindProps: {
			type: Object,
			required: true,
		},
		timeSpent: {
			type: Number,
			required: true,
		},
		isTimerRunning: {
			type: Boolean,
			required: false,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			ButtonColor,
			Outline,
		};
	},
	data(): Object
	{
		return {
			loading: true,
			isParticipantsLoading: true,
			isSettingsPopupShown: false,
			isParticipantsPopupShown: false,
			isSheetShown: false,
			isInvoiceHintShown: false,
			participants: [],
			contribution: [],
		};
	},
	computed: {
		isTimeTrackingLocked(): boolean
		{
			return !Core.getParams().restrictions.timeTracking.available;
		},
	},
	async mounted(): Promise<void>
	{
		if (this.task.numberOfElapsedTimes > 0)
		{
			void this.loadParticipants();

			await timeTrackingService.list(this.taskId, { reset: true });
		}
		else
		{
			this.isParticipantsLoading = false;
		}

		this.loading = false;
	},
	methods: {
		handleClosePopup(): void
		{
			this.isSettingsPopupShown = false;

			if (!this.task.allowsTimeTracking)
			{
				this.$emit('close');
			}
		},
		handleAvatarListClick(): void
		{
			if (this.participants.length > 1)
			{
				this.isParticipantsPopupShown = true;
			}
		},
		async loadParticipants(): Promise<void>
		{
			const [participants, contribution] = await timeTrackingService.listParticipants(this.taskId);

			this.participants = participants;
			this.contribution = contribution;

			this.isParticipantsLoading = false;
		},
	},
	template: `
		<BottomSheet
			customClass="tasks-task-time-tracking-sheet"
			:sheetBindProps
			@close="$emit('close')"
		>
			<div class="tasks-task-time-tracking-sheet-container">
				<div class="tasks-task-time-tracking-sheet-header">
					<HeadlineSm>{{ loc('TASKS_V2_TIME_TRACKING_TITLE_SHEET') }}</HeadlineSm>
					<div class="tasks-task-time-tracking-sheet-header-icons">
						<BIcon
							ref="filterIcon"
							v-if="task.rights.edit && !isTimeTrackingLocked"
							class="tasks-task-time-tracking-sheet-filter"
							:name="Outline.FILTER_2_LINES"
							hoverable
							@click="isSettingsPopupShown = true"
						/>
						<BIcon
							class="tasks-task-time-tracking-sheet-close"
							:name="Outline.CROSS_L"
							hoverable
							@click="$emit('close')"
						/>
					</div>
				</div>
				<div class="tasks-task-time-tracking-sheet-content">
					<TimeTrackingList
						:numbers="Math.min(20, task.numberOfElapsedTimes)"
						:loading
						:sheetBindProps
					/>
				</div>
				<div class="tasks-task-time-tracking-sheet-footer">
					<div class="tasks-task-time-tracking-sheet-timer">
						<div class="tasks-task-time-tracking-sheet-timer-label">
							{{ loc('TASKS_V2_TIME_TRACKING_SHEET_TIMER_LABEL') }}
						</div>
						<TimeTrackingTimer
							:timeSpent
							:totalTime="task.estimatedTime"
							:isRunning="isTimerRunning"
						/>
					</div>
					<div v-if="isParticipantsLoading">
						<BLine :width="120" :height="20"/>
					</div>
					<div
						v-else-if="task.numberOfElapsedTimes > 0"
						ref="participants"
						class="tasks-task-time-tracking-sheet-users"
					>
						<UserAvatarList
							:users="participants"
							:visibleAmount="5"
							:withPopup="false"
							@click="handleAvatarListClick"
						/>
						<TimeTrackingParticipantsPopup
							:isShown="isParticipantsPopupShown"
							:bindElement="$refs.participants"
							:users="participants"
							:contribution
							@close="isParticipantsPopupShown = false"
						/>
					</div>
					<div
						ref="invoiceBtn"
						class="tasks-task-time-tracking-sheet-invoice"
						@mouseover="isInvoiceHintShown = true"
					>
						<UiButton
							:text="loc('TASKS_V2_TIME_TRACKING_SHEET_TIMER_BTN_INVOICE')"
							:style="AirButtonStyle.OUTLINE_ACCENT_2"
							:size="ButtonSize.SMALL"
						/>
					</div>
				</div>
			</div>
			<TaskTrackingPopup
				v-if="isSettingsPopupShown"
				:bindElement="$refs.filterIcon.$el"
				:timeSpent
				@close="handleClosePopup"
			/>
			<TimeTrackingInvoiceHint
				v-if="isInvoiceHintShown"
				:bindElement="$refs.invoiceBtn"
				@close="isInvoiceHintShown = false"
			/>
		</BottomSheet>
	`,
};
