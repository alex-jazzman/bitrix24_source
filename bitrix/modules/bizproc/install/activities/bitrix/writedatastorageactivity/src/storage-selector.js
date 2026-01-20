import { Loc, Text } from 'main.core';
import { TagSelector, ItemOptions } from 'ui.entity-selector';
import { Router } from 'bizproc.router';
import StorageSelectorFooter from './storage-selector-footer';

export type StorageItem = {
	id: number,
	title: string,
	selected?: boolean | false
}
export type EventHandler = (event: MouseEvent) => void

export type EventHandlers = {
	onCreateNewStorageHandler: EventHandler,
};

class StorageSelector
{
	#entityId: string = 'bizproc-storage';
	#tabId: string = 'storage-tab';
	#storageIdField: HTMLInputElement;
	#storageItems: StorageItem[];
	#eventHandlers: EventHandlers = null;

	constructor(
		storageIdField: HTMLInputElement,
		storageItems: StorageItem[],
		eventHandlers: EventHandlers,
	)
	{
		this.#storageIdField = storageIdField;
		this.#storageItems = storageItems;
		this.#eventHandlers = eventHandlers;
	}

	#currentValue(): number | null
	{
		const value = parseInt(this.#storageIdField.value);

		return Number.isNaN(value) ? null : value;
	}

	#createStorageItems(): ItemOptions[]
	{
		const storageId = this.#currentValue();

		return this.#storageItems.map((item) =>
			this.#createItemOptions(item, storageId !== null && item.id === storageId)
		);
	}

	#createTagSelector(items: ItemOptions[]): TagSelector
	{
		return new TagSelector({
			dialogOptions: {
				items,
				tabs: [
					{ id: this.#tabId, title: Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_STORAGE_TAB_TITLE') },
				],
				width: 400,
				height: 300,
				enableSearch: true,
				compactView: true,
				dropdownMode: true,
				showAvatars: false,
				events: {
					'Item:onSelect': (event) => {
						const { item: selectedItem } = event.getData();

						this.#storageIdField.value = selectedItem.getId();

						this.#storageIdField.dispatchEvent(new Event('change'));
					},
					'Item:onDeselect': (event) => {
						this.#storageIdField.value = '';

						this.#storageIdField.dispatchEvent(new Event('change'));
					},
				},
				footer: StorageSelectorFooter,
				footerOptions: {
					onCreateNewStorageHandler: this.#eventHandlers.onCreateNewStorageHandler,
				},
			},
			multiple: false,
			tagMaxWidth: 500,
			textBoxWidth: 100,
			events: {
				'onAfterTagAdd': (event: BaseEvent) => {
					const selector: TagSelector = event.getTarget();
					const { tag } = event.getData();

					const itemOptions = this.#createItemOptions(
						{ id: tag.id, title: tag.title.text },
						true
					);
					selector.dialog.addItem(itemOptions);
					this.#setSelectedStorage(tag.id, tag.title.text);
				}
			}
		});
	}

	#createItemOptions(item: StorageItem, selected: boolean = false): ItemOptions
	{
		return {
			id: item.id,
			title: item.title,
			entityId: this.#entityId,
			tabs: this.#tabId,
			selected: selected,
			linkTitle: Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_OPEN_STORAGE_LIST'),
			link: `/bitrix/components/bitrix/bizproc.storage.item.list/?storageId=${item.id}`,
		};
	}

	#setSelectedStorage(storageId: number, title: string): void
	{
		const field = this.#storageIdField;
		let option = [...field.options].find(o => o.value == storageId);
		if (!option)
		{
			option = new Option(Text.encode(title ?? ''), Text.encode(storageId));
			field.add(option);
		}

		field.value = storageId;

		field.dispatchEvent(new Event('change'));
	}

	getTagSelector(targetNode: HTMLElement): TagSelector
	{
		Router.init();

		const items = this.#createStorageItems();

		return this.#createTagSelector(items);
	}
}

export default StorageSelector;