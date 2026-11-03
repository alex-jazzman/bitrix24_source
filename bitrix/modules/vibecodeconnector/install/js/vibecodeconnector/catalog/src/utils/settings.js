import { Extension } from 'main.core';

const EXTENSION_NAME = 'vibecodeconnector.catalog';

export type CatalogBrand = 'bitrix24' | 'alaio';

export function getCatalogBrand(): CatalogBrand
{
	return Extension.getSettings(EXTENSION_NAME).get('catalogBrand') === 'alaio'
		? 'alaio'
		: 'bitrix24';
}

export function getCatalogBrandName(): string
{
	return Extension.getSettings(EXTENSION_NAME).get('brandName') ?? '';
}

export function isItemClickOpensChatEnabled(): boolean
{
	return Extension.getSettings(EXTENSION_NAME).get('itemClickOpensChat', false) === true;
}
