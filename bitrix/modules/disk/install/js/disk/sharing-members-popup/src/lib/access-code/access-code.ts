import { SelectorEntityInfo, type SelectorEntityValue } from '../../const/selector';

/**
 * An item of ui.entity-selector as its dialog addresses it: the entity id and the id inside it.
 */
export type SelectorItemId = [SelectorEntityValue, string];

export function getSelectorItemIdByAccessCode(accessCode: string): SelectorItemId | null
{
	const entity = (Object.keys(SelectorEntityInfo) as SelectorEntityValue[]).find(
		(candidate: SelectorEntityValue) => accessCode.startsWith(SelectorEntityInfo[candidate].accessCodePrefix),
	);

	if (entity === undefined)
	{
		return null;
	}

	return [entity, accessCode.slice(SelectorEntityInfo[entity].accessCodePrefix.length)];
}

export function getAccessCodeBySelectorItem(entity: string, id: string | number): string | null
{
	const info = SelectorEntityInfo[entity as SelectorEntityValue];

	if (info === undefined)
	{
		return null;
	}

	return `${info.accessCodePrefix}${id}`;
}

export function getMemberTypeBySelectorEntity(entity: string): string | null
{
	const info = SelectorEntityInfo[entity as SelectorEntityValue];

	if (info === undefined)
	{
		return null;
	}

	return info.memberType;
}
