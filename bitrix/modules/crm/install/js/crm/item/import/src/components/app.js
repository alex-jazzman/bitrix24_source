import { BitrixVueComponentProps } from 'ui.vue3';

import { ImportSettings } from '../lib/model/import-settings';
import { Dictionary } from '../lib/model/dictionary';

import {
	Lead,
	Deal,
	Contact,
	Company,
	Quote,
	SmartInvoice,
	Dynamic,
} from './page/index';

const Entity = BX.CrmEntityType.enumeration;
const PAGE_MAP = Object.freeze({
	[Entity.lead]: Lead,
	[Entity.deal]: Deal,
	[Entity.contact]: Contact,
	[Entity.company]: Company,
	[Entity.quote]: Quote,
	[Entity.smartinvoice]: SmartInvoice,
});

import './app.css';

export const App: BitrixVueComponentProps = {
	name: 'App',

	props: {
		entityTypeId: {
			type: Number,
			required: true,
		},
		importSettings: {
			type: ImportSettings,
			required: true,
		},
		dictionary: {
			type: Dictionary,
			required: true,
		},
	},

	computed: {
		page(): BitrixVueComponentProps
		{
			const page = PAGE_MAP[this.entityTypeId] ?? null;
			if (page !== null)
			{
				return page;
			}

			if (BX.CrmEntityType.isDynamicTypeByTypeId(this.entityTypeId))
			{
				return Dynamic;
			}

			throw new RangeError('BX.Crm.Item.Import.App: Unknown entityTypeId');
		},
	},

	template: `
		<div class="crm-item-import">
			<component :is="page" :import-settings="importSettings" :dictionary="dictionary" />
		</div>
	`,
};
