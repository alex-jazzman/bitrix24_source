import { Type, Loc } from 'main.core';
import { Dialog, Item, ItemOptions, TabOptions, EntityOptions } from 'ui.entity-selector';
import type { Block, PortId } from '../../../../shared/types';
import { diagramStore } from '../../../blocks';

export class ValueSelector
{
	store: diagramStore;
	currentBlock: Block;
	currentPortId: PortId | null = null;

	constructor(
		store: diagramStore,
		currentBlock: Block,
		currentPortId: PortId | null = null,
	)
	{
		this.store = store;
		this.currentBlock = currentBlock;
		this.currentPortId = currentPortId;
	}

	show(targetElement: Element): Promise
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

	#getEntities(): EntityOptions[]
	{
		return [
			{
				id: 'bizproc-document',
			},
			{
				id: 'bizproc-system',
			},
			{
				id: 'structure-node',
				options: {
					selectMode: 'usersAndDepartments',
					allowFlatDepartments: true,
					allowSelectRootDepartment: true,
				},
			},
		];
	}

	#getTabs(): TabOptions[]
	{
		return [
			{
				id: 'documents',
				title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_DOCUMENTS'),
				icon: 'elements',
			},
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

	#getValue(item: Item): string
	{
		if (item.getEntityId() === 'user')
		{
			return `${item.getTitle()} [${item.getId()}]`;
		}

		if (item.getEntityId() === 'structure-node')
		{
			const id = String(item.getId());
			if (id.indexOf(':') > 0)
			{
				return `${item.getTitle()} [HR${id.split(':')[0]}]`;
			}

			return `${item.getTitle()} [HRR${id}]`;
		}

		return item.getId();
	}

	#getItems(): ItemOptions[]
	{
		const items = this.getReturnItems();

		this.#addDocumentItem(items);
		this.addTemplateItems(items);

		return items;
	}

	#addDocumentItem(items: ItemOptions[]): void
	{
		// compatible document
		items.push({
			id: 'template-document',
			entityId: 'bizproc-document',
			entityType: 'document',
			title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_DOCUMENT_FIELDS'),
			customData: {
				document: this.store.documentType,
				idTemplate: '{{ #FIELD_NAME# }}',
				supertitle: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_DOCUMENT_FIELDS'),
			},
			tabs: ['documents'],
			nodeOptions: {
				open: false,
				dynamic: true,
			},
		});
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
					const id = `{=${elem.idKey}:${key}}`;
					children.push({
						id,
						entityId: elem.key,
						title: item.Name,
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
		const blocks = this.store.getAllBlockAncestors(
			this.currentBlock,
			this.currentPortId,
		);

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

		const { documents, activities } = childrenProperties.reduce(
			(res, child) => {
				if (child)
				{
					if (child.entityId === 'bizproc-document')
					{
						res.documents.push(child);
					}
					else
					{
						res.activities.push(child);
					}
				}

				return res;
			},
			{ documents: [], activities: [] },
		);

		const properties = [];

		if (Type.isArrayFilled(documents))
		{
			properties.push({
				id: block.id,
				entityId: 'block-node',
				tabs: 'documents',
				title: block.activity.Properties.Title,
				children: documents,
				nodeOptions: {
					open: false,
					dynamic: false,
				},
				searchable: false,
			});
		}

		if (Type.isArrayFilled(activities))
		{
			properties.push({
				id: block.id,
				entityId: 'block-node',
				tabs: 'returns',
				title: block.activity.Properties.Title,
				children: activities,
				searchable: false,
			});
		}

		return properties;
	}

	#processReturnProperties(block: Block): ItemOptions[]
	{
		const fullTitle = block.activity.Properties.Title;

		const { documents, properties } = block.activity.ReturnProperties.reduce(
			(res, property) => {
				const id = `{=${block.id}:${property.Id}}`;
				if (property.Type === 'document')
				{
					res.documents.push({
						id,
						entityId: 'bizproc-document',
						entityType: 'document',
						title: `${property.Name} (${fullTitle})`,
						customData: {
							document: property.Default,
							idTemplate: `{=${block.id}:${property.Id}.#FIELD#}`,
						},
						nodeOptions: {
							open: false,
							dynamic: true,
						},
						tabs: 'documents',
						searchable: false,
					});
				}
				else
				{
					res.properties.push({
						id,
						entityId: 'block-node-property',
						title: property.Name,
						property,
						block,
					});
				}

				return res;
			},
			{ documents: [], properties: [] },
		);

		const result = [];

		if (Type.isArrayFilled(documents))
		{
			result.push(...documents);
		}

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
}
