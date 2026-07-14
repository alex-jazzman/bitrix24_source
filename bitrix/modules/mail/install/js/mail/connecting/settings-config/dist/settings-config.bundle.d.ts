/* eslint-disable */
type RawOption = {
	value: string | number;
	label?: string;
};

type NormalizedOption = {
	value: string;
	label: string;
};

type SettingsConfigDefaults = {
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

type RawSettingsConfig = {
	mailSyncIntervals?: RawOption[];
	crmSyncIntervals?: RawOption[];
	crmEntities?: RawOption[];
	crmSources?: RawOption[];
	defaultCrmSource?: string;
	defaults?: SettingsConfigDefaults;
	crmAvailable?: boolean;
	canEditCrmIntegration?: boolean;
};

type MappedSettingsConfig = {
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

declare namespace BX.Mail.Connecting.SettingsConfig {
	function normalizeOptions(options: unknown): NormalizedOption[];

	function resolveSettingValue(options: NormalizedOption[], currentValue: string | number | null | undefined, defaultValue: string | number | null | undefined): string;

	function mapSettingsConfigToState(rawConfig: RawSettingsConfig | null | undefined): MappedSettingsConfig;
}
