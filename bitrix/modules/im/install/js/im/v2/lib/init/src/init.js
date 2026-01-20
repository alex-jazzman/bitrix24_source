import { Core } from 'im.v2.application.core';
import { CallManager } from 'im.v2.lib.call';
import { PhoneManager } from 'im.v2.lib.phone';
import { SmileManager } from 'im.v2.lib.smile-manager';
import { UserManager } from 'im.v2.lib.user';
import { CounterManager } from 'im.v2.lib.counter';
import { Logger } from 'im.v2.lib.logger';
import { MessageNotifierManager } from 'im.v2.lib.message-notifier';
import { MarketManager } from 'im.v2.lib.market';
import { DesktopManager } from 'im.v2.lib.desktop';
import { PromoManager } from 'im.v2.lib.promo';
import { PermissionManager } from 'im.v2.lib.permission';
import { UpdateStateManager } from 'im.v2.lib.update-state.manager';
import { Router } from 'im.v2.lib.router';

import { PreloadedEntity } from './const/const';

import type { JsonObject } from 'main.core';

export class InitManager
{
	static #instance: InitManager;
	static #inited: boolean = false;

	static getInstance(): InitManager
	{
		InitManager.#instance = InitManager.#instance ?? new InitManager();

		return InitManager.#instance;
	}

	static init(): void
	{
		InitManager.getInstance();
	}

	constructor()
	{
		if (InitManager.#inited)
		{
			return;
		}

		this.#initLogger();
		Logger.warn('InitManager: start');
		this.#initSettings();
		this.#initTariffRestrictions();
		this.#initAnchors();
		this.#initCallManager();
		this.#initAvailableAIModelsList();
		this.#initPreloadedEntities();
		this.#initCurrentUserAdminStatus();

		CounterManager.init();
		PermissionManager.init();
		PromoManager.init();
		MarketManager.init();
		PhoneManager.init();
		SmileManager.init();
		MessageNotifierManager.init();
		DesktopManager.init();
		UpdateStateManager.init();
		Router.handleGetParams();

		InitManager.#inited = true;
	}

	#initLogger(): void
	{
		const { loggerConfig } = Core.getApplicationData();
		if (!loggerConfig)
		{
			return;
		}

		Logger.setConfig(loggerConfig);
	}

	#initSettings(): void
	{
		const { settings } = Core.getApplicationData();
		if (!settings)
		{
			return;
		}

		Logger.warn('InitManager: settings', settings);
		void Core.getStore().dispatch('application/settings/set', settings);
	}

	#initTariffRestrictions(): void
	{
		const { tariffRestrictions } = Core.getApplicationData();
		if (!tariffRestrictions)
		{
			return;
		}

		Logger.warn('InitManager: tariffRestrictions', tariffRestrictions);
		void Core.getStore().dispatch('application/tariffRestrictions/set', tariffRestrictions);
	}

	#initCallManager(): void
	{
		const { activeCalls } = Core.getApplicationData();
		CallManager.getInstance().updateRecentCallsList(activeCalls);
	}

	#initAnchors(): void
	{
		const { anchors } = Core.getApplicationData();
		if (!anchors)
		{
			return;
		}

		void Core.getStore().dispatch('messages/anchors/setAnchors', { anchors });
	}

	#initAvailableAIModelsList(): void
	{
		const { copilot }: ApplicationDataType = Core.getApplicationData();

		if (!copilot.availableEngines)
		{
			return;
		}

		void Core.getStore().dispatch('copilot/setAvailableAIModels', copilot.availableEngines);
	}

	#initPreloadedEntities(): void
	{
		const { preloadedEntities } = Core.getApplicationData();
		if (!preloadedEntities)
		{
			return;
		}

		const preloadedEntitiesHandler = {
			[PreloadedEntity.users]: (users) => (new UserManager()).setUsersToModel(users),
		};

		Object.entries(preloadedEntities).forEach(([entityType: string, items: JsonObject[]]) => {
			if (preloadedEntitiesHandler[entityType])
			{
				preloadedEntitiesHandler[entityType](items);
			}
		});
	}

	#initCurrentUserAdminStatus(): void
	{
		const { isCurrentUserAdmin } = Core.getApplicationData();
		void Core.getStore().dispatch('users/setCurrentUserAdminStatus', isCurrentUserAdmin);
	}
}
