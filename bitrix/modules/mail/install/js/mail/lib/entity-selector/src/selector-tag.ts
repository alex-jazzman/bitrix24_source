import { type ParsedSelectorItem, type SelectorTag } from './types';

const FLAT_DEPARTMENT_ITEM_ID = /^(\d+):F$/;
const NUMERIC_ITEM_ID = /^\d+$/;

export function parseSelectorTag(tag: SelectorTag): ParsedSelectorItem | null
{
	const entity = tag.getEntityId();
	const itemId = String(tag.getId());

	if (entity === 'department')
	{
		const flatMatch = itemId.match(FLAT_DEPARTMENT_ITEM_ID);
		if (flatMatch)
		{
			return { entity, id: Number(flatMatch[1]), isFlat: true };
		}

		if (NUMERIC_ITEM_ID.test(itemId))
		{
			return { entity, id: Number(itemId), isFlat: false };
		}

		return null;
	}

	if ((entity === 'user' || entity === 'mail_mailbox') && NUMERIC_ITEM_ID.test(itemId))
	{
		return { entity, id: Number(itemId), isFlat: false };
	}

	return null;
}

export function buildDepartmentItemId(id: number, isFlat: boolean): string
{
	return isFlat ? `${id}:F` : String(id);
}
