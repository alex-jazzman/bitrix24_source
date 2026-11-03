import { Type } from 'main.core';

import { PROPERTY_TYPES } from '../../../shared/constants';
import { type LastRunValue } from '../../../shared/stores/node-data-inspector-store';

const HINT_ITEMS_LIMIT = 10;

export type FormattedLastValue = {
	text: string,
	items: Array<string>,
	moreCount: number,
};

/**
 * Turns a last run value into a compact view representation: a single line for the value column
 * and a limited list of elements for the hint. The value is shown as received, without translation,
 * date formatting or id resolving.
 */
export function formatLastValue(entry: ?LastRunValue): FormattedLastValue
{
	if (!Type.isObject(entry) || Type.isNil(entry.value))
	{
		return {
			text: '',
			items: [],
			moreCount: 0,
		};
	}

	if (entry.multiple === true || Type.isArray(entry.value))
	{
		const list = Type.isArray(entry.value) ? entry.value : [entry.value];
		const total = Type.isNumber(entry.totalCount) ? entry.totalCount : list.length;
		const itemToText = entry.type === PROPERTY_TYPES.DOCUMENT ? documentItemAsText : asText;
		const first = list.length > 0 ? itemToText(list[0]) : '';
		const items = list.slice(0, HINT_ITEMS_LIMIT).map((item) => itemToText(item));

		return {
			text: total > 1 ? `${first} (${total})` : first,
			items,
			moreCount: Math.max(0, total - items.length),
		};
	}

	return {
		text: asText(entry.value),
		items: [],
		moreCount: 0,
	};
}

function asText(value: mixed): string
{
	return Type.isObject(value) ? JSON.stringify(value) : String(value);
}

/**
 * An item of a document collection is a whole document identifier - `[module, entity, documentId]` - so
 * the readable part of it is the identifier, not the encoded triplet.
 */
function documentItemAsText(value: mixed): string
{
	if (!Type.isArray(value))
	{
		return asText(value);
	}

	const documentId = value[value.length - 1];

	return Type.isNil(documentId) ? '' : asText(documentId);
}
