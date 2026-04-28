import { BitrixVueComponentProps } from 'ui.vue3';

import { Dictionary } from '../../../lib/model/dictionary';
import { ImportSettings } from '../../../lib/model/import-settings';

import { Page } from '../../layout/index';

import { CustomOrigin } from './origin-wizard/custom-origin';
import { VcardOrigin } from './origin-wizard/vcard-origin';
import { GmailOrigin } from './origin-wizard/gmail-origin';
import { OutlookOrigin } from './origin-wizard/outlook-origin';
import { YahooOrigin } from './origin-wizard/yahoo-origin';

import './contact.css';

export const Contact: BitrixVueComponentProps = {
	name: 'Contact',

	components: {
		Page,
	},

	props: {
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
		wizardByOrigin(): BitrixVueComponentProps
		{
			const origin = this.importSettings.get('origin');
			if (origin === 'vcard')
			{
				return VcardOrigin;
			}

			if (origin === 'gmail')
			{
				return GmailOrigin;
			}

			if (origin === 'outlook')
			{
				return OutlookOrigin;
			}

			if (origin === 'yahoo')
			{
				return YahooOrigin;
			}

			return CustomOrigin;
		},
	},

	template: `
		<Page class="--contact">
			<component :is="wizardByOrigin" :import-settings="importSettings" :dictionary="dictionary" />
		</Page>
	`,
};
