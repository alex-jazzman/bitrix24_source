import { sendData } from 'ui.analytics';

export type ReactionType = 'like' | 'dislike';
export type ReactionContext = 'extract_fields' | 'call_scoring' | 'summary' | 'transcription';

type CrmEntityType = {
	isDefined: (entityTypeId: number) => boolean;
	resolveName: (entityTypeId: number) => string;
	isDynamicTypeByName: (entityTypeName: string) => boolean;
};

function getEntitySection(ownerTypeId: number): string | null
{
	if (!Number.isInteger(ownerTypeId))
	{
		return null;
	}

	const crmEntityType = (BX as unknown as { CrmEntityType: CrmEntityType }).CrmEntityType;
	if (!crmEntityType.isDefined(ownerTypeId))
	{
		return null;
	}

	const entityTypeName = crmEntityType.resolveName(ownerTypeId);
	const section = crmEntityType.isDynamicTypeByName(entityTypeName)
		? 'dynamic'
		: entityTypeName.toLowerCase()
	;

	return section;
}

export function sendReaction(type: ReactionType, context: ReactionContext, ownerTypeId: number): void
{
	const section = getEntitySection(ownerTypeId);
	sendData({
		tool: 'ai',
		category: 'crm_operations',
		event: 'add_reaction',
		type,
		...(section === null ? {} : { c_section: section }),
		c_sub_section: 'details',
		status: 'success',
		p1: context,
	});
}
