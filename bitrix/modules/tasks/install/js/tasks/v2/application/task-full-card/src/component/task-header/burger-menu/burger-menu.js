import { Notifier } from 'ui.notification-manager';
import { mapGetters } from 'ui.vue3.vuex';
import { AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core, type RightsParams } from 'tasks.v2.core';
import { TaskCard } from 'tasks.v2.application.task-card';
import { Model } from 'tasks.v2.const';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './burger-menu.css';

const sectionPersonal = 'sectionPersonal';
const sectionTasks = 'sectionTasks';
const sectionCopy = 'sectionCopy';
const sectionLinks = 'sectionLinks';

// @vue/component
export const BurgerMenu = {
	name: 'TaskFullCardBurgerMenu',
	components: {
		BIcon,
		BMenu,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel, userRights: RightsParams }
	{
		return {
			Outline,
			userRights: Core.getParams().rights,
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
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				id: 'tasks-full-card-header-burger-menu',
				bindElement: this.$refs.container,
				sections: [
					{
						code: sectionPersonal,
					},
					{
						code: sectionTasks,
					},
					{
						code: sectionCopy,
					},
					{
						code: sectionLinks,
					},
				],
				items: this.menuItems,
			});
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				this.task.rights.favorite && this.getFavoriteItem(),
				this.task.rights.watch && this.getWatchItem(),
				this.task.rights.mute && this.getMuteItem(),
				this.userRights.tasks.create && this.getCreateNewTaskItem(),
				this.task.rights.createSubtask && this.getCreateSubtaskItem(),
				this.task.rights.copy && this.getCreateTaskCopyItem(),
				this.userRights.tasks.createFromTemplate && this.getCreateNewTaskWithTemplateItem(),
				false && this.task.rights.saveAsTemplate && this.getCreateTemplateFromTaskItem(), // TODO: handle later
				this.getCopyTaskIdItem(),
				this.getGoToBitrixMarketItem(),
				this.userRights.tasks.robot && this.getGoToRobotsItem(),
			].filter((item: MenuItemOptions) => item);
		},
		isStakeholderLocked(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
		},
	},
	methods: {
		getFavoriteItem(): MenuItemOptions
		{
			const favor = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_FAVOR_ACTION'),
				icon: Outline.FAVORITE,
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_FAVOR_NOTIF_SUCC'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_FAVOR_NOTIF_FAIL'),
			};

			const unFavor = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_UNFAVOR_ACTION'),
				icon: Outline.NON_FAVORITE,
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNFAVOR_NOTIF_SUCC'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNFAVOR_NOTIF_FAIL'),
			};

			const action = this.task.isFavorite ? unFavor : favor;

			return {
				sectionCode: sectionPersonal,
				title: action.title,
				icon: action.icon,
				onClick: async (): void => {
					const isSuccess = await taskService.setFavorite(this.taskId, !this.task.isFavorite);
					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-favorite',
						text: isSuccess ? action.successNotification : action.failNotification,
					});
				},
			};
		},
		getWatchItem(): MenuItemOptions
		{
			const watch = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_BECOME_AUDITOR_ACTION'),
				icon: Outline.OBSERVER,
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_BECOME_AUDITOR_NOTIF_SUCC'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_BECOME_AUDITOR_NOTIF_FAIL'),
				auditorsIds: [...this.task.auditorsIds, this.currentUserId],
				endpoint: 'Task.Audit.watch',
			};

			const unWatch = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_STOP_BEING_AUDITOR_ACTION'),
				icon: Outline.CROSSED_EYE,
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_STOP_BEING_AUDITOR_NOTIF_SUCC'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_STOP_BEING_AUDITOR_NOTIF_FAIL'),
				auditorsIds: this.task.auditorsIds.filter((id: number) => id !== this.currentUserId),
				endpoint: 'Task.Audit.unwatch',
			};

			const action = this.task.auditorsIds.includes(this.currentUserId) ? unWatch : watch;

			return {
				sectionCode: sectionPersonal,
				title: action.title,
				icon: action.icon,
				isLocked: this.isStakeholderLocked,
				onClick: async (): void => {
					if (this.isStakeholderLocked)
					{
						void showLimit({
							featureId: Core.getParams().restrictions.stakeholder.featureId,
							bindElement: this.$el,
						});

						return;
					}

					const result = await taskService.update(this.taskId, {
						auditorsIds: action.auditorsIds,
					});

					const isSuccess = !result[action.endpoint]?.length;

					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-watch',
						text: isSuccess ? action.successNotification : action.failNotification,
					});
				},
			};
		},
		getMuteItem(): MenuItemOptions
		{
			const mute = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_ACTION'),
				icon: Outline.SOUND_OFF,
				successNotificationTitle: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_NOTIF_SUCC_TITLE'),
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_NOTIF_SUCC_DESCR'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_NOTIF_FAIL'),
			};

			const unMute = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_ACTION'),
				icon: Outline.SOUND_ON,
				successNotificationTitle: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_NOTIF_SUCC_TITLE'),
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_NOTIF_SUCC_DESCR'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_NOTIF_FAIL'),
			};

			const action = this.task.isMuted ? unMute : mute;

			return {
				sectionCode: sectionPersonal,
				title: action.title,
				icon: action.icon,
				onClick: async (): void => {
					const isSuccess = await taskService.setMute(this.taskId, !this.task.isMuted);
					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-mute',
						title: action.successNotificationTitle,
						text: isSuccess ? action.successNotification : action.failNotification,
					});
				},
			};
		},
		getCreateNewTaskItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionTasks,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK'),
				icon: Outline.TASK,
				onClick: (): void => TaskCard.showCompactCard({ groupId: this.task.groupId }),
			};
		},
		getCreateSubtaskItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionTasks,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_SUBTASK'),
				icon: Outline.RELATED_TASKS,
				onClick: (): void => TaskCard.showCompactCard({ groupId: this.task.groupId, parentId: this.taskId }),
			};
		},
		getCreateTaskCopyItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionTasks,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TASK_COPY'),
				icon: Outline.DUPLICATE,
				onClick: (): void => TaskCard.showFullCard({ copiedFromId: this.taskId }),
			};
		},
		getCreateNewTaskWithTemplateItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionTasks,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK_WITH_TEMPLATE'),
				icon: Outline.CHEVRON_RIGHT_L,
				onClick: (): void => {
					// TODO: change to new template creation page when it will be ready
					BX.SidePanel.Instance.open(`/company/personal/user/${this.currentUserId}/tasks/templates/`, {
						newWindowLabel: false,
						copyLinkLabel: false,
					});
				},
			};
		},
		getCreateTemplateFromTaskItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionTasks,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TEMPLATE_FROM_TASK'),
				icon: Outline.TEMPLATE_TASK,
				onClick: (): void => TaskCard.showCompactCard({ groupId: this.task.groupId }),
			};
		},
		getCopyTaskIdItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionCopy,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_ID_ACTION'),
				icon: Outline.COPY,
				onClick: (): void => {
					const isCopyingSuccess = BX.clipboard.copy(this.taskId);
					if (isCopyingSuccess)
					{
						Notifier.notifyViaBrowserProvider({
							id: 'task-notify-copy',
							text: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_ID_NOTIF'),
						});
					}
				},
			};
		},
		getGoToBitrixMarketItem(): MenuItemOptions
		{
			return {
				sectionCode: sectionLinks,
				uiButtonOptions: {
					icon: Outline.MARKET,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_BITRIX_MARKET'),
					size: ButtonSize.SMALL,
					useAirDesign: true,
					style: AirButtonStyle.OUTLINE,
					wide: true,
					disabled: false,
					onclick: (): void => BX.rest.Marketplace.open({ PLACEMENT: 'TASK_LIST_CONTEXT_MENU' }),
				},
			};
		},
		getGoToRobotsItem(): MenuItemOptions
		{
			const isLocked = !Core.getParams().restrictions.robots.available;

			return {
				sectionCode: sectionLinks,
				uiButtonOptions: {
					icon: isLocked ? Outline.LOCK_L : Outline.ROBOT,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_ROBOTS'),
					size: ButtonSize.SMALL,
					useAirDesign: true,
					style: AirButtonStyle.OUTLINE,
					wide: true,
					disabled: false,
					onclick: (): void => {
						if (isLocked)
						{
							this.isMenuShown = false;

							void showLimit({
								featureId: Core.getParams().restrictions.robots.featureId,
								bindElement: this.$refs.container,
							});

							return;
						}

						BX.SidePanel.Instance.open(
							`/bitrix/components/bitrix/tasks.automation/slider.php?site_id=${this.loc('SITE_ID')}&project_id=${this.task.groupId}&task_id=${this.taskId}`,
							{ cacheable: false, customLeftBoundary: 0, loader: 'bizproc:automation-loader' },
						);
					},
				},
			};
		},
	},
	template: `
		<div
			class="tasks-full-card-header-burger"
			ref="container"
			@click="isMenuShown = true"
		>
			<BIcon :name="Outline.MORE_L" hoverable/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`,
};
