/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Connecting = this.BX.Mail.Connecting || {};
(function (exports) {
	'use strict';

	function normalizeOptions(options) {
		if (!Array.isArray(options)) {
			return [];
		}
		return options.map(option => ({
			value: String(option.value),
			label: option.label || String(option.value)
		}));
	}
	function resolveSettingValue(options, currentValue, defaultValue) {
		const normalizedCurrent = currentValue !== null && currentValue !== undefined ? String(currentValue) : '';
		if (options.some(option => option.value === normalizedCurrent)) {
			return normalizedCurrent;
		}
		const normalizedDefault = defaultValue !== null && defaultValue !== undefined ? String(defaultValue) : '';
		if (options.some(option => option.value === normalizedDefault)) {
			return normalizedDefault;
		}
		return options[0]?.value || '';
	}
	function mapSettingsConfigToState(rawConfig) {
		const config = rawConfig || {};
		const defaults = config.defaults || {};
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
			crmSource: resolveSettingValue(crmSourceOptions, null, defaults.crmSource || config.defaultCrmSource),
			calendarAutoAddEvents: defaults.calendarAutoAddEvents ?? true
		};
	}

	exports.mapSettingsConfigToState = mapSettingsConfigToState;
	exports.normalizeOptions = normalizeOptions;
	exports.resolveSettingValue = resolveSettingValue;

})(this.BX.Mail.Connecting.SettingsConfig = this.BX.Mail.Connecting.SettingsConfig || {});
//# sourceMappingURL=settings-config.bundle.js.map
