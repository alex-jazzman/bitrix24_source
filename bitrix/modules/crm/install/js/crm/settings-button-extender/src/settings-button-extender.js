import { TodoNotificationSkipMenu } from 'crm.activity.todo-notification-skip-menu';
import { TodoPingSettingsMenu } from 'crm.activity.todo-ping-settings-menu';
import { NameService } from 'crm.ai.name-service';
import { Restriction } from 'crm.kanban.restriction';
import { SettingsController, Type as SortType } from 'crm.kanban.sort';
import { Loc, Reflection, Runtime, Text, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { Menu, type MenuItem, type MenuItemOptions } from 'main.popup';
import { CHECKED_CLASS, NOT_CHECKED_CLASS } from './constants';

import { SortController as GridSortController } from './grid/sort-controller.js';

import { requireArrayOfString, requireClass, requireClassOrNull, requireStringOrNull } from './params-handling';

const EntityType = Reflection.getClass('BX.CrmEntityType');

export type SettingsButtonExtenderParams = {
	entityTypeId: number,
	categoryId: ?number,
	isAutomationSliderAvailable: ?boolean,
	pingSettings: Object,
	rootMenu: Menu,
	todoCreateNotificationSkipPeriod: ?string,
	targetItemId: ?string,
	expandsBehindThan: Array<string>;
	controller: ?SettingsController,
	restriction: ?Restriction,
	grid: ?BX.Main.grid,
	smartActivityNotificationSupported: ?boolean,
};

/**
 * @memberOf BX.Crm
 */
export class SettingsButtonExtender
{
	#entityTypeId: number;
	#categoryId: ?number;
	#pingSettings: Object;
	#rootMenu: Menu;
	#targetItemId: ?string;
	#expandsBehindThan: Array<string>;
	#kanbanController: ?SettingsController;
	#restriction: ?Restriction;
	#gridController: ?GridSortController = null;

	#todoSkipMenu: TodoNotificationSkipMenu;
	#todoPingSettingsMenu: TodoPingSettingsMenu;

	#isSetSortRequestRunning: boolean = false;
	#smartActivityNotificationSupported: boolean = false;

	#isAutomationSliderAvailable: boolean = false;

	constructor(params: SettingsButtonExtenderParams)
	{
		this.#initializeProperties(params);
		this.#initializeMenus(params);
		this.#bindEvents();
	}

	destroy(): void
	{
		EventEmitter.unsubscribeAll(EventEmitter.GLOBAL_TARGET, 'onPopupShow');
	}

	#initializeProperties(params: SettingsButtonExtenderParams): void
	{
		this.#entityTypeId = Text.toInteger(params.entityTypeId);
		this.#categoryId = Type.isInteger(params.categoryId) ? params.categoryId : null;
		this.#pingSettings = Type.isPlainObject(params.pingSettings) ? params.pingSettings : {};
		this.#expandsBehindThan = requireArrayOfString(params.expandsBehindThan ?? [], 'params.expandsBehindThan');
		this.#smartActivityNotificationSupported = Text.toBoolean(params.smartActivityNotificationSupported);

		if (EntityType && !EntityType.isDefined(this.#entityTypeId))
		{
			throw new Error(`Provided entityTypeId is invalid: ${this.#entityTypeId}`);
		}

		this.#rootMenu = requireClass(params.rootMenu, Menu, 'params.rootMenu');
		this.#targetItemId = requireStringOrNull(params.targetItemId, 'params.targetItemId');

		this.#kanbanController = requireClassOrNull(params.controller, SettingsController, 'params.controller');
		this.#restriction = requireClassOrNull(params.restriction, Restriction, 'params.restriction');

		if (Reflection.getClass('BX.Main.grid') && params.grid)
		{
			this.#gridController = new GridSortController(this.#entityTypeId, params.grid);
		}

		this.#isAutomationSliderAvailable = params.isAutomationSliderAvailable === true;
	}

	#initializeMenus(params: SettingsButtonExtenderParams): void
	{
		this.#todoSkipMenu = new TodoNotificationSkipMenu({
			entityTypeId: this.#entityTypeId,
			selectedValue: requireStringOrNull(params.todoCreateNotificationSkipPeriod, 'params.todoCreateNotificationSkipPeriod'),
		});

		if (Object.keys(this.#pingSettings).length > 0)
		{
			this.#todoPingSettingsMenu = new TodoPingSettingsMenu({
				entityTypeId: this.#entityTypeId,
				settings: this.#pingSettings,
			});
		}
	}

	#bindEvents(): void
	{
		const createdMenuItemIds = [];

		EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'onPopupShow', (event: BaseEvent) => {
			const popup = event.getTarget();
			if (popup.getId() !== this.#rootMenu.getId())
			{
				return;
			}

			const items = this.#getItems();
			if (items.length <= 0)
			{
				return;
			}

			while (createdMenuItemIds.length > 0)
			{
				this.#rootMenu.removeMenuItem(createdMenuItemIds.pop());
			}

			let targetItemId = this.#resolveEarlyTargetId();
			for (const item of items.reverse()) // new item is *prepended* on top of target item, therefore reverse
			{
				const newItem = this.#rootMenu.addMenuItem(
					item,
					targetItemId,
				);

				if (newItem)
				{
					targetItemId = newItem.getId();
					createdMenuItemIds.push(newItem.getId());
				}
			}
		});
	}

	#getItems(): MenuItemOptions[]
	{
		const items = [];

		const pushCrmSettings = this.#getPushCrmSettings();
		if (pushCrmSettings)
		{
			items.push(pushCrmSettings);
		}

		const coPilotSettings = this.#getCoPilotSettings();
		if (coPilotSettings)
		{
			items.push(coPilotSettings);
		}

		return items;
	}

	#resolveEarlyTargetId(): string | null
	{
		const items = this.#rootMenu.getMenuItems();
		const earlyItem = items.find((item: MenuItem) => this.#expandsBehindThan.includes(item.getId()));

		return earlyItem?.getId() ?? this.#targetItemId;
	}

	#getPushCrmSettings(): ?MenuItemOptions
	{
		const pushCrmItems = [];

		if (this.#shouldShowLastActivitySortToggle())
		{
			pushCrmItems.push(this.#getLastActivitySortToggle());
		}

		if (this.#shouldShowTodoSkipMenu())
		{
			pushCrmItems.push(...this.#todoSkipMenu.getItems());
		}

		if (this.#shouldShowTodoPingSettingsMenu())
		{
			pushCrmItems.push(...this.#todoPingSettingsMenu.getItems());
		}

		if (pushCrmItems.length <= 0)
		{
			return null;
		}

		return {
			text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_PUSH_CRM'),
			items: pushCrmItems,
		};
	}

	#shouldShowLastActivitySortToggle(): boolean
	{
		const shouldShowInKanban = (
			this.#kanbanController?.getCurrentSettings().isTypeSupported(SortType.BY_LAST_ACTIVITY_TIME)
			&& this.#restriction?.isSortTypeChangeAvailable()
		);

		return !!(shouldShowInKanban || this.#gridController?.isLastActivitySortSupported());
	}

	#getLastActivitySortToggle(): MenuItemOptions
	{
		return {
			text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_PUSH_CRM_TOGGLE_SORT'),
			disabled: this.#isSetSortRequestRunning,
			className: this.#isLastActivitySortEnabled() ? CHECKED_CLASS : NOT_CHECKED_CLASS,
			onclick: this.#handleLastActivitySortToggleClick.bind(this),
		};
	}

	#isLastActivitySortEnabled(): boolean
	{
		if (this.#kanbanController)
		{
			return this.#kanbanController.getCurrentSettings().getCurrentType() === SortType.BY_LAST_ACTIVITY_TIME;
		}

		if (this.#gridController)
		{
			return this.#gridController.isLastActivitySortEnabled();
		}

		return false;
	}

	#handleLastActivitySortToggleClick(event: PointerEvent, item: MenuItem): void
	{
		item.getMenuWindow()?.getRootMenuWindow()?.close();
		item.disable();

		if (this.#kanbanController)
		{
			if (this.#isSetSortRequestRunning)
			{
				return;
			}

			this.#isSetSortRequestRunning = true;

			const settings = this.#kanbanController.getCurrentSettings();

			const newSortType = settings.getCurrentType() === SortType.BY_LAST_ACTIVITY_TIME
				? settings.getSupportedTypes().find((sortType) => sortType !== SortType.BY_LAST_ACTIVITY_TIME)
				: SortType.BY_LAST_ACTIVITY_TIME
			;

			this.#kanbanController.setCurrentSortType(newSortType)
				.then(() => {})
				.catch(() => {})
				.finally(() => {
					this.#isSetSortRequestRunning = false;
					item.enable();
				})
			;
		}
		else if (this.#gridController)
		{
			this.#gridController.toggleLastActivitySort();
			item.enable();
		}
		else
		{
			throw new Error('Can not handle last activity toggle click');
		}
	}

	#shouldShowTodoSkipMenu(): boolean
	{
		return this.#smartActivityNotificationSupported;
	}

	#shouldShowTodoPingSettingsMenu(): boolean
	{
		return this.#todoPingSettingsMenu && this.#shouldShowLastActivitySortToggle();
	}

	#getCoPilotSettings(): ?MenuItemOptions
	{
		if (!this.#isAutomationSliderAvailable)
		{
			return null;
		}

		return {
			text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_IN_CRM', NameService.copilotNameReplacement()),
			onclick: this.#openAutomationSlider.bind(this),
		};
	}

	async #openAutomationSlider(): Promise<void>
	{
		this.#rootMenu.close();

		try
		{
			const { SettingsSliderApp } = await Runtime.loadExtension('crm.ai.settings-slider');

			const slider = new SettingsSliderApp(this.#entityTypeId, this.#categoryId);
			slider.open();
		}
		catch (error)
		{
			console.error(error);
		}
	}
}
