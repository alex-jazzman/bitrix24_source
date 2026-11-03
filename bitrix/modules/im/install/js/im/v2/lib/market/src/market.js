import { Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { EventType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelMarketApplication } from 'im.v2.model';

import { AvailabilityManager } from './classes/availability-manager';
import { IframeCommunicationManager } from './classes/iframe-communication-manager';
import { MarketService } from './classes/market-service';
import { PlacementPopupManager, type PlacementViewOptions } from './classes/placement-popup-manager';

type MarketApps = {
	items: ImModelMarketApplication[],
	links: {
		load: string
	}
}

export class MarketManager
{
	static #instance: MarketManager;

	#store: Store;
	#marketService: MarketService;
	#availabilityManager: AvailabilityManager;
	#placementPopupManager: PlacementPopupManager;

	static getInstance(): MarketManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	static init()
	{
		MarketManager.getInstance();
	}

	constructor()
	{
		this.#store = Core.getStore();
		this.#marketService = new MarketService();
		this.#availabilityManager = new AvailabilityManager();
		this.#placementPopupManager = new PlacementPopupManager({
			loadPlacement: (appId: string, dialogId: string) => this.loadPlacement(appId, { dialogId }),
			unloadPlacement: (appId: string, dialogId: string) => this.unloadPlacement(appId, dialogId),
			store: this.#store,
		});

		// third-party iframes must not outlive the messenger they were opened in
		EventEmitter.subscribe(EventType.slider.onClose, this.#onSliderClose);

		const { marketApps } = Core.getApplicationData();
		Logger.warn('MarketManager: marketApps', marketApps);
		this.#init(marketApps);
	}

	#onSliderClose = (): void => {
		this.#placementPopupManager.destroyAll();
	};

	getAvailablePlacementsByType(placementType: string, dialogId: string = ''): ImModelMarketApplication[]
	{
		const placements: ImModelMarketApplication[] = this.#store.getters['market/getByPlacement'](placementType);
		const dialog = this.#store.getters['chats/get'](dialogId);
		const dialogType = dialog ? dialog.type : '';

		return this.#availabilityManager.getAvailablePlacements(placements, dialogType);
	}

	loadPlacement(id: number, context: Object = {}): Promise
	{
		const placement = this.#store.getters['market/getById'](Number.parseInt(id, 10));

		return this.#marketService.openPlacement(placement, context);
	}

	unloadPlacement(placementId: string, dialogId: string = '')
	{
		const placementLayouts = Object.values(BX.rest?.layoutList ?? {}).filter((layout) => {
			// a destroyed layout leaves a null record in the list instead of removing it
			if (!Type.isObject(layout?.params))
			{
				return false;
			}

			if (layout.params.placementId !== placementId)
			{
				return false;
			}

			// the same application can be loaded in several chats at once (chat over chat) -
			// when the dialog is known, only its own layouts are destroyed
			return !Type.isStringFilled(dialogId) || layout.params.placementOptions?.dialogId === dialogId;
		});

		placementLayouts.forEach((layout) => {
			layout.destroy();
		});
	}

	showPlacement(options: PlacementViewOptions): void
	{
		this.#placementPopupManager.show(options);
	}

	closePlacement(dialogId: string, appId: string): void
	{
		this.#placementPopupManager.close(dialogId, appId);
	}

	closeDialogPlacement(dialogId: string): void
	{
		this.#placementPopupManager.closeDialog(dialogId);
	}

	static async openSlider(placement: ImModelMarketApplication, context: Object)
	{
		await Runtime.loadExtension('applayout');
		BX.rest.AppLayout.openApplication(placement.loadConfiguration.ID, context, placement.loadConfiguration);
	}

	static openChatMarket(): void
	{
		const placementCode = 'IM_CHAT';

		BX.SidePanel.Instance.open(`/market/?placement=${placementCode}`);
	}

	#init(marketApps: MarketApps)
	{
		if (!marketApps)
		{
			return;
		}

		void this.#store.dispatch('market/set', marketApps);
		this.#marketService.setLoadLink(marketApps.links.load);
		IframeCommunicationManager.init();
	}
}
