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

export function normalizeOptions(options: unknown): NormalizedOption[]
{
	if (!Array.isArray(options))
	{
		return [];
	}

	return options.map((option: RawOption) => ({
		value: String(option.value),
		label: option.label || String(option.value),
	}));
}

export function resolveSettingValue(
	options: NormalizedOption[],
	currentValue: string | number | null | undefined,
	defaultValue: string | number | null | undefined,
): string
{
	const normalizedCurrent = currentValue !== null && currentValue !== undefined ? String(currentValue) : '';
	if (options.some((option) => option.value === normalizedCurrent))
	{
		return normalizedCurrent;
	}

	const normalizedDefault = defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : '';
	if (options.some((option) => option.value === normalizedDefault))
	{
		return normalizedDefault;
	}

	return options[0]?.value || '';
}

export function mapSettingsConfigToState(rawConfig: RawSettingsConfig | null | undefined): MappedSettingsConfig
{
	const config: RawSettingsConfig = rawConfig || {};
	const defaults: SettingsConfigDefaults = config.defaults || {};

	const mailSyncOptions = normalizeOptions(config.mailSyncIntervals);
	const crmSyncOptions = normalizeOptions(config.crmSyncIntervals);
	const crmEntityOptions = normalizeOptions(config.crmEntities);
	const crmSourceOptions = normalizeOptions(config.crmSources);

	return {
		mailSyncOptions,
		crmSyncOptions,
		crmEntityOptions,
		crmSourceOptions,
		defaultCrmSource: config.defaultCrmSource || '',
		crmAvailable: config.crmAvailable ?? false,
		canEditCrmIntegration: config.canEditCrmIntegration ?? false,

		mailSyncEnabled: defaults.mailSyncEnabled ?? true,
		messageMaxAge: resolveSettingValue(mailSyncOptions, null, defaults.messageMaxAge),
		crmEnabled: defaults.crmEnabled ?? false,
		crmSyncEnabled: defaults.crmSyncEnabled ?? true,
		crmSyncPeriod: resolveSettingValue(crmSyncOptions, null, defaults.crmSyncPeriod),
		crmAssignKnownClientEmails: defaults.crmAssignKnownClientEmails ?? true,
		crmIncomingCreate: defaults.crmIncomingCreate ?? true,
		crmIncomingEntity: resolveSettingValue(crmEntityOptions, null, defaults.crmIncomingEntity),
		crmOutgoingCreate: defaults.crmOutgoingCreate ?? true,
		crmOutgoingEntity: resolveSettingValue(crmEntityOptions, null, defaults.crmOutgoingEntity),
		crmVcf: defaults.crmVcf ?? true,
		crmSource: resolveSettingValue(
			crmSourceOptions,
			null,
			defaults.crmSource || config.defaultCrmSource,
		),
		calendarAutoAddEvents: defaults.calendarAutoAddEvents ?? true,
	};
}
