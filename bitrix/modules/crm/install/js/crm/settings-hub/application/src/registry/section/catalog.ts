import { Loc } from 'main.core';

import {
	registration as currenciesRegistration,
} from '../../setting/catalog/currencies';
import {
	registration as taxesRegistration,
} from '../../setting/catalog/taxes';
import {
	registration as measuresRegistration,
} from '../../setting/catalog/measures';
import {
	registration as productPropsRegistration,
} from '../../setting/catalog/product-props';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const catalogSection: SettingsSectionRegistration = {
	id: 'catalog',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_CATALOG_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'products_and_directories',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_PRODUCTS_AND_DIRECTORIES_TITLE'),
			icon: 'o-product',
			settings: [
				currenciesRegistration,
				taxesRegistration,
				measuresRegistration,
				productPropsRegistration,
			],
		},
	],
};
