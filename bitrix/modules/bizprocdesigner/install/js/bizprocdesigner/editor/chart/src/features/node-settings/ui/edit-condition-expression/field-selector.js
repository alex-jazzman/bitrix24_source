import { Loc, Type } from 'main.core';
import { Dialog, type EntityOptions, type Item, type ItemOptions, type TabOptions } from 'ui.entity-selector';

import { diagramStore } from '../../../../entities/blocks';
import { FIELD_OBJECT_TYPES, type ConditionExpressionField } from '../../../../entities/node-settings';
import { isTemplateSourceAvailableForBlockType } from '../../../../shared/constants';
import { type PortId, type Block, type DocumentField } from '../../../../shared/types';
import { documentFieldsCache } from '../../../../shared/utils';

const CustomDataFieldKey = 'field';

// Selectors whose dialog is still being assembled, keyed by the element they open over: `show()`
// awaits the fields of the document, and on a cache miss a second click within that window would
// open a second dialog over the same control. The key is the control and not the instance because
// the caller builds a fresh FieldSelector on every click. The entry lives only until the dialog is
// on screen — from there a repeated click is handled by the open dialog itself, as it was while
// `show()` was synchronous.
const pendingShows: WeakMap<Element, Promise<ConditionExpressionField>> = new WeakMap();

export class FieldSelector
{
	store: diagramStore;
	currentBlock: Block;
	// Null when the panel holds no current rule (it is being closed or reopened): the ancestors are
	// then collected without filtering the incoming connections by a port.
	currentPortId: PortId | null;
	connectedBlocks: Array<Block> | null;
	// Document the `Document` object of this condition is evaluated against, or null when the node
	// addresses none. Decided by the caller (see EditConditionExpression.conditionDocumentType): the
	// selector only offers what it is given.
	documentType: Array<string> | null;

	constructor(
		currentBlock: Block,
		currentPortId: PortId | null = null,
		connectedBlocks: Array<Block> | null = null,
		documentType: Array<string> | null = null,
	)
	{
		this.store = diagramStore();
		this.currentBlock = currentBlock;
		this.currentPortId = currentPortId;
		this.connectedBlocks = connectedBlocks;
		this.documentType = documentType;
	}

	/**
	 * The dialog of the control, and the field picked in it. A click landing while the previous one
	 * is still loading its items is swallowed into that call: both settle on the single dialog it
	 * opens, instead of stacking a second one over the control.
	 */
	show(targetElement: Element): Promise<ConditionExpressionField>
	{
		const pending = pendingShows.get(targetElement);
		if (pending)
		{
			return pending;
		}

		const selection = this.#openDialog(targetElement);
		pendingShows.set(targetElement, selection);

		return selection;
	}

	async #openDialog(targetElement: Element): Promise<ConditionExpressionField>
	{
		let items;
		try
		{
			items = await this.getItems();
		}
		catch (error)
		{
			pendingShows.delete(targetElement);

			throw error;
		}

		return new Promise((resolve) => {
			try
			{
				const dialog = new Dialog({
					targetNode: targetElement,
					width: 500,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					items,
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
			}
			finally
			{
				// On screen: the window a second click could duplicate the dialog in is over, while
				// the promise itself stays pending until an item is picked. Dropped on a throw of the
				// dialog as well — a rejected promise left in the map would lock the control out of
				// ever opening a selector again, while the next click may well succeed.
				pendingShows.delete(targetElement);
			}
		});
	}

	#getValue(item: Item): ConditionExpressionField
	{
		const field = { ...item.getCustomData().get(CustomDataFieldKey) };

		if (item.getEntityId() === 'bizproc-document')
		{
			return {
				...field,
				fieldId: item.getId(),
			};
		}

		return field;
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

	async getItems(): Promise<ItemOptions[]>
	{
		const items = await this.getDocumentItems();
		items.push(...this.getReturnItems());
		this.addTemplateItems(items);

		return items;
	}

	/**
	 * Fields of the document this condition is evaluated against, as a single root of the selector.
	 * Empty for a node addressing no document (documentType is null) and for a document that answers
	 * with no field at all.
	 * The fields come through the shared cache, warmed by the panel on load (fetchNodeSettings), so
	 * opening the menu normally costs no request.
	 */
	async getDocumentItems(): Promise<ItemOptions[]>
	{
		if (!Type.isArrayFilled(this.documentType))
		{
			return [];
		}

		const fields: Array<DocumentField> = await documentFieldsCache.fetchFields(this.documentType);
		if (!Type.isArrayFilled(fields))
		{
			return [];
		}

		return [{
			id: FIELD_OBJECT_TYPES.DOCUMENT,
			entityId: 'document',
			tabs: 'documents',
			title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT'),
			searchable: false,
			children: fields.map((field: DocumentField) => ({
				id: `${FIELD_OBJECT_TYPES.DOCUMENT}:${field.fieldKey}`,
				entityId: 'document-field',
				title: field.name,
				customData: {
					[CustomDataFieldKey]: this.#toDocumentConditionField(field),
				},
			})),
		}];
	}

	/**
	 * A document field as the condition addresses it: the very shape the server reads back
	 * (object `Document` plus the field key), the rest types the value control. An empty option list
	 * is no list at all: the same `?? null` the template sources use.
	 */
	#toDocumentConditionField(field: DocumentField): ConditionExpressionField
	{
		const hasOptions = Type.isPlainObject(field.options) && Object.keys(field.options).length > 0;

		return {
			object: FIELD_OBJECT_TYPES.DOCUMENT,
			fieldId: field.fieldKey,
			type: field.type,
			multiple: field.multiple,
			options: hasOptions ? field.options : null,
			settings: field.property?.Settings ?? null,
		};
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

		map.filter(
			(elem) => isTemplateSourceAvailableForBlockType(this.currentBlock?.type, elem.key),
		).forEach((elem) => {
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
								options: item.Options ?? null,
								settings: item.Settings ?? null,
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
		const blocks = this.connectedBlocks ?? this.store.getBlockAncestorsByInputPortId(
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

	#processReturnProperties(block: Block): ItemOptions[]
	{
		const fullTitle = block.activity.Properties.Title;

		const { documents, properties } = block.activity.ReturnProperties.reduce(
			(res, property) => {
				const activityName = block.activity?.Name || block.id;
				const id = `${block.id}:${property.Id}`;
				if (property.Type === 'document')
				{
					res.documents.push({
						id,
						entityId: 'bizproc-document',
						entityType: 'document',
						title: fullTitle,
						customData: {
							idTemplate: `${property.Id}.#FIELD#`,
							document: property.Default,
							[CustomDataFieldKey]: {
								object: activityName,
							},
						},
						nodeOptions: {
							open: false,
							dynamic: true,
						},
						searchable: false,
						tabs: 'documents',
					});

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
							object: activityName,
							fieldId: property.Id,
							type: property.Type,
							multiple: property.Multiple,
							options: property.Options ?? null,
							settings: property.Settings ?? null,
						},
					},
				});

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
}
