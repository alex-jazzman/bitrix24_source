import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { diagramStore } from '../../entities/blocks/stores/diagram.js';
import { COMPUTE_VALUE_PREFIXES, PROPERTY_TYPES, TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE, TEMPLATE_DEFAULT_DATA_TYPE, BLOCK_TYPES } from '../constants';
import { documentFieldsCache, getDocumentTypeKey } from './document-fields-cache';

import {
	type ActivityData,
	type Block,
	type DiagramStore,
	type DiagramTemplateGeneralData,
	type PortId,
	type TemplateDataNodeGroup,
	type TemplateDataTemplateGroup,
} from '../types';

export type TemplateDataSnapshot = {
	templateItems: Array<TemplateDataTemplateGroup>,
	incomingItems: Array<TemplateDataNodeGroup>,
	filterItems: Array<TemplateDataNodeGroup>,
	outgoingItems: Array<TemplateDataNodeGroup> | null,
};

// The property a node saves its filter results under, mirroring
// `\Bitrix\Bizproc\Public\Activity\Mixins\NodeFilterResultProperties::FILTER_RETURN_PROPERTIES_MAP`.
const FILTER_RETURN_PROPERTIES_MAP = 'FilterReturnPropertiesMap';

type DocumentTypeItem = {
	type: string,
	documentType?: string | Array<string>,
	items?: Array<DocumentTypeItem>,
};

export class TemplateDataProvider extends EventEmitter
{
	static instance: TemplateDataProvider;

	#store: DiagramStore;

	constructor(store: DiagramStore)
	{
		super();
		this.#store = store;

		this.setEventNamespace('BizprocDesigner.Editor.Chart.TemplateDataProvider');
	}

	async prepare(
		block: Block,
		activityData: ?ActivityData = null,
		isCurrent: () => boolean = () => true,
	): Promise<?TemplateDataSnapshot>
	{
		const draft = this.#buildSnapshot(block, activityData);
		const documentTypes = this.#collectUniqueDocumentTypes(draft);
		const missingDocumentTypes = [...documentTypes.values()].filter(
			(documentType) => !documentFieldsCache.has(documentType),
		);
		if (missingDocumentTypes.length === 0)
		{
			return draft;
		}

		await Promise.all(
			missingDocumentTypes.map(
				(documentType) => documentFieldsCache.fetchFields(documentType),
			),
		);
		if (!isCurrent())
		{
			return null;
		}

		return this.#buildSnapshot(block, activityData);
	}

	getTemplateItems(): Array<TemplateDataTemplateGroup>
	{
		const rawTemplateItems = [
			{
				type: TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.CONSTANT,
				object: this.#store.template.CONSTANTS ?? {},
			},
			{
				type: TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.VARIABLE,
				object: this.#store.template.VARIABLES ?? {},
			},
		].filter((o) => Object.keys(o.object).length > 0);

		return rawTemplateItems.map(
			(item) => this.#makeTemplateItemGroup(item.type, item.object),
		);
	}

	getIncomingProperties(block: Block, targetPortId?: PortId): Array<TemplateDataNodeGroup>
	{
		const ancestors: Array<Block> = this.#store.getAllBlockAncestors(block, targetPortId);

		return ancestors
			.reduce((acc, ancestor) => {
				const templateDataNodeGroup = this.#createTemplateDataNodeGroup(ancestor.block, ancestor.block.activity);
				if (templateDataNodeGroup)
				{
					acc.push({
						...templateDataNodeGroup,
						relatedPortsIds: new Set(Object.values(ancestor.connections).flat()),
					});
				}

				const outgoingProperties = this.getOutgoingProperties(ancestor.block, { isAncestorBlock: true });
				outgoingProperties?.forEach((outgoingProperty) => {
					const { relatedPortsIds, ...rest } = outgoingProperty;
					const [portId] = relatedPortsIds;
					acc.push({
						nodeId: ancestor.block.id,
						name: ancestor.block.node.title,
						icon: ancestor.block.node.icon,
						relatedPortsIds: new Set(ancestor.connections[portId]),
						items: [rest],
					});
				});

				return acc;
			}, []);
	}

	getOutgoingProperties(block: Block, options = {}): Array<TemplateDataNodeGroup> | null
	{
		const { isAncestorBlock, activityData } = options;
		const { Properties = {}, Children = [] } = activityData ?? block.activity ?? {};
		if (block.type !== BLOCK_TYPES.COMPLEX && !isAncestorBlock)
		{
			const templateDataNodeGroup = this.#createTemplateDataNodeGroup(block, block.activity);
			if (templateDataNodeGroup)
			{
				return [{
					...templateDataNodeGroup,
					name: block.activity.Properties.Title ?? '',
					icon: '',
					relatedPortsIds: ['o1'],
				}];
			}

			return null;
		}

		const outputNames = Object.keys(Properties.OutputNames ?? {});
		if (outputNames.length === 0)
		{
			return null;
		}

		return outputNames.reduce((acc, outputName) => {
			const outputPortId = `o${Properties.OutputNames[outputName]}`;
			const [activityName] = outputName.split(':');
			const activity = Children.find((child) => child.Name === activityName);
			const templateDataNodeGroup = this.#createTemplateDataNodeGroup(block, activity);
			if (templateDataNodeGroup)
			{
				acc.push({
					...templateDataNodeGroup,
					name: activity.Properties.Title ?? '',
					icon: '',
					relatedPortsIds: [outputPortId],
				});
			}

			return acc;
		}, []);
	}

	/**
	 * Fields produced by the filter construction of the node. Keyed neither by the block type nor by the
	 * panel marker, but by the filter results the node really carries: `FilterReturnPropertiesMap` is the
	 * property the server expands into `ReturnProperties` ({@see \CBPRuntime::getActivityReturnProperties()}),
	 * so its keys - `<filterId>` and `<filterId>_all` - name exactly the entries the filter block produced.
	 * A node whose filter is not set up has no such property at all: the save removes it. Everything else in
	 * the package is the own output of the node and belongs to the outgoing group, not here.
	 */
	getNodeFilterProperties(block: Block): Array<TemplateDataNodeGroup>
	{
		const filterPropertyIds = this.#getFilterResultPropertyIds(block.activity);
		if (filterPropertyIds.size === 0)
		{
			return [];
		}

		const returnProperties = block.activity?.ReturnProperties;
		if (!Array.isArray(returnProperties))
		{
			return [];
		}

		const templateDataNodeGroup = this.#createTemplateDataNodeGroup(block, {
			...block.activity,
			ReturnProperties: returnProperties.filter((property) => filterPropertyIds.has(property?.Id)),
		});
		if (!templateDataNodeGroup)
		{
			return [];
		}

		return [templateDataNodeGroup];
	}

	#getFilterResultPropertyIds(activity: ?ActivityData): Set<string>
	{
		const propertiesMap = activity?.Properties?.[FILTER_RETURN_PROPERTIES_MAP];

		return Type.isPlainObject(propertiesMap) ? new Set(Object.keys(propertiesMap)) : new Set();
	}

	#createTemplateDataNodeGroup(block: Block, activity): TemplateDataNodeGroup | null
	{
		const properties = activity?.ReturnProperties ?? [];

		if (!Array.isArray(properties) || properties.length === 0)
		{
			return null;
		}

		const items = properties
			.map((property) => {
				const propertyId = property?.Id ?? '';
				const propertyName = property?.Name ?? propertyId;

				if (!propertyName)
				{
					return null;
				}

				const resolvedPropertyId = propertyId || propertyName;

				if (property?.Type === PROPERTY_TYPES.DOCUMENT)
				{
					return this.#processDocumentProperty(block, property, resolvedPropertyId, propertyName);
				}

				return {
					id: resolvedPropertyId,
					name: propertyName,
					computeValue: this.#makeComputeValue(block.id, resolvedPropertyId),
					type: property?.Type ?? TEMPLATE_DEFAULT_DATA_TYPE,
				};
			})
			.filter(Boolean);
		if (items.length === 0)
		{
			return null;
		}

		return {
			nodeId: block.id,
			name: block.node.title,
			icon: block.node.icon,
			items,
		};
	}

	#processDocumentProperty(
		block: Block,
		property: Object,
		resolvedPropertyId: string,
		propertyName: string,
	): Object
	{
		const cachedFields = documentFieldsCache.get(property.Default);

		return {
			name: propertyName,
			type: PROPERTY_TYPES.DOCUMENT,
			documentType: property.Default,
			blockId: block.id,
			resolvedPropertyId,
			items: cachedFields
				? cachedFields.map((field) => ({
					id: field.fieldKey,
					name: field.name,
					computeValue: this.#makeComputeValue(block.id, `${resolvedPropertyId}.${field.fieldKey}`),
					type: field.type,
				}))
				: [],
		};
	}

	#buildSnapshot(block: Block, activityData: ?ActivityData): TemplateDataSnapshot
	{
		return {
			templateItems: this.getTemplateItems(),
			incomingItems: this.getIncomingProperties(block),
			filterItems: this.getNodeFilterProperties(block),
			outgoingItems: this.getOutgoingProperties(block, { activityData }),
		};
	}

	#collectUniqueDocumentTypes(snapshot: TemplateDataSnapshot): Map<string, string | Array<string>>
	{
		const documentTypes = new Map();
		const nodeGroups = [
			...(snapshot.incomingItems ?? []),
			...(snapshot.filterItems ?? []),
			...(snapshot.outgoingItems ?? []),
		];

		const collectDocumentTypes = (items: Array<DocumentTypeItem>): void => {
			items.forEach((item) => {
				if (item.type === PROPERTY_TYPES.DOCUMENT)
				{
					const documentType = item.documentType;
					const key = getDocumentTypeKey(documentType);
					if (!documentTypes.has(key))
					{
						documentTypes.set(key, documentType);
					}
				}

				if (Array.isArray(item.items))
				{
					collectDocumentTypes(item.items);
				}
			});
		};

		nodeGroups.forEach((group) => {
			collectDocumentTypes(group.items);
		});

		return documentTypes;
	}

	#makeTemplateItemGroup(
		type: $Values<TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE>,
		dataObject: DiagramTemplateGeneralData,
	): TemplateDataTemplateGroup
	{
		const items = Object.entries(dataObject).map(([propertyId, propertyData]) => ({
			id: propertyId,
			name: propertyData.Name,
			computeValue: this.#makeComputeValue(type, propertyId),
			type: propertyData.Type ?? '',
		}));

		return {
			type,
			items,
		};
	}

	#makeComputeValue(source: $Values<TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE> | string, propertyId: string): string
	{
		const buildComputeValueWithPrefix = (prefix: string) => `{=${prefix}:${propertyId}}`;
		if (source === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.CONSTANT)
		{
			return buildComputeValueWithPrefix(COMPUTE_VALUE_PREFIXES.CONSTANT);
		}

		if (source === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.VARIABLE)
		{
			return buildComputeValueWithPrefix(COMPUTE_VALUE_PREFIXES.VARIABLE);
		}

		return buildComputeValueWithPrefix(source);
	}
}

export function getTemplateDataProvider(): TemplateDataProvider
{
	if (!TemplateDataProvider.instance)
	{
		TemplateDataProvider.instance = new TemplateDataProvider(
			diagramStore(),
		);
	}

	return TemplateDataProvider.instance;
}
