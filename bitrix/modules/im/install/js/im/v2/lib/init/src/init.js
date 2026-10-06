import { type JsonObject } from 'main.core';
import { SidePanel } from 'main.sidepanel';

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
import { GuestManager } from 'im.v2.lib.guest';

import { BindingsManager } from './classes/bindings';
import { PreloadedEntity } from './const/const';
import { BindingsCondition } from './const/bindings';

type AnchorLink = {
	anchor: HTMLElement,
	matches: Array,
	target: string,
	url: string,
};

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
		this.#initCopilot();
		this.#initPreloadedEntities();
		this.#initCurrentUserAdminStatus();
		this.#initGuestState();
		this.#initBindings();

		this.#initFolders();

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

	#initLogger()
	{
		const { loggerConfig } = Core.getApplicationData();
		if (!loggerConfig)
		{
			return;
		}

		Logger.setConfig(loggerConfig);
	}

	#initSettings()
	{
		const { settings } = Core.getApplicationData();
		if (!settings)
		{
			return;
		}

		Logger.warn('InitManager: settings', settings);
		void Core.getStore().dispatch('application/settings/set', settings);
	}

	#initTariffRestrictions()
	{
		const { tariffRestrictions } = Core.getApplicationData();
		if (!tariffRestrictions)
		{
			return;
		}

		Logger.warn('InitManager: tariffRestrictions', tariffRestrictions);
		void Core.getStore().dispatch('application/tariffRestrictions/set', tariffRestrictions);
	}

	#initCallManager()
	{
		const { activeCalls } = Core.getApplicationData();
		CallManager.getInstance().updateRecentCallsList(activeCalls);
	}

	#initAnchors()
	{
		const { anchors } = Core.getApplicationData();
		if (!anchors)
		{
			return;
		}

		void Core.getStore().dispatch('messages/anchors/setAnchors', { anchors });
	}

	#initCopilot()
	{
		const { copilot } = Core.getApplicationData();
		void Core.getStore().dispatch('copilot/setName', copilot.botName);
		void Core.getStore().dispatch('copilot/setAgentName', copilot.agentName);
		void Core.getStore().dispatch('copilot/setSuggests', copilot.suggests ?? []);

		if (!copilot.availableEngines)
		{
			return;
		}

		void Core.getStore().dispatch('copilot/setAvailableAIModels', copilot.availableEngines);
	}

	#initPreloadedEntities()
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

	#initCurrentUserAdminStatus()
	{
		const { isCurrentUserAdmin } = Core.getApplicationData();
		void Core.getStore().dispatch('users/setCurrentUserAdminStatus', isCurrentUserAdmin);
	}

	#initGuestState()
	{
		const { isGuestWelcome, videoCallsTermsUrl } = Core.getApplicationData();
		GuestManager.getInstance().setGuestNamePopupState(isGuestWelcome);
		GuestManager.getInstance().setTermsOfServiceUrl(videoCallsTermsUrl);
	}

	#initBindings()
	{
		const rule = {
			condition: Object.values(BindingsCondition),
			handler(event: PointerEvent, link: AnchorLink)
			{
				(new BindingsManager()).routeLink(link.url);

				event.preventDefault();
			},
		};

		SidePanel.Instance.bindAnchors({ rules: [rule] });
	}

	#initFolders()
	{
		const { folders } = Core.getApplicationData();

		void Core.getStore().dispatch('recent/folders/set', folders);
	}
}
