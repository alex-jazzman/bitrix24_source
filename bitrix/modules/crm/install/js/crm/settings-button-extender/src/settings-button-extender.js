import { Extension, Loc, Reflection, Text, Type, userOptions as UserOptions } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Menu, MenuItemOptions } from 'main.popup';
import { Dialog } from 'ui.entity-selector';
import { TodoNotificationSkipMenu } from 'crm.activity.todo-notification-skip-menu';
import { TodoPingSettingsMenu } from 'crm.activity.todo-ping-settings-menu';
import { Restriction } from 'crm.kanban.restriction';
import { SettingsController, Type as SortType } from 'crm.kanban.sort';

import { SortController as GridSortController } from './grid/sort-controller.js';
import { SettingsMigrator } from './settings-migrator';
import { AISettingsService } from './ai-settings-service';
import { BaseChannelHandler } from './handlers/base-channel-handler';
import {
	CHANNEL_TYPE_CALL,
	CHANNEL_TYPE_CHAT,
	CHECKED_CLASS,
	COPILOT_LANGUAGE_ID_SAVE_REQUEST_DELAY,
	COPILOT_LANGUAGE_SELECTOR_POPUP_WIDTH,
	NOT_CHECKED_CLASS,
} from './constants';

import { requireArrayOfString, requireClass, requireClassOrNull, requireStringOrNull } from './params-handling';
import { ChannelHandlerFactory } from './handlers/channel-handler-factory';

const EntityType = Reflection.getClass('BX.CrmEntityType');

export type SettingsButtonExtenderParams = {
	entityTypeId: number,
	categoryId: ?number,
	aiAutostartSettings: ?string, // json
	aiCopilotLanguageId: ?string,
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

	#aiAutostartSettings: null | Object = null;
	#aiCopilotLanguageId: null | string = null;
	#isSetAiSettingsRequestRunning: boolean = false;

	#extensionSettings: Collections.SettingsCollection = Extension.getSettings('crm.settings-button-extender');
	#channelHandlers = new Map();
	#aiSettingsService: AISettingsService;

	constructor(params: SettingsButtonExtenderParams)
	{
		this.#initializeProperties(params);
		this.#initializeMenus(params);
		this.#parseAISettings(params.aiAutostartSettings);
		this.#initializeChannelHandlers();
		this.#bindEvents();
	}

	destroy(): void
	{
		this.#channelHandlers.clear();

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

		this.#aiCopilotLanguageId = params.aiCopilotLanguageId;
		this.#aiSettingsService = new AISettingsService(this.#entityTypeId, this.#categoryId);
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

	#parseAISettings(aiSettingsJson: string | null): void
	{
		const settingsJson = requireStringOrNull(aiSettingsJson, 'params.aiAutostartSettings');
		if (!Type.isStringFilled(settingsJson))
		{
			return;
		}

		try
		{
			const rawSettings = JSON.parse(settingsJson);
			if (Type.isPlainObject(rawSettings))
			{
				this.#aiAutostartSettings = SettingsMigrator.migrateToChannelFormat(rawSettings);
			}
		}
		catch (error)
		{
			throw new Error('Failed to parse AI settings:', error);
		}
	}

	#initializeChannelHandlers(): void
	{
		this.#channelHandlers.clear();

		if (!this.#aiAutostartSettings?.channels)
		{
			return;
		}

		Object.entries(this.#aiAutostartSettings.channels).forEach(([channelType, settings]) => {
			const handler = ChannelHandlerFactory.create(channelType, settings, this.#extensionSettings);
			if (handler)
			{
				handler.setActionClickHandler((event, menuItem, action) => {
					this.#handleChannelAction(channelType, action, event, menuItem);
				});

				this.#channelHandlers.set(channelType, handler);
			}
		});
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
		const showInfoHelper = this.#getInfoHelper();
		const menuItems = [];

		// call settings
		const callHandler = this.#channelHandlers.get(CHANNEL_TYPE_CALL);
		if (callHandler)
		{
			menuItems.push({
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS'),
				disabled: this.#isSetAiSettingsRequestRunning,
				items: callHandler.getMenuItems(showInfoHelper),
			});
		}

		// chat settings
		const chatHandler = this.#channelHandlers.get(CHANNEL_TYPE_CHAT);
		if (chatHandler)
		{
			menuItems.push({
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES'),
				disabled: this.#isSetAiSettingsRequestRunning,
				items: chatHandler.getMenuItems(showInfoHelper),
			});
		}

		if (Type.isStringFilled(this.#aiCopilotLanguageId))
		{
			menuItems.push({
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_LANGUAGE_MSGVER_1'),
				onclick: this.#getInfoHelper(true) ?? this.#handleCoPilotLanguageSelect.bind(this),
			});
		}

		if (menuItems.length === 0)
		{
			return null;
		}

		return {
			text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_IN_CRM'),
			disabled: this.#isSetAiSettingsRequestRunning,
			items: menuItems,
		};
	}

	#handleChannelAction(channelType: string, action: string, event: PointerEvent, menuItem: MenuItem): void
	{
		menuItem.getMenuWindow()?.getRootMenuWindow()?.close();
		menuItem.getMenuWindow()?.getParentMenuItem()?.disable();

		if (this.#isSetAiSettingsRequestRunning)
		{
			return;
		}

		this.#isSetAiSettingsRequestRunning = true;

		setTimeout(() => {
			this.#saveAISettings(menuItem);
		}, 50);
	}

	async #saveAISettings(menuItem: MenuItem): void
	{
		try
		{
			this.#aiAutostartSettings = await this.#aiSettingsService.saveWithErrorHandling(this.#aiAutostartSettings);
			this.#initializeChannelHandlers();
		}
		catch
		{
			// error already handled in service
		}
		finally
		{
			menuItem.getMenuWindow()?.getParentMenuItem()?.enable();

			this.#isSetAiSettingsRequestRunning = false;
		}
	}

	#handleCoPilotLanguageSelect(event: PointerEvent): void
	{
		const languageSelector = new Dialog({
			targetNode: event.target,
			multiple: false,
			showAvatars: false,
			dropdownMode: true,
			compactView: true,
			enableSearch: true,
			context: `COPILOT-LANGUAGE-SELECTOR-${this.#entityTypeId}-${this.#categoryId}`,
			width: COPILOT_LANGUAGE_SELECTOR_POPUP_WIDTH,
			tagSelectorOptions: {
				textBoxWidth: '100%',
			},
			preselectedItems: [
				['copilot_language', this.#aiCopilotLanguageId],
			],
			entities: [{
				id: 'copilot_language',
				options: {
					entityTypeId: this.#entityTypeId,
					categoryId: this.#categoryId,
				},
			}],
			events: {
				'Item:onSelect': (selectEvent: BaseEvent): void => {
					const item = selectEvent.getData().item;
					const languageId = item.id.toLowerCase();
					if (!Type.isStringFilled(languageId))
					{
						throw new Error('Language ID is not defined');
					}

					setTimeout(() => {
						let optionName = `ai_config_${this.#entityTypeId}`;
						if (Type.isInteger(this.#categoryId))
						{
							optionName += `_${this.#categoryId}`;
						}

						UserOptions.save('crm', optionName, 'languageId', languageId);

						this.#aiCopilotLanguageId = languageId;
					}, COPILOT_LANGUAGE_ID_SAVE_REQUEST_DELAY);
				},
			},
		});

		languageSelector.show();
	}

	#getInfoHelper(skipPackagesCheck: boolean = false): ?Function
	{
		if (skipPackagesCheck)
		{
			if (this.#extensionSettings.get('isAIEnabledInGlobalSettings'))
			{
				return null;
			}

			return (): void => {
				if (Reflection.getClass('BX.UI.InfoHelper.show'))
				{
					BX.UI.InfoHelper.show(this.#extensionSettings.get('aiDisabledSliderCode'));
				}
			};
		}

		if (
			this.#extensionSettings.get('isAIEnabledInGlobalSettings')
			&& this.#extensionSettings.get('isAIHasPackages')
		)
		{
			return null;
		}

		return (): void => {
			if (Reflection.getClass('BX.UI.InfoHelper.show'))
			{
				if (!this.#extensionSettings.get('isAIEnabledInGlobalSettings'))
				{
					BX.UI.InfoHelper.show(this.#extensionSettings.get('aiDisabledSliderCode'));
				}
				else if (!this.#extensionSettings.get('isAIHasPackages'))
				{
					BX.UI.InfoHelper.show(this.#extensionSettings.get('aiPackagesEmptySliderCode'));
				}
			}
		};
	}

	// region Public methods
	updateAISettings(settings: Object): void
	{
		if (!SettingsMigrator.isValidChannelFormat(settings))
		{
			throw new Error('Invalid settings format', settings);
		}

		this.#aiAutostartSettings = settings;
		this.#initializeChannelHandlers();
	}

	getChannelHandler(channelType: string): BaseChannelHandler | null
	{
		return this.#channelHandlers.get(channelType);
	}

	isChannelAvailable(channelType: string): boolean
	{
		return this.#channelHandlers.has(channelType);
	}

	getAvailableChannels(): string[]
	{
		return [...this.#channelHandlers.keys()];
	}
	// endregion
}
