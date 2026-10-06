import { type Item, type ItemId } from 'ui.entity-selector';

export const EntityId = Object.freeze({
	User: 'user',
	Department: 'department',
	SiteGroups: 'site-groups',
	StructureRole: 'structure-role',
	UserGroups: 'user-groups',
	ProjectAccessCodes: 'project-access-codes',
});

const USER_CODE = /^I?U(\d+)$/;
const RECURSIVE_DEPARTMENT_CODE = /^DR(\d+)$/;
const DEPARTMENT_CODE = /^D(\d+)$/;
const SITE_GROUP_CODE = /^G(\d+)$/;
const PROJECT_ACCESS_CODE = /^SG\d+(?:_[AEK])?$/;
const NODE_ROLE_CODE = /^(?:AD|AT)[1-9]\d*$/;
const COMPANY_ROLE_CODE = /^(?:AD|AT)0$/;

const FLAT_DEPARTMENT_ITEM = /^(\d+):F$/;

/**
 * A role of a structure node or of the company, as opposed to a node itself: node ids are plain numbers.
 */
const ROLE_ITEM_ID = /^(?:AD|AE|AT|ATD|ATE|ATT)\d+$/;
const SELECTABLE_ROLE_ITEM_ID = /^(?:AD|AT)(?:0|[1-9]\d*)$/;

export function toAccessCode(item: Item): string
{
	const itemId = String(item.getId());

	switch (item.getEntityId())
	{
		case EntityId.User:
			// IU covers the employee and everyone he reports to, the meaning the previous selector had.
			return `IU${itemId}`;

		case EntityId.Department:
		{
			const departmentOnly = itemId.match(FLAT_DEPARTMENT_ITEM);

			return departmentOnly ? `D${departmentOnly[1]}` : `DR${itemId}`;
		}

		case EntityId.SiteGroups:
			return `G${itemId}`;

		case EntityId.StructureRole:
		case EntityId.UserGroups:
		case EntityId.ProjectAccessCodes:
			return itemId;

		default:
			return '';
	}
}

export function toItemId(accessCode: string): ItemId | null
{
	const user = accessCode.match(USER_CODE);
	if (user)
	{
		return [EntityId.User, user[1]];
	}

	const departmentWithChildren = accessCode.match(RECURSIVE_DEPARTMENT_CODE);
	if (departmentWithChildren)
	{
		return [EntityId.Department, departmentWithChildren[1]];
	}

	const department = accessCode.match(DEPARTMENT_CODE);
	if (department)
	{
		return [EntityId.Department, `${department[1]}:F`];
	}

	const siteGroup = accessCode.match(SITE_GROUP_CODE);
	if (siteGroup)
	{
		return [EntityId.SiteGroups, siteGroup[1]];
	}

	if (NODE_ROLE_CODE.test(accessCode))
	{
		return [EntityId.StructureRole, accessCode];
	}

	if (COMPANY_ROLE_CODE.test(accessCode))
	{
		return [EntityId.UserGroups, accessCode];
	}

	if (PROJECT_ACCESS_CODE.test(accessCode))
	{
		return [EntityId.ProjectAccessCodes, accessCode];
	}

	return null;
}

/**
 * A person selected today is stored as IU{id} while older records may keep U{id},
 * so both forms have to collapse into one key to keep the row unique.
 */
export function normalizeAccessCode(accessCode: string): string
{
	const user = accessCode.match(USER_CODE);

	return user ? `person:${user[1]}` : `code:${accessCode}`;
}

/**
 * Group and role tabs come from foreign providers and offer every role of a node,
 * while telephony permissions cover heads and their deputies only.
 */
export function isRoleOutOfScope(entityId: string, itemId: string): boolean
{
	if (entityId !== EntityId.UserGroups && entityId !== EntityId.StructureRole)
	{
		return false;
	}

	if (!ROLE_ITEM_ID.test(itemId))
	{
		// A structure node carries its roles as children: hiding the node would empty the whole tab.
		return false;
	}

	return !SELECTABLE_ROLE_ITEM_ID.test(itemId);
}
