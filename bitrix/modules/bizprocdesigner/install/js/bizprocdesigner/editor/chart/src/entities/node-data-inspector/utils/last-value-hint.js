import { Loc } from 'main.core';

import { type InspectorViewItem } from '../types';

import { getHintPopupMinWidth } from './hint-popup-min-width';

const ITEMS_SEPARATOR = ', ';

export type LastValueHintParams = {
	text: string,
	interactivity: boolean,
	popupOptions: { minWidth: number, closeByEsc: boolean, role: string },
};

/**
 * Hint params for a value cell: the whole value for a single one, the captured elements
 * enumerated in one line with an "N more" item at the end for a collection. Returns null
 * when there is nothing to show, so the hint directive stays inactive on an empty cell.
 *
 * The text goes through `text`, never `html`, so the directive encodes it.
 */
export function getLastValueHintParams(item: ?InspectorViewItem, carrierWidth: number): ?LastValueHintParams
{
	const text = getHintText(item);

	if (text === '')
	{
		return null;
	}

	return {
		text,
		// hoverable popup: the pointer can reach it and it is not dismissed at once (WCAG 1.4.13)
		interactivity: true,
		popupOptions: {
			minWidth: getHintPopupMinWidth(carrierWidth),
			closeByEsc: true,
			// the popup is a tooltip, not the dialog main.popup declares by default
			role: 'tooltip',
		},
	};
}

/**
 * Whether the hint would list elements the cell does not show. A collection cell shows only its
 * first element and the total count, so everything from the second element on is hidden there.
 * A collection of a single element reads the same in the cell and in the hint, just as a plain
 * value does, and gets no hint of its own; only truncation can earn one.
 */
export function hasHiddenCollectionItems(item: ?InspectorViewItem): boolean
{
	return getCollectionTotalCount(item) > 1;
}

function getCollectionTotalCount(item: ?InspectorViewItem): number
{
	return getCollectionItems(item).length + Math.max(0, item?.exampleValueMoreCount ?? 0);
}

function getCollectionItems(item: ?InspectorViewItem): Array<string>
{
	return Array.isArray(item?.exampleValueItems) ? item.exampleValueItems : [];
}

function getHintText(item: ?InspectorViewItem): string
{
	const items = getCollectionItems(item);

	if (items.length === 0)
	{
		return item?.exampleValue ?? '';
	}

	const moreCount = item?.exampleValueMoreCount ?? 0;

	if (moreCount <= 0)
	{
		return items.join(ITEMS_SEPARATOR);
	}

	const moreLabel = Loc.getMessage(
		'BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_VALUE_HINT_MORE',
		{ '#COUNT#': String(moreCount) },
	);

	return [...items, moreLabel].join(ITEMS_SEPARATOR);
}
