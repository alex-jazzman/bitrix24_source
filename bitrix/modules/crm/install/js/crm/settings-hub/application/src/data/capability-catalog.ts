import { Loc } from 'main.core';

import { CrmSettingsHubBitrixGptCapability } from '../capability/ai/bitrix-gpt';
import { CrmSettingsHubCommunicationsCapability } from '../capability/clients/communications';
import { CrmSettingsHubCrmMailCapability } from '../capability/clients/crm-mail';
import { CrmSettingsHubDupControlCapability } from '../capability/clients/dup-control';
import { CrmSettingsHubStoplistCapability } from '../capability/clients/stoplist';
import { CrmSettingsHubCatalogCapability } from '../capability/data/catalog';
import { CrmSettingsHubDocumentsCapability } from '../capability/data/documents';
import { CrmSettingsHubPaymentsCapability } from '../capability/data/payments';
import { CrmSettingsHubRequisitesCapability } from '../capability/data/requisites';
import { CrmSettingsHubUserFieldsCapability } from '../capability/data/user-fields';
import { CrmSettingsHubActivitiesCapability } from '../capability/employees/activities';
import { CrmSettingsHubDistributionCapability } from '../capability/employees/distribution';
import { CrmSettingsHubPermissionsCapability } from '../capability/employees/permissions';
import { CrmSettingsHubIntegrationsCapability } from '../capability/grow/integrations';
import { CrmSettingsHubMarketplaceCapability } from '../capability/grow/marketplace';
import { CrmSettingsHubMigrationCapability } from '../capability/grow/migration';
import { CrmSettingsHubRestCapability } from '../capability/grow/rest';
import { CrmSettingsHubAutoActivitiesCapability } from '../capability/sales/auto-activities';
import { CrmSettingsHubAutomationCapability } from '../capability/sales/automation';
import { CrmSettingsHubConversionCapability } from '../capability/sales/conversion';
import { CrmSettingsHubPipelinesCapability } from '../capability/sales/pipelines';
import { CrmSettingsHubRepeatSalesCapability } from '../capability/sales/repeat-sales';
import { type CapabilityCatalog } from '../model/types';

function getMessage(messageId: string): string
{
	return Loc.getMessage(messageId) ?? messageId;
}

export const capabilityCatalog: CapabilityCatalog = {
	groups: [
		{
			id: 'sales',
			title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_GROUP_SALES_TITLE'),
			capabilities: [
				{
					id: 'repeat-sales',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_REPEAT_SALES_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_REPEAT_SALES_TASK'),
					icon: 'o-refresh',
					component: CrmSettingsHubRepeatSalesCapability,
				},
				{
					id: 'pipelines',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_PIPELINES_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_PIPELINES_TASK'),
					icon: 'o-handshake',
					component: CrmSettingsHubPipelinesCapability,
				},
				{
					id: 'conversion',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_CONVERSION_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_CONVERSION_TASK'),
					icon: 'o-lead',
					component: CrmSettingsHubConversionCapability,
				},
				{
					id: 'auto-activities',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_AUTO_ACTIVITIES_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_AUTO_ACTIVITIES_TASK'),
					icon: 'o-calendar',
					component: CrmSettingsHubAutoActivitiesCapability,
				},
				{
					id: 'automation',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_AUTOMATION_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_AUTOMATION_TASK'),
					icon: 'o-robot',
					component: CrmSettingsHubAutomationCapability,
				},
			],
		},
		{
			id: 'clients',
			title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_GROUP_CLIENTS_TITLE'),
			capabilities: [
				{
					id: 'communications',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_COMMUNICATIONS_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_COMMUNICATIONS_TASK'),
					icon: 'o-phone-up',
					component: CrmSettingsHubCommunicationsCapability,
				},
				{
					id: 'stoplist',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_STOPLIST_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_STOPLIST_TASK'),
					icon: 'o-black-list',
					component: CrmSettingsHubStoplistCapability,
				},
				{
					id: 'dup-control',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_DUP_CONTROL_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_DUP_CONTROL_TASK'),
					icon: 'o-duplicate',
					component: CrmSettingsHubDupControlCapability,
				},
				{
					id: 'crm-mail',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_CRM_MAIL_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_CRM_MAIL_TASK'),
					icon: 'o-mail',
					component: CrmSettingsHubCrmMailCapability,
				},
			],
		},
		{
			id: 'employees',
			title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_GROUP_EMPLOYEES_TITLE'),
			capabilities: [
				{
					id: 'permissions',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_PERMISSIONS_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_PERMISSIONS_TASK'),
					icon: 'o-key',
					component: CrmSettingsHubPermissionsCapability,
				},
				{
					id: 'activities',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_ACTIVITIES_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_ACTIVITIES_TASK'),
					icon: 'o-calendar',
					component: CrmSettingsHubActivitiesCapability,
				},
				{
					id: 'distribution',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_DISTRIBUTION_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_DISTRIBUTION_TASK'),
					icon: 'o-business-process',
					component: CrmSettingsHubDistributionCapability,
				},
			],
		},
		{
			id: 'data',
			title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_GROUP_DATA_TITLE'),
			capabilities: [
				{
					id: 'user-fields',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_USER_FIELDS_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_USER_FIELDS_TASK'),
					icon: 'o-form',
					component: CrmSettingsHubUserFieldsCapability,
				},
				{
					id: 'requisites',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_REQUISITES_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_REQUISITES_TASK'),
					icon: 'o-company',
					component: CrmSettingsHubRequisitesCapability,
				},
				{
					id: 'documents',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_DOCUMENTS_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_DOCUMENTS_TASK'),
					icon: 'o-file',
					component: CrmSettingsHubDocumentsCapability,
				},
				{
					id: 'payments',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_PAYMENTS_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_PAYMENTS_TASK'),
					icon: 'o-payment',
					component: CrmSettingsHubPaymentsCapability,
				},
				{
					id: 'catalog',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_CATALOG_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_CATALOG_TASK'),
					icon: 'o-box',
					component: CrmSettingsHubCatalogCapability,
				},
			],
		},
		{
			id: 'grow',
			title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_GROUP_GROW_TITLE'),
			capabilities: [
				{
					id: 'migration',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_MIGRATION_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_MIGRATION_TASK'),
					icon: 'o-refresh',
					component: CrmSettingsHubMigrationCapability,
				},
				{
					id: 'integrations',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_INTEGRATIONS_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_INTEGRATIONS_TASK'),
					icon: 'o-apps',
					component: CrmSettingsHubIntegrationsCapability,
				},
				{
					id: 'marketplace',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_MARKETPLACE_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_MARKETPLACE_TASK'),
					icon: 'o-market',
					component: CrmSettingsHubMarketplaceCapability,
				},
				{
					id: 'rest',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_REST_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_REST_TASK'),
					icon: 'o-settings',
					component: CrmSettingsHubRestCapability,
				},
			],
		},
		{
			id: 'ai',
			title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_GROUP_AI_TITLE'),
			capabilities: [
				{
					id: 'bitrix-gpt',
					title: getMessage('CRM_SETTINGS_HUB_CAPABILITY_BITRIX_GPT_TITLE'),
					task: getMessage('CRM_SETTINGS_HUB_CAPABILITY_BITRIX_GPT_TASK'),
					icon: 'o-copilot',
					component: CrmSettingsHubBitrixGptCapability,
				},
			],
		},
	],
};
