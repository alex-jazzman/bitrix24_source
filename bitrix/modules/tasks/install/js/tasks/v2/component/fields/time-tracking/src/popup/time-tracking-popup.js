import { Type } from 'main.core';
import type { PopupOptions } from 'main.popup';
import { EventName, Model } from 'tasks.v2.const';

import { mapGetters } from 'ui.vue3.vuex';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextMd, TextSm, TextXs, Text2Xl } from 'ui.system.typography.vue';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { Switcher } from 'ui.vue3.components.switcher';
import 'ui.icon-set.outline';
import { Popup } from 'ui.vue3.components.popup';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { taskService } from 'tasks.v2.provider.service.task-service';
import { statusService } from 'tasks.v2.provider.service.status-service';
import type { TaskModel, TimerModel } from 'tasks.v2.model.tasks';

import './time-tracking-popup.css';

// @vue/component
export const TaskTrackingPopup = {
	name: 'TasksTaskTrackingPopup',
	components: {
		BIcon,
		BInput,
		Popup,
		Switcher,
		TextMd,
		TextSm,
		TextXs,
		Text2Xl,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		bindElement: {
			type: HTMLElement,
			default: null,
		},
		timeSpent: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			InputDesign,
			Outline,
		};
	},
	data(): Object
	{
		return {
			localAllowsTimeTracking: true,
			localEstimatedTime: 0,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		options(): PopupOptions
		{
			return {
				id: `tasks-time-tracking-popup-${this.taskId}`,
				className: 'tasks-time-tracking-popup',
				bindElement: this.bindElement,
				width: 540,
				targetContainer: document.body,
			};
		},
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.small,
				useAirDesign: true,
			};
		},
		timer(): ?TimerModel
		{
			return this.task.timers?.find((timer: TimerModel) => timer.userId === this.currentUserId);
		},
		hours: {
			get(): string
			{
				const hour = Math.floor(this.localEstimatedTime / 3600);

				if (hour === 0)
				{
					return '';
				}

				return String(hour) || '';
			},
			set(value: number): void
			{
				let hours = value === '' ? 0 : parseInt(value, 10);
				if (!Type.isNumber(hours))
				{
					return;
				}

				hours = Math.abs(hours);

				const minutes = this.minutes;
				this.localEstimatedTime = (hours * 3600) + (minutes * 60);

				this.save();
			},
		},
		minutes: {
			get(): string
			{
				const minutes = Math.floor((this.localEstimatedTime % 3600) / 60);

				if (minutes === 0)
				{
					return '';
				}

				return String(minutes) || '';
			},
			set(value: number): void
			{
				let minutes = value === '' ? 0 : parseInt(value, 10);
				if (!Type.isNumber(minutes))
				{
					return;
				}

				minutes = Math.abs(minutes);

				const hours = this.hours;
				this.localEstimatedTime = (hours * 3600) + (minutes * 60);

				this.save();
			},
		},
	},
	created(): void
	{
		this.localEstimatedTime = this.task.estimatedTime ?? 0;

		this.save();
	},
	methods: {
		handleClose(): void
		{
			this.save();

			this.$emit('close');
		},
		toggleAllows(): void
		{
			if (!this.task.rights.edit)
			{
				return;
			}

			const localAllowsTimeTracking = !this.localAllowsTimeTracking;

			if (
				this.task.allowsTimeTracking === true
				&& this.timeSpent
				&& localAllowsTimeTracking === false
			)
			{
				this.freeze();

				const messageBox = MessageBox.create({
					message: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_TEXT'),
					title: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_TITLE'),
					okCaption: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_OK'),
					cancelCaption: this.loc('TASKS_V2_TIME_TRACKING_CONFIRM_POPUP_CANCEL'),
					useAirDesign: true,
					popupOptions: {
						height: 186,
						closeIcon: false,
					},
					onOk: () => {
						this.localAllowsTimeTracking = localAllowsTimeTracking;
						messageBox.close();
						this.unfreeze();
						this.handleClose();
					},
					onCancel: () => {
						messageBox.close();
						this.unfreeze();
						this.handleClose();
					},
					buttons: MessageBoxButtons.OK_CANCEL,
				});
				messageBox.show();

				return;
			}

			this.localAllowsTimeTracking = localAllowsTimeTracking;
		},
		save(): void
		{
			if (this.task.allowsTimeTracking !== this.localAllowsTimeTracking)
			{
				this.$bitrix.eventEmitter.emit(EventName.TimeTrackingChange);
			}

			void taskService.update(this.taskId, {
				allowsTimeTracking: this.localAllowsTimeTracking,
				estimatedTime: this.localEstimatedTime,
			});

			if (!this.localAllowsTimeTracking && this.timer)
			{
				void statusService.pauseTimer(this.taskId);
			}
		},
		openHelpDesk(): void
		{
			top.BX.Helper.show('redirect=detail&code=27145920');
		},
		freeze(): void
		{
			this.$refs.popup?.freeze();
		},
		unfreeze(): void
		{
			this.$refs.popup?.unfreeze();
		},
	},
	template: `
		<Popup ref="popup" :options @close="handleClose">
			<div
				class="tasks-time-tracking-popup-header"
				:class="{'--disable': !localAllowsTimeTracking}"
			>
				<div class="tasks-time-tracking-popup-content">
					<div class="tasks-time-tracking-popup-content-info">
						<div class="tasks-time-tracking-popup-content-switcher">
							<Switcher
								:isChecked="localAllowsTimeTracking"
								:options="switcherOptions"
								@click="toggleAllows"
							/>
							<Text2Xl
								class="tasks-task-setting-switcher-label"
								@click="toggleAllows"
							>{{ loc('TASKS_V2_TIME_TRACKING_POPUP_LABEL') }}</Text2Xl>
						</div>
						<TextMd class="tasks-time-tracking-popup-content-text">
							{{ loc('TASKS_V2_TIME_TRACKING_POPUP_TEXT') }}
						</TextMd>
						<div class="tasks-time-tracking-popup-content-more" @click="openHelpDesk">
							<BIcon
								:name="Outline.KNOWLEDGE_BASE"
								class="tasks-time-tracking-popup-content-more-icon"
							/>
							<TextSm class="tasks-time-tracking-popup-content-more-text">
								{{ loc('TASKS_V2_TIME_TRACKING_POPUP_MORE') }}
							</TextSm>
						</div>
					</div>
					<div class="tasks-time-tracking-popup-content-icon"/>
				</div>
			</div>
			<div v-if="localAllowsTimeTracking" class="tasks-time-tracking-popup-form">
				<TextMd class="tasks-time-tracking-popup-form-title">
					{{ loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_TITLE') }}
				</TextMd>
				<TextXs class="tasks-time-tracking-popup-form-label">
					{{ loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_LABEL') }}
				</TextXs>
				<div class="tasks-time-tracking-popup-form-fields">
					<BInput
						v-model="hours"
						class="tasks-time-tracking-popup-form-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_HOUR')"
						labelInline
					/>
					<BInput
						v-model="minutes"
						class="tasks-time-tracking-popup-form-field"
						:design="InputDesign.LightGrey"
						:label="loc('TASKS_V2_TIME_TRACKING_POPUP_FORM_MINUTES')"
						labelInline
					/>
				</div>
			</div>
		</Popup>
	`,
};
