/**
 * Mirrors the payload of MailboxSettingsConfig::getClientConfig(): options, per-portal defaults and
 * the CRM availability flags. `crmEnabled` is deliberately absent — the backend default is false,
 * so every test that needs the CRM integration switched on states it explicitly.
 */
export function createSettingsConfig(overrides: Object = {}): Object
{
	const { defaults: defaultsOverrides = {}, ...configOverrides } = overrides;

	return {
		mailSyncIntervals: [
			{ value: 7 },
		],
		crmSyncIntervals: [
			{ value: 7 },
		],
		crmEntities: [
			{ value: 'LEAD' },
			{ value: 'CONTACT' },
		],
		crmSources: [
			{ value: 'EMAIL' },
		],
		defaultCrmSource: 'EMAIL',
		crmAvailable: true,
		canEditCrmIntegration: true,
		...configOverrides,
		defaults: {
			messageMaxAge: 7,
			crmSyncPeriod: 7,
			crmIncomingEntity: 'LEAD',
			crmOutgoingEntity: 'CONTACT',
			crmSource: 'EMAIL',
			...defaultsOverrides,
		},
	};
}
