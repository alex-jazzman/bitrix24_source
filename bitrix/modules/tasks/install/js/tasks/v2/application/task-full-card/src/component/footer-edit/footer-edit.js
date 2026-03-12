import { Type } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { mapGetters } from 'ui.vue3.vuex';
import { BLine } from 'ui.system.skeleton.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize, ButtonIcon } from 'ui.vue3.components.button';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskCard } from 'tasks.v2.application.task-card';
import { GroupType, Model, Option, TaskStatus, Mark, EventName, Analytics } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { statusService } from 'tasks.v2.provider.service.status-service';
import { MarkTaskButton } from 'tasks.v2.component.mark-task-button';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { TaskModel, TimerModel } from 'tasks.v2.model.tasks';

// eslint-disable-next-line import/namespace
import { More } from './more/more';
import { ButtonId } from './footer-edit-const';

import './footer-edit.css';

export type ButtonOptions = {
	id: string,
	text: string,
	color: string,
	disabled: boolean,
	onClick: Function,
	icon?: ?string,
};

// @vue/component
export const FooterEdit = {
	components: {
		Hint,
		UiButton,
		BIcon,
		More,
		TextMd,
		TextXs,
		MarkTaskButton,
		TemplatePermissionsButton: BitrixVue.defineAsyncComponent(
			'tasks.v2.component.template-permissions-button',
			'TemplatePermissionsButton',
			{
				delay: 0,
				loadingComponent: {
					components: { BLine },
					template: '<BLine :width="131" :height="22"/>',
				},
			},
		),
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
		settings: {},
		analytics: {},
	},
	setup(): { task: TaskModel, Outline: typeof Outline }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			Outline,
			TaskStatus,
		};
	},
	data(): Object
	{
		return {
			loading: false,
			showStartTimeTrackingHint: false,
			computedSecondaryButton: null,
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
		group(): ?GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		isScrum(): boolean
		{
			return this.group?.type === GroupType.Scrum;
		},
		isCreator(): boolean
		{
			return this.currentUserId === this.task.creatorId;
		},
		primaryButton(): ButtonOptions | null
		{
			const inProgress = (this.task.rights.timeTracking)
				? [
					this.getStartTimerButton(),
					this.getPauseButton(AirButtonStyle.OUTLINE),
				]
				: [this.getCompleteButton()];

			const statuses = {
				[TaskStatus.Pending]: [
					this.getTakeButton(),
					this.getStartTimerButton(),
					this.getPauseButton(AirButtonStyle.OUTLINE),
					this.getStartButton(),
					this.getCompleteButton(),
				],
				[TaskStatus.InProgress]: inProgress,
				[TaskStatus.Deferred]: this.getRenewButton(),
				[TaskStatus.SupposedlyCompleted]: [
					this.getApproveButton(),
					this.getReviewButton(),
				],
				[TaskStatus.Completed]: this.getRenewButton(AirButtonStyle.PLAIN),
			};

			if (Type.isArray(statuses[this.task.status]))
			{
				return statuses[this.task.status].find((item) => item !== null);
			}

			return statuses[this.task.status] || null;
		},
		secondaryButton(): ButtonOptions | null
		{
			return this.computedSecondaryButton;
		},
		selectedButtons(): ButtonOptions[]
		{
			return [this.primaryButton, this.secondaryButton];
		},
		shouldShowStartTimeTrackingHint(): boolean
		{
			return (
				this.showStartTimeTrackingHint
				&& this.primaryButton?.id === ButtonId.Start
			);
		},
		shouldShowMarkTaskButton(): boolean
		{
			return this.task.rights.mark || (this.task.mark !== Mark.None);
		},
		showFooter(): boolean
		{
			if (this.isTemplate)
			{
				return this.settings.rights.tasks.createFromTemplate || this.task.rights.edit;
			}

			return Boolean(
				this.primaryButton
				|| this.secondaryButton
				|| this.shouldShowMarkTaskButton,
			);
		},
	},
	watch: {
		primaryButton: {
			handler: 'updateSecondaryButton',
			immediate: true,
		},
		'task.status': {
			handler: 'updateSecondaryButton',
		},
	},
	mounted(): void
	{
		this.$bitrix.eventEmitter.subscribe(EventName.TimeTrackingChange, this.handleTimeTrackingActivating);
	},
	methods: {
		getStartButton(): ?ButtonOptions
		{
			if (!this.task.rights.start || this.timer)
			{
				return null;
			}

			return {
				id: ButtonId.Start,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
				onClick: (): void => this.waitStatus(statusService.start(this.taskId)),
			};
		},
		getTakeButton(): ?ButtonOptions
		{
			if (!this.task.rights.take || this.task.status !== TaskStatus.Pending)
			{
				return null;
			}

			return {
				id: ButtonId.Take,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_TAKE'),
				onClick: (): void => this.waitStatus(statusService.take(
					this.taskId,
					{
						context: this.analytics?.context ?? Analytics.Section.Tasks,
					},
				)),
			};
		},
		getStartTimerButton(): ?ButtonOptions
		{
			if (!this.task.rights.timeTracking || this.timer)
			{
				return null;
			}

			return {
				id: ButtonId.Start,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
				icon: ButtonIcon.START,
				onClick: (): void => this.waitStatus(statusService.startTimer(
					this.taskId,
					{
						context: this.analytics?.context ?? Analytics.Section.Tasks,
					},
				)),
			};
		},
		getCompleteButton(style: string): ?ButtonOptions
		{
			if (!this.task.rights.complete)
			{
				return null;
			}

			return {
				id: ButtonId.Complete,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_COMPLETE'),
				style,
				onClick: (): void => this.waitStatus(statusService.complete(
					this.taskId,
					{
						context: this.analytics?.context ?? Analytics.Section.Tasks,
						additionalContext: this.analytics?.additionalContext ?? Analytics.SubSection.TaskCard,
						element: Analytics.Element.CompleteButton,
					},
				)),
			};
		},
		getPauseButton(style: string): ?ButtonOptions
		{
			if (!this.task.rights.timeTracking || !this.timer)
			{
				return null;
			}

			return {
				id: ButtonId.Pause,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_PAUSE_TIMER'),
				style,
				onClick: (): void => this.waitStatus(statusService.pauseTimer(this.taskId)),
			};
		},
		getRenewButton(style: string): ?ButtonOptions
		{
			if (!this.task.rights.renew)
			{
				return null;
			}

			return {
				id: ButtonId.Renew,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_RENEW'),
				style,
				onClick: (): void => this.waitStatus(statusService.renew(this.taskId)),
			};
		},
		getReviewButton(): ButtonOptions
		{
			return {
				id: ButtonId.Review,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_ON_REVIEW_MSGVER_1'),
				disabled: true,
			};
		},
		getApproveButton(): ButtonOptions
		{
			if (!this.task.rights.approve)
			{
				return null;
			}

			return {
				id: ButtonId.Approve,
				text: this.loc('TASKS_V2_TASK_FULL_CARD_APPROVE'),
				onClick: (): void => this.waitStatus(statusService.approve(this.taskId)),
			};
		},
		updateSecondaryButton(): void
		{
			void this.$nextTick(() => {
				const inProgress = this.task.rights.timeTracking
					? this.getCompleteButton(this.timer ? '' : AirButtonStyle.OUTLINE)
					: null;

				const statuses = {
					[TaskStatus.Pending]: this.getCompleteButton(AirButtonStyle.OUTLINE),
					[TaskStatus.InProgress]: inProgress,
				};

				let secondary = statuses[this.task.status] || null;

				if (secondary && this.primaryButton && secondary.id === this.primaryButton.id)
				{
					secondary = null;
				}

				this.computedSecondaryButton = secondary;
			});
		},
		handleOverPrimaryButton(): void
		{
			if (
				this.task.rights.timeTracking
				&& this.primaryButton?.id === ButtonId.Start
				&& ahaMoments.shouldShow(Option.AhaStartTimeTracking)
			)
			{
				ahaMoments.setActive(Option.AhaStartTimeTracking);
				this.showStartTimeTrackingHint = true;
			}
		},
		handleTimeTrackingActivating(): void
		{
			void this.waitStatus(new Promise((resolve) => {
				const unwatch = this.$watch(
					() => this.task.rights.timeTracking,
					async () => {
						await this.$nextTick();
						resolve();
					},
					{ immediate: false },
				);
				setTimeout(() => {
					unwatch();
					resolve();
				}, 5000);
			}));
		},
		hideStartTimeTrackingHint(): void
		{
			this.showStartTimeTrackingHint = false;
		},
		hidePermanentStartTimeTrackingHint(): void
		{
			this.hideStartTimeTrackingHint();

			ahaMoments.setInactive(Option.AhaStartTimeTracking);
			ahaMoments.setShown(Option.AhaStartTimeTracking);
		},
		async waitStatus(statusPromise: Promise): Promise<void>
		{
			this.loading = true;
			await statusPromise;
			this.loading = false;
		},
		createTaskFromTemplate(): void
		{
			TaskCard.showFullCard({
				templateId: idUtils.unbox(this.taskId),
				analytics: {
					context: Analytics.Section.Templates,
					additionalContext: Analytics.SubSection.TemplatesCard,
					element: Analytics.Element.CreateButton,
				},
			});
		},
	},
	template: `
		<div v-if="showFooter" class="tasks-full-card-footer print-ignore">
			<div class="tasks-full-card-footer-edit">
				<UiButton
					v-if="isTemplate && settings.rights.tasks.createFromTemplate"
					:text="loc('TASKS_V2_TASK_TEMPLATE_CREATE_TASK')"
					:size="ButtonSize.LARGE"
					:dataset="{ taskButtonId: 'createFromTemplate' }"
					:leftIcon="Outline.PLUS_L"
					@click="createTaskFromTemplate"
				/>
				<template v-if="!isTemplate">
					<div
						v-if="primaryButton"
						ref="primaryButton"
						@mouseover="handleOverPrimaryButton"
					>
						<UiButton
							:text="primaryButton.text"
							:size="ButtonSize.LARGE"
							:style="primaryButton.style ?? AirButtonStyle.FILLED"
							:disabled="Boolean(primaryButton.disabled)"
							:loading
							:leftIcon="primaryButton.icon"
							:dataset="{ taskButtonId: 'status' }"
							@click="primaryButton.onClick"
						/>
					</div>
					<UiButton
						v-if="secondaryButton && !loading"
						:text="secondaryButton.text"
						:size="ButtonSize.LARGE"
						:style="secondaryButton.style ?? AirButtonStyle.FILLED"
						:disabled="secondaryButton.disabled ?? false"
						:dataset="{ taskButtonId: 'secondary' }"
						@click="secondaryButton.onClick"
					/>
				</template>
				<More :selectedButtons/>
				<div class="tasks-full-card-footer-edit-grow"/>
				<MarkTaskButton v-if="!isTemplate && shouldShowMarkTaskButton"/>
				<TemplatePermissionsButton v-if="isTemplate && task.rights.edit"/>
			</div>
			<Hint
				v-if="shouldShowStartTimeTrackingHint"
				:bindElement="$refs.primaryButton"
				:options="{
					closeIcon: true,
					offsetLeft: 24,
					minWidth: 344,
					maxWidth: 344,
				}"
				@close="hideStartTimeTrackingHint"
			>
				<div class="tasks-full-card-start-time-tracking-hint">
					<TextMd class="tasks-full-card-start-time-tracking-hint-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_START_TIME_TRACKING_HINT_TEXT') }}
					</TextMd>
					<TextXs
						class="tasks-full-card-start-time-tracking-hint-info-link"
						@click.stop="hidePermanentStartTimeTrackingHint"
					>
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_START_TIME_TRACKING_HINT_MORE') }}
					</TextXs>
				</div>
			</Hint>
		</div>
	`,
};
