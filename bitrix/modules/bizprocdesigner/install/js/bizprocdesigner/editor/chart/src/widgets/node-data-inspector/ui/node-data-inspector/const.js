import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { InspectorViewItemGroupColorDict } from '../../../../entities/node-data-inspector';

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
});

export const SchemeViewGroupKey = Object.freeze({
	GLOBAL: 'global',
	INBOUND: 'inbound',
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
	[ViewGroup.OUTBOUND]: {
		title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_SCHEME_SECTION_OUTBOUND'),
		color: InspectorViewItemGroupColorDict.GRAY,
		icon: Outline.LOWER_LEFT_ARROW,
	},
});
