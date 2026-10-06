import type { CrmIntegrationSettingsType } from 'mail.connecting.crm-integration';
import type { MappedSettingsConfig } from 'mail.connecting.settings-config';

export function buildMassCrmSettings(mapped: MappedSettingsConfig): CrmIntegrationSettingsType
{
	return {
		enabled: true,
		sync: {
			enabled: mapped.crmSyncEnabled,
			periodValue: mapped.crmSyncPeriod,
		},
		assignKnownClientEmails: mapped.crmAssignKnownClientEmails,
		vcf: mapped.crmVcf,
		incoming: {
			enabled: mapped.crmIncomingCreate,
			createAction: mapped.crmIncomingEntity,
		},
		outgoing: {
			enabled: mapped.crmOutgoingCreate,
			createAction: mapped.crmOutgoingEntity,
		},
		source: mapped.crmSource,
		leadCreationAddresses: '',
		responsibleQueue: [],
	};
}
