import { ajax, Loc } from 'main.core';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { MY_TAB_ID } from '../constants';

type CatalogPopupItemPinActionOptions = {
	onPinToggled?: () => void,
};

type CatalogPopupItemPinMenuItem = {
	title: string,
	onClick: () => void,
};

export class CatalogPopupItemPinAction
{
	#item: CatalogItem;
	#tab: TabConfig | null;
	#onPinToggled: (() => void) | null;

	constructor(
		item: CatalogItem,
		tab: TabConfig | null = null,
		options: CatalogPopupItemPinActionOptions = {},
	)
	{
		this.#item = item;
		this.#tab = tab;
		this.#onPinToggled = options.onPinToggled ?? null;
	}

	canBePinned(): boolean
	{
		return this.#tab?.id === MY_TAB_ID && this.#item.isHidden !== true;
	}

	getMenuItem(): ?CatalogPopupItemPinMenuItem
	{
		if (!this.canBePinned())
		{
			return null;
		}

		return {
			title: Loc.getMessage(
				this.#item.isPinned
					? 'VIBECODECONNECTOR_CATALOG_MENU_UNPIN'
					: 'VIBECODECONNECTOR_CATALOG_MENU_PIN',
			),
			onClick: () => this.toggle(),
		};
	}

	toggle(): void
	{
		const action = this.#item.isPinned
			? 'vibecodeconnector.Catalog.unpin'
			: 'vibecodeconnector.Catalog.pin';

		this.#item.isPinned = !this.#item.isPinned;
		this.#onPinToggled?.();

		ajax.runAction(action, {
			data: { ...this.#tab?.extraData, catalogItemId: this.#item.id },
		}).catch((error) => {
			this.#item.isPinned = !this.#item.isPinned;
			this.#onPinToggled?.();
			console.error('[vibecodeconnector.catalog] failed to toggle pin', this.#item.id, error);
		});
	}
}
