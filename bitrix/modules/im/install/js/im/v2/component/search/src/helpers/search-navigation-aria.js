const ID_PREFIX = 'bx-im-search';

function encodeIdPart(value: string | number): string
{
	const encodedValue = [...String(value)]
		.map((character) => character.codePointAt(0).toString(16))
		.join('-')
	;

	return encodedValue || 'empty';
}

export function getSearchListboxId(searchAreaId: string): string
{
	return `${ID_PREFIX}-${encodeIdPart(searchAreaId)}-listbox`;
}

export function getSearchOptionId(searchAreaId: string, navIndex: number, dialogId: string): string
{
	return `${ID_PREFIX}-${encodeIdPart(searchAreaId)}-option-${encodeIdPart(navIndex)}-${encodeIdPart(dialogId)}`;
}

export function getSearchGroupId(searchAreaId: string, groupId: string): string
{
	return `${ID_PREFIX}-${encodeIdPart(searchAreaId)}-group-${encodeIdPart(groupId)}`;
}

export function getSearchGroupTitleId(searchAreaId: string, groupId: string): string
{
	return `${getSearchGroupId(searchAreaId, groupId)}-title`;
}
