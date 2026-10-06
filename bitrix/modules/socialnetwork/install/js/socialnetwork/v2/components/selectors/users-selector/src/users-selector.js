import {
	TagSelector,
	type Item,
	type DialogOptions,
	type TagSelectorOptions,
	type EntityOptions,
} from 'ui.entity-selector';

import { EntitySelectorEntity } from 'socialnetwork.v2.const';

import './user-selector.css';

export type { Item };

export type UsersSelectorOptions = {
	context: string,
	multiple: boolean,
	preselectedIds: Array<string | number> | string | number | null,
	preselectedItems: ?Array<[$Values<typeof EntitySelectorEntity>, number | string]>,
	targetContainer: HTMLElement,
	entities: ?Array<typeof EntitySelectorEntity>,
	onSelect: Function,
	onDeselect: Function,
};

export class UsersSelector
{
	constructor(options: UsersSelectorOptions)
	{
		this.options = options;
		this.selector = this.createSelector();
		this.container = null;
	}

	createSelector(): TagSelector
	{
		const dialogOptions: DialogOptions = {
			context: this.options.context,
			width: 390,
			height: 340,
			compactView: true,
			enableSearch: true,
			cacheable: true,
			showAvatars: true,
			popupOptions: {
				targetContainer: this.options.targetContainer,
			},
			entities: this.#getEntities(),
			preselectedItems: this.getPreselectedItems(),
			events: {
				'Item:onSelect': (event) => {
					const item = event.getData().item;
					this.options.onSelect?.(item.getId(), item);
				},
				'Item:onDeselect': (event) => {
					const item = event.getData().item;
					this.options.onDeselect?.(item.getId(), item);
				},
			},
		};

		const tagSelectionOptions: TagSelectorOptions = {
			showAddButton: true,
			multiple: this.options.multiple,
			textBoxWidth: 'auto',
			showCreateButton: false,
			dialogOptions,
		};

		return new TagSelector(tagSelectionOptions);
	}

	#getEntities(): EntityOptions[]
	{
		const entities: EntityOptions[] = [
			{
				id: EntitySelectorEntity.User,
				dynamicLoad: true,
				dynamicSearch: true,
			},
		];

		const optionsEntities = this.options.entities || [];
		if (optionsEntities.includes(EntitySelectorEntity.Department))
		{
			entities.push({
				id: EntitySelectorEntity.Department,
				options: {
					selectMode: 'usersAndDepartments',
					allowFlatDepartments: true,
					allowSelectRootDepartment: true,
				},
			});
		}

		return entities;
	}

	getPreselectedItems(): Array<[string, string | number | null]>
	{
		if (this.options.preselectedItems?.length > 0)
		{
			return this.options.preselectedItems;
		}

		return this.normalizePreselectedIds().map((id) => [EntitySelectorEntity.User, id]);
	}

	normalizePreselectedIds(): Array<string | number | null>
	{
		const { preselectedIds } = this.options;

		if (Array.isArray(preselectedIds))
		{
			return preselectedIds;
		}

		return [preselectedIds];
	}

	renderTo(container: HTMLElement): void
	{
		this.container = container;
		this.selector.renderTo(container);
	}

	destroy(): void
	{
		this.selector.getDialog()?.destroy();
		this.selector = null;
		if (this.container)
		{
			this.container.innerHTML = '';
		}
		this.container = null;
	}
}
