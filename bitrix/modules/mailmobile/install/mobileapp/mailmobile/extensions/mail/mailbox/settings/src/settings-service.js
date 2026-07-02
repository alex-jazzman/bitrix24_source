/**
 * @module mail/mailbox/settings/src/settings-service
 */
jn.define('mail/mailbox/settings/src/settings-service', (require, exports, module) => {
	const { AjaxMethod } = require('mail/const');

	const LOADER_SIZE = 50;
	const FLAG_YES = 'Y';
	const FLAG_NO = 'N';
	const DEFAULT_SMTP_LIMIT = 250;

	/**
	 * @param {Array<{value: string|number, label: string}>} options
	 * @returns {Array<{value: string, label: string}>}
	 */
	function normalizeOptions(options)
	{
		if (!Array.isArray(options))
		{
			return [];
		}

		return options.map((option) => ({
			value: String(option.value),
			label: option.label || String(option.value),
		}));
	}

	function resolveSettingValue(options, currentValue, defaultValue)
	{
		const normalizedCurrentValue = currentValue !== null && currentValue !== undefined
			? String(currentValue)
			: ''
		;
		if (options.some((option) => option.value === normalizedCurrentValue))
		{
			return normalizedCurrentValue;
		}

		const normalizedDefaultValue = defaultValue !== null && defaultValue !== undefined
			? String(defaultValue)
			: ''
		;
		if (options.some((option) => option.value === normalizedDefaultValue))
		{
			return normalizedDefaultValue;
		}

		return options[0]?.value || '';
	}

	function getCurrentUserId()
	{
		return Number(typeof env !== 'undefined' ? env.userId : 0);
	}

	const DEFAULT_STATE = Object.freeze({
		loading: false,
		saving: false,
		loadError: false,
		loadErrorMessage: '',
		messageMaxAge: '',
		folderFetchEnabled: true,
		mailSyncOptions: [],
		crmAvailable: false,
		canEditCrmIntegration: false,
		crmEnabled: false,
		crmSyncPeriod: '',
		crmSyncEnabled: true,
		crmSyncOptions: [],
		crmAssignKnown: true,
		crmIncomingCreate: true,
		crmIncomingEntity: '',
		crmOutgoingCreate: true,
		crmOutgoingEntity: '',
		crmVcf: true,
		crmEntityOptions: [],
		crmSource: '',
		crmLeadResp: [],
		crmLeadRespUsers: [],
		crmNewLeadFor: '',
		crmSourceOptions: [],
		showAddressesInput: false,
		calendarEnabled: true,
		calendarAutoAdd: true,
		useSenderName: false,
		senderName: '',
		smtpUseLimit: false,
		smtpLimit: DEFAULT_SMTP_LIMIT,
		shareAccess: [],
		shareAccessUsers: [],
		currentUserId: getCurrentUserId(),
		password: '',
		passwordChanged: false,
		serviceConfig: {
			name: '',
			isOAuth: false,
		},
		footerHeight: 0,
	});

	class SettingsService
	{
		/**
		 * @param {number} mailboxId
		 * @returns {Promise<object>}
		 */
		loadMailboxData(mailboxId)
		{
			return BX.ajax.runAction(AjaxMethod.getMailbox, {
				data: { mailboxId },
			}).then(({ data }) => this.mapResponseToState(data));
		}

		/**
		 * @returns {Promise<{defaultSenderName: string, currentUser: {id: number, title: string, imageUrl: string|null}}>}
		 */
		loadDefaultSettings()
		{
			return BX.ajax.runAction(AjaxMethod.getDefaultSettings, {})
				.then(({ data }) => data);
		}

		/**
		 * @param {number} mailboxId
		 * @param {object} payload
		 * @returns {Promise}
		 */
		saveSettings(mailboxId, payload)
		{
			return BX.ajax.runAction(AjaxMethod.updateMailbox, {
				data: {
					mailboxId,
					...payload,
				},
			});
		}

		getCurrentUserId()
		{
			return getCurrentUserId();
		}

		/**
		 * @param {object} state
		 * @returns {object}
		 */
		prepareUpdatePayload(state, { isNewMailbox = false } = {})
		{
			const payload = {
				iCalAccess: (state.calendarEnabled && state.calendarAutoAdd) ? FLAG_YES : FLAG_NO,
				useSenderName: state.useSenderName,
				senderName: state.senderName,
				useLimitSmtp: state.smtpUseLimit ? 1 : 0,
				shareAccess: Array.isArray(state.shareAccess) ? state.shareAccess : [],
			};

			if (state.smtpUseLimit)
			{
				payload.limitSmtp = state.smtpLimit;
			}

			if (state.passwordChanged && state.password)
			{
				payload.password = state.password;
			}

			if (isNewMailbox)
			{
				payload.messageMaxAge = state.folderFetchEnabled ? state.messageMaxAge : 0;
			}

			if (!state.canEditCrmIntegration)
			{
				if (isNewMailbox)
				{
					payload.crmOptions = { enabled: FLAG_NO };
				}

				return payload;
			}

			if (!state.crmEnabled)
			{
				payload.crmOptions = { enabled: FLAG_NO };

				return payload;
			}

			const crmConfig = {
				crm_sync_days: state.crmSyncEnabled ? state.crmSyncPeriod : 0,
				crm_public: state.crmAssignKnown ? FLAG_YES : FLAG_NO,
				crm_new_entity_in: state.crmIncomingCreate ? state.crmIncomingEntity : '',
				crm_new_entity_out: state.crmOutgoingCreate ? state.crmOutgoingEntity : '',
				crm_vcf: state.crmVcf ? FLAG_YES : FLAG_NO,
				crm_lead_source: state.crmSource,
				crm_lead_resp: state.crmLeadResp,
				crm_new_lead_for: state.crmNewLeadFor || '',
			};

			payload.crmOptions = {
				enabled: FLAG_YES,
				config: crmConfig,
			};

			return payload;
		}

		/**
		 * @param {object} data
		 * @returns {object}
		 */
		mapSettingsConfigToState(data = {})
		{
			const defaults = data.defaults || {};
			const mailSyncOptions = normalizeOptions(data.mailSyncIntervals);
			const crmSyncOptions = normalizeOptions(data.crmSyncIntervals);
			const crmEntityOptions = normalizeOptions(data.crmEntities);
			const crmSourceOptions = normalizeOptions(data.crmSources);
			const calendarAutoAdd = typeof defaults.calendarAutoAddEvents === 'boolean'
				? defaults.calendarAutoAddEvents
				: DEFAULT_STATE.calendarAutoAdd
			;

			return {
				mailSyncOptions,
				messageMaxAge: resolveSettingValue(mailSyncOptions, null, defaults.messageMaxAge),
				folderFetchEnabled: defaults.mailSyncEnabled ?? DEFAULT_STATE.folderFetchEnabled,
				crmAvailable: data.crmAvailable ?? DEFAULT_STATE.crmAvailable,
				canEditCrmIntegration: data.canEditCrmIntegration ?? DEFAULT_STATE.canEditCrmIntegration,
				crmEnabled: defaults.crmEnabled ?? DEFAULT_STATE.crmEnabled,
				crmSyncOptions,
				crmSyncPeriod: resolveSettingValue(crmSyncOptions, null, defaults.crmSyncPeriod),
				crmSyncEnabled: defaults.crmSyncEnabled ?? DEFAULT_STATE.crmSyncEnabled,
				crmAssignKnown: defaults.crmAssignKnownClientEmails ?? DEFAULT_STATE.crmAssignKnown,
				crmIncomingCreate: defaults.crmIncomingCreate ?? DEFAULT_STATE.crmIncomingCreate,
				crmIncomingEntity: resolveSettingValue(crmEntityOptions, null, defaults.crmIncomingEntity),
				crmOutgoingCreate: defaults.crmOutgoingCreate ?? DEFAULT_STATE.crmOutgoingCreate,
				crmOutgoingEntity: resolveSettingValue(crmEntityOptions, null, defaults.crmOutgoingEntity),
				crmVcf: defaults.crmVcf ?? DEFAULT_STATE.crmVcf,
				crmEntityOptions,
				crmSourceOptions,
				crmSource: resolveSettingValue(
					crmSourceOptions,
					null,
					defaults.crmSource || data.defaultCrmSource,
				),
				calendarEnabled: calendarAutoAdd,
				calendarAutoAdd,
			};
		}

		/**
		 * @param {object} data
		 * @returns {object}
		 */
		mapResponseToState(data)
		{
			const state = this.mapSettingsConfigToState(data);

			const crmOptions = data.crmOptions || {};
			const crmConfig = crmOptions.config || {};

			state.crmEnabled = crmOptions.enabled === FLAG_YES;

			if (state.crmEnabled)
			{
				state.crmSyncEnabled = crmConfig.crm_sync_days !== null && Number(crmConfig.crm_sync_days) !== 0;
				state.crmSyncPeriod = resolveSettingValue(state.crmSyncOptions, crmConfig.crm_sync_days, state.crmSyncPeriod);

				state.crmAssignKnown = crmConfig.crm_public === FLAG_YES;

				state.crmIncomingCreate = Boolean(crmConfig.crm_new_entity_in);
				state.crmIncomingEntity = resolveSettingValue(
					state.crmEntityOptions,
					crmConfig.crm_new_entity_in,
					state.crmIncomingEntity,
				);

				state.crmOutgoingCreate = Boolean(crmConfig.crm_new_entity_out);
				state.crmOutgoingEntity = resolveSettingValue(
					state.crmEntityOptions,
					crmConfig.crm_new_entity_out,
					state.crmOutgoingEntity,
				);

				state.crmVcf = crmConfig.crm_vcf === FLAG_YES;
				state.crmSource = resolveSettingValue(state.crmSourceOptions, crmConfig.crm_lead_source, state.crmSource);
				state.crmLeadResp = crmConfig.crm_lead_resp || [];
				state.crmLeadRespUsers = Array.isArray(crmConfig.crm_lead_resp_users)
					? crmConfig.crm_lead_resp_users
					: []
				;

				const rawLeadFor = crmConfig.crm_new_lead_for;
				state.crmNewLeadFor = Array.isArray(rawLeadFor) ? rawLeadFor.join(', ') : (rawLeadFor || '');
				state.showAddressesInput = Boolean(state.crmNewLeadFor);
			}

			state.calendarEnabled = data.iCalAccess === FLAG_YES;
			state.calendarAutoAdd = data.iCalAccess === FLAG_YES;

			state.useSenderName = Boolean(data.useSenderName);
			state.senderName = data.senderName || data.defaultSenderName || '';

			const smtp = data.smtp || {};
			state.smtpUseLimit = Boolean(smtp.useLimit);
			state.smtpLimit = smtp.limit || DEFAULT_SMTP_LIMIT;

			state.shareAccess = Array.isArray(data.shareAccess) ? data.shareAccess : [];
			state.shareAccessUsers = Array.isArray(data.shareAccessUsers) ? data.shareAccessUsers : [];
			state.currentUserId = getCurrentUserId();

			const service = data.service || {};
			state.serviceConfig = {
				name: service.name || '',
				isOAuth: Boolean(service.isOAuth),
			};

			return state;
		}
	}

	module.exports = { SettingsService, DEFAULT_STATE, LOADER_SIZE };
});
