BX.namespace('BX.MailClientConfig');
BX.MailClientConfig.Edit = {

	isSuccessSyncStatus: null,
	oauthUserIsEmpty: true,
	isOauthMode: false,
	isForbiddenToShare: false,
	serviceName: 'other',
	isNewMailbox: true,
	smtp: {
		switcherChecked: false,
		switcherDisabled: false,
	},
	crm: {
		integrationAvailable: false,
		switcherChecked: false,
		switcherDisabled: false,
	},
	isCrmIntegrationAvailable: false,
	isCrmSwitcherChecked: false,
	canEditCrmOptions: false,

	init: function(params)
	{
		if (BX.type.isNotEmptyObject(params))
		{
			this.isForbiddenToShare = params.isForbiddenToShare || false;
			this.smtp.switcherChecked = params.isSmtpSwitcherChecked || false;
			this.smtp.switcherDisabled = params.isSmtpSwitcherDisabled || false;
			this.crm.switcherChecked = params.isCrmSwitcherChecked || false;
			this.crm.switcherDisabled = params.canEditCrmOptions || false;
			this.crm.integrationAvailable = params.isCrmIntegrationAvailable || false;
			this.canEditCrmOptions = params.canEditCrmOptions || false;
			this.oauthUserIsEmpty = params.oauthUserIsEmpty || false;
			this.isSuccessSyncStatus = null;
			this.isOauthMode = params.isOauthMode || false;

			this.ownerId = params.ownerId || 0;
			this.shareAccessSelectorId = params.shareAccessSelectorId || '';
			this.shareAccessValueContainerId = params.shareAccessValueContainerId || '';
			this.shareAccessSelectorPreselectedIds = params.shareAccessSelectorPreselectedIds || [];
			this.isShareAccessLocked = params.isShareAccessLocked || false;

			this.crmQueueSelectorId = params.crmQueueSelectorId || '';
			this.crmQueueValueContainerId = params.crmQueueValueContainerId || '';
			this.crmQueueSelectorPreselectedIds = params.crmQueueSelectorPreselectedIds || [];

			this.serviceName = params.serviceName || 'other';
			this.isNewMailbox = (params.isNewMailbox === true);

			if (params.isSuccessSyncStatus !== undefined)
			{
				this.isSuccessSyncStatus = params.isSuccessSyncStatus;
			}

			const {
				crmSyncIntervals = {},
				leadSourceList = {},
				crmEntityList = {},
				messageSyncIntervals = {},
				defaultMaxCrmSyncKey = '',
				defaultMaxAgeMessageSyncKey = '',
				defaultLeadSourceKey = '',
				defaultNewEntityInKey = '',
				defaultNewEntityOutKey = '',
			} = params;

			const connectCrmAllowEntityInSelectorWrapper = BX('mail-connect-crm-allow-entity-in');

			if (connectCrmAllowEntityInSelectorWrapper !== null)
			{
				const connectCrmAllowEntityInSelector = new BX.Mail.SettingSelector({
					settingsMap: crmEntityList,
					selectedOptionKey: defaultNewEntityInKey,
					inputName: 'fields[crm_entity_in]',
					disabled: this.canEditCrmOptions,
				});
				connectCrmAllowEntityInSelector.renderTo(connectCrmAllowEntityInSelectorWrapper);
			}

			const connectCrmAllowEntityOutSelectorWrapper = BX('mail-connect-crm-allow-entity-out');

			if (connectCrmAllowEntityOutSelectorWrapper !== null)
			{
				const connectCrmAllowEntityOutSelector = new BX.Mail.SettingSelector({
					settingsMap: crmEntityList,
					selectedOptionKey: defaultNewEntityOutKey,
					inputName: 'fields[crm_entity_out]',
					disabled: this.canEditCrmOptions,
				});
				connectCrmAllowEntityOutSelector.renderTo(connectCrmAllowEntityOutSelectorWrapper);
			}

			const connectCrmLeadSourceSelectorWrapper = BX('mail-connect-crm-lead-source');

			if (connectCrmLeadSourceSelectorWrapper !== null)
			{
				const connectCrmLeadSourceSelector = new BX.Mail.SettingSelector({
					settingsMap: leadSourceList,
					selectedOptionKey: defaultLeadSourceKey,
					inputName: 'fields[crm_lead_source]',
					dialogOptions: {
						width: 300,
						height: 300,
						enableSearch: true,
					},
					disabled: this.canEditCrmOptions,
				});
				connectCrmLeadSourceSelector.renderTo(connectCrmLeadSourceSelectorWrapper);
			}

			const mailMessageMaxAgeSelectorWrapper = BX('mail-message-max-age');

			if (mailMessageMaxAgeSelectorWrapper !== null)
			{
				const mailMessageMaxAgeSelector = new BX.Mail.SettingSelector({
					settingsMap: messageSyncIntervals,
					selectedOptionKey: defaultMaxAgeMessageSyncKey,
					inputName: 'fields[msg_max_age]',
				});
				mailMessageMaxAgeSelector.renderTo(mailMessageMaxAgeSelectorWrapper);
			}

			const mailCrmMaxAgeSelectorWrapper = BX('mail-crm-max-age');

			if (mailCrmMaxAgeSelectorWrapper !== null)
			{
				const mailCrmMaxAgeSelector = new BX.Mail.SettingSelector({
					settingsMap: crmSyncIntervals,
					selectedOptionKey: defaultMaxCrmSyncKey,
					inputName: 'fields[crm_max_age]',
					disabled: this.canEditCrmOptions,
				});
				mailCrmMaxAgeSelector.renderTo(mailCrmMaxAgeSelectorWrapper);
			}
		}

		if (this.isSuccessSyncStatus === false)
		{
			if (this.isOauthMode)
			{
				this.showOauthAuthorizationBlock();
				this.showOauthErrorTour();
			}
			else
			{
				this.showPasswordErrorTour();
			}
		}

		if (this.isOauthMode && this.oauthUserIsEmpty)
		{
			this.showOauthAuthorizationBlock();
		}

		var selectInputs = BX.findChildrenByClassName(document, 'mail-set-singleselect', true);
		for (var i in selectInputs)
		{
			if (!selectInputs.hasOwnProperty(i))
			{
				continue;
			}
			this.singleselect(selectInputs[i]);
		}

		BX.bind(
			BX('mail_connect_mb_crm_new_lead_for_link'),
			'click',
			function (e)
			{
				var textarea = BX('mail_connect_mb_crm_new_lead_for');
				var hide = textarea.offsetHeight > 0;

				textarea.style.display = hide ? 'none' : '';
				BX[hide?'removeClass':'addClass'](this, 'mail-set-textarea-show-open');
			}
		);

		this.setSmtpSwitcher();
		this.setCrmSwitcher();
		this.initConnectionRequestSelector();
		this.initShareAccessSelector();
		this.initCrmQueueSelector();
		this.initMigrationSettings(params);
	},

	initMigrationSettings(params)
	{
		this.settingsDisposed = false;
		if (this.isNewMailbox)
		{
			return;
		}

		this.mailboxId = params.mailboxId;
		this.formError = params.formError;
		this.settingsForm = BX('mail_connect_form');
		this.settingsReady = false;
		this.connectionSettingsReady = false;
		this.settingsSaving = false;
		this.settingsRequest = 0;
		this.settingsRefreshRevision = null;
		this.settingsRetryTimer = null;
		this.settingsRetryAttempts = 0;
		this.settingsRefreshFailed = false;
		this.migrationActive = null;
		this.settingsVersion = 0;
		this.connectionStructure = null;
		this.settingsFields = {};
		Array.from(this.settingsForm.elements).forEach((field) => {
			const name = field.name.match(/^fields\[([^\]]+)\]$/)?.[1];
			if (name)
			{
				this.settingsFields[name] = field;
			}
		});
		this.renderedServiceId = this.settingsFields.service_id.value;
		this.generalSettingsBaseline = this.readGeneralSettings();
		this.connectionBlocks = Array.from(document.querySelectorAll('[data-mail-connection-settings]')).map((node) => {
			const placeholder = document.createComment('mail-connection-settings');
			node.before(placeholder);

			return { node, placeholder };
		});
		this.settingsLoader = new BX.Loader({ target: this.settingsForm.parentNode });
		this.settingsLoader.show();
		this.setConnectionSettingsVisible(false);
		this.settingsUnloadHandler = this.disposeMigrationSettings.bind(this);
		BX.bind(window, 'pagehide', this.settingsUnloadHandler);
		this.settingsRecoveryHandler = () => {
			if (this.settingsRefreshFailed && !this.settingsDisposed)
			{
				this.settingsRetryAttempts = 0;
				this.refreshConnectionSettings();
			}
		};
		BX.bind(window, 'online', this.settingsRecoveryHandler);
		BX.bind(window, 'focus', this.settingsRecoveryHandler);
		this.migrationState = BX.Mail.getMigrationState(this.mailboxId);
		this.unsubscribeMigration = this.migrationState.subscribe((change) => {
			this.handleMigrationSettingsStatus(change.active);
		});
		this.migrationState.initialize().then(() => {
			if (!this.settingsDisposed && this.migrationState.isInitialized())
			{
				this.handleMigrationSettingsStatus(this.migrationState.isActive());
			}
		});
	},

	isConnectionSettingsLocked()
	{
		return this.settingsDisposed === true || (!this.isNewMailbox && (
			!this.settingsReady || !this.connectionSettingsReady || this.migrationActive
		));
	},

	handleMigrationSettingsStatus(active)
	{
		if (this.settingsDisposed || !this.migrationState.isInitialized())
		{
			return;
		}

		const previousActive = this.migrationActive;
		this.migrationActive = active;
		if (active)
		{
			this.connectionSettingsReady = false;
			this.setConnectionSettingsVisible(false);
			if (previousActive !== true)
			{
				this.settingsRequest++;
				this.settingsRefreshRevision = null;
			}
			if (this.settingsReady)
			{
				this.renderSettingsAvailability();

				return;
			}
		}
		else if (previousActive === false && this.connectionSettingsReady)
		{
			return;
		}

		this.connectionSettingsReady = false;
		this.setConnectionSettingsVisible(false);
		this.refreshConnectionSettings();
	},

	refreshConnectionSettings()
	{
		const revision = this.migrationState.getRevision();
		if (this.settingsRefreshRevision === revision)
		{
			return;
		}

		clearTimeout(this.settingsRetryTimer);
		this.settingsRetryTimer = null;
		this.settingsRefreshRevision = revision;
		const request = ++this.settingsRequest;
		BX.ajax.runAction('mail.api.mailboxconnecting.getMailbox', {
			data: { mailboxId: this.mailboxId },
		}).then((response) => {
			if (!this.isCurrentSettingsRequest(request, revision))
			{
				return;
			}

			const data = response.data;
			if (!data?.imap || !data.smtp || !data.service
				|| !Number.isInteger(data.imap.serviceId) || typeof data.imap.email !== 'string')
			{
				throw new Error(this.formError);
			}
			if (this.requiresConnectionReload(data))
			{
				this.disposeMigrationSettings();
				window.location.reload();

				return;
			}
			this.applyConnectionSettings(data);
			this.connectionSettingsBaseline = this.readConnectionSettings();
			this.sourceGeneration = {};
			if (Object.prototype.hasOwnProperty.call(data, 'sourceGenerationId') && (
				data.sourceGenerationId === null
				|| (Number.isInteger(data.sourceGenerationId) && data.sourceGenerationId >= 0)
			))
			{
				this.sourceGeneration.expectedSourceGenerationId = data.sourceGenerationId;
			}
			this.settingsRefreshFailed = false;
			this.settingsRetryAttempts = 0;
			this.settingsVersion++;
			this.settingsReady = true;
			this.connectionSettingsReady = !this.migrationActive && data.migrationActive !== true;
			BX('mail_connect_form_error').textContent = '';
			this.renderSettingsAvailability();
		}).catch((error) => {
			if (this.isCurrentSettingsRequest(request, revision))
			{
				this.settingsRefreshFailed = true;
				this.settingsLoader?.destroy();
				this.settingsLoader = null;
				this.showSettingsError(error);
				if (this.settingsRetryAttempts < 3)
				{
					this.settingsRetryAttempts++;
					this.settingsRetryTimer = setTimeout(() => {
						this.settingsRetryTimer = null;
						if (this.isCurrentSettingsRequest(request, revision))
						{
							this.refreshConnectionSettings();
						}
					}, 5000 * this.settingsRetryAttempts);
				}
			}
		}).finally(() => {
			if (!this.settingsDisposed && request === this.settingsRequest)
			{
				this.settingsRefreshRevision = null;
			}
		});
	},

	isCurrentSettingsRequest(request, revision)
	{
		return !this.settingsDisposed && request === this.settingsRequest
			&& revision === this.migrationState.getRevision();
	},

	setConnectionSettingsVisible(visible)
	{
		this.connectionBlocks.forEach(({ node, placeholder }) => {
			if (visible)
			{
				placeholder.after(node);
			}
			else
			{
				node.remove();
			}
		});
		if (!visible)
		{
			this.ownerSelector?.getDialog().hide();
			this.onConnectionSettingsHidden?.();
			this.oauthErrorTour?.close();
		}
	},

	renderSettingsAvailability()
	{
		this.settingsForm.style.visibility = this.settingsReady ? '' : 'hidden';
		if (this.settingsReady)
		{
			this.settingsLoader?.destroy();
			this.settingsLoader = null;
		}
		this.setConnectionSettingsVisible(!this.isConnectionSettingsLocked());
		if (!this.isConnectionSettingsLocked() && this.onConnectionSettingsReady)
		{
			const onReady = this.onConnectionSettingsReady;
			this.onConnectionSettingsReady = null;
			onReady();
		}
		const notice = BX('mail-migration-settings-notice');
		notice.textContent = '';
		notice.hidden = !this.settingsReady || !this.isConnectionSettingsLocked();
		if (!notice.hidden)
		{
			const alert = new BX.UI.Alert({
				text: BX.message('MAIL_MIGRATION_CREDENTIALS_LOCKED'),
				color: BX.UI.Alert.Color.WARNING,
			});
			notice.append(alert.getContainer());
		}
		BX('mail_connect_save_btn').disabled = !this.settingsReady || this.settingsSaving;
		const disconnect = this.connectionBlocks.find(({ node }) => node.id === 'mail_connect_disconnect_btn')?.node;
		if (disconnect)
		{
			disconnect.style.display = '';
		}
	},

	requiresConnectionReload(data)
	{
		const structure = JSON.stringify([
			data.imap.serviceId,
			data.imap.isOAuth,
			data.imap.oauthUid,
			data.service.oauthSmtpEnabled,
			data.service.smtpServer,
			data.service.smtpLoginAsImap,
			data.service.smtpPasswordAsImap,
		]);
		const changed = String(data.imap.serviceId) !== this.renderedServiceId
			|| (this.connectionStructure !== null && structure !== this.connectionStructure);
		this.connectionStructure ??= structure;

		return changed && !this.migrationActive && data.migrationActive !== true;
	},

	applyConnectionSettings(data)
	{
		const imap = data.imap;
		const smtp = data.smtp;
		const values = {
			service_id: imap.serviceId,
			email: imap.email,
			server_imap: imap.server,
			port_imap: imap.port,
			login_imap: imap.login,
			ssl_imap: imap.ssl === 'Y' || imap.ssl === 'S',
			oauth_uid: imap.oauthUid || '',
			oauth_mode: imap.isOAuth ? 'S' : 'N',
			server_smtp: smtp.server,
			port_smtp: smtp.port,
			login_smtp: smtp.login,
			ssl_smtp: smtp.ssl === 'Y',
			use_smtp: smtp.enabled === 'Y',
			use_limit_smtp: smtp.useLimit,
			limit_smtp: smtp.limit ?? '',
			upload_outgoing: !data.denyUpload,
			user_principal_name: smtp.login,
			owner_id: `U${data.userId}`,
		};
		Object.entries(values).forEach(([name, value]) => {
			const field = this.settingsFields[name];
			if (field)
			{
				if (field.type === 'checkbox')
				{
					field.checked = Boolean(value);
				}
				else
				{
					field.value = value ?? '';
				}
			}
		});
		['pass_imap', 'pass_smtp'].forEach((name) => {
			const field = this.settingsFields[name];
			if (field)
			{
				field.value = field.getAttribute('data-placeholder') || '';
				field.__filled = field.value.length > 0;
			}
		});
		const emailNode = this.settingsForm.querySelector('.mail-connect-mailbox-name');
		if (emailNode)
		{
			emailNode.textContent = imap.email;
		}
		const oauthBlock = this.connectionBlocks.find(({ node }) => {
			return node.querySelector('#mail_connect_mb_oauth_status_email');
		})?.node;
		if (oauthBlock)
		{
			oauthBlock.querySelector('#mail_connect_mb_oauth_status_email').textContent = imap.email;
			const image = oauthBlock.querySelector('#mail_connect_mb_oauth_status_image');
			if (this.settingsVersion > 0)
			{
				image.textContent = imap.email.slice(0, 1).toUpperCase();
				image.style.backgroundImage = '';
			}
		}
		if (this.settingsFields.limit_smtp)
		{
			this.settingsFields.limit_smtp.disabled = !smtp.useLimit;
		}
		this.smtpSwitcher?.check(smtp.enabled === 'Y', false);
		const smtpBlock = this.connectionBlocks.find(({ node }) => node.id === 'mail-connect-smtp-fields')?.node;
		if (smtpBlock)
		{
			const smtpForm = smtpBlock.querySelector('#mail_connect_mb_server_smtp_form');
			if (smtpForm)
			{
				smtpForm.style.display = smtp.enabled === 'Y' ? '' : 'none';
			}
			smtpBlock.style.display = smtp.enabled === 'Y' ? '' : 'none';
		}
	},

	readConnectionSettings()
	{
		const snapshot = {};
		[
			'email', 'service_id', 'server_imap', 'port_imap', 'login_imap', 'ssl_imap', 'pass_imap',
			'oauth_uid', 'oauth_mode', 'user_principal_name', 'use_smtp', 'server_smtp', 'port_smtp',
			'login_smtp', 'ssl_smtp', 'pass_smtp', 'use_limit_smtp', 'limit_smtp', 'upload_outgoing', 'owner_id',
		].forEach((name) => {
			const field = this.settingsFields[name];
			if (!field)
			{
				return;
			}
			if (field.type === 'checkbox')
			{
				const checkedValue = ['use_smtp', 'upload_outgoing'].includes(name) ? '1' : 'Y';
				snapshot[name] = field.checked ? checkedValue : 'N';
				if (name === 'use_smtp' && !field.checked)
				{
					snapshot[name] = '';
				}
			}
			else
			{
				snapshot[name] = field.value === field.getAttribute('data-placeholder') ? '' : field.value;
			}
		});

		return snapshot;
	},

	readGeneralSettings()
	{
		const snapshot = {};
		const fields = this.settingsFields;
		const mappings = { name: 'mailboxName', link: 'link', sender: 'senderName', use_sender_name: 'useSenderName' };
		Object.entries(mappings).forEach(([name, key]) => {
			if (fields[name])
			{
				snapshot[key] = fields[name].type === 'checkbox' ? fields[name].checked : fields[name].value;
			}
		});
		if (fields.ical_access)
		{
			snapshot.iCalAccess = fields.ical_access.checked;
		}
		if (fields.share_access && !this.isShareAccessLocked && !this.isForbiddenToShare)
		{
			snapshot.shareAccess = [...new Set(JSON.parse(fields.share_access.value || '[]'))].sort();
		}
		if (this.crm.integrationAvailable && !this.canEditCrmOptions)
		{
			snapshot['crmOptions.enabled'] = fields.use_crm.checked;
			const config = 'crmOptions.config.';
			['in', 'out'].forEach((direction) => {
				snapshot[`${config}crm_new_entity_${direction}`] = fields[`crm_allow_entity_${direction}`].checked
					? fields[`crm_entity_${direction}`].value : '';
			});
			snapshot[`${config}crm_lead_source`] = fields.crm_lead_source.value;
			snapshot[`${config}crm_lead_resp`] = JSON.parse(fields.crm_queue.value || '[]')
				.map((code) => Number(String(code).replace(/^U/, '')));
			snapshot[`${config}crm_new_lead_for`] = fields.crm_new_lead_for.value.split(/[\r\n,;]+/)
				.map((value) => value.trim()).filter(Boolean);
			snapshot[`${config}crm_public`] = fields.crm_public.checked;
			snapshot[`${config}crm_vcf`] = fields.crm_vcf.checked;
			if (fields.crm_sync_old && fields.crm_max_age)
			{
				snapshot[`${config}crm_sync_days`] = fields.crm_sync_old.checked
					? Number(fields.crm_max_age.value) : null;
			}
		}

		return snapshot;
	},

	buildGeneralSettingsPatch(snapshot)
	{
		const patch = {};
		Object.entries(snapshot).forEach(([path, value]) => {
			if (JSON.stringify(value) === JSON.stringify(this.generalSettingsBaseline[path]))
			{
				return;
			}
			const keys = path.split('.');
			let target = patch;
			keys.slice(0, -1).forEach((key) => {
				target[key] ??= {};
				target = target[key];
			});
			target[keys[keys.length - 1]] = value;
		});

		return patch;
	},

	saveSettings(validateConnection, onSaved)
	{
		if (this.settingsDisposed || !this.settingsReady || this.settingsSaving)
		{
			return;
		}
		const general = this.readGeneralSettings();
		const patch = this.buildGeneralSettingsPatch(general);
		const connection = this.readConnectionSettings();
		const connectionChanges = {};
		if (!this.isConnectionSettingsLocked())
		{
			Object.entries(connection).forEach(([name, value]) => {
				if (value !== this.connectionSettingsBaseline[name])
				{
					connectionChanges[name] = value;
				}
			});
		}
		const hasConnectionChanges = Object.keys(connectionChanges).length > 0;
		if (!hasConnectionChanges && Object.keys(patch).length === 0)
		{
			return;
		}
		if (hasConnectionChanges && !validateConnection())
		{
			return;
		}

		const version = this.settingsVersion;
		const revision = this.migrationState.getRevision();
		let request;
		this.settingsSaving = true;
		BX('mail_connect_form_error').textContent = '';
		BX.addClass(BX('mail_connect_save_btn'), 'ui-btn-wait');
		this.renderSettingsAvailability();
		if (hasConnectionChanges)
		{
			if (connectionChanges.oauth_mode === 'Y')
			{
				connectionChanges.oauth_uid = connection.oauth_uid;
			}
			request = BX.ajax.runComponentAction('bitrix:mail.client.config', 'save', {
				mode: 'class',
				method: 'POST',
				json: {
					fields: {
						site_id: this.settingsFields.site_id.value,
						mailbox_id: this.mailboxId,
						...connectionChanges,
						...patch,
					},
					...this.sourceGeneration,
				},
			});
		}
		else
		{
			request = BX.ajax.runAction('mail.api.mailboxconnecting.updateGeneralSettings', {
				method: 'POST',
				json: { mailboxId: this.mailboxId, patch },
			});
		}
		request.then((response) => {
			if (this.settingsDisposed)
			{
				return;
			}
			this.generalSettingsBaseline = general;
			if (hasConnectionChanges && version === this.settingsVersion)
			{
				this.connectionSettingsBaseline = connection;
			}
			this.sendAnalyticsData('success');
			const unchanged = Object.keys(this.buildGeneralSettingsPatch(this.readGeneralSettings())).length === 0;
			const connectionUnchanged = this.isConnectionSettingsLocked()
				|| JSON.stringify(connection) === JSON.stringify(this.readConnectionSettings());
			if (unchanged && connectionUnchanged && version === this.settingsVersion
				&& (!hasConnectionChanges || revision === this.migrationState.getRevision()))
			{
				onSaved(response.data?.id || this.mailboxId);
			}
		}).catch((error) => {
			if (!this.settingsDisposed)
			{
				this.sendAnalyticsData('error');
				this.showSettingsError(error);
			}
		}).finally(() => {
			if (!this.settingsDisposed)
			{
				this.settingsSaving = false;
				BX.removeClass(BX('mail_connect_save_btn'), 'ui-btn-wait');
				this.renderSettingsAvailability();
			}
		});
	},

	showSettingsError(error)
	{
		const message = error?.errors?.[0]?.message || this.formError;
		const alert = new BX.UI.Alert({
			text: BX.util.htmlspecialchars(message),
			inline: true,
			closeBtn: true,
			color: BX.UI.Alert.Color.DANGER,
		});
		const container = BX('mail_connect_form_error');
		container.textContent = '';
		container.append(alert.getContainer());
	},

	disposeMigrationSettings()
	{
		if (this.settingsDisposed)
		{
			return;
		}
		this.settingsDisposed = true;
		clearTimeout(this.settingsRetryTimer);
		this.settingsRetryTimer = null;
		if (this.settingsRecoveryHandler)
		{
			BX.unbind(window, 'online', this.settingsRecoveryHandler);
			BX.unbind(window, 'focus', this.settingsRecoveryHandler);
			this.settingsRecoveryHandler = null;
		}
		this.settingsRequest++;
		this.unsubscribeMigration?.();
		this.unsubscribeMigration = null;
		if (this.settingsOauthHandler)
		{
			BX.removeCustomEvent('OnMailOAuthBCompleted', this.settingsOauthHandler);
			this.settingsOauthHandler = null;
		}
		this.settingsLoader?.destroy();
		this.settingsLoader = null;
		this.onConnectionSettingsHidden?.();
		this.smtpSwitcher?.destroy();
		if (this.settingsUnloadHandler)
		{
			BX.unbind(window, 'pagehide', this.settingsUnloadHandler);
		}
	},

	singleselect: function(input)
	{
		var options = BX.findChildren(input, {tag: 'input', attr: {type: 'radio'}}, true);
		for (var i in options)
		{
			if (!options.hasOwnProperty(i))
			{
				continue;
			}

			BX.bind(options[i], 'change', function()
			{
				if (this.checked)
				{
					if (this.value == 0)
					{
						var input1 = BX(input.getAttribute('data-checked'));
						if (input1)
						{
							var label0 = BX.findNextSibling(this, {tag: 'label', attr: {'for': this.id}});
							var label1 = BX.findNextSibling(input1, {tag: 'label', attr: {'for': input1.id}});
							if (label0 && label1)
								BX.adjust(label0, {text: label1.innerHTML});
						}
					}
					else
					{
						input.setAttribute('data-checked', this.id);
					}
				}
			});
		}

		BX.bind(input, 'click', function(event)
		{
			event = event || window.event;
			event.skip_singleselect = input;
		});

		BX.bind(document, 'click', function(event)
		{
			event = event || window.event;
			if (event.skip_singleselect !== input)
			{
				BX(input.getAttribute('data-checked')).checked = true;
			}
		});
	},

	beforeOpenDialog: function()
	{
		return new Promise(function(resolve, reject)
		{
			if (BX.MailClientConfig.Edit.isForbiddenToShare)
			{
				BX.MailClientConfig.Edit.alertForbiddenToShare();
				return reject();
			}

			return resolve();
		});
	},

	alertForbiddenToShare: function()
	{

			B24.licenseInfoPopup.show(
				'mail-shared-mailbox-limit',
				BX.message('MAIL_MAILBOX_LICENSE_SHARED_LIMIT_TITLE'),
				BX.message('MAIL_MAILBOX_LICENSE_SHARED_LIMIT_BODY')
			);


	},

	setBlockSwitcher(
		switcherNodeId,
		oldSwitcherId,
		sectionBlockId,
		isSwitcherChecked,
		isSwitcherDisabled = false,
	)
	{
		const switcherNode = BX(switcherNodeId);
		const sectionBlockNode = BX(sectionBlockId);
		if (!switcherNode || !sectionBlockNode)
		{
			return;
		}

		const blockItemsNode = sectionBlockNode.querySelector('.mail-connect-form-items');
		const blockTitleNode = sectionBlockNode.querySelector('.mail-connect-title-block');
		if (!blockItemsNode || !blockTitleNode)
		{
			return;
		}

		const hideBlock = () => {
			BX.Dom.hide(blockItemsNode);
			BX.Dom.addClass(blockTitleNode, 'mail-connect-title-hidden-block');
			if (sectionBlockId !== 'mail-connect-section-smtp-block')
			{
				BX.Dom.removeClass(sectionBlockNode, 'mail-connect-section-block');
			}
		};

		const showBlock = () => {
			BX.Dom.show(blockItemsNode);
			BX.Dom.removeClass(blockTitleNode, 'mail-connect-title-hidden-block');
			BX.Dom.addClass(sectionBlockNode, 'mail-connect-section-block');
		};

		const oldSwitcherNode = BX(oldSwitcherId);
		const switcher = new BX.UI.Switcher({
			node: switcherNode,
			checked: isSwitcherChecked,
			size: 'small',
			disabled: isSwitcherDisabled ?? false,
			handlers: {
				toggled: () => {
					if (switcher.checked === true)
					{
						showBlock();
					}
					else
					{
						hideBlock();
					}

					if (oldSwitcherNode)
					{
						oldSwitcherNode.click();
					}
				},
			},
		});

		if (switcherNodeId === 'mail-connect-smtp-settings-title')
		{
			this.smtpSwitcher = switcher;
		}

		if (!isSwitcherChecked)
		{
			hideBlock();
		}
	},

	showOauthErrorTour()
	{
		this.oauthErrorTour = new BX.UI.Tour.Guide({
			id: 'mail-config-oauth-error-tour',
			simpleMode: true,
			steps: [
				{
					target: '#mail_connect_mb_oauth_btn',
					title: BX.message('MAIL_CONFIG_OAUTH_ERROR_TOUR_TITLE'),
					text: BX.message('MAIL_CONFIG_OAUTH_ERROR_TOUR_TEXT'),
					position: 'bottom',
					article: '19083990',
				},
			],
		});

		this.oauthErrorTour.start();
	},

	showPasswordErrorTour()
	{
		this.oauthErrorTour = new BX.UI.Tour.Guide({
			id: 'mail-config-password-error-tour',
			simpleMode: true,
			steps: [
				{
					target: '#mail_password_form_wrapper',
					title: BX.message('MAIL_CONFIG_PASSWORD_ERROR_TOUR_TITLE'),
					text: BX.message('MAIL_CONFIG_PASSWORD_ERROR_TOUR_TEXT'),
					position: 'bottom',
					article: '19083990',
				},
			],
		});

		this.oauthErrorTour.start();
	},

	showOauthAuthorizationBlock()
	{
		if (BX.MailClientConfig.Edit.isConnectionSettingsLocked())
		{
			return;
		}

		var form = BX('mail_connect_form');
		var oauthFieldError = BX('mail-client-config-email-oauth-field-error');
		var oauthFieldSuccess = BX('mail-client-config-email-oauth-field-success');
		var emailOauthBlock = BX('mail-email-oauth');
		var mailConnectOauthField = BX('mail_connect_mb_oauth_field');

		if(emailOauthBlock)
		{
			BX.hide(emailOauthBlock);
			BX.hide(oauthFieldError);
			BX.hide(oauthFieldSuccess);
		}

		if (mailConnectOauthField)
		{
			mailConnectOauthField.value = 'N';
		}

		if (!form.elements['fields[mailbox_id]'])
		{
			var nameField = BX('mail_connect_mb_name_field');
			if (!nameField['__filled'])
			{
				nameField.value = '';
			}
		}

		BX.Dom.style(BX('mail_connect_mb_oauth_status'), 'display', 'none');
		BX.Dom.style(BX('mail_connect_mb_oauth_btn'), 'display', null);
	},

	setSmtpSwitcher()
	{
		if (!this.smtp.switcherDisabled)
		{
			this.setBlockSwitcher(
				'mail-connect-smtp-settings-title',
				'mail_connect_mb_server_smtp_switch',
				'mail-connect-section-smtp-block',
				this.smtp.switcherChecked,
				this.smtp.switcherDisabled,
			);
		}
	},

	setCrmSwitcher() {
		if (!this.crm.integrationAvailable)
		{
			return;
		}

		this.setBlockSwitcher(
			'mail-connect-crm-settings-title',
			'mail_connect_mb_crm_switch',
			'mail-connect-section-crm-block',
			this.crm.switcherChecked,
			this.crm.switcherDisabled,
		);
	},

	initShareAccessSelector()
	{
		const ownerContainerNode = document.getElementById(this.shareAccessSelectorId);
		if (!ownerContainerNode)
		{
			return;
		}

		ownerContainerNode.innerHTML = '';
		const selectItem = () => {
			const selectedItems = tagSelector.getDialog().getSelectedItems();
			if (BX.type.isArray(selectedItems))
			{
				const result = selectedItems
					.map((item) => {
						let type = null;
						switch (item.entityId)
						{
							case 'department':
								type = item.id.toString().split(':')[1] === 'F' ? 'D' : 'DR';
								break;
							case 'user':
								type = 'U';
								break;
							default:
								break;
						}

						return type ? type + item.id.toString().split(':')[0] : null;
					})
					.filter((code) => code !== null);

				const shareAccessValueContainer = document.getElementById(this.shareAccessValueContainerId);
				if (shareAccessValueContainer)
				{
					shareAccessValueContainer.value = JSON.stringify(result);
				}
			}
		};

		const tagSelector = new BX.UI.EntitySelector.TagSelector({
			multiple: true,
			dialogOptions: {
				context: 'MAIL_CLIENT_CONFIG_SHARE_ACCESS',
				preselectedItems: this.shareAccessSelectorPreselectedIds,
				undeselectedItems: [['user', this.ownerId]],
				entities: [
					{
						id: 'department',
						options: {
							selectMode: 'usersAndDepartments',
							allowSelectRootDepartment: true,
							allowFlatDepartments: true,
						},
					},
				],
				events: {
					'Item:onSelect': selectItem,
					'Item:onDeselect': selectItem,
					onLoad: () => {
						if (this.isForbiddenToShare || this.isShareAccessLocked)
						{
							tagSelector.lock();
						}
					},
				},
			},
		});

		tagSelector.renderTo(ownerContainerNode);
	},

	initCrmQueueSelector()
	{
		const queueContainerNode = document.getElementById(this.crmQueueSelectorId);
		if (!queueContainerNode)
		{
			return;
		}

		queueContainerNode.innerHTML = '';
		const selectItem = () => {
			const selectedItems = tagSelector.getDialog().getSelectedItems();
			if (BX.type.isArray(selectedItems))
			{
				const result = selectedItems
					.map((item) => {
						return item.entityId === 'user' ? `U${item.id}` : null;
					})
					.filter((code) => code !== null);

				const queueValueContainer = document.getElementById(this.crmQueueValueContainerId);
				if (queueValueContainer)
				{
					queueValueContainer.value = JSON.stringify(result);
				}
			}
		};

		const tagSelector = new BX.UI.EntitySelector.TagSelector({
			multiple: true,
			dialogOptions: {
				context: 'MAIL_CLIENT_CONFIG_CRM_QUEUE',
				preselectedItems: this.crmQueueSelectorPreselectedIds,
				entities: [
					{
						id: 'user',
						options: {
							inviteEmployeeLink: false,
							intranetUsersOnly: true,
						},
					},
				],
				events: {
					'Item:onSelect': selectItem,
					'Item:onDeselect': selectItem,
					onLoad: () => {
						if (this.canEditCrmOptions)
						{
							tagSelector.lock();
						}
					},
				},
			},
		});

		tagSelector.renderTo(queueContainerNode);
	},

	initConnectionRequestSelector()
	{
		const ownerBlock = document.getElementById('mail-mailbox-connection-request-owner-block');
		const selectorContainer = document.getElementById('mail-mailbox-connection-request-selector-container');
		const requestIdInput = document.getElementById('mail-mailbox-connection-request-id-input');

		if (!ownerBlock || !selectorContainer || !requestIdInput)
		{
			return;
		}

		const slider = BX.SidePanel.Instance.getTopSlider();
		const connectionRequest = slider?.getRequestParams?.()?.connectionRequest || null;

		if (!connectionRequest)
		{
			BX.hide(ownerBlock);
			selectorContainer.innerHTML = '';
			requestIdInput.value = '';

			return;
		}

		requestIdInput.value = connectionRequest.requestId;

		this.ownerId = connectionRequest.requesterId;
		this.shareAccessSelectorPreselectedIds = [['user', connectionRequest.requesterId]];

		const shareAccessValueContainer = document.getElementById(this.shareAccessValueContainerId);
		if (shareAccessValueContainer)
		{
			shareAccessValueContainer.value = JSON.stringify([`U${connectionRequest.requesterId}`]);
		}

		BX.show(ownerBlock);

		selectorContainer.innerHTML = '';

		const tagSelector = new BX.UI.EntitySelector.TagSelector({
			multiple: false,
			showAddButton: false,
			dialogOptions: {
				context: 'MAIL_CLIENT_CONFIG_CONNECTION_REQUEST_OWNER',
				preselectedItems: [['user', connectionRequest.requesterId]],
				undeselectedItems: [['user', connectionRequest.requesterId]],
				maxCount: 1,
				entities: [{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						intranetUsersOnly: true,
					},
				}],
			},
		});

		tagSelector.renderTo(selectorContainer);
	},

	/**
	 * @param {string} status
	 * @return void
	 */
	sendAnalyticsData(status)
	{
		if (!BX.UI.Analytics)
		{
			return;
		}

		const form = document.getElementById('mail_connect_form');
		if (!form)
		{
			return;
		}

		const eventName = this.isNewMailbox ? 'mailbox_connect' : 'mailbox_edit';

		const useCrmField = form.elements['fields[use_crm]'];
		const useIcalField = form.elements['fields[ical_access]'];

		const isCrm = useCrmField && useCrmField.checked;
		const isIcal = useIcalField && useIcalField.checked;

		const shareAccessField = form.elements['fields[share_access]'];
		let isShared = false;

		if (shareAccessField && shareAccessField.value)
		{
			try
			{
				const accessList = JSON.parse(shareAccessField.value);
				if (Array.isArray(accessList) && accessList.length > 1)
				{
					isShared = true;
				}
			}
			catch (e)
			{
				console.error('Analytics: share_access parse error', e);
			}
		}

		BX.UI.Analytics.sendData({
			tool: 'mail',
			event: eventName,
			type: this.serviceName,
			category: 'mail_general_ops',
			c_section: 'menu',
			status,
			p1: `integrationCalendar_${isIcal ? 'true' : 'false'}`,
			p2: `integrationCRM_${isCrm ? 'true' : 'false'}`,
			p3: `shared_${isShared ? 'true' : 'false'}`,
		});
	},
};
