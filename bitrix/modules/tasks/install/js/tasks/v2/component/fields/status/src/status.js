import { DateTimeFormat } from 'main.date';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BMenu, type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { TaskStatus, Analytics } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { timezone } from 'tasks.v2.lib.timezone';
import { statusService } from 'tasks.v2.provider.service.status-service';
import type { TaskModel, TaskRights } from 'tasks.v2.model.tasks';

import { statusMeta } from './status-meta';
import './status.css';

// @vue/component
export const Status = {
	components: {
		BIcon,
		BMenu,
		HoverPill,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		analytics: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			statusMeta,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		rights(): TaskRights
		{
			return this.task.rights;
		},
		icon(): string
		{
			const statuses = {
				[TaskStatus.Pending]: Outline.HOURGLASS,
				[TaskStatus.InProgress]: Outline.NEXT,
				[TaskStatus.SupposedlyCompleted]: Outline.REFRESH,
				[TaskStatus.Completed]: Outline.SENDED,
				[TaskStatus.Deferred]: Outline.PAUSE_L,
			};

			return statuses[this.task.status] ?? Outline.HOURGLASS;
		},
		statusFormatted(): string
		{
			const statuses = {
				[TaskStatus.Pending]: this.loc('TASKS_V2_STATUS_PENDING'),
				[TaskStatus.InProgress]: this.loc('TASKS_V2_STATUS_IN_PROGRESS'),
				[TaskStatus.SupposedlyCompleted]: this.loc('TASKS_V2_STATUS_SUPPOSEDLY_COMPLETED_MSGVER_1'),
				[TaskStatus.Completed]: this.loc('TASKS_V2_STATUS_COMPLETED_MSGVER_1'),
				[TaskStatus.Deferred]: this.loc('TASKS_V2_STATUS_DEFERRED'),
			};

			return statuses[this.task.status] ?? this.loc('TASKS_V2_STATUS_PENDING');
		},
		statusAtFormatted(): string
		{
			return this.loc('TASKS_V2_STATUS_FROM', {
				'#DATE#': this.formatDate(this.statusChangedTs),
				'#TIME#': this.formatTime(this.statusChangedTs),
			});
		},
		statusChangedTs(): number
		{
			return this.task.statusChangedTs || this.task.createdTs;
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `tasks-status-menu-${this.taskId}`,
				bindElement: this.$refs.clickable.$el,
				offsetTop: 8,
				items: this.menuItems,
				targetContainer: document.body,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			const statusActionsMap = {
				[TaskStatus.Pending]: [
					this.rights.start && this.getStartItem(),
					this.rights.complete && this.getCompleteItem(),
					this.rights.defer && this.getDeferItem(),
				].filter(Boolean),
				[TaskStatus.InProgress]: [
					this.rights.pause && this.getPauseItem(),
					this.rights.complete && this.getCompleteItem(),
				].filter(Boolean),
				[TaskStatus.SupposedlyCompleted]: [
					this.rights.renew && this.getRenewItem(),
					this.rights.complete && this.getCompleteItem(),
				].filter(Boolean),
				[TaskStatus.Deferred]: [
					this.rights.renew && this.getResumeItem(),
					this.rights.complete && this.getCompleteItem(),
				].filter(Boolean),
				[TaskStatus.Completed]: [
					this.rights.renew && this.getResumeItem(),
				].filter(Boolean),
			};

			return statusActionsMap[this.task.status] ?? [];
		},
		hasMenuItems(): boolean
		{
			return this.menuItems.length > 0;
		},
		tooltip(): ?Function
		{
			return (): HintParams => tooltip({
				text: this.statusAtFormatted,
				popupOptions: {
					offsetLeft: 40,
				},
				timeout: 200,
			});
		},
		controlTooltip(): ?Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_STATUS_NEEDS_CONTROL_HINT'),
				popupOptions: {
					offsetLeft: this.$refs.needsControl.offsetWidth / 2,
				},
				timeout: 200,
			});
		},
	},
	methods: {
		formatDate(timestamp: number): string
		{
			const timezoneTimestamp = (timestamp + timezone.getOffset(timestamp)) / 1000;

			return DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), timezoneTimestamp);
		},
		formatTime(timestamp: number): string
		{
			const timezoneTimestamp = (timestamp + timezone.getOffset(timestamp)) / 1000;

			return DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), timezoneTimestamp);
		},
		handleClick(): void
		{
			if (!this.hasMenuItems)
			{
				return;
			}

			this.isMenuShown = true;
		},
		getStartItem(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_STATUS_START_ACTION'),
				icon: Outline.NEXT,
				dataset: {
					id: 'tasks-status-menu-start',
				},
				onClick: (): void => statusService.start(this.taskId),
			};
		},
		getPauseItem(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_STATUS_PAUSE_ACTION'),
				icon: Outline.HOURGLASS,
				dataset: {
					id: 'tasks-status-menu-pause',
				},
				onClick: (): void => statusService.pause(this.taskId),
			};
		},
		getCompleteItem(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_STATUS_COMPLETE_ACTION'),
				icon: Outline.CHECK_L,
				dataset: {
					id: 'tasks-status-menu-complete',
				},
				onClick: (): void => {
					void statusService.complete(
						this.taskId,
						{
							context: this.analytics?.context ?? Analytics.Section.Tasks,
							additionalContext: this.analytics?.additionalContext ?? Analytics.SubSection.TaskCard,
							element: Analytics.Element.ContextMenu,
						},
					);
				},
			};
		},
		getDeferItem(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_STATUS_DEFER_ACTION'),
				icon: Outline.PAUSE_L,
				dataset: {
					id: 'tasks-status-menu-defer',
				},
				onClick: (): void => statusService.defer(this.taskId),
			};
		},
		getRenewItem(): MenuItemOptions
		{
			if (!this.task.rights.renew)
			{
				return null;
			}

			return {
				title: this.loc('TASKS_V2_STATUS_RENEW_ACTION'),
				icon: Outline.UNDO,
				dataset: {
					id: 'tasks-status-menu-renew',
				},
				onClick: (): void => statusService.renew(this.taskId),
			};
		},
		getResumeItem(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_STATUS_RESUME_ACTION'),
				icon: Outline.UNDO,
				dataset: {
					id: 'tasks-status-menu-resume',
				},
				onClick: (): void => statusService.renew(this.taskId),
			};
		},
	},
	template: `
		<div
			class="tasks-field-status"
			:data-task-id="taskId"
			:data-task-field-id="statusMeta.id"
			:data-task-field-value="task.status"
			:data-task-created-ts="task.createdTs"
			:data-task-status-changes-ts="statusChangedTs"
		>
			<HoverPill
				v-hint="tooltip"
				:active="isMenuShown"
				:readonly="!hasMenuItems"
				@click="handleClick"
				ref="clickable"
			>
				<BIcon class="tasks-field-status-icon" :name="icon"/>
				<div class="tasks-field-status-text">{{ statusFormatted }}</div>
			</HoverPill>
			<div ref="needsControl" class="tasks-field-status-control" v-hint="controlTooltip">
				<BIcon
					v-if="task.needsControl"
					class="tasks-field-status-control-icon"
					:name="Outline.CHECK_DEFERRED"
				/>
			</div>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
