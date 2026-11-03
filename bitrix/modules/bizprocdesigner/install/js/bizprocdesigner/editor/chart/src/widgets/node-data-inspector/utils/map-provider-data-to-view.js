import { Loc } from 'main.core';
import { Feature, FeatureCode } from 'bizprocdesigner.feature';

import { PROPERTY_TYPES, TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE } from '../../../shared/constants';
import { documentFieldsCache } from '../../../shared/utils/document-fields-cache';
import {
	type TemplateDataGeneralGroup,
	type TemplateDataNodeGroup,
	type TemplateDataTemplateGroup,
	type PortId,
	type TemplateDataItem,
	type Port,
} from '../../../shared/types';

import { SchemeItemType, SchemeViewGroupConfig, SchemeViewGroupKey } from '../ui/node-data-inspector/const';
import {
	DataTypeLabelMap,
	type InspectorViewFoundItemsItem,
	type InspectorViewItemBase,
	type InspectorViewItemData,
	type InspectorViewItemType,
} from '../../../entities/node-data-inspector';
import { type LastRunValue } from '../../../shared/stores/node-data-inspector-store';

import { formatLastValue } from './format-last-value';

type LastValuesMap = { [expression: string]: LastRunValue };

type NodeItem = {
	type: InspectorViewItemType,
	text: string,
	icon: string,
	items: Array<InspectorViewItemData | InspectorViewFoundItemsItem>,
	relatedPortsIds: Array<PortId>,
};

type GroupedNode = {
	id: PortId,
	items: Array<NodeItem>,
	text: string,
};

const SchemeTemplateSectionTitle = Object.freeze({
	CONSTANTS: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_CONSTANTS'),
	VARIABLES: Loc.getMessage('BIZPROCDESIGNER_SELECTOR_ITEM_VARIABLES'),
});

// Suffix of the paired collection result of a filter, mirroring
// `\Bitrix\Bizproc\Public\Activity\Mixins\NodeFilterResultProperties::FILTER_RESULT_ALL_SUFFIX`.
const FILTER_RESULT_ALL_SUFFIX = '_all';

const GroupPortLabels = {
	INCOMING: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE'),
	OUTGOING: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE'),
};

export function mapTemplateGroupsToView(items: {
	templateItems: Array<TemplateDataTemplateGroup>,
	incomingItems: Array<TemplateDataNodeGroup>,
	filterItems: Array<TemplateDataNodeGroup>,
	outgoingItems: Array<TemplateDataNodeGroup>
}, ports: Array<Port>, lastValues: ?LastValuesMap = null): Array
{
	const templateSections = (Array.isArray(items?.templateItems) ? items.templateItems : [])
		.map((group) => createTemplateSection(group, lastValues))
		.filter(Boolean)
	;
	const incomingNodes = (Array.isArray(items?.incomingItems) ? items.incomingItems : [])
		.map((group) => createNodeItem(group, lastValues))
		.filter(Boolean)
	;
	const areUntitledPorts = ports.every((port) => !port.title);
	const groupedIncomingNodes = areUntitledPorts
		? incomingNodes
		: groupNodesByPort(incomingNodes, ports, GroupPortLabels.INCOMING);
	const filterNodes = (Array.isArray(items?.filterItems) ? items.filterItems : [])
		.map((group) => createFilterNodeItem(group, lastValues))
		.filter(Boolean)
	;
	const outgoingNodes = (Array.isArray(items?.outgoingItems) ? items.outgoingItems : [])
		.map((group) => createNodeItem(group, lastValues))
		.filter(Boolean)
	;
	const groupedOutgoingNodes = areUntitledPorts
		? outgoingNodes
		: groupNodesByPort(outgoingNodes, ports, GroupPortLabels.OUTGOING);
	const groups = [
		createGroup(SchemeViewGroupConfig[SchemeViewGroupKey.GLOBAL], templateSections, SchemeViewGroupKey.GLOBAL),
		createGroup(
			SchemeViewGroupConfig[SchemeViewGroupKey.INBOUND],
			[...groupedIncomingNodes.values()],
			SchemeViewGroupKey.INBOUND,
		),
		createGroup(SchemeViewGroupConfig[SchemeViewGroupKey.FILTER], filterNodes, SchemeViewGroupKey.FILTER),
		createGroup(
			SchemeViewGroupConfig[SchemeViewGroupKey.OUTBOUND],
			[...groupedOutgoingNodes.values()],
			SchemeViewGroupKey.OUTBOUND,
		),
	];

	return groups.filter(Boolean);
}

function groupNodesByPort(nodes: Array<NodeItem>, ports: Array<Port>, label: string): Map<PortId, GroupedNode>
{
	const groupedNodes = new Map();
	nodes.forEach((node) => {
		node.relatedPortsIds.forEach((relatedPortId) => {
			if (!groupedNodes.has(relatedPortId))
			{
				groupedNodes.set(relatedPortId, {
					id: relatedPortId,
					items: [],
				});
			}

			const group = groupedNodes.get(relatedPortId);
			group.items.push(node);
		});
	});
	ports.forEach((port) => {
		const groupedNode = groupedNodes.get(port.id);
		if (groupedNode)
		{
			groupedNode.text = `${label} ${port.title}`;
		}
	});

	return groupedNodes;
}

function createTemplateSection(group: TemplateDataTemplateGroup, lastValues: ?LastValuesMap): ?Object
{
	const title = getTemplateGroupTitle(group?.type);
	const items = mapTemplateItems(group?.items ?? [], lastValues);

	return createSection(title, items, group?.type);
}

function getTemplateGroupTitle(type: ?string): string
{
	if (type === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.CONSTANT)
	{
		return SchemeTemplateSectionTitle.CONSTANTS;
	}

	if (type === TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE.VARIABLE)
	{
		return SchemeTemplateSectionTitle.VARIABLES;
	}

	return '';
}

function createNodeItem(nodeGroup: TemplateDataNodeGroup, lastValues: ?LastValuesMap): NodeItem | null
{
	return buildNodeItem(nodeGroup, mapTemplateItems(nodeGroup?.items ?? [], lastValues));
}

function createFilterNodeItem(nodeGroup: TemplateDataNodeGroup, lastValues: ?LastValuesMap): NodeItem | null
{
	return buildNodeItem(nodeGroup, mapFilterResultItems(nodeGroup?.items ?? [], lastValues));
}

function buildNodeItem(
	nodeGroup: TemplateDataNodeGroup,
	dataItems: Array<InspectorViewItemData | InspectorViewFoundItemsItem>,
): NodeItem | null
{
	const nodeTitle = nodeGroup?.name ?? '';

	if (!nodeTitle || dataItems.length === 0)
	{
		return null;
	}

	return {
		id: nodeGroup?.nodeId ?? '',
		type: SchemeItemType.NODE,
		text: nodeTitle,
		icon: nodeGroup?.icon ?? '',
		items: dataItems,
		relatedPortsIds: nodeGroup?.relatedPortsIds ?? null,
	};
}

/**
 * The filter group is the only one built this way: the pair of filter result properties of a node - the
 * first found document and the whole collection - collapses into a single found items node.
 *
 * Only while the last run values are available. Without them the node has no list to walk and no values
 * to show, and the pair it replaces would be gone from the panel with nothing in its place: the two
 * expressions of the filter result would stop being draggable at all.
 */
function mapFilterResultItems(
	items: Array<Object>,
	lastValues: ?LastValuesMap,
): Array<InspectorViewItemData | InspectorViewFoundItemsItem>
{
	if (!Feature.instance().isAvailable(FeatureCode.lastRunValues))
	{
		return mapTemplateItems(items, lastValues);
	}

	const collectionIds = new Set(
		items.filter((item) => isFilterResultCollection(item)).map((item) => item.id),
	);

	return items.flatMap((item) => {
		const propertyId = item?.id ?? '';

		// the first position is shown inside the found items node of its collection
		if (collectionIds.has(`${propertyId}${FILTER_RESULT_ALL_SUFFIX}`))
		{
			return [];
		}

		if (collectionIds.has(propertyId))
		{
			return [createFoundItemsItem(item, findFirstItemProperty(items, propertyId))];
		}

		return mapTemplateItems([item], lastValues);
	});
}

function isFilterResultCollection(item: Object): boolean
{
	const propertyId = item?.id ?? '';

	return item?.type === PROPERTY_TYPES.DOCUMENT && propertyId.endsWith(FILTER_RESULT_ALL_SUFFIX);
}

function findFirstItemProperty(items: Array<Object>, collectionPropertyId: string): ?Object
{
	const firstItemPropertyId = collectionPropertyId.slice(0, -FILTER_RESULT_ALL_SUFFIX.length);

	return items.find((item) => item?.id === firstItemPropertyId) ?? null;
}

function createFoundItemsItem(collectionProperty: Object, firstItemProperty: ?Object): InspectorViewFoundItemsItem
{
	const documentType = collectionProperty?.documentType ?? firstItemProperty?.documentType;
	const fields = documentFieldsCache.get(documentType) ?? [];
	const firstItemExpressionPrefix = makeFilterResultExpression(firstItemProperty);

	return {
		id: collectionProperty?.id ?? '',
		type: SchemeItemType.FOUND_ITEMS,
		// the caption of the selected item is not part of the text: it keys the render of the subtree
		text: collectionProperty?.name ?? firstItemProperty?.name ?? '',
		// collapsible before the list arrives, otherwise the chevron appears and goes as it loads
		hasChildren: true,
		collectionExpression: makeFilterResultExpression(collectionProperty),
		firstItemExpressionPrefix,
		// the schema cache is addressed by document type, so the node carries it: that is how the
		// panel tells a refused schema from a document without fields
		documentType,
		fields,
		// the leaves come from the schema cache, not from the provider snapshot: the snapshot is
		// rebuilt on a node switch only, so a schema that arrived later would leave the node empty
		items: mapTemplateItems(makeFieldItems(fields, firstItemExpressionPrefix), null),
	};
}

function makeFieldItems(fields: Array<Object>, expressionPrefix: string): Array<Object>
{
	if (expressionPrefix === '')
	{
		return [];
	}

	return fields.map((field) => ({
		id: field.fieldKey,
		name: field.name,
		computeValue: `${expressionPrefix.slice(0, -1)}.${field.fieldKey}}`,
		type: field.type,
	}));
}

function makeFilterResultExpression(property: ?Object): string
{
	const blockId = property?.blockId ?? '';
	const propertyId = property?.id ?? '';

	return blockId && propertyId ? `{=${blockId}:${propertyId}}` : '';
}

function createGroup(
	groupConfig: { title: string, color: string, icon: string },
	items: Array<InspectorViewItemBase>,
	id: string,
): InspectorViewItemBase | null
{
	if (!Array.isArray(items) || items.length === 0)
	{
		return null;
	}

	return {
		id,
		type: SchemeItemType.GROUP,
		icon: groupConfig.icon,
		color: groupConfig.color,
		text: groupConfig.title,
		items,
	};
}

function createSection(
	title: string,
	items: Array<InspectorViewItemBase>,
	id: string,
): ?InspectorViewItemBase
{
	if (!title || !Array.isArray(items) || items.length === 0)
	{
		return null;
	}

	return {
		id,
		type: SchemeItemType.SECTION,
		text: title,
		items,
	};
}

function mapTemplateItems(
	items: TemplateDataGeneralGroup | Array<TemplateDataItem>,
	lastValues: ?LastValuesMap,
): Array<InspectorViewItemData>
{
	return (Array.isArray(items) ? items : [])
		.map((item) => {
			if (item.items)
			{
				return {
					...item,
					text: item.name,
					items: mapTemplateItems(item.items, lastValues),
				};
			}

			return createDataItem(item, lastValues);
		})
		.filter(Boolean)
	;
}

function createDataItem(item: TemplateDataItem, lastValues: ?LastValuesMap): ?InspectorViewItemData
{
	const title = item?.name ?? '';

	if (!title)
	{
		return null;
	}

	const expression = item?.computeValue ?? '';
	const lastValue = formatLastValue(lastValues?.[expression]);

	return {
		type: SchemeItemType.DATA,
		text: title,
		dataType: DataTypeLabelMap[item?.type] ?? item?.type ?? '',
		value: expression,
		exampleValue: lastValue.text,
		exampleValueItems: lastValue.items,
		exampleValueMoreCount: lastValue.moreCount,
	};
}
