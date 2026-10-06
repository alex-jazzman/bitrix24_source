import type { CrmIntegrationSettingsType, ResponsibleQueueItem } from 'mail.connecting.crm-integration';

export type CrmOptionsPayload = {
	enabled: 'Y' | 'N';
	config?: {
		crm_new_entity_in?: string;
		crm_new_entity_out?: string;
		crm_lead_source?: string;
		crm_lead_resp?: number[];
		crm_new_lead_for?: string;
		crm_public?: 'Y';
		crm_vcf?: 'Y';
		crm_sync_days?: number;
	};
};

export function buildCrmOptions(crmSettings: CrmIntegrationSettingsType, showVcfOption: boolean = true): CrmOptionsPayload
{
	if (!crmSettings.enabled)
	{
		return { enabled: 'N' };
	}

	const config: NonNullable<CrmOptionsPayload['config']> = {};

	if (crmSettings.sync.enabled)
	{
		config.crm_sync_days = parseInt(crmSettings.sync.periodValue, 10) || 0;
	}

	if (crmSettings.assignKnownClientEmails)
	{
		config.crm_public = 'Y';
	}

	if (showVcfOption && crmSettings.vcf)
	{
		config.crm_vcf = 'Y';
	}

	if (crmSettings.incoming.enabled)
	{
		config.crm_new_entity_in = crmSettings.incoming.createAction;
	}

	if (crmSettings.outgoing.enabled)
	{
		config.crm_new_entity_out = crmSettings.outgoing.createAction;
	}

	config.crm_lead_source = crmSettings.source;

	if (crmSettings.responsibleQueue.length > 0)
	{
		config.crm_lead_resp = crmSettings.responsibleQueue.map((item: ResponsibleQueueItem) => Number(item.id));
	}

	if (crmSettings.leadCreationAddresses.length > 0)
	{
		config.crm_new_lead_for = crmSettings.leadCreationAddresses;
	}

	return { enabled: 'Y', config };
}
