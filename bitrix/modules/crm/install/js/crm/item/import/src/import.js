import { BitrixVue, VueCreateAppResult } from 'ui.vue3';

import { App } from './components/app';

import { Dictionary, type DictionaryOptions } from './lib/model/dictionary';
import { ImportSettings } from './lib/model/import-settings';

// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import 'crm_common';

import 'ui.design-tokens';
import 'ui.forms';

declare type ImportOptions = {
	entityTypeId: number,
	importSettings: Object,
	dictionary: DictionaryOptions,
};

export class Import
{
	#app: VueCreateAppResult;

	constructor(options: ImportOptions = {})
	{
		if (!this.#isAvailableEntityTypeId(options.entityTypeId))
		{
			throw new RangeError(`BX.Crm.Item.Import: Unsupported entityTypeId: ${options.entityTypeId}`);
		}

		this.#app = BitrixVue.createApp(App, {
			entityTypeId: options.entityTypeId,
			importSettings: new ImportSettings(options.importSettings),
			dictionary: new Dictionary(options.dictionary),
		});
	}

	mount(container: string | HTMLElement): Object
	{
		return this.#app.mount(container);
	}

	#isAvailableEntityTypeId(entityTypeId: number): boolean
	{
		const availableTypeIds = [
			BX.CrmEntityType.enumeration.lead,
			BX.CrmEntityType.enumeration.deal,
			BX.CrmEntityType.enumeration.contact,
			BX.CrmEntityType.enumeration.company,
			BX.CrmEntityType.enumeration.quote,
			BX.CrmEntityType.enumeration.smartinvoice,
		];

		return availableTypeIds.includes(entityTypeId) || BX.CrmEntityType.isDynamicTypeByTypeId(entityTypeId);
	}
}
