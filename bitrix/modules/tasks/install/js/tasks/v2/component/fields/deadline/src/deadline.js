import { Runtime } from 'main.core';
import { DurationFormat } from 'main.date';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Notifier } from 'ui.notification-manager';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd, Text2Xs } from 'ui.system.typography.vue';
import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EventName, TaskStatus, Endpoint, DeadlineState } from 'tasks.v2.const';
import { TaskSettingsPopup } from 'tasks.v2.component.task-settings-popup';
import { SettingsLabel } from 'tasks.v2.component.elements.settings-label';
import { Hint, tooltip } from 'tasks.v2.component.elements.hint';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { calendar } from 'tasks.v2.lib.calendar';
import { heightTransition } from 'tasks.v2.lib.height-transition';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { DeadlineDefaultView } from './deadline-default-view';
import { DeadlineChipView } from './deadline-chip-view';
import { DeadlinePopup } from './deadline-popup/deadline-popup';
import { DeadlineChangeReasonPopup } from './deadline-change-reason-popup/deadline-change-reason-popup';
import { DeadlineAfterPopup } from './deadline-after-popup/deadline-after-popup';
import { Presets } from './deadline-after-popup/deadline-after-popup-content';
import { deadlineMeta } from './deadline-meta';

import './deadline.css';

const unitDurations = DurationFormat.getUnitDurations();

// @vue/component
export const Deadline = {
	components: {
		TextMd,
		Text2Xs,
		Hint,
		HoverPill,
		BIcon,
		DeadlinePopup,
		DeadlineAfterPopup,
		DeadlineChangeReasonPopup,
		SettingsLabel,
		TaskSettingsPopup,
		DeadlineDefaultView,
		DeadlineChipView,
	},
	directives: { hint },
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isTemplate: {
			type: Boolean,
			default: false,
		},
		isAutonomous: {
			type: Boolean,
			default: false,
		},
		isHovered: {
			type: Boolean,
			default: false,
		},
		compact: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['isSettingsPopupShown'],
	setup(): Object
	{
		return {
			deadlineMeta,
			DeadlineState,
		};
	},
	data(): Object
	{
		return {
			nowTs: Date.now(),
			isFieldHovered: false,
			isPopupShown: false,
			isSettingsPopupShown: false,
			isExceededHintShown: false,
			isChangeReasonPopupShown: false,
			dateTs: null,
			externalBindElement: null,
			coordinates: null,
			saveCallback: null,
			changeReason: '',
			selectedPreset: null,
		};
	},
	computed: {
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		taskStatus(): string
		{
			return this.task.status;
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		taskDeadline(): number
		{
			return this.isTemplate ? this.task.deadlineAfter : this.task.deadlineTs;
		},
		deadlineTs(): number
		{
			return this.dateTs ?? this.taskDeadline;
		},
		expiredDuration(): number
		{
			const isCompleted = this.taskStatus === TaskStatus.Completed
				|| this.taskStatus === TaskStatus.SupposedlyCompleted
			;
			const cannotExpire = this.isTemplate
				|| !this.deadlineTs
				|| this.isFlowFilledOnAdd
				|| isCompleted
			;

			return cannotExpire ? 0 : this.nowTs - this.deadlineTs;
		},
		isExpired(): boolean
		{
			return this.expiredDuration > 0;
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

			if (this.isTemplate)
			{
				return calendar.formatDuration(this.deadlineTs, this.task.matchesWorkTime);
			}

			if (this.isExpired && this.compact)
			{
				return this.loc('TASKS_V2_TASK_LIST_DEADLINE_EXPIRED', {
					'#DURATION#': new DurationFormat(this.expiredDuration).formatClosest(),
				});
			}

			return calendar.formatDateTime(this.deadlineTs);
		},
		deadlineFormattedForPrint(): string
		{
			if (this.isFlowFilledOnAdd)
			{
				return this.loc('TASKS_V2_DEADLINE_AUTO');
			}

			if (!this.deadlineTs)
			{
				return this.loc('TASKS_V2_DEADLINE_EMPTY');
			}

			if (this.isTemplate)
			{
				return calendar.formatDuration(this.deadlineTs, this.task.matchesWorkTime);
			}

			return calendar.formatDateTime(this.deadlineTs);
		},
		bindElement(): HTMLElement
		{
			return this.externalBindElement ?? this.$refs.container;
		},
		isFlowFilledOnAdd(): boolean
		{
			return !this.isEdit && this.task.flowId > 0;
		},
		readonly(): boolean
		{
			if (this.isCompactReadonly)
			{
				return true;
			}

			return !this.task.rights.deadline || this.exceededChangeCount || this.isFlowFilledOnAdd;
		},
		isCompactReadonly(): string[]
		{
			return this.compact && [
				TaskStatus.Completed,
				TaskStatus.SupposedlyCompleted,
				TaskStatus.Deferred,
			].includes(this.taskStatus);
		},
		canChangeDeadlineWithoutLimitation(): boolean
		{
			const isCreator = Core.getParams().currentUser.id === this.task.creatorId;

			return !this.isEdit || isCreator || this.task.rights.edit || Core.getParams().rights.user.admin;
		},
		requireChangeReason(): boolean
		{
			return this.task.requireDeadlineChangeReason && !this.canChangeDeadlineWithoutLimitation;
		},
		exceededChangeCount(): boolean
		{
			if (this.isTemplate || this.canChangeDeadlineWithoutLimitation || !this.task.maxDeadlineChanges)
			{
				return false;
			}

			return this.task.deadlineChangeCount >= this.task.maxDeadlineChanges;
		},
		canChangeTooltip(): ?Function
		{
			if (this.isCompactReadonly)
			{
				return null;
			}

			if (!this.isEdit || !this.readonly || this.exceededChangeCount || this.task.allowsChangeDeadline)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_DEADLINE_CAN_CHANGE_HINT'),
				popupOptions: {
					width: 280,
					offsetLeft: this.hintAngleOffset + 3,
				},
			});
		},
		hintBindElement(): HTMLElement
		{
			return this.$refs.deadlineView?.getHintBindElement?.()
				?? this.$refs.container
			;
		},
		hintAngleOffset(): number
		{
			return this.hintBindElement.offsetWidth / 2;
		},
	},
	watch: {
		async isSettingsPopupShown(value): void
		{
			if (this.isTemplate && value === false)
			{
				await this.$nextTick();

				this.recalculateDeadlineAfterFromPresets();
			}

			this.$emit('isSettingsPopupShown', value);
		},
	},
	mounted(): void
	{
		heightTransition.animate(this.$refs.container);
		this.nowTsInterval = setInterval(() => {
			this.nowTs = Date.now();
		}, 1000);

		EventEmitter.subscribe(EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);
	},
	created(): void
	{
		this.showErrorDebounce = Runtime.debounce(this.showError, 300);

		if (this.isTemplate)
		{
			this.setCurrentPreset();
		}
	},
	updated(): void
	{
		heightTransition.animate(this.$refs.container);
	},
	beforeUnmount(): void
	{
		clearInterval(this.nowTsInterval);

		EventEmitter.unsubscribe(EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);
	},
	methods: {
		handleOpenDeadlinePickerEvent(event: BaseEvent): void
		{
			const { taskId, bindElement, coordinates } = event.getData();

			if (Number(taskId) === Number(this.taskId))
			{
				this.showPopup(bindElement, coordinates);
			}
		},
		handleClick(): void
		{
			if (!this.readonly)
			{
				this.showPopup();
			}
		},
		handleApplyPreset(presetId: ?string): void
		{
			this.selectedPreset = Object.values(Presets).find((preset) => preset.id === presetId) ?? null;
		},
		showPopup(bindElement: HTMLElement, coordinates: { x: number, y: number }): void
		{
			this.dateTs = this.deadlineTs;
			this.externalBindElement = bindElement;
			this.coordinates = coordinates;
			this.isPopupShown = true;
		},
		handleCrossClick(): void
		{
			if (this.requireChangeReason)
			{
				this.isChangeReasonPopupShown = true;

				this.saveCallback = this.clearDeadline;
			}
			else
			{
				void this.clearDeadline();
			}
		},
		handleClose(): void
		{
			if (this.requireChangeReason && this.dateTs && this.dateTs !== this.taskDeadline)
			{
				this.isChangeReasonPopupShown = true;

				this.saveCallback = this.saveDeadline;
			}
			else
			{
				void this.saveDeadline();
			}

			this.isPopupShown = false;

			if (this.$refs?.deadlineView)
			{
				this.$refs.deadlineView.focusDeadline();
			}
		},
		async handleChangeReasonPopupClose(): void
		{
			this.isChangeReasonPopupShown = false;

			await this.saveCallback();

			this.saveCallback = null;
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey))
			{
				void this.handleClick();
			}
		},
		async saveDeadline(): Promise<void>
		{
			if (this.requireChangeReason && this.changeReason === '')
			{
				return;
			}

			if (this.dateTs)
			{
				await this.setDeadline(this.dateTs);
			}

			if (!this.isTemplate && !this.canChangeDeadlineWithoutLimitation && this.task.maxDeadlineChanges)
			{
				void deadlineService.updateDeadlineChangeCount(this.task.id);
			}
		},
		async clearDeadline(): Promise<void>
		{
			if (this.requireChangeReason && this.changeReason === '')
			{
				return;
			}

			await this.setDeadline(0);
		},
		async setDeadline(dateTs: number): Promise<void>
		{
			if (this.isTemplate)
			{
				await taskService.update(this.taskId, { deadlineAfter: dateTs });
			}
			else
			{
				taskService.setSilentErrorMode(true);

				const result = await taskService.update(this.taskId, {
					deadlineTs: dateTs,
					deadlineChangeReason: this.changeReason,
				});

				taskService.setSilentErrorMode(false);

				if (result[Endpoint.TaskDeadlineUpdate]?.length)
				{
					const error = result[Endpoint.TaskDeadlineUpdate][0];

					this.showErrorDebounce(error);
				}
			}

			this.dateTs = null;
		},
		recalculateDeadlineAfterFromPresets(): void
		{
			if (!this.selectedPreset)
			{
				return;
			}

			this.dateTs = this.calculateDayDuration() * this.selectedPreset.multiplier;

			void this.saveDeadline();

			this.$refs.deadline?.$el?.focus();
		},
		calculateDayDuration(): number
		{
			return this.task?.matchesWorkTime ? calendar.workdayDuration : unitDurations.d;
		},
		setCurrentPreset(): void
		{
			const dayDuration = this.calculateDayDuration();

			this.selectedPreset = Object.values(Presets).find(
				(preset) => this.deadlineTs === dayDuration * preset.multiplier,
			) ?? null;
		},
		showError(error): void
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-deadline-update-error',
				text: error?.message,
			});
		},
		mouseover(): void
		{
			this.isFieldHovered = true;

			if (this.compact)
			{
				this.isExceededHintShown = true;
			}
		},
		mouseleave(): void
		{
			this.isFieldHovered = false;

			if (this.compact)
			{
				this.isExceededHintShown = false;
			}
		},
	},
	template: `
		<div
			class="tasks-field-deadline-wrapper"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			@mouseover="mouseover"
			@mouseleave="mouseleave"
			ref="container"
		>
			<DeadlineChipView
				v-if="compact"
				v-hint="canChangeTooltip"
				:deadlineFormatted
				:isExpired
				:readonly
				:taskStatus
				:deadlineTs
				:isFlowFilledOnAdd
				:isTemplate
				@click="handleClick"
				@keydown="handleKeydown"
				ref="deadlineView"
			/>
			<DeadlineDefaultView
				v-else
				v-hint="canChangeTooltip"
				:taskId
				:deadlineFormatted
				:deadlineFormattedForPrint
				:isExpired
				:expiredDuration
				:readonly
				:isPopupShown
				:deadlineTs
				:isFlowFilledOnAdd
				:isTemplate
				:isHovered
				:isFieldHovered
				:isSettingsPopupShown
				@click="handleClick"
				@clear="handleCrossClick"
				@keydown="handleKeydown"
				@settingsClick="isSettingsPopupShown = true"
				@update:isExceededHintShown="isExceededHintShown = $event"
				ref="deadlineView"
			/>
		</div>
		<DeadlinePopup
			v-if="!isTemplate && isPopupShown"
			v-model:deadlineTs="dateTs"
			:taskId
			:bindElement
			:coordinates
			@close="handleClose"
		/>
		<DeadlineAfterPopup
			v-if="isTemplate && isPopupShown"
			v-model:deadlineAfter="dateTs"
			:taskId
			:bindElement
			@update:presetId="handleApplyPreset"
			@close="handleClose"
		/>
		<DeadlineChangeReasonPopup
			v-if="isChangeReasonPopupShown"
			v-model="changeReason"
			:taskId
			:bindElement="$refs.container"
			@close="handleChangeReasonPopupClose"
		/>
		<TaskSettingsPopup v-if="isSettingsPopupShown" @close="isSettingsPopupShown = false"/>
		<Hint
			v-if="exceededChangeCount && isExceededHintShown && !isCompactReadonly"
			:bindElement="hintBindElement"
			:options="{
				maxWidth: 330,
				padding: 12,
				closeIcon: false,
				offsetLeft: hintAngleOffset,
			}"
			@close="isExceededHintShown = false"
		>
			<div class="tasks-field-deadline-exceeded-hint">
				<span>{{ loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_HINT_1') }}</span>
				<span>{{ loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_HINT_2') }}</span>
			</div>
		</Hint>
	`,
};
