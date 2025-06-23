import { Dialog, Item, type DialogOptions } from 'ui.entity-selector';

export type ItemId = [string, number];

export class EntitySelectorDialog extends Dialog
{
	#isSelectProgrammatically: boolean = false;

	constructor(dialogOptions: DialogOptions)
	{
		const minHeight = 280;
		const minTagSelectorHeight = 34;
		const options = {
			tagSelectorOptions: {
				maxHeight: minTagSelectorHeight * 2,
			},
			...dialogOptions,
			height: Math.max(minHeight, dialogOptions.height ?? (window.innerHeight / 2 - minTagSelectorHeight)),
			events: {
				...dialogOptions.events,
				'Item:onSelect': () => {
					if (this.#isSelectProgrammatically)
					{
						return;
					}

					dialogOptions.events?.['Item:onSelect']?.();
				},
				'Item:onDeselect': () => {
					if (this.#isSelectProgrammatically)
					{
						return;
					}

					dialogOptions.events?.['Item:onDeselect']?.();
				},
			},
		};

		super(options);
	}

	showTo(targetNode: HTMLElement): void
	{
		this.getPopup();
		this.setTargetNode(targetNode);
		this.show();
	}

	selectItemsByIds(items: ItemId[]): void
	{
		this.#isSelectProgrammatically = true;

		this.getItems().forEach((item: Item) => {
			const isSelected = this.#inIds(item, items);

			if (!item.isSelected() && isSelected)
			{
				item.select();
			}

			if (item.isSelected() && !isSelected)
			{
				item.deselect();
			}
		});

		this.#isSelectProgrammatically = false;
	}

	getItemsByIds(items: ItemId[]): Item[]
	{
		return this.getItems().filter((item: Item) => this.#inIds(item, items));
	}

	#inIds(item: Item, items: ItemId[]): boolean
	{
		const itemId = [item.getEntityId(), item.getId()];

		return items.some((it) => itemId[0] === it[0] && itemId[1] === it[1]);
	}
}
