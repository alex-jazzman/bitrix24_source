import { EntitySelectorEntity } from 'tasks.v2.const';
import type { CrmItemModel } from 'tasks.v2.model.crm-items';
import type { CrmItemDto } from './types';

const entityPrefixMap = {
	[EntitySelectorEntity.Deal]: 'D',
	[EntitySelectorEntity.Contact]: 'C',
	[EntitySelectorEntity.Company]: 'CO',
	[EntitySelectorEntity.Lead]: 'L',
	[EntitySelectorEntity.SmartInvoice]: 'SI',
};

const prefixSortMap = Object.fromEntries(Object.values(entityPrefixMap).map((it, index) => [it, index]));

const prefixEntityMap = Object.fromEntries(Object.entries(entityPrefixMap).map((it) => it.reverse()));

const entityTypeIdMap = {
	[EntitySelectorEntity.Deal]: 2,
	[EntitySelectorEntity.Contact]: 3,
	[EntitySelectorEntity.Company]: 4,
	[EntitySelectorEntity.Lead]: 1,
	[EntitySelectorEntity.SmartInvoice]: 31,
};

export function mapDtoToModel(crmItemDto: CrmItemDto): CrmItemModel
{
	return {
		id: crmItemDto.id,
		entityId: crmItemDto.entityId,
		type: crmItemDto.type,
		typeName: crmItemDto.typeName,
		title: crmItemDto.title,
		link: crmItemDto.link,
	};
}

export function mapId(entityId: string, id: number): string
{
	if (!entityPrefixMap[entityId])
	{
		const [typeId, itemId] = id.split(':');

		return `T${Number(typeId).toString(16)}_${itemId}`;
	}

	return `${entityPrefixMap[entityId]}_${id}`;
}

export function splitId(id: string): string
{
	const [prefix, entityId] = id.split('_');
	if (!prefixEntityMap[prefix])
	{
		return [EntitySelectorEntity.DynamicMultiple, `${getEntityTypeId(id)}:${entityId}`];
	}

	return [prefixEntityMap[prefix], Number(entityId)];
}

export function compareIds(idA: string, idB: string): number
{
	const [prefixA, entityIdA] = idA.split('_');
	const [prefixB, entityIdB] = idB.split('_');

	const sortA = prefixSortMap[prefixA] ?? getEntityTypeId(idA);
	const sortB = prefixSortMap[prefixB] ?? getEntityTypeId(idB);

	if (sortA === sortB)
	{
		return entityIdA - entityIdB;
	}

	return sortA - sortB;
}

export function getEntityTypeId(id: string): number
{
	const [prefix] = id.split('_');
	if (!prefixEntityMap[prefix])
	{
		return parseInt(prefix.slice(1), 16);
	}

	return entityTypeIdMap[prefixEntityMap[prefix]];
}
