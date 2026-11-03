import { Type } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { mapGetters } from 'ui.vue3.vuex';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import { calendar } from 'tasks.v2.lib.calendar';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { stateService } from 'tasks.v2.provider.service.state-service';
import type { DeadlineUserOption } from 'tasks.v2.model.interface';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskSettings } from './component/task-settings';

import './task-settings-popup.css';

const normalizeDeadlineUserOption = (
	pendingDeadlineUserOption: Partial<DeadlineUserOption>,
): Partial<DeadlineUserOption> => {
	return pendingDeadlineUserOption.defaultDeadlineInSeconds === 0
		? { ...pendingDeadlineUserOption, defaultDeadlineDate: '' }
		: pendingDeadlineUserOption
	;
};

const mergeSavedDeadlineUserOption = (
	pendingDeadlineUserOption: Partial<DeadlineUserOption>,
	savedState: any,
): Partial<DeadlineUserOption> => {
	const savedDeadlineUserOption = savedState?.deadlineUserOption ?? savedState;
	if (
		Type.isPlainObject(savedDeadlineUserOption)
		&& savedDeadlineUserOption.defaultDeadlineDate !== undefined
	)
	{
		return {
			...pendingDeadlineUserOption,
			defaultDeadlineDate: savedDeadlineUserOption.defaultDeadlineDate,
		};
	}

	return pendingDeadlineUserOption;
};

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
		isTemplate: {},
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
			templateStateFlags: `${Model.Interface}/templateStateFlags`,
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

			try
			{
				const isMaxDeadlineChangesChanged = (
					this.pendingDeadlineUserOption.maxDeadlineChanges
					&& this.task.maxDeadlineChanges !== this.pendingDeadlineUserOption.maxDeadlineChanges
				);

				if (this.isEdit)
				{
					if (!Type.isNil(this.pendingDeadlineUserOption.defaultDeadlineInSeconds))
					{
						let pendingDeadlineUserOption = normalizeDeadlineUserOption(
							{ defaultDeadlineInSeconds: this.pendingDeadlineUserOption.defaultDeadlineInSeconds },
						);
						const nextDeadlineUserOption = {
							...this.deadlineUserOption,
							...pendingDeadlineUserOption,
						};

						if (!this.isTemplate)
						{
							const savedState = await stateService.set({
								defaultDeadline: nextDeadlineUserOption,
							});

							pendingDeadlineUserOption = mergeSavedDeadlineUserOption(
								pendingDeadlineUserOption,
								savedState,
							);
						}

						await this.$store.dispatch(
							`${Model.Interface}/updateDeadlineUserOption`,
							pendingDeadlineUserOption,
						);
					}
				}
				else if (this.isTemplate)
				{
					const nextTemplateStateFlags = {
						...this.templateStateFlags,
						...this.pendingFlagsData,
					};

					await stateService.setTemplateFlags(nextTemplateStateFlags);
					await this.$store.dispatch(
						`${Model.Interface}/updateTemplateStateFlags`,
						this.pendingFlagsData,
					);
				}
				else
				{
					const nextStateFlags = {
						...this.stateFlags,
						...this.pendingFlagsData,
					};
					const pendingDeadlineUserOption = normalizeDeadlineUserOption(
						this.pendingDeadlineUserOption,
					);
					const nextDeadlineUserOption = {
						...this.deadlineUserOption,
						...pendingDeadlineUserOption,
					};

					const savedState = await stateService.set({
						needsControl: nextStateFlags.needsControl,
						matchesWorkTime: nextStateFlags.matchesWorkTime,
						defaultRequireResult: nextStateFlags.defaultRequireResult,
						defaultDeadline: nextDeadlineUserOption,
						allowsTimeTracking: nextStateFlags.allowsTimeTracking,
					});
					const nextPendingDeadlineUserOption = mergeSavedDeadlineUserOption(
						pendingDeadlineUserOption,
						savedState,
					);
					await this.$store.dispatch(
						`${Model.Interface}/updateStateFlags`,
						this.pendingFlagsData,
					);
					await this.$store.dispatch(
						`${Model.Interface}/updateDeadlineUserOption`,
						nextPendingDeadlineUserOption,
					);
				}

				const updateFields = {
					...this.pendingFlagsData,
					...this.pendingDeadlineUserOption,
				};

				const isMatchesWorkTimeChanged = (
					!Type.isNil(this.pendingFlagsData.matchesWorkTime)
					&& this.task.matchesWorkTime !== this.pendingFlagsData.matchesWorkTime
				);

				if (
					this.isTemplate
					&& this.task.deadlineAfter
					&& isMatchesWorkTimeChanged
				)
				{
					updateFields.deadlineAfter = calendar.recalculateDurationByMatchWorkTime(
						this.task.deadlineAfter,
						this.task.matchesWorkTime,
						this.pendingFlagsData.matchesWorkTime,
					);
				}

				const updatePromise = taskService.update(this.taskId, updateFields);
				this.$emit('close');
				await updatePromise;

				if (this.isEdit && isMaxDeadlineChangesChanged)
				{
					void deadlineService.cleanChangeLog(this.task.id);
				}
			}
			finally
			{
				this.saving = false;
			}
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
					<QuestionMark v-if="!isTemplate" :hintText="loc('TASKS_V2_TASK_SETTINGS_POPUP_TITLE_HINT')"/>
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
