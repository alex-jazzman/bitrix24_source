import { Dom, Runtime, Tag, Type } from 'main.core';
import { Loader } from 'main.loader';
import { Popup, PopupManager } from 'main.popup';
import { type Store } from 'ui.vue3.vuex';

import { Logger } from 'im.v2.lib.logger';

import '../css/placement-popup.css';

const POPUP_ID_PREFIX = 'im-market-app-popup';
const POPUP_BORDER_RADIUS = '10px';
// compensates the margin the popup reserves above the bind element for its shadow
const POPUP_OFFSET_TOP = -10;
const LOADER_SIZE = 40;
const MAX_LIVE_PLACEMENTS = 8;

export type PlacementViewOptions = {
	dialogId: string,
	appId: string,
	bindElement: HTMLElement,
	width: number,
	height: number,
};

type PlacementHandlers = {
	loadPlacement: (appId: string, dialogId: string) => Promise<string>,
	unloadPlacement: (appId: string, dialogId: string) => void,
	store: Store,
};

type LivePlacement = {
	key: string,
	dialogId: string,
	appId: string,
	popup: Popup,
	frameContainer: HTMLElement,
};

const getKey = (dialogId: string, appId: string): string => `${dialogId}|${appId}`;

/**
 * Owns the popups of the textarea placements: an iframe is only alive while it stays in the DOM,
 * so both the popup and its container are created here and outlive the Vue panel of the chat.
 */
export class PlacementPopupManager
{
	#loadPlacement: (appId: string, dialogId: string) => Promise<string>;
	#unloadPlacement: (appId: string, dialogId: string) => void;
	#store: Store;

	// popup instances must stay out of any reactive proxy - Vue breaks their private fields,
	// so only this map lives here, while all the readable state belongs to the market model
	#placements: Map<string, LivePlacement> = new Map();

	constructor(handlers: PlacementHandlers)
	{
		this.#loadPlacement = handlers.loadPlacement;
		this.#unloadPlacement = handlers.unloadPlacement;
		this.#store = handlers.store;
	}

	show(options: PlacementViewOptions): void
	{
		const { dialogId, appId, bindElement } = options;

		const openedAppId = this.#getOpenedAppId(dialogId);
		if (Type.isStringFilled(openedAppId) && openedAppId !== appId)
		{
			this.close(dialogId, openedAppId);
		}

		const placement = this.#getAlivePlacement(dialogId, appId) ?? this.#createPlacement(options);
		this.#touchPlacement(placement);

		// the panel of every chat has its own icons, so the anchor is taken anew on each show
		placement.popup.setBindElement(bindElement);
		placement.popup.show();
		placement.popup.adjustPosition({ forceBindPosition: true, position: 'top' });

		void this.#store.dispatch('market/setOpenedPlacement', { dialogId, appId });

		this.#evictExtraPlacements();
	}

	close(dialogId: string, appId: string): void
	{
		// Popup.destroy() emits no close event, so a popup destroyed from outside
		// has to be disassembled here - otherwise the chat keeps it as opened
		this.#getAlivePlacement(dialogId, appId)?.popup.close();
	}

	closeDialog(dialogId: string): void
	{
		const openedAppId = this.#getOpenedAppId(dialogId);
		if (Type.isStringFilled(openedAppId))
		{
			this.close(dialogId, openedAppId);
		}
	}

	destroyPlacement(dialogId: string, appId: string): void
	{
		const key = getKey(dialogId, appId);
		const placement = this.#placements.get(key);
		if (!placement)
		{
			return;
		}

		this.#placements.delete(key);
		this.#setLivePlacements(this.#getLivePlacements().filter((livePlacement) => {
			return getKey(livePlacement.dialogId, livePlacement.appId) !== key;
		}));
		this.#clearOpenedApp(dialogId, appId);

		this.#unloadPlacement(appId, dialogId);
		placement.popup.destroy();

		Logger.warn(`MarketManager: placement ${key} destroyed`);
	}

	destroyAll(): void
	{
		[...this.#placements.values()].forEach(({ dialogId, appId }) => {
			this.destroyPlacement(dialogId, appId);
		});
	}

	#getAlivePlacement(dialogId: string, appId: string): ?LivePlacement
	{
		const placement = this.#placements.get(getKey(dialogId, appId)) ?? null;
		if (placement && placement.popup.isDestroyed())
		{
			// somebody outside destroyed the popup and its DOM, so the iframe is dead anyway
			this.destroyPlacement(dialogId, appId);

			return null;
		}

		return placement;
	}

	#createPlacement(options: PlacementViewOptions): LivePlacement
	{
		const { dialogId, appId, width, height, bindElement } = options;
		const key = getKey(dialogId, appId);

		const frameContainer = Tag.render`<div class="bx-im-market-placement__frame"></div>`;
		const loaderContainer = Tag.render`<div class="bx-im-market-placement__loader"></div>`;
		const content = Tag.render`
			<div class="bx-im-market-placement__container">${loaderContainer}${frameContainer}</div>
		`;

		const popupId = `${POPUP_ID_PREFIX}-${dialogId}-${appId}`;
		PopupManager.getPopupById(popupId)?.destroy();

		const placement: LivePlacement = {
			key,
			dialogId,
			appId,
			frameContainer,
			popup: new Popup({
				id: popupId,
				content,
				width,
				height,
				bindElement,
				bindOptions: { position: 'top' },
				offsetTop: POPUP_OFFSET_TOP,
				offsetLeft: 0,
				padding: 0,
				className: 'bx-im-messenger__scope',
				// a closed popup keeps its content: the iframe survives until the placement is destroyed
				cacheable: true,
				closeIcon: false,
				autoHide: true,
				closeByEsc: true,
				animation: false,
				borderRadius: POPUP_BORDER_RADIUS,
				contentBorderRadius: POPUP_BORDER_RADIUS,
				events: {
					onPopupClose: () => this.#onPopupClose(placement),
				},
			}),
		};

		this.#placements.set(key, placement);
		this.#loadFrame(placement, loaderContainer);

		Logger.warn(`MarketManager: placement ${key} created`);

		return placement;
	}

	#loadFrame(placement: LivePlacement, loaderContainer: HTMLElement): void
	{
		const loader = new Loader({ target: loaderContainer, size: LOADER_SIZE, mode: 'inline' });
		void loader.show();

		const releaseLoader = () => {
			loader.destroy();
			Dom.remove(loaderContainer);
		};

		void this.#loadPlacement(placement.appId, placement.dialogId).then((layoutHtml: string) => {
			releaseLoader();

			// the same key may already belong to a recreated placement - only the own one counts
			if (this.#placements.get(placement.key) !== placement)
			{
				return;
			}

			Runtime.html(placement.frameContainer, layoutHtml);
		}).catch(() => {
			releaseLoader();

			if (this.#placements.get(placement.key) !== placement)
			{
				return;
			}

			this.destroyPlacement(placement.dialogId, placement.appId);
		});
	}

	#onPopupClose(placement: LivePlacement): void
	{
		this.#clearOpenedApp(placement.dialogId, placement.appId);
	}

	#getOpenedAppId(dialogId: string): ?string
	{
		return this.#store.getters['market/getOpenedAppId'](dialogId);
	}

	#getLivePlacements(): {dialogId: string, appId: string}[]
	{
		return this.#store.getters['market/getLivePlacements'];
	}

	#setLivePlacements(placements: {dialogId: string, appId: string}[]): void
	{
		void this.#store.dispatch('market/setLivePlacements', { placements });
	}

	#touchPlacement({ dialogId, appId }: LivePlacement): void
	{
		const rest = this.#getLivePlacements().filter((livePlacement) => {
			return getKey(livePlacement.dialogId, livePlacement.appId) !== getKey(dialogId, appId);
		});

		this.#setLivePlacements([{ dialogId, appId }, ...rest]);
	}

	#evictExtraPlacements(): void
	{
		const livePlacements = this.#getLivePlacements();
		const overflow = livePlacements.length - MAX_LIVE_PLACEMENTS;
		if (overflow <= 0)
		{
			return;
		}

		// walk from the least recent tail; an opened placement is visible right now and is never evicted
		const extraPlacements = [...livePlacements]
			.reverse()
			.filter(({ dialogId, appId }) => this.#getOpenedAppId(dialogId) !== appId)
			.slice(0, overflow);

		extraPlacements.forEach(({ dialogId, appId }) => {
			this.destroyPlacement(dialogId, appId);
		});
	}

	#clearOpenedApp(dialogId: string, appId: string): void
	{
		// the action itself keeps the record when another application is already opened there
		void this.#store.dispatch('market/clearOpenedPlacement', { dialogId, appId });
	}
}
