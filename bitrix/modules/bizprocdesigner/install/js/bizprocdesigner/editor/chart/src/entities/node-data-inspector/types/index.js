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

export type InspectorViewItem = InspectorViewItemData | InspectorViewItemBase;

export type SelectedGridViewGroup = {
	id: string,
	title: string,
	values: Array<InspectorViewItem>,
};
