declare module 'mail.connecting.settings-config' {
	export type RawOption = {
		value: string | number;
		label?: string;
	};

	export type NormalizedOption = {
		value: string;
		label: string;
	};

	export type SettingsConfigDefaults = {
		mailSyncEnabled?: boolean;
		messageMaxAge?: number | string;
		crmEnabled?: boolean;
		crmSyncEnabled?: boolean;
		crmSyncPeriod?: number | string;
		crmAssignKnownClientEmails?: boolean;
		crmIncomingCreate?: boolean;
		crmIncomingEntity?: string;
		crmOutgoingCreate?: boolean;
		crmOutgoingEntity?: string;
		crmVcf?: boolean;
		crmSource?: string;
		calendarAutoAddEvents?: boolean;
	};

	export type RawSettingsConfig = {
		mailSyncIntervals?: RawOption[];
		crmSyncIntervals?: RawOption[];
		crmEntities?: RawOption[];
		crmSources?: RawOption[];
		defaultCrmSource?: string;
		defaults?: SettingsConfigDefaults;
		crmAvailable?: boolean;
		canEditCrmIntegration?: boolean;
	};

	export type MappedSettingsConfig = {
		mailSyncOptions: NormalizedOption[];
		crmSyncOptions: NormalizedOption[];
		crmEntityOptions: NormalizedOption[];
		crmSourceOptions: NormalizedOption[];
		defaultCrmSource: string;
		crmAvailable: boolean;
		canEditCrmIntegration: boolean;
		mailSyncEnabled: boolean;
		messageMaxAge: string;
		crmEnabled: boolean;
		crmSyncEnabled: boolean;
		crmSyncPeriod: string;
		crmAssignKnownClientEmails: boolean;
		crmIncomingCreate: boolean;
		crmIncomingEntity: string;
		crmOutgoingCreate: boolean;
		crmOutgoingEntity: string;
		crmVcf: boolean;
		crmSource: string;
		calendarAutoAddEvents: boolean;
	};

	export function normalizeOptions(options: unknown): NormalizedOption[];

	export function resolveSettingValue(
		options: NormalizedOption[],
		currentValue: string | number | null | undefined,
		defaultValue: string | number | null | undefined,
	): string;

	export function mapSettingsConfigToState(
		rawConfig: RawSettingsConfig | null | undefined,
	): MappedSettingsConfig;
}

declare module 'mail.connecting.crm-integration' {
	export { BitrixSettingSelector, CrmIntegration, UserSelector } from '../../crm-integration/src/index';
	export type {
		CrmIntegrationSettingsType,
		IndirectPhraseParts,
		ResponsibleQueueItem,
		SettingOption,
	} from '../../crm-integration/src/index';
}

declare module 'mail.connecting.calendar-integration' {
	export { CalendarIntegration } from '../../calendar-integration/src/index';
	export type { CalendarIntegrationSettingsType } from '../../calendar-integration/src/index';
}

declare module 'mail.connecting.mail-sync-settings' {
	export { BitrixSettingSelector, MailIntegration } from '../../mail-sync-settings/src/index';
	export type {
		IndirectPhraseParts,
		MailIntegrationSettingsType,
		SettingOption,
	} from '../../mail-sync-settings/src/index';
}
