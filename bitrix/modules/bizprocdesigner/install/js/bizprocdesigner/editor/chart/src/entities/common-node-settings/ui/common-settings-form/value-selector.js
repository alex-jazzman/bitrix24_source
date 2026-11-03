import { Type, Loc, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Dialog, type Item, type ItemOptions, type TabOptions, type EntityOptions } from 'ui.entity-selector';

import { DOCUMENT_FIELDS_ENTITY_ID, EVALUATION_STAGE } from '../../../../shared/constants';
import { type ActivityProperty, type Block, type DocumentField, type PortId } from '../../../../shared/types';
import { documentFieldsCache } from '../../../../shared/utils/document-fields-cache';
import {
	buildProcessDataGroups,
	loadProcessDataCatalog,
	processDataMechanics,
	type ProcessDataSelectorEntry,
	type ProcessDataSelectorGroup,
} from '../../../process-data/groups';
import { diagramStore } from '../../../blocks';
import { EVENT_NAMES } from '../../../node-settings/constants';

/**
 * How results of connected nodes are offered.
 *
 * `selectableDocuments` also narrows the offer to the documents the field can actually be pointed at:
 * see the rule in `#isDocumentOffered`.
 */
type DocumentSourceOptions = {
	/**
	 * The value being picked is a document itself, not a field of one, so a document is offered as a
	 * value instead of a node to drill into: an item with children is expanded by a click of the
	 * dialog, never selected.
	 *
	 * A result of a connected node that is not a document is left out of the offer entirely: it names
	 * no document, and a projection of many values would reach the runtime as an array that the
	 * document id is then read out of element by element.
	 */
	selectableDocuments?: boolean,
	/** The document type the node of the field is fixed to, when it has one. */
	fixedDocumentType?: Array<string> | null,
};

type ShowOptions = DocumentSourceOptions & {
	showOnlyRealProperties?: boolean,
};

const pendingShows: WeakMap<Element, Promise<string>> = new WeakMap();

export class ValueSelector
{
	store: diagramStore;
	currentBlock: ?Block = null;
	currentPortId: PortId | null = null;
	connectedBlocks: Array<Block> | null = null;
	selectedItem: Item | null = null;
	evaluationStage: string = EVALUATION_STAGE.BEFORE_WORKFLOW_START;

	/**
	 * `evaluationStage` is the construction the field belongs to: a caller opening the selector for a
	 * field of an action or of a filter says so, everyone else keeps the default — see the rule in
	 * shared/constants.
	 */
	constructor(
		store: diagramStore,
		currentBlock: ?Block = null,
		currentPortId: PortId | null = null,
		connectedBlocks: Array<Block> | null = null,
		evaluationStage: string = EVALUATION_STAGE.BEFORE_WORKFLOW_START,
	)
	{
		this.store = store;
		this.currentBlock = currentBlock;
		this.currentPortId = currentPortId;
		this.connectedBlocks = connectedBlocks;
		this.evaluationStage = evaluationStage;
	}

	show(targetElement: Element, options: ShowOptions = {}): Promise
	{
		const pending = pendingShows.get(targetElement);
		if (pending)
		{
			return pending;
		}

		const selection = this.#openDialog(targetElement, options);
		pendingShows.set(targetElement, selection);

		return selection;
	}

	async #openDialog(targetElement: Element, options: ShowOptions = {}): Promise<string>
	{
		const documentOptions: DocumentSourceOptions = {
			selectableDocuments: options.selectableDocuments === true,
			fixedDocumentType: options.fixedDocumentType ?? null,
		};
		let items = [];
		try
		{
			await loadProcessDataCatalog(this.store)?.catch(() => {});
			items = await this.getItems(documentOptions);
		}
		catch (error)
		{
			pendingShows.delete(targetElement);

			throw error;
		}

		return new Promise((resolve) => {
			try
			{
				let dialog: ?Dialog = null;
				const handleScroll = () => {
					EventEmitter.unsubscribe(EVENT_NAMES.SCROLL_EVENT, handleScroll);
					dialog?.hide();
				};
				const unsubscribeFromScroll = () => {
					EventEmitter.unsubscribe(EVENT_NAMES.SCROLL_EVENT, handleScroll);
				};
				dialog = new Dialog({
					targetNode: targetElement,
					width: 500,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					items,
					tabs: this.#getTabs(),
					entities: this.#getEntities(options.showOnlyRealProperties),
					cacheable: false,
					showAvatars: false,
					events: {
						onLoad: () => {
							this.#syncDocumentsTabStub(dialog);
						},
						onHide: unsubscribeFromScroll,
						onDestroy: unsubscribeFromScroll,
						'Item:onSelect': (event) => {
							this.selectedItem = event.getData().item;
							resolve(this.#getValue(event.getData().item));
						},
					},
					compactView: true,
				});

				EventEmitter.subscribe(EVENT_NAMES.SCROLL_EVENT, handleScroll);
				dialog.show();
			}
			finally
			{
				pendingShows.delete(targetElement);
			}
		});
	}

	#syncDocumentsTabStub(dialog: ?Dialog): void
	{
		const documentsTab = dialog?.getTab('documents');
		const documentsStub = documentsTab?.getStub();
		if (!documentsTab || !documentsStub)
		{
			return;
		}

		if (documentsTab.getRootNode().hasChildren())
		{
			documentsStub.hide();
		}
		else
		{
			documentsStub.show();
		}
	}

	#getEntities(showOnlyRealProperties: boolean = false): EntityOptions[]
	{
		if (showOnlyRealProperties)
		{
			return [
				{
					id: DOCUMENT_FIELDS_ENTITY_ID,
					dynamicLoad: true,
				},
			];
		}

		return [
			{
				id: DOCUMENT_FIELDS_ENTITY_ID,
				dynamicLoad: true,
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
		const documentsTab: TabOptions = {
			id: 'documents',
			title: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_DOCUMENTS'),
			icon: 'elements',
			stub: true,
		};
		const documentsStubTitle = Loc.getMessage('BIZPROCDESIGNER_SELECTOR_TAB_DOCUMENTS_STUB');
		if (Type.isStringFilled(documentsStubTitle))
		{
			documentsTab.stubOptions = {
				title: documentsStubTitle,
			};
		}

		return [
			documentsTab,
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

	async getItems(options: DocumentSourceOptions = {}): Promise<ItemOptions[]>
	{
		const items = await this.#normalizeDocumentItems(this.getReturnItems(options));

		this.addTemplateItems(items);

		return items;
	}

	async #normalizeDocumentItems(items: ItemOptions[]): Promise<ItemOptions[]>
	{
		const normalizedItems = await Promise.all(items.map((item) => this.#normalizeDocumentItem(item)));

		return normalizedItems.filter(Boolean);
	}

	async #normalizeDocumentItem(item: ItemOptions): Promise<?ItemOptions>
	{
		if (this.#isDynamicDocumentItem(item))
		{
			return this.#resolveDocumentItem(item);
		}

		if (!Type.isArrayFilled(item.children))
		{
			return item;
		}

		const children = await this.#normalizeDocumentItems(item.children);
		if (item.tabs === 'documents' && !Type.isArrayFilled(children))
		{
			return null;
		}

		return {
			...item,
			children,
		};
	}

	async #resolveDocumentItem(item: ItemOptions): Promise<?ItemOptions>
	{
		const document = item.customData?.document;
		const fields: Array<DocumentField> = await documentFieldsCache.fetchFields(document);
		if (!Type.isArrayFilled(fields))
		{
			return null;
		}

		return {
			...item,
			nodeOptions: {
				...(item.nodeOptions ?? {}),
				open: false,
				dynamic: false,
			},
			children: fields.map((field) => this.#createDocumentFieldItem(item, field)),
		};
	}

	#isDynamicDocumentItem(item: ItemOptions): boolean
	{
		return (
			item.entityId === DOCUMENT_FIELDS_ENTITY_ID
			&& item.entityType === 'document'
			&& item.nodeOptions?.dynamic === true
			&& !Type.isNil(item.customData?.document)
		);
	}

	#createDocumentFieldItem(documentItem: ItemOptions, field: DocumentField): ItemOptions
	{
		return {
			id: this.#createDocumentFieldId(documentItem.customData?.idTemplate, field),
			entityId: DOCUMENT_FIELDS_ENTITY_ID,
			tabs: 'documents',
			title: field.name,
			supertitle: documentItem.title,
			searchable: false,
			customData: {
				fieldKey: field.fieldKey,
				field: {
					type: field.type,
					multiple: field.multiple,
					required: field.required,
					options: field.options,
				},
				property: field.property,
			},
		};
	}

	#createDocumentFieldId(idTemplate: ?string, field: DocumentField): string
	{
		const template = Type.isStringFilled(idTemplate) ? idTemplate : '#FIELD#';

		return template
			.split('#FIELD_NAME#').join(field.name)
			.split('#FIELD#').join(field.fieldKey)
		;
	}

	addTemplateItems(items: ItemOptions[]): void
	{
		loadProcessDataCatalog(this.store);

		const groups = buildProcessDataGroups(
			this.store.template,
			this.currentBlock?.type,
			this.evaluationStage,
			processDataMechanics(this.store),
		);

		groups.forEach((group: ProcessDataSelectorGroup) => {
			items.push({
				id: group.id,
				entityId: 'template',
				title: group.title,
				tabs: 'template',
				children: group.entries.map((entry: ProcessDataSelectorEntry) => ({
					id: `{=${entry.idKey}:${entry.key}}`,
					entityId: entry.entityId,
					title: entry.property.Name,
					customData: {
						property: entry.property,
					},
				})),
			});
		});
	}

	/**
	 * The whole package of every connected block. The options change nothing but which documents of it
	 * are offered and what they are offered as — see {@see DocumentSourceOptions}.
	 */
	getReturnItems(options: DocumentSourceOptions = {}): ItemOptions[]
	{
		if (!Type.isArrayFilled(this.connectedBlocks) && !Type.isPlainObject(this.currentBlock))
		{
			return [];
		}

		const blocks = this.connectedBlocks ?? this.store.getAllBlockAncestors(
			this.currentBlock,
			this.currentPortId,
		);

		return blocks.reduce((acc, currentBlock: Block) => {
			const block = Type.isPlainObject(currentBlock?.block) ? currentBlock.block : currentBlock;
			if (!Type.isPlainObject(block?.activity))
			{
				return acc;
			}

			if (Type.isArrayFilled(block.activity.Children))
			{
				const properties = this.#processChildrenProperties(block, options);
				if (Type.isArrayFilled(properties))
				{
					acc.push(...properties);
				}
			}

			if (Type.isArrayFilled(block.activity.ReturnProperties))
			{
				const properties = this.#processReturnProperties(block, options);
				if (Type.isArrayFilled(properties))
				{
					acc.push(...properties);
				}
			}

			return acc;
		}, []);
	}

	#processChildrenProperties(block: Block, options: DocumentSourceOptions = {}): ItemOptions[]
	{
		const childrenProperties = [];
		block.activity.Children.forEach((activity) => {
			if (Type.isArrayFilled(activity.ReturnProperties))
			{
				const properties = this.#processReturnProperties({ id: activity.Name, activity }, options);
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

	/**
	 * Whether a document of a connected node can be the value of this field.
	 *
	 * A field picking a document names one document, so a projection holding many (`Multiple`) names
	 * none of them, and a node fixed to a document type of its own is served by that module alone - the
	 * rule the selector of documents applied before the field took free values. Everything else is left
	 * in: a projection that says nothing about its type may still turn out to be the right document, and
	 * one that does not is answered at run time.
	 */
	#isDocumentOffered(property: ActivityProperty, options: DocumentSourceOptions): boolean
	{
		if (options.selectableDocuments !== true)
		{
			return true;
		}

		if (property.Multiple === true)
		{
			return false;
		}

		if (!Type.isArrayFilled(property.Default) || !Type.isArrayFilled(options.fixedDocumentType))
		{
			return true;
		}

		return property.Default[0] === options.fixedDocumentType[0];
	}

	/**
	 * The results of one connected node, split between the tab of the documents and the tab of the
	 * results.
	 *
	 * A field picking a document takes documents alone (`selectableDocuments`), so the results that are
	 * not documents are left out instead of being offered by the tab of the results: none of them names
	 * a document, and a projection of many values reaches the runtime as an array, which the resolver of
	 * the document id then reads element by element as if it were a document itself. The parameters, the
	 * variables and the constants of the template stay on the tab of the template - what they hold is
	 * written by the author, not by the shape of a result.
	 */
	#processReturnProperties(block: Block, options: DocumentSourceOptions = {}): ItemOptions[]
	{
		const fullTitle = block.activity.Properties.Title;

		const { documents, properties } = block.activity.ReturnProperties.reduce(
			(res, property) => {
				const id = `{=${block.id}:${property.Id}}`;
				if (property.Type === 'document')
				{
					if (!this.#isDocumentOffered(property, options))
					{
						return res;
					}

					// A document offered as a value is a leaf: an item with children is expanded by a
					// click of the dialog instead of being selected.
					const allowsFields = options.selectableDocuments !== true && !property.Multiple;
					const documentItem = {
						id,
						entityId: DOCUMENT_FIELDS_ENTITY_ID,
						entityType: 'document',
						title: Loc.getMessage(
							'BIZPROCDESIGNER_SELECTOR_DOCUMENT_PROPERTY_TITLE',
							{
								'#PROPERTY_NAME#': property.Name,
								'#BLOCK_TITLE#': fullTitle,
							},
						),
						customData: {
							document: property.Default,
						},
						nodeOptions: {
							open: false,
							dynamic: allowsFields,
						},
						tabs: 'documents',
						searchable: false,
					};

					if (allowsFields)
					{
						documentItem.customData.idTemplate = `{=${block.id}:${property.Id}.#FIELD#}`;
					}

					res.documents.push(documentItem);
				}
				else if (options.selectableDocuments !== true)
				{
					const customProperty = Runtime.clone(property);
					if (customProperty.Type === 'json')
					{
						customProperty.Type = customProperty.BaseType ?? 'string';
					}

					res.properties.push({
						id,
						entityId: 'block-node-property',
						title: property.Name,
						property,
						block,
						customData: {
							property: customProperty,
						},
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
