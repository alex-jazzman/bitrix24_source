import type { Port, BlockType } from '../../../../shared/types';

type DefaultSettings = {
	width: number,
	height: number,
	ports: Array<Port>,
};

export type CatalogMenuItemId = string;

export type CatalogMenuItem = {
	id: CatalogMenuItemId,
	type: BlockType,
	// server-owned marker of the settings panel serving the node; an absent value reads as false
	servedByUnifiedPanel?: boolean,
	title: string,
	subtitle: string,
	icon: string,
	colorIndex: number,
	contentBlockColor?: ?number,
	defaultSettings: DefaultSettings,
	properties: {...} | null,
	contentBlockProducer?: ?{ namespace: string, keyProperty: string, labelProperty: string },
	contentBlockConsumer?: ?{ namespace: string, keyProperty: string, emptyLabel: string },
};

export type CatalogMenuGroupId = string;

export type CatalogMenuGroup = {
	id: CatalogMenuGroupId,
	title: string,
	icon: string,
	items: Array<CatalogItem>,
};
