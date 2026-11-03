import { Dialog, Item, type DialogOptions } from 'ui.entity-selector';

import './entity-selector-dialog.css';

export { Item };
export { restoreOpenerFocus, isFocusLost } from './restore-opener-focus';
export type ItemId = [string, number | string];

export class EntitySelectorDialog extends Dialog
{
	constructor(dialogOptions: DialogOptions)
	{
		const minHeight = 280;
		const minTagSelectorHeight = 34;
		const options = {
			// height grows with the tag selector: reserve 2 extra lines of the ui.entity-selector 3-line default
			height: Math.max(minHeight, dialogOptions.height ?? (window.innerHeight / 2 - minTagSelectorHeight * 2)),
			...dialogOptions,
			offsetAnimation: false,
			compactView: true,
		};

		super(options);
	}

	showTo(targetNode: HTMLElement): void
	{
		this.getPopup();
		this.setTargetNode(targetNode);
		this.getPopup().bringToFront();
		this.unfreeze();
		this.show();
	}

	selectItemsByIds(items: ItemId[]): void
	{
		this.getItems().forEach((item: Item) => {
			const isSelected = this.#inIds(item, items);

			if (isSelected)
			{
				item.select(true);
			}

			if (!isSelected)
			{
				item.deselect(true);
			}
		});
	}

	setSelectableByIds({ selectable, unselectable }: { selectable: ItemId[], unselectable: ItemId[] }): void
	{
		this.getItems().forEach((item: Item) => {
			if (this.#inIds(item, selectable))
			{
				item.setDeselectable(true);
			}

			if (this.#inIds(item, unselectable))
			{
				item.setDeselectable(false);
			}
		});
	}

	#inIds(item: Item, items: ItemId[]): boolean
	{
		const itemId = [item.getEntityId(), item.getId()];

		return items.some((it) => itemId[0] === it[0] && String(itemId[1]) === String(it[1]));
	}
}
