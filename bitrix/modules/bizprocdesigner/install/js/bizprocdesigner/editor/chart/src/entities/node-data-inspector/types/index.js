import { InspectorViewItemGroupColorDict, InspectorViewItemTypeDict } from '../constants';

export type InspectorViewItemType = $Values<InspectorViewItemTypeDict>;

export type InspectorViewItemBase = {
	type: InspectorViewItemType,
	text: string,
	id: string,
	color?: $Keys<InspectorViewItemGroupColorDict>,
	icon?: ?string,
	items: ?Array<InspectorViewItemBase>,
	documentType?: Array<DocumentType>,
};

export type InspectorViewItemData = {
	type: InspectorViewItemTypeDict.DATA,
	id: string,
	name: string,
	computeValue: string,
	dataType: string,
};

export type SelectedGridViewGroup = {
	id: string,
	title: string,
	values: Array<InspectorViewItemData>,
};
