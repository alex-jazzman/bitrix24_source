import { Loc } from 'main.core';

import { type CatalogItem } from '../tab-controller';
import { CatalogShareDialog } from '../share/catalog-share-dialog';

type CatalogPopupItemShareMenuItem = {
	title: string,
	dataset: { testid: string },
	onClick: () => void,
};

export class CatalogPopupItemShareAction
{
	#item: CatalogItem;

	constructor(item: CatalogItem)
	{
		this.#item = item;
	}

	canBeShared(): boolean
	{
		return this.#item.kind === 'application' && this.#item.canShare === true;
	}

	getMenuItem(trigger: HTMLElement): ?CatalogPopupItemShareMenuItem
	{
		if (!this.canBeShared())
		{
			return null;
		}

		return {
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_SHARE'),
			dataset: { testid: 'vibecode-catalog-share-menu' },
			onClick: () => {
				CatalogShareDialog.show({
					application: {
						id: this.#item.id,
						title: this.#item.title,
						iconUrl: this.#item.iconUrl,
						color: this.#item.color,
						viewUrl: this.#item.viewUrl,
					},
					trigger,
				});
			},
		};
	}
}
