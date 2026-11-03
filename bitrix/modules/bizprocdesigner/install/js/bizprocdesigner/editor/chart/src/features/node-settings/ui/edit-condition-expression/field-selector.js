import { Loc, Type } from 'main.core';
import { Dialog, type EntityOptions, type Item, type ItemOptions, type TabOptions } from 'ui.entity-selector';

import { diagramStore } from '../../../../entities/blocks';
import { FIELD_OBJECT_TYPES, type ConditionExpressionField } from '../../../../entities/node-settings';
import { DOCUMENT_FIELDS_ENTITY_ID, EVALUATION_STAGE } from '../../../../shared/constants';
import { type PortId, type Block, type DocumentField } from '../../../../shared/types';
import { documentFieldsCache } from '../../../../shared/utils';
import {
	buildProcessDataGroups,
	loadProcessDataCatalog,
	processDataMechanics,
	type ProcessDataSelectorEntry,
	type ProcessDataSelectorGroup,
} from '../../../../entities/process-data/groups';

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
	selectedField: ConditionExpressionField | null;

	constructor(
		currentBlock: Block,
		currentPortId: PortId | null = null,
		connectedBlocks: Array<Block> | null = null,
		documentType: Array<string> | null = null,
		selectedField: ConditionExpressionField | null = null,
	)
	{
		this.store = diagramStore();
		this.currentBlock = currentBlock;
		this.currentPortId = currentPortId;
		this.connectedBlocks = connectedBlocks;
		this.documentType = documentType;
		this.selectedField = selectedField;
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
		let items = [];
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
						'ItemNode:onFocus': (event) => {
							this.#selectDynamicDocumentItemOnLoad(dialog, event.getData().node, items);
						},
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

		if (item.getEntityId() === DOCUMENT_FIELDS_ENTITY_ID)
		{
			const itemId = String(item.getId());
			const objectPrefix = Type.isStringFilled(field.object) ? `${field.object}:` : '';

			return {
				...field,
				fieldId: itemId.startsWith(objectPrefix) ? itemId.slice(objectPrefix.length) : itemId,
			};
		}

		return field;
	}

	#isSelectedField(field: ConditionExpressionField): boolean
	{
		if (!this.selectedField)
		{
			return false;
		}

		return field.object === this.selectedField.object && field.fieldId === this.selectedField.fieldId;
	}

	#markSelected(itemOptions: ItemOptions): ItemOptions
	{
		const field = itemOptions.customData?.[CustomDataFieldKey];

		return {
			...itemOptions,
			selected: field ? this.#isSelectedField(field) : false,
		};
	}

	#selectDynamicDocumentItemOnLoad(dialog: Dialog, node, items: ItemOptions[]): void
	{
		const selectedDynamicDocumentItem = this.#findSelectedDynamicDocumentItem(items);
		const item = node?.getItem?.();
		if (
			!selectedDynamicDocumentItem
			|| item?.getEntityId?.() !== DOCUMENT_FIELDS_ENTITY_ID
			|| String(item.getId()) !== String(selectedDynamicDocumentItem.parentId)
		)
		{
			return;
		}

		const selectLoadedItem = () => {
			dialog.getItem([DOCUMENT_FIELDS_ENTITY_ID, selectedDynamicDocumentItem.itemId])?.select(true);
		};

		if (node.isLoaded?.())
		{
			selectLoadedItem();

			return;
		}

		if (node.isDynamic?.())
		{
			node.loadChildren().then(selectLoadedItem).catch(() => {});
		}
	}

	#findSelectedDynamicDocumentItem(items: ItemOptions[]): { parentId: string | number, itemId: string } | null
	{
		for (const itemOptions of items)
		{
			const selectedDynamicDocumentItem = this.#getSelectedDynamicDocumentItem(itemOptions);
			if (selectedDynamicDocumentItem)
			{
				return selectedDynamicDocumentItem;
			}

			if (Type.isArrayFilled(itemOptions.children))
			{
				const selectedChild = this.#findSelectedDynamicDocumentItem(itemOptions.children);
				if (selectedChild)
				{
					return selectedChild;
				}
			}
		}

		return null;
	}

	#getSelectedDynamicDocumentItem(itemOptions: ItemOptions): { parentId: string | number, itemId: string } | null
	{
		if (!this.selectedField || itemOptions.entityId !== DOCUMENT_FIELDS_ENTITY_ID)
		{
			return null;
		}

		const field = itemOptions.customData?.[CustomDataFieldKey];
		const idTemplate = itemOptions.customData?.idTemplate;
		const fieldIdTemplate = itemOptions.customData?.fieldIdTemplate ?? idTemplate;
		const itemIdTemplate = Type.isStringFilled(idTemplate) ? idTemplate : fieldIdTemplate;
		const templateIndex = Type.isStringFilled(fieldIdTemplate) ? fieldIdTemplate.indexOf('#FIELD#') : -1;
		const selectedFieldId = this.selectedField.fieldId;
		const fieldIdPrefix = templateIndex >= 0 ? fieldIdTemplate.slice(0, templateIndex) : '';

		if (
			field?.object !== this.selectedField.object
			|| !Type.isStringFilled(selectedFieldId)
			|| templateIndex < 0
			|| !selectedFieldId.startsWith(fieldIdPrefix)
		)
		{
			return null;
		}

		return {
			parentId: itemOptions.id,
			itemId: itemIdTemplate.replace('#FIELD#', selectedFieldId.slice(fieldIdPrefix.length)),
		};
	}

	#getEntities(): EntityOptions[]
	{
		return [
			{
				id: DOCUMENT_FIELDS_ENTITY_ID,
				dynamicLoad: true,
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
		// The catalog decides how the values are grouped, so the items are built only after it is read.
		await loadProcessDataCatalog(this.store)?.catch(() => {});
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
			children: fields.map((field: DocumentField) => this.#markSelected({
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
		loadProcessDataCatalog(this.store);

		const groups = buildProcessDataGroups(
			this.store.template,
			this.currentBlock?.type,
			EVALUATION_STAGE.BEFORE_WORKFLOW_START,
			processDataMechanics(this.store),
		);

		groups.forEach((group: ProcessDataSelectorGroup) => {
			items.push({
				id: group.id,
				entityId: 'template',
				title: group.title,
				tabs: 'template',
				children: group.entries.map((entry: ProcessDataSelectorEntry) => this.#markSelected({
					id: `${entry.idKey}:${entry.key}`,
					entityId: entry.entityId,
					title: entry.property.Name,
					customData: {
						[CustomDataFieldKey]: {
							object: entry.idKey,
							fieldId: entry.key,
							type: entry.property.Type,
							multiple: entry.property.Multiple,
							options: entry.property.Options ?? null,
							settings: entry.property.Settings ?? null,
						},
					},
				})),
			});
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
						entityId: DOCUMENT_FIELDS_ENTITY_ID,
						entityType: 'document',
						title: fullTitle,
						customData: {
							idTemplate: `${activityName}:${property.Id}.#FIELD#`,
							fieldIdTemplate: `${property.Id}.#FIELD#`,
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

				res.properties.push(this.#markSelected({
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
				}));

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
					if (child.entityId === DOCUMENT_FIELDS_ENTITY_ID)
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
