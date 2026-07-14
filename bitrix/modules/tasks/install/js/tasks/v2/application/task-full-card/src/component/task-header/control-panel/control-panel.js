import { BIcon, Outline, Solid, Main } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Notifier } from 'ui.notification-manager';
import { Popup } from 'ui.vue3.components.popup';
import { mapGetters } from 'ui.vue3.vuex';

import { TaskCard } from 'tasks.v2.application.task-card';
import {
	TasksControlPanel,
	TasksControlPanelSection,
	TasksControlPanelMenu,
	TasksControlPanelInfo,
} from 'tasks.v2.component.tasks-control-panel';
import { TasksEntityPicker } from 'tasks.v2.component.tasks-entity-picker';
import { Analytics, EntitySelectorEntity, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { TasksOpenerFullCard } from '../tasks-opener-full-card/tasks-opener-full-card.js';
import './control-panel.css';

const templatePickerOpenerId = 'templatePickerOpener';

// @vue/component
export const ControlPanel = {
	name: 'TaskFullCardControlPanel',
	components: {
		Popup,
		BIcon,
		TasksOpenerFullCard,
		TasksControlPanel,
		TasksControlPanelSection,
		TasksControlPanelMenu,
		TasksControlPanelInfo,
		TasksEntityPicker,
	},
	inject: {
		analytics: {},
		embedded: {},
		task: {},
		taskId: {},
	},
	setup(): {}
	{
		return {
			Main,
			Outline,
			Solid,
			userRights: Core.getParams().rights,
		};
	},
	data(): Object
	{
		return {
			intervalAutoHideWorkaround: null,
			isControlPanelOpened: false,
			isTemplatesPickerOpened: false,
			popupOpenerTemplatesPicker: null,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		isStakeholderLocked(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
		},
		isInnerPopupOpened(): boolean
		{
			return Boolean(this.isTemplatesPickerOpened);
		},
		isSelfHideEnabled(): boolean
		{
			return !(this.isInnerPopupOpened);
		},
		optionsPopupControlPanel(): any
		{
			const popupWidth = 340;

			return {
				bindElement: this.$refs.controlPanelOpener,
				className: 'tasks-full-card-header__control-panel-popup',
				width: popupWidth,
				offsetTop: 10,
				offsetLeft: 10 + this.$refs.controlPanelOpener.offsetWidth - popupWidth,
			};
		},
		optionsPopupTemplatesPicker(): any
		{
			const openerElement = this.popupOpenerTemplatesPicker;
			const openerWidth = openerElement ? openerElement.offsetWidth : 0;
			const openerHeight = openerElement ? openerElement.offsetHeight : 0;

			return {
				positioning: {
					elementAnchor: openerElement,
					offsetVertical: ((openerHeight * -1) - 10),
					offsetHorizontal: (openerWidth + 5),
				},
			};
		},
		optionsTemplatesPicker(): any
		{
			const popupWidth = 385;
			const popupHeight = 385;

			return {
				context: 'tasks-card',
				width: popupWidth,
				height: popupHeight,
				autoHide: false,
				closeByEsc: false,
				multiple: false,
				enableSearch: true,
				dropdownMode: true,
				entities: [
					{
						id: EntitySelectorEntity.TemplateCommon,
						options: {
							isFullListOpenable: true,
						},
					},
				],
				popupOptions: {
					className: 'popup-window_entity-picker-no-check',
				},
			};
		},
		itemToggleWatch(): MenuItemOptions
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
				title: action.title,
				icon: action.icon,
				isLocked: this.isStakeholderLocked,
				isDisabled: !this.task.rights.watch,
				handleClickItem: async (): void => {
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
		itemToggleNotification(): MenuItemOptions
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
				title: action.title,
				icon: action.icon,
				isDisabled: !this.task.rights.mute,
				handleClickItem: async (): void => {
					const isSuccess = await taskService.setMute(this.taskId, !this.task.isMuted);
					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-mute',
						title: action.successNotificationTitle,
						text: isSuccess ? action.successNotification : action.failNotification,
					});
				},
			};
		},
		itemToggleFavor(): MenuItemOptions
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
				title: action.title,
				icon: action.icon,
				isDisabled: !this.task.rights.favorite,
				handleClickItem: async (): void => {
					const isSuccess = await taskService.setFavorite(this.taskId, !this.task.isFavorite);
					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-favorite',
						text: isSuccess ? action.successNotification : action.failNotification,
					});
				},
			};
		},
		itemCopyUrl(): MenuItemOptions
		{
			const action = {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_URL_ACTION'),
				icon: Outline.LINK,
				successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_URL_NOTIF_SUCC'),
				failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_URL_NOTIF_FAIL'),
			};

			return {
				title: action.title,
				icon: action.icon,
				handleClickItem: async (): void => {
					const path = TaskCard.getUrl(this.taskId);
					const url = `${window.location.origin}${path}`;
					const isCopyingSuccess = Boolean(path) && BX.clipboard.copy(url);
					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-copy-url',
						text: isCopyingSuccess ? action.successNotification : action.failNotification,
					});
				},
			};
		},
		itemCreationTaskNew(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK'),
				icon: Outline.TASK,
				handleClickItem: (): void => {
					this.isControlPanelOpened = false;
					TaskCard.showCompactCard({
						groupId: this.task.groupId,
						analytics: this.getAnalytics(),
					});
				},
			};
		},
		itemCreationSubtask(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_SUBTASK'),
				icon: Outline.RELATED_TASKS,
				handleClickItem: (): void => {
					this.isControlPanelOpened = false;
					TaskCard.showCompactCard({
						groupId: this.task.groupId,
						parentId: this.taskId,
						analytics: this.getAnalytics(Analytics.Element.ContextMenuSubtask),
					});
				},
			};
		},
		itemCreationTaskCopy(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TASK_COPY'),
				icon: Outline.DUPLICATE,
				handleClickItem: (): void => TaskCard.showFullCard({
					copiedFromId: this.taskId,
					analytics: this.getAnalytics(),
				}),
			};
		},
		itemCreationTaskNewWithTemplate(): MenuItemOptions
		{
			return {
				id: templatePickerOpenerId,
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK_WITH_TEMPLATE'),
				icon: Outline.TEMPLATE_TASK,
				handleClickItem: this.handleClickTemplatesPickerOpener,
				isActive: this.isTemplatesPickerOpened,
			};
		},
		itemCreationTemplateFromTask(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TEMPLATE_FROM_TASK'),
				icon: Outline.TEMPLATE_TASK,
				handleClickItem: (): void => TaskCard.showCompactCard({
					groupId: this.task.groupId,
					analytics: this.getAnalytics(),
				}),
			};
		},
		itemRoutingBitrixMarket(): MenuItemOptions
		{
			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_BITRIX_MARKET'),
				icon: Outline.MARKET,
				handleClickItem: (): void => {
					this.isControlPanelOpened = false;
					BX.rest.Marketplace.open({ PLACEMENT: 'TASK_LIST_CONTEXT_MENU' });
				},
			};
		},
		itemRoutingRobots(): MenuItemOptions
		{
			const isLocked = !Core.getParams().restrictions.robots.available;

			return {
				title: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_ROBOTS'),
				icon: isLocked ? Outline.LOCK_L : Outline.ROBOT,
				handleClickItem: (): void => {
					if (isLocked)
					{
						this.isMenuShown = false;

						void showLimit({
							featureId: Core.getParams().restrictions.robots.featureId,
							bindElement: this.$refs.container,
						});

						return;
					}

					this.isControlPanelOpened = false;
					BX.SidePanel.Instance.open(
						`/bitrix/components/bitrix/tasks.automation/slider.php?site_id=${this.loc('SITE_ID')}&project_id=${this.task.groupId}&task_id=${this.taskId}`,
						{ cacheable: false, customLeftBoundary: 0, loader: 'bizproc:automation-loader' },
					);
				},
			};
		},
		itemsToggle(): any
		{
			return [
				this.itemToggleWatch,
				this.itemToggleNotification,
				this.itemCopyUrl,
			].filter((item: MenuItemOptions) => item);
		},
		itemsCreation(): any
		{
			return [
				this.userRights.tasks.create && this.itemCreationTaskNew,
				this.task.rights.createSubtask && this.itemCreationSubtask,
				this.task.rights.copy && this.itemCreationTaskCopy,
				this.userRights.tasks.createFromTemplate && this.itemCreationTaskNewWithTemplate,
				false && this.task.rights.saveAsTemplate && this.itemCreationTemplateFromTask, // TODO: handle later
				this.itemToggleFavor,
			].filter((item: MenuItemOptions) => item);
		},
		itemsRouting(): any
		{
			return [
				this.itemRoutingBitrixMarket,
				this.userRights.tasks.robot && this.itemRoutingRobots,
			].filter((item: MenuItemOptions) => item);
		},
	},
	watch: {
		isSelfHideEnabled(value): void {
			this.setSelfHide(value);
		},
		async isControlPanelOpened(value): void {
			await this.$nextTick();
			this.popupOpenerTemplatesPicker = value ? document.getElementById(templatePickerOpenerId) : null;
		},
	},
	async beforeUnmount(): void
	{
		// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
		// remove this workaround (and other instanses) when main.popup autoHide is fixed
		// it prevents unbinding popup props including autoHide after
		// big bottomsheet is opened, e.g. "All templates" bottomsheet
		if (this.intervalAutoHideWorkaround)
		{
			clearInterval(this.intervalAutoHideWorkaround);
		}
		// workaround end
	},
	methods: {
		getAnalytics(element = Analytics.Element.ContextMenu): Object
		{
			return {
				element,
				context: this.analytics?.context ?? Analytics.Section.Tasks,
				additionalContext: Analytics.SubSection.TaskCard,
			};
		},
		freezeControlPanelPopup(): void
		{
			this.$refs.controlPanelPopup?.getPopupInstance()?.setAutoHide(false);
			this.$refs.controlPanelPopup?.getPopupInstance()?.setClosingByEsc(false);
		},
		unfreezeControlPanelPopup(): void
		{
			setTimeout(() => {
				this.$refs.controlPanelPopup?.getPopupInstance()?.setAutoHide(true);
				this.$refs.controlPanelPopup?.getPopupInstance()?.setClosingByEsc(true);
			}, 100);
		},
		setSelfHide(isSelfHideEnabledNew): void
		{
			if (isSelfHideEnabledNew === false)
			{
				this.freezeControlPanelPopup();
				// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
				if (this.intervalAutoHideWorkaround)
				{
					clearInterval(this.intervalAutoHideWorkaround);
				}

				this.intervalAutoHideWorkaround = setInterval(() => {
					this.setSelfHide(this.isSelfHideEnabled);
				}, 100);
			}
			else
			{
				// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
				if (this.intervalAutoHideWorkaround)
				{
					clearInterval(this.intervalAutoHideWorkaround);
				}
				this.unfreezeControlPanelPopup();
			}
		},
		createTaskFromTemplate(templateId): void
		{
			TaskCard.showFullCard({
				templateId: idUtils.unbox(templateId),
				analytics: {
					context: Analytics.Section.Templates,
					additionalContext: Analytics.SubSection.TemplatesCard,
					element: Analytics.Element.CreateButton,
				},
			});
		},
		showTemplatesPicker(): any {
			this.isTemplatesPickerOpened = true;
		},
		closeTemplatesPicker(): any {
			this.isTemplatesPickerOpened = false;
		},
		handleClickControlPanelOpener(): any
		{
			this.isControlPanelOpened = !this.isControlPanelOpened;
		},
		handleCloseControlPanel(): any
		{
			this.isControlPanelOpened = false;
		},
		handleClickTemplatesPickerOpener(): void {
			event.preventDefault();
			event.stopPropagation();
			this.showTemplatesPicker();
		},
		handleSelectTemplatesPicker(dialog): void
		{
			const entity = dialog.getSelectedItems()[0];
			const entityId = entity?.getId();
			if (entityId > 0)
			{
				this.createTaskFromTemplate(entityId);
				dialog.deselectAll();
			}
		},
		handleCloseTemplatesPicker(): void
		{
			this.closeTemplatesPicker();
		},
	},
	template: `
		<div
			class="tasks-full-card-header__control-panel-opener print-ignore"
			ref="controlPanelOpener"
			@click="handleClickControlPanelOpener"
		>
			<BIcon
				class="tasks-full-card-header__control-panel-opener-icon"
				:name="Outline.HAMBURGER_MENU"
				hoverable
			/>
		</div>
		<Popup
			v-if="isControlPanelOpened"
			ref="controlPanelPopup"
			:options="optionsPopupControlPanel"
			@close="handleCloseControlPanel"
		>
			<TasksControlPanel>
				<TasksControlPanelSection
					:controlItems="itemsToggle"
				>
				</TasksControlPanelSection>
				<TasksControlPanelMenu
					:menuItems="itemsCreation"
				/>
				<TasksControlPanelMenu
					:menuItems="itemsRouting"
				/>
				<TasksControlPanelInfo v-if="embedded">
					<TasksOpenerFullCard />
				</TasksControlPanelInfo>
			</TasksControlPanel>
		</Popup>
		<TasksEntityPicker
			ref="popupTemplatesPicker"
			:isOpened="isTemplatesPickerOpened"
			:optionsPopup="optionsPopupTemplatesPicker"
			:optionsEntityPicker="optionsTemplatesPicker"
			@select="handleSelectTemplatesPicker"
			@close="handleCloseTemplatesPicker"
		/>
	`,
};
