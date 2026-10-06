/**
 * Access codes of a pilot audience: `U{id}` - an employee, `D{id}` - the members of a department
 * itself, `DR{id}` - the department with everyone below it, `SNT{id}` and `SNTR{id}` - the same pair
 * for a team of the HR structure. The rules are the ones the platform selector service follows
 * (ui/install/js/ui/accessrights/v2/src/service/selector-service.js); that service is private to its
 * own extension, so the entities the audience uses are mapped here.
 */

export type SelectorItem = {
	entityId: string,
	id: string | number,
};

export type SelectorItemId = [string, string];

export const USER_ENTITY_ID = 'user';
export const DEPARTMENT_ENTITY_ID = 'department';
export const STRUCTURE_NODE_ENTITY_ID = 'structure-node';

export const TEAM_NODE_ENTITY_TYPE = 'team';

// The selector marks a node item that stands for the node alone with this suffix; without it the item
// means the node together with everyone below it.
const FLAT_NODE_SUFFIX = ':F';

// Both node entities of the audience share the shape of an item id and differ only in the prefixes of
// their codes. The structure node entity is taken for teams only, so it carries the team prefixes.
const NODE_CODE_PREFIXES = new Map([
	[DEPARTMENT_ENTITY_ID, { own: 'D', recursive: 'DR' }],
	[STRUCTURE_NODE_ENTITY_ID, { own: 'SNT', recursive: 'SNTR' }],
]);

const USER_CODE = /^U(\d+)$/;
const NODE_CODE = /^([A-Z]+)(\d+)$/;
const NUMERIC_ITEM_ID = /^\d+$/;
const FLAT_NODE_ITEM_ID = /^(\d+):F$/;

// null for an entity the audience does not accept and for an id of an unexpected shape, so an unknown
// selection never travels to the server as a code of a guessed shape.
export function getAccessCodeByItem(item: SelectorItem): string | null
{
	const itemId = String(item?.id ?? '');

	if (item?.entityId === USER_ENTITY_ID)
	{
		return NUMERIC_ITEM_ID.test(itemId) ? `U${itemId}` : null;
	}

	const prefixes = NODE_CODE_PREFIXES.get(item?.entityId);
	if (prefixes === undefined)
	{
		return null;
	}

	const flatNode = FLAT_NODE_ITEM_ID.exec(itemId);
	if (flatNode !== null)
	{
		return `${prefixes.own}${flatNode[1]}`;
	}

	return NUMERIC_ITEM_ID.test(itemId) ? `${prefixes.recursive}${itemId}` : null;
}

export function getItemIdByAccessCode(accessCode: string): SelectorItemId | null
{
	const user = USER_CODE.exec(accessCode);
	if (user !== null)
	{
		return [USER_ENTITY_ID, user[1]];
	}

	const node = NODE_CODE.exec(accessCode);
	if (node === null)
	{
		return null;
	}

	const [, prefix, id] = node;
	for (const [entityId, prefixes] of NODE_CODE_PREFIXES)
	{
		if (prefix === prefixes.recursive)
		{
			return [entityId, id];
		}

		if (prefix === prefixes.own)
		{
			return [entityId, `${id}${FLAT_NODE_SUFFIX}`];
		}
	}

	return null;
}
