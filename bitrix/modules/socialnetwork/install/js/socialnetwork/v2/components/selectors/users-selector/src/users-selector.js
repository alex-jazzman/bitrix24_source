import { Dom, Type } from 'main.core';
import {
	TagSelector,
	type Item,
	type ItemOptions,
	type DialogOptions,
	type TagSelectorOptions,
	type EntityOptions,
} from 'ui.entity-selector';

import { EntitySelectorEntity, StructureNodeEntityType } from 'socialnetwork.v2.const';

import './user-selector.css';

// humanresources StructureAction the org structure provider checks before it offers a node
const STRUCTURE_VIEW_ACTION = 'view';

export type { Item };

export type UsersSelectorOptions = {
	context: string,
	multiple: boolean,
	preselectedIds: Array<string | number> | string | number | null,
	preselectedItems: ?Array<[string, number | string]>,
	selectedItems?: ItemOptions[],
	targetContainer: HTMLElement,
	entities: ?Array<typeof EntitySelectorEntity>,
	isTeamsAvailable: ?boolean,
	intranetUsersOnly?: boolean,
	inputId: ?string,
	inputLabel: ?string,
	onSelect: Function,
	onDeselect: Function,
	controlId?: string,
	ariaLabelledBy?: string,
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
			entities: UsersSelector.getEntities(this.options),
			preselectedItems: this.getPreselectedItems(),
			selectedItems: this.options.selectedItems,
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

		const selector = new TagSelector(tagSelectionOptions);

		if (Type.isStringFilled(this.options.controlId))
		{
			selector.getAddButtonLink().id = this.options.controlId;
		}

		if (Type.isStringFilled(this.options.ariaLabelledBy))
		{
			const addButtonLabelledBy = Type.isStringFilled(this.options.controlId)
				? `${this.options.controlId} ${this.options.ariaLabelledBy}`
				: this.options.ariaLabelledBy
			;

			Dom.attr(selector.getAddButtonLink(), 'aria-labelledby', addButtonLabelledBy);
			Dom.attr(selector.getTextBox(), 'aria-labelledby', this.options.ariaLabelledBy);
		}

		return selector;
	}

	static getEntities(options: UsersSelectorOptions): EntityOptions[]
	{
		const entities: EntityOptions[] = [
			{
				id: EntitySelectorEntity.User,
				dynamicLoad: true,
				dynamicSearch: true,
				...(options.intranetUsersOnly === true ? { options: { intranetUsersOnly: true } } : {}),
			},
		];

		const requestedEntities = options.entities || [];
		if (requestedEntities.includes(EntitySelectorEntity.Department))
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

		if (requestedEntities.includes(EntitySelectorEntity.StructureNode) && options.isTeamsAvailable === true)
		{
			entities.push({
				id: EntitySelectorEntity.StructureNode,
				options: {
					includedNodeEntityTypes: [StructureNodeEntityType.Team],
					// without it the provider builds the tree with no access filter at all
					restricted: STRUCTURE_VIEW_ACTION,
					// own tabs keep teams and departments in separate trees
					useMultipleTabs: true,
					selectMode: 'usersAndDepartments',
					allowFlatDepartments: true,
					visual: {
						avatarMode: 'node',
						tagStyle: 'none',
					},
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

		if (Type.isNil(preselectedIds))
		{
			return [];
		}

		return [preselectedIds];
	}

	renderTo(container: HTMLElement): void
	{
		this.container = container;
		this.selector.renderTo(container);
		this.bindFieldLabel();
	}

	// the tag selector names its input after its own search placeholder, so an outer field label has to take over
	bindFieldLabel(): void
	{
		const textBox = this.selector.getTextBox();

		if (Type.isStringFilled(this.options.inputId))
		{
			Dom.attr(textBox, 'id', this.options.inputId);
		}

		if (Type.isStringFilled(this.options.inputLabel))
		{
			Dom.attr(textBox, 'aria-label', this.options.inputLabel);
		}
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
