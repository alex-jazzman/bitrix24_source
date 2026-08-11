import { Loc } from 'main.core';

import { TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE } from '../../../shared/constants';
import {
	type TemplateDataGeneralGroup,
	type TemplateDataNodeGroup,
	type TemplateDataTemplateGroup,
	type PortId,
	type TemplateDataItem,
	type Port,
} from '../../../shared/types';

import { SchemeItemType, SchemeViewGroupConfig, SchemeViewGroupKey } from '../ui/node-data-inspector/const';
import { DataTypeLabelMap, type InspectorViewItemBase, type InspectorViewItemData } from '../../../entities/node-data-inspector';

type NodeItem = {
	type: $Values<typeof SchemeItemType>,
	text: string,
	icon: string,
	items: Array<InspectorViewItemData>,
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

const GroupPortLabels = {
	INCOMING: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE'),
	OUTGOING: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE'),
};

export function mapTemplateGroupsToView(items: {
	templateItems: Array<TemplateDataTemplateGroup>,
	incomingItems: Array<TemplateDataNodeGroup>,
	outgoingItems: Array<TemplateDataNodeGroup>
}, ports: Array<Port>): Array
{
	const templateSections = (Array.isArray(items?.templateItems) ? items.templateItems : [])
		.map((group) => createTemplateSection(group))
		.filter(Boolean)
	;
	const incomingNodes = (Array.isArray(items?.incomingItems) ? items.incomingItems : [])
		.map((group) => createNodeItem(group))
		.filter(Boolean)
	;
	const areUntitledPorts = ports.every((port) => !port.title);
	const groupedIncomingNodes = areUntitledPorts
		? incomingNodes
		: groupNodesByPort(incomingNodes, ports, GroupPortLabels.INCOMING);
	const outgoingNodes = (Array.isArray(items?.outgoingItems) ? items.outgoingItems : [])
		.map((group) => createNodeItem(group))
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

function createTemplateSection(group: TemplateDataTemplateGroup): ?Object
{
	const title = getTemplateGroupTitle(group?.type);
	const items = mapTemplateItems(group?.items ?? []);

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

function createNodeItem(nodeGroup: TemplateDataNodeGroup): NodeItem | null
{
	const nodeTitle = nodeGroup?.name ?? '';
	const dataItems = mapTemplateItems(nodeGroup?.items ?? []);

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

function mapTemplateItems(items: TemplateDataGeneralGroup | Array<TemplateDataItem>): Array<InspectorViewItemData>
{
	return (Array.isArray(items) ? items : [])
		.map((item) => {
			if (item.items)
			{
				return {
					...item,
					text: item.name,
					items: item.items.map((i) => createDataItem(i)),
				};
			}

			return createDataItem(item);
		})
		.filter(Boolean)
	;
}

function createDataItem(item: TemplateDataItem): ?InspectorViewItemData
{
	const title = item?.name ?? '';

	if (!title)
	{
		return null;
	}

	return {
		type: SchemeItemType.DATA,
		text: title,
		dataType: DataTypeLabelMap[item?.type] ?? item?.type ?? '',
		value: item?.computeValue ?? '',
	};
}
