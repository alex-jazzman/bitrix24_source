import { EventEmitter } from 'main.core.events';

import { diagramStore } from '../../entities/blocks/index.js';
import { COMPUTE_VALUE_PREFIXES, PROPERTY_TYPES, TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE, TEMPLATE_DEFAULT_DATA_TYPE, BLOCK_TYPES } from '../constants';
import { documentFieldsCache } from './document-fields-cache';

import {
	type Block,
	type DiagramStore,
	type DiagramTemplateGeneralData,
	type PortId,
	type TemplateDataNodeGroup,
	type TemplateDataTemplateGroup,
} from '../types';

class TemplateDataProvider extends EventEmitter
{
	static instance: TemplateDataProvider;

	#store: DiagramStore;

	constructor(store: DiagramStore)
	{
		super();
		this.#store = store;

		this.setEventNamespace('BizprocDesigner.Editor.Chart.TemplateDataProvider');
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

		if (!cachedFields)
		{
			this.#prefetchDocumentFields(property.Default);
		}

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

	async #prefetchDocumentFields(documentType: string | Array<string>): Promise<void>
	{
		try
		{
			const fields = await documentFieldsCache.fetchFields(documentType);
			if (fields.length > 0)
			{
				this.emit('onDocumentFieldsLoaded');
			}
		}
		catch
		{ /* empty */ }
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
