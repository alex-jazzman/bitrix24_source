import type { Ports, BlockType } from '../../../../shared/types';

type DefaultSettings = {
	width: number,
	height: number,
	ports: Ports,
};

export type CatalogMenuItemId = string;

export type CatalogMenuItem = {
	id: CatalogMenuItemId,
	type: BlockType,
	title: string,
	subtitle: string,
	icon: string,
	colorIndex: number,
	defaultSettings: DefaultSettings,
	properties: {...} | null,
};

export type CatalogMenuGroupId = string;

export type CatalogMenuGroup = {
	id: CatalogMenuGroupId,
	title: string,
	icon: string,
	items: Array<CatalogItem>,
};
