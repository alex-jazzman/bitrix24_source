import { Loc } from 'main.core';
import { type TaskListOptions } from 'tasks.v2.model.interface';

import { mapGetters } from 'ui.vue3.vuex';
import { Notifier } from 'ui.notification-manager';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu, MenuItemDesign, type MenuOptions, type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu.vue';
import 'ui.icon-set.outline';

import { showLimit } from 'tasks.v2.lib.show-limit';
import { TaskCard } from 'tasks.v2.application.task-card';
import { Model, TaskStatus, Analytics } from 'tasks.v2.const';
import { Deadline } from 'tasks.v2.component.fields.deadline';
import { Responsible } from 'tasks.v2.component.fields.responsible';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { statusService } from 'tasks.v2.provider.service.status-service';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { type CoreParams } from 'tasks.v2.core';
import { type TaskModel, type TaskRights } from 'tasks.v2.model.tasks';

import { Gantt } from '../../field/gantt';
import { TaskLineExpandToggle } from '../task-line-expand-toggle/task-line-expand-toggle';

import './task-line.css';

const sectionStatus = 'sectionStatus';
const sectionBase = 'sectionBase';
const sectionRemove = 'sectionRemove';

// @vue/component
export const TaskLine = {
	components: {
		TextMd,
		BIcon,
		BMenu,
		Responsible,
		Deadline,
		Gantt,
		TaskLineExpandToggle,
	},
	inject: {
		settings: {},
		analytics: {},
		fields: {},
		shouldShowSubTasksOption: {},
		isTemplateEntities: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: false,
		},
		isSubTask: {
			type: Boolean,
			default: false,
		},
		isLastSubTask: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['remove', 'toggleSubTasks'],
	setup(): { settings: CoreParams, taskListOptions: TaskListOptions }
	{
		return {
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
		...mapGetters({
			taskListOptions: `${Model.Interface}/taskListOptions`,
		}),
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isTemplate(): boolean
		{
			return idUtils.isTemplate(this.taskId);
		},
		rights(): TaskRights
		{
			return this.task.rights;
		},
		completed(): boolean
		{
			return this.task.status === TaskStatus.Completed;
		},
		href(): string
		{
			const path = String(this.taskId).startsWith('tmp.')
				? TaskCard.getUrl(idUtils.boxTemplate(this.taskId.replace('tmp.', '')))
				: TaskCard.getUrl(this.taskId)
			;

			return `${window.location.origin}${path}`;
		},
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				id: `tasks-line-menu-${this.taskId}`,
				bindElement: this.$refs.moreIcon,
				offsetTop: 8,
				sections: this.menuSections,
				items: this.menuItems,
				targetContainer: document.body,
			});
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				...this.statusMenuItems,
				...this.baseMenuItems,
				...this.removeMenuItems,
			].filter(Boolean);
		},
		menuSections(): MenuSectionOptions[]
		{
			return [
				this.statusMenuItems.length > 0 && { code: sectionStatus },
				{ code: sectionBase },
				this.removeMenuItems.length > 0 && { code: sectionRemove },
			].filter(Boolean);
		},
		statusMenuItems(): MenuItemOptions[]
		{
			if (this.isTemplate)
			{
				return [];
			}

			const statusActionsMap = {
				[TaskStatus.Pending]: [
					this.rights.start && this.getStartItem(),
					this.rights.complete && this.getCompleteItem(),
					this.rights.defer && this.getDeferItem(),
				],
				[TaskStatus.InProgress]: [
					this.rights.pause && this.getPauseItem(),
					this.rights.complete && this.getCompleteItem(),
				],
				[TaskStatus.SupposedlyCompleted]: [
					this.rights.renew && this.getRenewItem(),
					this.rights.complete && this.getCompleteItem(),
				],
				[TaskStatus.Deferred]: [
					this.rights.renew && this.getResumeItem(),
					this.rights.complete && this.getCompleteItem(),
				],
				[TaskStatus.Completed]: [
					this.rights.renew && this.getResumeItem(),
				],
			};

			return statusActionsMap[this.task.status]?.filter(Boolean) ?? [];
		},
		baseMenuItems(): MenuItemOptions[]
		{
			return [
				this.getCopyLinkItem(),
				this.getSubCreateItem(),
			];
		},
		removeMenuItems(): MenuItemOptions[]
		{
			return [
				this.canDetach && this.getRemoveItem(),
				this.rights.remove && this.getDeleteItem(),
			].filter(Boolean);
		},
		canDetach(): boolean
		{
			const { detachParent, detachRelated, changeDependence } = this.task.rights;

			return detachParent || detachRelated || changeDependence;
		},
		subTaskIds(): number[]
		{
			return subTasksService.getSortedIds(
				this.taskId,
				this.task?.subTaskIds ?? [],
				this.taskListOptions.showCompletedSubTasks,
				this.isTemplateEntities,
			);
		},
		countSubTasks(): number
		{
			return this.subTaskIds.length;
		},
		hasSubTasks(): boolean
		{
			return this.shouldShowSubTasksOption && this.countSubTasks > 0;
		},
		sideIconClass(): string
		{
			return this.isLastSubTask ? '--last' : '--side';
		},
		showSubTasksOption(): boolean
		{
			return this.isTemplate
				? this.taskListOptions.showSubTemplates
				: this.taskListOptions.showSubTasks
			;
		},
		showExpand(): boolean
		{
			return this.shouldShowSubTasksOption
				&& this.showSubTasksOption
				&& this.hasSubTasks
				&& !this.isExpanded
			;
		},
		expandTitle(): string
		{
			if (this.isTemplate)
			{
				return Loc.getMessagePlural('TASKS_V2_TASK_LINE_SUBTEMPLATE', this.countSubTasks, {
					'#NUM#': this.countSubTasks,
				});
			}

			return Loc.getMessagePlural('TASKS_V2_TASK_LINE_SUBTASK', this.countSubTasks, {
				'#NUM#': this.countSubTasks,
			});
		},
		expandIcon(): string
		{
			return this.isSubTask ? Outline.CHEVRON_RIGHT_M : Outline.CHEVRON_DOWN_M;
		},
	},
	methods: {
		getStartItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionStatus,
				title: this.loc('TASKS_V2_TASK_LINE_START_ACTION'),
				icon: Outline.NEXT,
				dataset: { id: `tasks-line-menu-start-${this.taskId}` },
				onClick: (): void => statusService.start(this.taskId),
			};
		},
		getPauseItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionStatus,
				title: this.loc('TASKS_V2_TASK_LINE_PAUSE_ACTION'),
				icon: Outline.HOURGLASS,
				dataset: { id: `tasks-line-menu-pause-${this.taskId}` },
				onClick: (): void => statusService.pause(this.taskId),
			};
		},
		getCompleteItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionStatus,
				title: this.loc('TASKS_V2_TASK_LINE_COMPLETE_ACTION'),
				icon: Outline.CHECK_L,
				dataset: { id: `tasks-line-menu-complete-${this.taskId}` },
				onClick: async (): void => {
					const error = await statusService.complete(
						this.taskId,
						{
							context: Analytics.Section.Tasks,
							additionalContext: Analytics.SubSection.TaskCard,
						},
						false,
					);

					if (error)
					{
						Notifier.notifyViaBrowserProvider({
							id: 'task-line-notify-error-complete',
							text: error.message,
						});
					}
				},
			};
		},
		getDeferItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionStatus,
				title: this.loc('TASKS_V2_TASK_LINE_DEFER_ACTION'),
				icon: Outline.PAUSE_L,
				dataset: { id: `tasks-line-menu-defer-${this.taskId}` },
				onClick: (): void => statusService.defer(this.taskId),
			};
		},
		getRenewItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionStatus,
				title: this.loc('TASKS_V2_TASK_LINE_RENEW_ACTION'),
				icon: Outline.UNDO,
				dataset: { id: `tasks-line-menu-renew-${this.taskId}` },
				onClick: (): void => statusService.renew(this.taskId),
			};
		},
		getResumeItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionStatus,
				title: this.loc('TASKS_V2_TASK_LINE_RESUME_ACTION'),
				icon: Outline.UNDO,
				dataset: { id: `tasks-line-menu-resume-${this.taskId}` },
				onClick: (): void => statusService.renew(this.taskId),
			};
		},
		getCopyLinkItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionBase,
				title: this.loc('TASKS_V2_TASK_LINE_COPY_LINK_ACTION'),
				icon: Outline.COPY,
				dataset: { id: `tasks-line-menu-copy-link-${this.taskId}` },
				onClick: (): void => {
					const isCopyingSuccess = BX.clipboard.copy(this.href);
					if (isCopyingSuccess)
					{
						Notifier.notifyViaBrowserProvider({
							id: 'task-line-notify-copy-link',
							text: this.loc('TASKS_V2_TASK_LINE_COPY_LINK_NOTIFICATION'),
						});
					}
				},
			};
		},
		getSubCreateItem(): MenuItemOptions | null
		{
			return this.isTemplate
				? this.getSubTemplateCreateItem()
				: this.getSubTaskCreateItem()
			;
		},
		getSubTemplateCreateItem(): MenuItemOptions | null
		{
			if (!this.settings.rights.templates.create)
			{
				return null;
			}

			const isLocked = !this.settings.restrictions.templatesSubtasks.available;

			return {
				sectionCode: sectionBase,
				title: this.loc('TASKS_V2_TASK_LINE_TEMPLATE_SUBTASK_CREATE_ACTION'),
				icon: Outline.RELATED_TASKS,
				dataset: { id: `tasks-line-menu-add-subtemplate-${this.taskId}` },
				onClick: (): void => {
					if (isLocked)
					{
						void showLimit({
							featureId: this.settings.restrictions.templatesSubtasks.featureId,
						});

						return;
					}

					TaskCard.showCompactCard({
						taskId: 'template0',
						groupId: this.task.groupId,
						parentId: this.taskId,
					});
				},
			};
		},
		getSubTaskCreateItem(): MenuItemOptions | null
		{
			if (!this.rights.createSubtask)
			{
				return null;
			}

			return {
				sectionCode: sectionBase,
				title: this.loc('TASKS_V2_TASK_LINE_SUBTASK_CREATE_ACTION'),
				icon: Outline.RELATED_TASKS,
				dataset: { id: `tasks-line-menu-add-subtask-${this.taskId}` },
				onClick: (): void => {
					TaskCard.showCompactCard({
						groupId: this.task.groupId,
						parentId: this.taskId,
						analytics: {},
					});
				},
			};
		},
		getRemoveItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionRemove,
				title: this.loc('TASKS_V2_TASK_LINE_REMOVE_ACTION'),
				icon: Outline.CROSS_L,
				dataset: { id: `tasks-line-menu-remove-${this.taskId}` },
				onClick: (): void => {
					this.$emit('remove');
				},
			};
		},
		getDeleteItem(): MenuItemOptions
		{
			const title = this.isTemplate
				? this.loc('TASKS_V2_TASK_LINE_DELETE_TEMPLATE_ACTION')
				: this.loc('TASKS_V2_TASK_LINE_DELETE_TASK_ACTION')
			;

			return {
				title,
				sectionCode: sectionRemove,
				icon: Outline.TRASHCAN,
				design: MenuItemDesign.Alert,
				dataset: {
					id: `tasks-line-menu-delete-${this.taskId}`,
				},
				onClick: (): void => {
					if (this.isTemplate)
					{
						void templateService.delete(this.taskId);
					}
					else
					{
						void taskService.delete(this.taskId);
					}
				},
			};
		},
	},
	template: `
		<div 
			class="tasks-task-line-title-container-wrapper"
			:class="{ '--expanded': isExpanded }"
		>
			<div v-if="isSubTask" class="tasks-task-line-side-icon" :class="sideIconClass"/>
			<div 
				class="tasks-task-line-title-container"
				:class="{ 
					'--sub-task': isSubTask,
					'--sub-task-with-expanded': isSubTask && showExpand,
				}"
			>
				<TextMd
					class="tasks-task-line-title print-white-space-normal"
					:title="task.title"
				>
					<a
						class="tasks-task-line-title-href print-font-color-base-1"
						:class="{ '--completed': completed }"
						:href
					>
						{{ task.title }}
					</a>
				</TextMd>
				<TaskLineExpandToggle
					v-if="showExpand"
					:text="expandTitle"
					:icon="expandIcon"
					@click="$emit('toggleSubTasks')"
				/>
			</div>
		</div>
		<div
			v-if="fields.has('responsible')"
			class="tasks-task-line-field"
			:class="{ '--expanded': isExpanded }"
		>
			<Responsible :taskId avatarOnly/>
		</div>
		<div
			v-if="fields.has('deadline')"
			class="tasks-task-line-field"
			:class="{ '--expanded': isExpanded }"
		>
			<Deadline :taskId :isTemplate compact/>
		</div>
		<div
			v-if="fields.has('gantt')"
			class="tasks-task-line-field"
			:class="{ '--expanded': isExpanded }"
		>
			<Gantt :taskId/>
		</div>
		<div
			class="tasks-task-line-more print-ignore"
			:class="{ '--expanded': isExpanded }"
			@click="isMenuShown = true"
			ref="moreIcon"
		>
			<BIcon :name="Outline.MORE_L" hoverable/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`,
};
