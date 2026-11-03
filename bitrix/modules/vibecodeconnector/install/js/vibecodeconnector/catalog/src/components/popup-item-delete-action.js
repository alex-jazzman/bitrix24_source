import { Loc, Tag } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { MY_TAB_ID } from '../constants';
import { openUrl } from '../utils/links';
import { getCatalogBrand } from '../utils/settings';

type CatalogPopupItemDeleteMenuItem = {
	title: string,
	onClick: () => void,
};

export class CatalogPopupItemDeleteAction
{
	#item: CatalogItem;
	#tab: TabConfig | null;

	constructor(item: CatalogItem, tab: TabConfig | null = null)
	{
		this.#item = item;
		this.#tab = tab;
	}

	canBeDeleted(): boolean
	{
		return this.#tab?.id === MY_TAB_ID
			&& this.#item.isMine === true
			&& this.#item.editUrl !== null;
	}

	getMenuItem(): ?CatalogPopupItemDeleteMenuItem
	{
		if (!this.canBeDeleted())
		{
			return null;
		}

		return {
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_DELETE'),
			onClick: () => this.#confirmDelete(),
		};
	}

	#confirmDelete(): void
	{
		const deleteDialogTextMessageId = getCatalogBrand() === 'alaio'
			? 'VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_TEXT_ALAIO'
			: 'VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_TEXT_BITRIX24';
		const content = Tag.render`
			<div class="vibecode-catalog__delete-dialog ui-text --sm" data-testid="vibecode-catalog-delete-dialog">
				${Loc.getMessage(deleteDialogTextMessageId)}
			</div>
		`;

		const cancelButton = new Button({
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_CANCEL'),
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			dataset: { testid: 'vibecode-catalog-delete-dialog-cancel' },
			onclick: () => dialog.hide(),
		});

		const confirmButton = new Button({
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_CONFIRM'),
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			dataset: { testid: 'vibecode-catalog-delete-dialog-confirm' },
			onclick: () => {
				openUrl(this.#item.editUrl);
				dialog.hide();
			},
		});

		const dialog = new Dialog({
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_TITLE'),
			content,
			width: 400,
			hasOverlay: true,
			rightButtons: [cancelButton, confirmButton],
		});

		dialog.show();
	}
}
