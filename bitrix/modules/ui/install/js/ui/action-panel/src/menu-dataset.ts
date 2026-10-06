import { Dom, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

/**
 * Every popup the panel opens carries it, nested levels included: a host that decides by DOM subtree
 * has no other way to tell a click inside its own menu from a click somewhere on the page.
 */
export const MENU_CLASS_NAME: string = 'ui-air-action-panel__menu';

const POPUP_SHOW_EVENT: string = 'BX.Main.Popup:onShow';

export function applyDataset(node: HTMLElement | null, dataset: { [key: string]: string }): void
{
	if (!node)
	{
		return;
	}

	Object.entries(dataset).forEach(([key, value]) => {
		Dom.attr(node, `data-${key}`, value);
	});
}

/**
 * Stamps the `data-*` set of the panel on the popups `ui.system.menu` builds by itself: a level below
 * the first one and the system menu of a split control. Their options are not the panel's to fill —
 * a popup takes no attributes, and a submenu has its events replaced by the level above — so the only
 * moment such a popup can be reached is the one it appears at. The class of the panel is what tells
 * a popup of ours from any other popup of the page.
 */
export default class MenuPopupDataset
{
	#dataset: { [key: string]: string };
	#watching: boolean = false;

	constructor(dataset: { [key: string]: string })
	{
		this.#dataset = dataset;
	}

	/** Nothing to stamp means nothing to listen to: a host without a dataset costs no subscription. */
	start(): void
	{
		if (this.#watching || Object.keys(this.#dataset).length === 0)
		{
			return;
		}

		this.#watching = true;
		EventEmitter.subscribe(POPUP_SHOW_EVENT, this.#handlePopupShow);
	}

	stop(): void
	{
		if (!this.#watching)
		{
			return;
		}

		this.#watching = false;
		EventEmitter.unsubscribe(POPUP_SHOW_EVENT, this.#handlePopupShow);
	}

	#handlePopupShow = (event: BaseEvent): void => {
		const container = (event.getTarget()?.getPopupContainer?.() ?? null) as HTMLElement | null;

		if (Type.isDomNode(container) && Dom.hasClass(container, MENU_CLASS_NAME))
		{
			applyDataset(container, this.#dataset);
		}
	};
}
