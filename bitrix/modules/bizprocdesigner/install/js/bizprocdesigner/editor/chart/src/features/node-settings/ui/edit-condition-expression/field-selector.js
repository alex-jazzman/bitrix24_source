import { Loc, Type } from 'main.core';
import { Dialog, EntityOptions, Item, ItemOptions, TabOptions } from 'ui.entity-selector';
import { diagramStore } from '../../../../entities/blocks';
import type { ConditionExpressionField } from '../../../../entities/node-settings';
import { type PortId, Block } from '../../../../shared/types';

const CustomDataFieldKey = 'field';

export class FieldSelector
{
	store: diagramStore;
	currentBlock: Block;

	currentPortId: PortId;

	constructor(
		currentBlock: Block,
		currentPortId: PortId,
	)
	{
		this.store = diagramStore();
		this.currentBlock = currentBlock;
		this.currentPortId = currentPortId;
	}

	show(targetElement: Element): Promise<ConditionExpressionField>
	{
		return new Promise((resolve) => {
			const dialog = new Dialog({
				targetNode: targetElement,
				width: 500,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				items: this.#getItems(),
				tabs: this.#getTabs(),
				entities: this.#getEntities(),
				cacheable: false,
				showAvatars: false,
				events: {
					'Item:onSelect': (event) => {
						resolve(this.#getValue(event.getData().item));
					},
				},
				compactView: true,
			});

			dialog.show();
		});
	}

	#getValue(item: Item): ConditionExpressionField
	{
		return item.getCustomData().get(CustomDataFieldKey);
	}

	#getEntities(): EntityOptions[]
	{
		return [
			{
				id: 'bizproc-document',
			},
		];
	}

	#getTabs(): TabOptions[]
	{
		return [
			{
				id: 'returns',
				title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_RETURNS'),
				icon: 'flag-1',
			},
			{
				id: 'template',
				title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_TEMPLATE'),
				icon: 'disk',
			},
		];
	}

	#getItems(): ItemOptions[]
	{
		const items = this.getReturnItems();
		this.addTemplateItems(items);

		return items;
	}

	addTemplateItems(items: ItemOptions[]): void
	{
		const map = [
			{
				key: 'PARAMETERS',
				idKey: 'Template',
				title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_PARAMETERS'),
			},
			{
				key: 'VARIABLES',
				idKey: 'Variable',
				title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_VARIABLES'),
			},
			{
				key: 'CONSTANTS',
				idKey: 'Constant',
				title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_CONSTANTS'),
			},
		];

		map.forEach((elem) => {
			const collection = this.store.template[elem.key];
			if (Type.isObject(collection) && Object.keys(collection).length > 0)
			{
				const children = [];
				Object.keys(collection).forEach((key) => {
					const item = collection[key];
					const id = `${elem.idKey}:${key}`;
					children.push({
						id,
						entityId: elem.key,
						title: item.Name,
						customData: {
							[CustomDataFieldKey]: {
								object: elem.idKey,
								fieldId: key,
								type: item.Type,
								multiple: item.Multiple,
							},
						},
					});
				});

				items.push({
					id: elem.idKey,
					entityId: 'template',
					title: elem.title,
					tabs: 'template',
					children,
				});
			}
		});
	}

	getReturnItems(): ItemOptions[]
	{
		const blocks = this.store.getBlockAncestorsByInputPortId(this.currentBlock, this.currentPortId);

		return blocks.reduce((acc, block: Block) => {
			if (Type.isArrayFilled(block.activity.Children))
			{
				const properties = this.#processChildrenProperties(block);
				if (Type.isArrayFilled(properties))
				{
					acc.push(...properties);
				}
			}

			if (Type.isArrayFilled(block.activity.ReturnProperties))
			{
				const properties = this.#processReturnProperties(block);
				if (Type.isArrayFilled(properties))
				{
					acc.push(...properties);
				}
			}

			return acc;
		}, []);
	}

	#processReturnProperties(block: Block): ItemOptions[]
	{
		const fullTitle = block.activity.Properties.Title;

		const { properties } = block.activity.ReturnProperties.reduce(
			(res, property) => {
				const id = `${block.id}:${property.Id}`;
				if (property.Type === 'document')
				{
					return res;
				}

				res.properties.push({
					id,
					entityId: 'block-node-property',
					title: property.Name,
					property,
					block,
					customData: {
						[CustomDataFieldKey]: {
							object: block.id,
							fieldId: property.Id,
							type: property.Type,
							multiple: property.Multiple,
						},
					},
				});

				return res;
			},
			{ properties: [] },
		);

		const result = [];

		if (Type.isArrayFilled(properties))
		{
			result.push({
				id: block.id,
				entityId: 'block-node',
				tabs: 'returns',
				title: fullTitle,
				children: properties,
				searchable: false,
			});
		}

		return result;
	}

	#processChildrenProperties(block: Block): ItemOptions[]
	{
		const childrenProperties = [];
		block.activity.Children.forEach((activity) => {
			if (Type.isArrayFilled(activity.ReturnProperties))
			{
				const properties = this.#processReturnProperties({ id: activity.Name, activity });
				if (Type.isArrayFilled(properties))
				{
					childrenProperties.push(...properties);
				}
			}
		});

		const properties = [];
		if (Type.isArrayFilled(childrenProperties))
		{
			properties.push({
				id: block.id,
				entityId: 'block-node',
				tabs: 'returns',
				title: block.activity.Properties.Title,
				children: childrenProperties,
				searchable: false,
			});
		}

		return properties;
	}
}
