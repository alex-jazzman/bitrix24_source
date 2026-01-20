import { Type } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { mapGetters } from 'ui.vue3.vuex';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { stateService } from 'tasks.v2.provider.service.state-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskSettings } from './component/task-settings';

import './task-settings-popup.css';

// @vue/component
export const TaskSettingsPopup = {
	name: 'TaskSettingsPopup',
	components: {
		BIcon,
		UiButton,
		QuestionMark,
		Popup,
		TaskSettings,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		bindElement: {
			type: HTMLElement,
			default: null,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	data(): Object
	{
		return {
			pendingFlagsData: {},
			pendingDeadlineUserOption: {},
			saving: false,
		};
	},
	computed: {
		...mapGetters({
			stateFlags: `${Model.Interface}/stateFlags`,
			deadlineUserOption: `${Model.Interface}/deadlineUserOption`,
		}),
		options(): PopupOptions
		{
			return {
				id: `tasks-settings-popup-${this.taskId}`,
				className: 'tasks-task-settings-popup',
				bindElement: this.bindElement,
				width: 530,
				targetContainer: document.body,
			};
		},
	},
	methods: {
		handleClose(): void
		{
			this.$emit('close');
		},
		async handleSave(): void
		{
			this.saving = true;

			const isMaxDeadlineChangesChanged = (
				this.pendingDeadlineUserOption.maxDeadlineChanges
				&& this.task.maxDeadlineChanges !== this.pendingDeadlineUserOption.maxDeadlineChanges
			);
			if (this.isEdit && isMaxDeadlineChangesChanged)
			{
				void deadlineService.cleanChangeLog(this.task.id);
			}

			if (this.isEdit)
			{
				if (!Type.isNil(this.pendingDeadlineUserOption.defaultDeadlineInSeconds))
				{
					await this.$store.dispatch(
						`${Model.Interface}/updateDeadlineUserOption`,
						{ defaultDeadlineInSeconds: this.pendingDeadlineUserOption.defaultDeadlineInSeconds },
					);

					void stateService.set({
						defaultDeadline: this.deadlineUserOption,
					});
				}
			}
			else
			{
				await this.$store.dispatch(
					`${Model.Interface}/updateStateFlags`,
					this.pendingFlagsData,
				);
				await this.$store.dispatch(
					`${Model.Interface}/updateDeadlineUserOption`,
					this.pendingDeadlineUserOption,
				);

				void stateService.set({
					needsControl: this.stateFlags.needsControl,
					matchesWorkTime: this.stateFlags.matchesWorkTime,
					defaultRequireResult: this.stateFlags.defaultRequireResult,
					defaultDeadline: this.deadlineUserOption,
				});
			}

			await taskService.update(this.taskId, {
				...this.pendingFlagsData,
				...this.pendingDeadlineUserOption,
			});

			this.$emit('close');

			this.saving = false;
		},
		handleFlagsUpdate(updatedData: Object): void
		{
			this.pendingFlagsData = {
				...this.pendingFlagsData,
				...updatedData,
			};
		},
		handleDeadlineUserOptionUpdate(updatedData: Object): void
		{
			this.pendingDeadlineUserOption = {
				...this.pendingDeadlineUserOption,
				...updatedData,
			};
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
			<div class="tasks-task-settings-popup-header">
				<div class="tasks-task-settings-popup-title-container">
					<div class="tasks-task-settings-popup-title">
						{{ loc('TASKS_V2_TASK_SETTINGS_POPUP_TITLE') }}
					</div>
					<QuestionMark :hintText="loc('TASKS_V2_TASK_SETTINGS_POPUP_TITLE_HINT')"/>
				</div>
				<BIcon
					:name="Outline.CROSS_L"
					hoverable
					class="tasks-task-settings-popup-close-icon"
					@click="handleClose"
				/>
			</div>
			<div class="tasks-task-settings-popup-content">
				<TaskSettings
					@updateFlags="handleFlagsUpdate"
					@updateDeadlineUserOption="handleDeadlineUserOptionUpdate"
					@freeze="freeze"
					@unfreeze="unfreeze"
				/>
			</div>
			<div class="tasks-task-settings-popup-footer">
				<UiButton
					:text="loc('TASKS_V2_TASK_SETTINGS_POPUP_BTN_CANCEL')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:dataset="{
						taskSettingsButtonId: 'cancel',
					}"
					@click="handleClose"
				/>
				<UiButton
					:text="loc('TASKS_V2_TASK_SETTINGS_POPUP_BTN_SAVE')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:dataset="{
						taskSettingsButtonId: 'save',
					}"
					:loading="saving"
					@click="handleSave"
				/>
			</div>
		</Popup>
	`,
};
