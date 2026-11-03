import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { InspectorViewItemGroupColorDict } from '../../../../entities/node-data-inspector';

// On a warm document-schemes cache the snapshot arrives within a frame, and a placeholder living
// that long is a flicker, not a loading state.
export const SKELETON_DELAY_MS = 150;

export const ViewMode = Object.freeze({
	SCHEME: 'scheme',
	GRID: 'grid',
});

export const ViewModeConfigs = Object.freeze({
	[ViewMode.SCHEME]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_VIEW_MODE_SCHEME'),
		key: ViewMode.SCHEME,
	},
	[ViewMode.GRID]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_VIEW_MODE_TABLE'),
		key: ViewMode.GRID,
	},
});

export const SchemeItemType = Object.freeze({
	GROUP: 'group',
	SECTION: 'section',
	NODE: 'node',
	DATA: 'data',
	FOUND_ITEMS: 'foundItems',
});

export const SchemeViewGroupKey = Object.freeze({
	GLOBAL: 'global',
	INBOUND: 'inbound',
	FILTER: 'filter',
	OUTBOUND: 'outbound',
});

export const ViewGroup = SchemeViewGroupKey;

export const SchemeViewGroupConfig = Object.freeze({
	[ViewGroup.GLOBAL]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_GLOBAL'),
		color: InspectorViewItemGroupColorDict.BLUE,
		icon: Outline.PRODUCT,
	},
	[ViewGroup.INBOUND]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_INBOUND'),
		color: InspectorViewItemGroupColorDict.GREEN,
		icon: Outline.LOWER_RIGHT_ARROW,
	},
	[ViewGroup.FILTER]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_FILTER'),
		color: InspectorViewItemGroupColorDict.ORANGE,
		icon: Outline.FILTER_2_L,
	},
	[ViewGroup.OUTBOUND]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_OUTBOUND'),
		color: InspectorViewItemGroupColorDict.GRAY,
		icon: Outline.LOWER_LEFT_ARROW,
	},
});
