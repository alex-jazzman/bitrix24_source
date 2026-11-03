import { type DocumentField } from '../../../shared/types';

import { InspectorViewItemGroupColorDict, InspectorViewItemTypeDict } from '../constants';

export type InspectorViewItemType = $Values<InspectorViewItemTypeDict>;

export type InspectorViewItemBase = {
	type: InspectorViewItemType,
	text: string,
	id: string,
	color?: $Keys<InspectorViewItemGroupColorDict>,
	icon?: ?string,
	items: ?Array<InspectorViewItemBase>,
	documentType?: string | Array<string>,
};

/**
 * Leaf of the inspector data view built by `createDataItem()`: `text` is the field title, `value`
 * the expression behind it, `exampleValue*` the last run value. The value fields stay optional
 * because the value carrier and the hint also read items that never have one, such as group rows.
 */
export type InspectorViewItemData = {
	type: InspectorViewItemType,
	text: string,
	dataType: string,
	value: string,
	exampleValue?: string,
	exampleValueItems?: Array<string>,
	exampleValueMoreCount?: number,
};

/**
 * Found items node of the filter group. Fields of the selected item live in `items` because the panel
 * search descends by it, and the caption of that item stays out of `text`, which keys the render.
 */
export type InspectorViewFoundItemsItem = {
	type: InspectorViewItemType,
	id: string,
	text: string,
	hasChildren: boolean,
	collectionExpression: string,
	firstItemExpressionPrefix: string,
	documentType?: string | Array<string>,
	fields: Array<DocumentField>,
	items: Array<InspectorViewItemData>,
};

export type InspectorViewItem = InspectorViewItemData | InspectorViewItemBase | InspectorViewFoundItemsItem;

export type SelectedGridViewGroup = {
	id: string,
	title: string,
	values: Array<InspectorViewItem>,
};
