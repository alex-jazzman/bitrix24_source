import { Type } from 'main.core';
import { type ProcessStartMember } from 'sign.v2.api';

export type SelectedEntity = {
	entityId: number | string,
	entityType: string,
};

const USER_ENTITY_TYPE = 'user';
const STRUCTURE_NODE_ENTITY_TYPE = 'structure-node';
const SIGNERS_LIST_ENTITY_TYPE = 'signers-list';
const SIGN_DOCUMENT_ENTITY_TYPE = 'sign-document';

const ALLOWED_ENTITY_TYPES = new Set([
	USER_ENTITY_TYPE,
	STRUCTURE_NODE_ENTITY_TYPE,
	SIGNERS_LIST_ENTITY_TYPE,
	SIGN_DOCUMENT_ENTITY_TYPE,
]);

const FLAT_STRUCTURE_NODE_ID_PATTERN = /^([1-9]\d*):F$/;
const NUMERIC_ID_PATTERN = /^[1-9]\d*$/;

export function normalizeMembers(entities: SelectedEntity[]): ProcessStartMember[]
{
	const members: ProcessStartMember[] = [];
	const keys = new Set<string>();

	entities.forEach((entity: SelectedEntity) => {
		if (!ALLOWED_ENTITY_TYPES.has(entity?.entityType))
		{
			return;
		}

		const entityId = normalizeEntityId(entity.entityType, entity.entityId);
		if (entityId === null)
		{
			return;
		}

		const key = `${entity.entityType}:${entityId}`;
		if (keys.has(key))
		{
			return;
		}

		keys.add(key);
		members.push({ entityType: entity.entityType, entityId });
	});

	return members;
}

function normalizeEntityId(entityType: string, rawEntityId: number | string): number | string | null
{
	if (Type.isNumber(rawEntityId))
	{
		return isValidNumericId(rawEntityId) ? rawEntityId : null;
	}

	if (!Type.isString(rawEntityId))
	{
		return null;
	}

	const entityId = rawEntityId.trim();
	if (NUMERIC_ID_PATTERN.test(entityId))
	{
		const numericId = Number(entityId);

		return isValidNumericId(numericId) ? numericId : null;
	}

	if (entityType !== STRUCTURE_NODE_ENTITY_TYPE)
	{
		return null;
	}

	const flatStructureNodeMatch = entityId.match(FLAT_STRUCTURE_NODE_ID_PATTERN);
	if (flatStructureNodeMatch === null)
	{
		return null;
	}

	const structureNodeId = Number(flatStructureNodeMatch[1]);

	return isValidNumericId(structureNodeId) ? `${structureNodeId}:F` : null;
}

function isValidNumericId(entityId: number): boolean
{
	return Number.isSafeInteger(entityId) && entityId > 0;
}
