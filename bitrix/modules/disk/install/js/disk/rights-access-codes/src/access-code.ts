import { Type } from 'main.core';

export type SelectorItem = {
	getEntityId: () => string,
	getId: () => string | number,
};

export type SelectorItemId = [string, string];

export const EntityId = Object.freeze({
	User: 'user',
	Department: 'department',
	ProjectAccessCodes: 'project-access-codes',
	SiteGroups: 'site-groups',
	SpecialAccess: 'disk-special-access',
});

const SpecialAccessCode = Object.freeze({
	AllAuthorized: 'AU',
	Creator: 'CR',
});

// Disk rights dialogs never offer G2 among site groups: it stays visible in the cloud where
// every other group is hidden, so it is not interchangeable with a site-groups item.
const nonGroupSiteGroupCode = 'G2';

const numericId = /^\d+$/;
const flatDepartmentItemId = /^(\d+):F$/;
const userCode = /^U(\d+)$/;
const departmentWithChildrenCode = /^DR(\d+)$/;
const flatDepartmentCode = /^D(\d+)$/;
const siteGroupCode = /^G(\d+)$/;
const projectRoleCode = /^SG\d+_[AEK]$/;

export function getAccessCodeByItem(item: SelectorItem): string | null
{
	const id = String(item.getId());

	switch (item.getEntityId())
	{
		case EntityId.User:
			return numericId.test(id) ? `U${id}` : null;

		case EntityId.Department:
			return getDepartmentAccessCode(id);

		case EntityId.ProjectAccessCodes:
			return projectRoleCode.test(id) ? id : null;

		case EntityId.SiteGroups:
			return getSiteGroupAccessCode(id);

		case EntityId.SpecialAccess:
			return isSpecialAccessCode(id) ? id : null;

		default:
			return null;
	}
}

export function getItemIdByAccessCode(accessCode: string): SelectorItemId | null
{
	if (!Type.isString(accessCode) || accessCode === nonGroupSiteGroupCode)
	{
		return null;
	}

	if (isSpecialAccessCode(accessCode))
	{
		return [EntityId.SpecialAccess, accessCode];
	}

	if (projectRoleCode.test(accessCode))
	{
		return [EntityId.ProjectAccessCodes, accessCode];
	}

	const userMatch = accessCode.match(userCode);
	if (userMatch !== null)
	{
		return [EntityId.User, userMatch[1]];
	}

	const departmentMatch = accessCode.match(departmentWithChildrenCode);
	if (departmentMatch !== null)
	{
		return [EntityId.Department, departmentMatch[1]];
	}

	const flatDepartmentMatch = accessCode.match(flatDepartmentCode);
	if (flatDepartmentMatch !== null)
	{
		return [EntityId.Department, `${flatDepartmentMatch[1]}:F`];
	}

	const siteGroupMatch = accessCode.match(siteGroupCode);
	if (siteGroupMatch !== null)
	{
		return [EntityId.SiteGroups, siteGroupMatch[1]];
	}

	return null;
}

function getDepartmentAccessCode(id: string): string | null
{
	const flatMatch = id.match(flatDepartmentItemId);
	if (flatMatch !== null)
	{
		return `D${flatMatch[1]}`;
	}

	return numericId.test(id) ? `DR${id}` : null;
}

function getSiteGroupAccessCode(id: string): string | null
{
	if (!numericId.test(id))
	{
		return null;
	}

	const accessCode = `G${id}`;

	return accessCode === nonGroupSiteGroupCode ? null : accessCode;
}

function isSpecialAccessCode(code: string): boolean
{
	return code === SpecialAccessCode.AllAuthorized || code === SpecialAccessCode.Creator;
}
