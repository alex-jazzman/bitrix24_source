import { Runtime } from 'main.core';
import { DurationFormat } from 'main.date';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { mapGetters } from 'ui.vue3.vuex';
import { Notifier } from 'ui.notification-manager';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd, Text2Xs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model, EventName, TaskStatus, Endpoint } from 'tasks.v2.const';
import { TaskSettingsPopup } from 'tasks.v2.component.task-settings-popup';
import { SettingsLabel } from 'tasks.v2.component.elements.settings-label';
import { Hint, tooltip } from 'tasks.v2.component.elements.hint';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { calendar } from 'tasks.v2.lib.calendar';
import { heightTransition } from 'tasks.v2.lib.height-transition';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { DeadlinePopup } from './deadline-popup/deadline-popup';
import { DeadlineChangeReasonPopup } from './deadline-change-reason-popup/deadline-change-reason-popup';
import { DeadlineAfterPopup } from './deadline-after-popup/deadline-after-popup';
import { deadlineMeta } from './deadline-meta';
import './deadline.css';

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
		};
	},
	computed: {
		...mapGetters({
			deadlineChangeCount: `${Model.Interface}/deadlineChangeCount`,
		}),
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		deadlineTs(): number
		{
			return this.dateTs ?? (this.isTemplate ? this.task.deadlineAfter : this.task.deadlineTs);
		},
		expiredDuration(): number
		{
			const isCompleted = this.task.status === TaskStatus.Completed
				|| this.task.status === TaskStatus.SupposedlyCompleted
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
		expiredFormatted(): string
		{
			return this.loc('TASKS_V2_DEADLINE_EXPIRED', {
				'#EXPIRED_DURATION#': new DurationFormat(this.expiredDuration).formatClosest(),
			});
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
		iconName(): string
		{
			return this.isFlowFilledOnAdd ? Outline.BOTTLENECK : Outline.CALENDAR_WITH_SLOTS;
		},
		bindElement(): HTMLElement
		{
			return this.externalBindElement ?? this.$refs.deadline.$el;
		},
		isFlowFilledOnAdd(): boolean
		{
			return !this.isEdit && this.task.flowId > 0;
		},
		canChangeSettings(): boolean
		{
			const features = Core.getParams().features;
			if (!features.isV2Enabled)
			{
				return false;
			}

			return this.task.rights.edit;
		},
		readonly(): boolean
		{
			return !this.task.rights.deadline || this.exceededChangeCount || this.isFlowFilledOnAdd;
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

			return this.deadlineChangeCount >= this.task.maxDeadlineChanges;
		},
		canChangeTooltip(): ?Function
		{
			if (!this.isEdit || !this.readonly || this.exceededChangeCount)
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
			return this.$refs.deadlineIcon?.$el ?? this.$refs.deadline?.$el;
		},
		hintAngleOffset(): number
		{
			return this.hintBindElement.offsetWidth / 2;
		},
	},
	watch: {
		isSettingsPopupShown(value): void
		{
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
			if (this.requireChangeReason && this.dateTs)
			{
				this.isChangeReasonPopupShown = true;

				this.saveCallback = this.saveDeadline;
			}
			else
			{
				void this.saveDeadline();
			}

			this.isPopupShown = false;
			this.$refs.deadline?.$el?.focus();
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
			this.dateTs = null;
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
		},
		showError(error): void
		{
			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-deadline-update-error',
				text: error?.message,
			});
		},
	},
	template: `
		<div
			v-hint="canChangeTooltip"
			class="tasks-field-deadline"
			:class="{ '--expired': isExpired }"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			@mouseover="isFieldHovered = true"
			@mouseleave="isFieldHovered = false"
			ref="container"
		>
			<div class="tasks-field-deadline-inner">
				<HoverPill
					:withClear="Boolean(deadlineTs)"
					:readonly
					:textOnly="compact"
					:noOffset="compact"
					:active="isPopupShown"
					:alert="isExpired"
					@click="handleClick"
					@clear="handleCrossClick"
					@keydown="handleKeydown"
					@mouseover="isExceededHintShown = true"
					@mouseleave="isExceededHintShown = false"
					ref="deadline"
				>
					<BIcon
						v-if="!compact"
						class="tasks-field-deadline-icon" 
						:name="iconName"
						ref="deadlineIcon"
					/>
					<TextMd 
						class="tasks-field-deadline-text print-ignore" 
						:accent="isExpired"
					>
						{{ deadlineFormatted }}
					</TextMd>
					<TextMd
						class="tasks-field-deadline-text --display-none print-display-block" 
						:accent="isExpired">{{ deadlineFormattedForPrint }}
					</TextMd>
				</HoverPill>
				<div
					v-if="!isFlowFilledOnAdd && !isTemplate && !compact"
					class="tasks-field-deadline-settings-label"
					ref="settings"
				>
					<SettingsLabel
						v-if="canChangeSettings && (isHovered || isFieldHovered || isSettingsPopupShown)"
						data-settings-label
						@click="isSettingsPopupShown = true"
					/>
				</div>
			</div>
			<Text2Xs v-if="isExpired && !compact" class="tasks-field-deadline-expired print-ignore">{{ expiredFormatted }}</Text2Xs>
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
			v-if="exceededChangeCount && isExceededHintShown"
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
