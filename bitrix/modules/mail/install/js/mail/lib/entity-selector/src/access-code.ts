import { buildDepartmentItemId, parseSelectorTag } from './selector-tag';
import { type SelectorPreselectedItem, type SelectorTag } from './types';

export function getSelectorItemByAccessCode(code: string): SelectorPreselectedItem | null
{
	const userMatch = code.match(/^U(\d+)$/);
	if (userMatch)
	{
		return ['user', userMatch[1]];
	}

	const recursiveDepartmentMatch = code.match(/^DR(\d+)$/);
	if (recursiveDepartmentMatch)
	{
		return ['department', buildDepartmentItemId(Number(recursiveDepartmentMatch[1]), false)];
	}

	const flatDepartmentMatch = code.match(/^D(\d+)$/);
	if (flatDepartmentMatch)
	{
		return ['department', buildDepartmentItemId(Number(flatDepartmentMatch[1]), true)];
	}

	return null;
}

export function getAccessCodeBySelectorTag(tag: SelectorTag): string | null
{
	const parsed = parseSelectorTag(tag);

	if (parsed?.entity === 'user')
	{
		return `U${parsed.id}`;
	}

	if (parsed?.entity === 'department')
	{
		return parsed.isFlat ? `D${parsed.id}` : `DR${parsed.id}`;
	}

	return null;
}
