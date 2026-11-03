import { Loc } from 'main.core';

import {
	registration as paymentSystemsRegistration,
} from '../../setting/docs/payment-systems';
import {
	registration as paymentMarketplaceRegistration,
} from '../../setting/docs/payment-marketplace';
import {
	registration as requisitesTemplatesRegistration,
} from '../../setting/docs/requisites-templates';
import {
	registration as myCompaniesRequisitesRegistration,
} from '../../setting/docs/my-companies-requisites';
import {
	registration as docNumeratorsRegistration,
} from '../../setting/docs/doc-numerators';
import {
	registration as numeratorInvoicesRegistration,
} from '../../setting/docs/numerator-invoices';
import {
	registration as numeratorInvoicesOldRegistration,
} from '../../setting/docs/numerator-invoices-old';
import {
	registration as numeratorQuotesRegistration,
} from '../../setting/docs/numerator-quotes';
import { type SettingsSectionRegistration } from '../../model/types';

function getMessage(key: string): string
{
	return Loc.getMessage(key) ?? '';
}

export const docsSection: SettingsSectionRegistration = {
	id: 'docs',
	title: getMessage('CRM_SETTINGS_HUB_SECTION_DOCS_TITLE'),
	type: 'settings-group',
	blocks: [
		{
			id: 'payment',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_PAYMENT_TITLE'),
			icon: 'o-payment',
			settings: [
				paymentSystemsRegistration,
				paymentMarketplaceRegistration,
			],
		},
		{
			id: 'requisites',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_REQUISITES_TITLE'),
			icon: 'o-company',
			settings: [
				requisitesTemplatesRegistration,
				myCompaniesRequisitesRegistration,
			],
		},
		{
			id: 'numerators',
			title: getMessage('CRM_SETTINGS_HUB_BLOCK_NUMERATORS_TITLE'),
			icon: 'o-numbered-list',
			settings: [
				docNumeratorsRegistration,
				numeratorInvoicesRegistration,
				numeratorInvoicesOldRegistration,
				numeratorQuotesRegistration,
			],
		},
	],
};
