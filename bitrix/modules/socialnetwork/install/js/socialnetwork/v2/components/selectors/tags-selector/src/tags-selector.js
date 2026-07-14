import { Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import { TagSelector, type Item, type DialogOptions, type TagSelectorOptions } from 'ui.entity-selector';

import { EntitySelectorEntity } from 'socialnetwork.v2.const';

export type TagsSelectorOptions = {
	context: string;
	groupId: string | number;
	targetContainer: HTMLElement;
	onSelect: (item: Item) => void;
	onDeselect: (item: Item) => void;
}

export class TagsSelector
{
	#options: TagsSelectorOptions;
	#container: ?HTMLElement;

	constructor(options: TagsSelectorOptions)
	{
		this.#options = options;
		this.selector = this.createSelector();
	}

	createSelector(): TagSelector
	{
		const dialogOptions: DialogOptions = {
			context: this.#options.context,
			width: 350,
			height: 300,
			dropdownMode: true,
			compactView: true,
			cacheable: true,
			preload: true,
			enableSearch: true,
			offsetAnimation: false,
			searchOptions: {
				allowCreateItem: true,
			},
			popupOptions: {
				bindOptions: {
					position: 'top',
				},
				targetContainer: this.#options?.targetContainer ?? document.body,
			},
			entities: [
				{
					id: EntitySelectorEntity.ProjectTag,
					options: {
						groupId: this.#options.groupId,
					},
				},
			],
			events: {
				'Item:onSelect': (event) => {
					const item = event.getData().item;
					this.#options.onSelect?.(item);
				},
				'Item:onDeselect': (event) => {
					const item = event.getData().item;
					this.#options.onDeselect?.(item);
				},
				'Search:onItemCreateAsync': (event: BaseEvent) => this.#createTag(event),
			},
		};

		const tagSelectionOptions: TagSelectorOptions = {
			showAddButton: true,
			multiple: true,
			textBoxWidth: 'auto',
			showCreateButton: false,
			dialogOptions,
		};

		return new TagSelector(tagSelectionOptions);
	}

	async #createTag(event: BaseEvent): Promise<void>
	{
		return new Promise((resolve) => {
			const { searchQuery } = event.getData();
			const name = searchQuery.getQuery().toLowerCase();
			const dialog = event.getTarget();

			setTimeout(() => {
				const tagsList = name.split(',');

				tagsList.forEach((tag) => {
					const item = dialog.addItem({
						id: tag,
						entityId: EntitySelectorEntity.ProjectTag,
						title: tag,
						tabs: ['all', 'recents'],
					});
					if (item)
					{
						item.select();
					}
				});

				resolve();
			}, 1000);
		});
	}

	renderTo(container: HTMLElement, tags: string[] = []): void
	{
		this.#container = container;
		this.selector.renderTo(this.#container);
		this.selector.getDialog().unfreeze();
		this.#setTags(tags);
	}

	#setTags(tags: string[] = []): void
	{
		const dialog = this.selector.dialog;
		if (!Type.isArrayFilled(tags) || !dialog)
		{
			return;
		}

		tags.forEach((tag) => {
			dialog.addItem({
				id: tag,
				title: tag,
				entityId: EntitySelectorEntity.ProjectTag,
				entityType: 'default',
				tabs: 'all',
				selected: true,
			});
		});
	}

	destroy(): void
	{
		this.selector.getDialog()?.destroy();

		if (Type.isDomNode(this.#container))
		{
			this.#container.innerHTML = '';
		}

		this.#container = null;
	}
}
