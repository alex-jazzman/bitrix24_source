/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Connecting = this.BX.Mail.Connecting || {};
(function (exports, main_core, ui_vue3, main_core_events, ui_dialogs_messagebox, ui_system_typography_vue, ui_iconSet_api_vue, ui_vue3_components_button, mail_connecting_crmIntegration, mail_connecting_calendarIntegration, mail_connecting_mailSyncSettings, mail_migrationState, ui_system_input, ui_system_input_vue, mail_connecting_settingsConfig, ui_a11y, ui_vue3_components_switcher, ui_switcher, ui_vue3_directives_hint, ui_entitySelector, mail_lib_entitySelector, ui_tour, ui_buttons) {
	'use strict';

	const formStateKey = Symbol('mailbox-config-form-state');
	function useFormState() {
		const state = ui_vue3.inject(formStateKey, null);
		if (state === null) {
			throw new Error('Mailbox config form state was not provided.');
		}
		return state;
	}
	function normalizeService(service) {
		if (!service) {
			return null;
		}
		return {
			...service,
			smtp: service.smtp ? {
				server: String(service.smtp.server ?? ''),
				port: service.smtp.port ?? '',
				login: Boolean(service.smtp.login),
				password: Boolean(service.smtp.password)
			} : undefined
		};
	}
	function createPermissions(initialData, mapped) {
		const rawPermissions = initialData.permissions;
		const sharedMailboxLimit = rawPermissions?.sharedMailboxLimit ?? null;
		return {
			canEditCrm: rawPermissions?.canEditCrm ?? false,
			canEditAccess: rawPermissions?.canEditAccess ?? false,
			canChangeOwner: rawPermissions?.canChangeOwner ?? false,
			canViewMailboxList: rawPermissions?.canViewMailboxList ?? false,
			isSmtpAvailable: rawPermissions?.isSmtpAvailable ?? false,
			isCrmAvailable: rawPermissions?.isCrmAvailable ?? mapped.crmAvailable,
			isCalendarAvailable: rawPermissions?.isCalendarAvailable ?? false,
			isAvatarAvailable: rawPermissions?.isAvatarAvailable ?? false,
			syncOldLimit: rawPermissions?.syncOldLimit ?? 90,
			sharedMailboxLimit,
			sharedMailboxLimitReached: rawPermissions?.sharedMailboxLimitReached ?? false,
			sharedMailboxesCount: rawPermissions?.sharedMailboxesCount ?? null
		};
	}
	function setSourceGeneration(state, data) {
		const generationId = data.sourceGenerationId;
		const hasSourceGenerationId = Object.prototype.hasOwnProperty.call(data, 'sourceGenerationId') && (main_core.Type.isNull(generationId) || main_core.Type.isInteger(generationId) && generationId >= 0);
		Object.assign(state, {
			hasSourceGenerationId,
			sourceGenerationId: hasSourceGenerationId ? generationId ?? null : null
		});
	}
	function getSourceGenerationPrecondition(state) {
		return state.hasSourceGenerationId ? {
			expectedSourceGenerationId: state.sourceGenerationId
		} : {};
	}
	function createMailboxAvatarState(mailboxId = null) {
		return {
			mailboxId,
			confirmed: null,
			intent: null,
			selection: null,
			loading: false,
			saving: false,
			needsRefresh: false,
			rejectedUploadId: null,
			preservedUploadId: null,
			error: '',
			imageErrorUrl: '',
			requestId: 0,
			resetKey: 0
		};
	}
	function beginMailboxAvatarRead(state) {
		const requestId = state.avatar.requestId + 1;
		if (state.avatar.mailboxId !== state.mailboxId) {
			Object.assign(state, {
				avatar: createMailboxAvatarState(state.mailboxId)
			});
		}
		Object.assign(state.avatar, {
			requestId,
			loading: true,
			error: ''
		});
		return requestId;
	}
	function invalidateMailboxAvatarRead(state) {
		Object.assign(state.avatar, {
			requestId: state.avatar.requestId + 1,
			loading: false
		});
	}
	function acceptMailboxAvatarRead(state, requestId, data) {
		if (state.avatar.requestId !== requestId || data.mailboxId !== state.mailboxId || state.avatar.mailboxId !== state.mailboxId) {
			return false;
		}
		Object.assign(state.avatar, {
			confirmed: {
				...data
			},
			loading: false,
			needsRefresh: false,
			error: '',
			imageErrorUrl: ''
		});
		return true;
	}
	function rejectMailboxAvatarRead(state, requestId, message) {
		if (state.avatar.requestId === requestId && state.avatar.mailboxId === state.mailboxId) {
			Object.assign(state.avatar, {
				loading: false,
				error: message
			});
		}
	}
	function canEditMailboxAvatar(state) {
		return state.mode === 'edit' && !state.avatar.needsRefresh && state.avatar.mailboxId === state.mailboxId && state.avatar.confirmed?.supported === true && state.avatar.confirmed.canEdit === true;
	}
	function setMailboxAvatarSelection(state, selection) {
		const confirmed = state.avatar.confirmed;
		if (!confirmed || !canEditMailboxAvatar(state) || state.avatar.saving || selection.id === state.avatar.rejectedUploadId || state.loading && (!state.avatar.selection || state.avatar.selection.id !== selection.id)) {
			return;
		}
		const expectedRevision = state.avatar.intent?.expectedRevision ?? confirmed.revision;
		Object.assign(state.avatar, {
			selection: {
				...selection
			},
			rejectedUploadId: null,
			intent: {
				operation: 'replace',
				expectedRevision,
				uploadToken: selection.status === 'complete' ? selection.uploadToken : null
			},
			imageErrorUrl: ''
		});
	}
	function resetMailboxAvatarIntent(state) {
		Object.assign(state.avatar, {
			intent: null,
			selection: null,
			rejectedUploadId: null,
			imageErrorUrl: '',
			resetKey: state.avatar.resetKey + 1
		});
	}
	function deleteMailboxAvatar(state) {
		const confirmed = state.avatar.confirmed;
		if (!confirmed?.hasAvatar || !canEditMailboxAvatar(state) || state.loading || state.avatar.loading || state.avatar.error) {
			return;
		}
		const expectedRevision = state.avatar.intent?.expectedRevision ?? confirmed.revision;
		resetMailboxAvatarIntent(state);
		Object.assign(state.avatar, {
			intent: {
				operation: 'delete',
				expectedRevision
			}
		});
	}
	function isMailboxAvatarSaveBlocked(state) {
		if (!state.avatar.intent) {
			return false;
		}
		return !canEditMailboxAvatar(state) || state.avatar.loading || Boolean(state.avatar.error) || state.avatar.intent.operation === 'replace' && (state.avatar.selection?.status !== 'complete' || !state.avatar.intent.uploadToken);
	}
	function createMailboxAvatarSaveSnapshot(state) {
		const intent = state.avatar.intent;
		if (!intent || !state.mailboxId) {
			return null;
		}
		if (isMailboxAvatarSaveBlocked(state)) {
			throw new Error('Mailbox avatar is not ready to save.');
		}
		const change = intent.operation === 'delete' ? {
			operation: 'delete',
			expectedRevision: intent.expectedRevision
		} : {
			operation: 'replace',
			expectedRevision: intent.expectedRevision,
			uploadToken: String(intent.uploadToken)
		};
		return {
			mailboxId: state.mailboxId,
			requestId: state.avatar.requestId,
			resetKey: state.avatar.resetKey,
			selectionId: state.avatar.selection?.id ?? null,
			change
		};
	}
	function isMailboxAvatarSaveCurrent(state, snapshot) {
		return state.mailboxId === snapshot.mailboxId && state.avatar.mailboxId === snapshot.mailboxId && state.avatar.requestId === snapshot.requestId;
	}
	function matchesMailboxAvatarIntent(state, snapshot) {
		const intent = state.avatar.intent;
		const change = snapshot.change;
		return state.avatar.resetKey === snapshot.resetKey && (state.avatar.selection?.id ?? null) === snapshot.selectionId && intent?.operation === change.operation && intent.expectedRevision === change.expectedRevision && (change.operation === 'delete' || intent.operation === 'replace' && intent.uploadToken === change.uploadToken);
	}
	function acceptMailboxAvatarSave(state, snapshot, data) {
		if (!isMailboxAvatarSaveCurrent(state, snapshot) || !data || data.mailboxId !== snapshot.mailboxId || !main_core.Type.isInteger(data.revision) || data.revision <= snapshot.change.expectedRevision) {
			return false;
		}
		if (matchesMailboxAvatarIntent(state, snapshot)) {
			resetMailboxAvatarIntent(state);
		}
		invalidateMailboxAvatarRead(state);
		Object.assign(state.avatar, {
			confirmed: {
				...data
			},
			needsRefresh: false,
			error: '',
			imageErrorUrl: ''
		});
		return true;
	}
	function requireMailboxAvatarRefresh(state) {
		resetMailboxAvatarIntent(state);
		invalidateMailboxAvatarRead(state);
		Object.assign(state.avatar, {
			needsRefresh: true
		});
	}
	function rejectMailboxAvatarUpload(state, snapshot, message) {
		if (!isMailboxAvatarSaveCurrent(state, snapshot) || !matchesMailboxAvatarIntent(state, snapshot) || snapshot.change.operation !== 'replace' || !state.avatar.selection) {
			return;
		}
		Object.assign(state.avatar, {
			rejectedUploadId: state.avatar.selection.id,
			intent: {
				...snapshot.change,
				uploadToken: null
			},
			selection: {
				...state.avatar.selection,
				status: 'error',
				uploadToken: null,
				previewUrl: '',
				error: message
			}
		});
	}
	function getMailboxAvatarUrl(state) {
		if (state.avatar.mailboxId !== state.mailboxId || state.avatar.intent?.operation === 'delete') {
			return '';
		}
		const previewUrl = state.avatar.selection?.status === 'error' ? '' : state.avatar.selection?.previewUrl;
		const url = previewUrl || state.avatar.confirmed?.url || '';
		return url === state.avatar.imageErrorUrl ? '' : url;
	}
	function createGeneralSettingsSnapshot(state) {
		const crm = state.crmSettings;
		return {
			mailboxName: state.mailbox.name,
			link: state.mailbox.link,
			senderName: state.mailbox.senderName,
			useSenderName: state.mailbox.useSenderName,
			iCalAccess: state.calendarSettings.enabled && state.calendarSettings.autoAddEvents,
			shareAccess: [...new Set(state.access.sharedWith)].sort(),
			crmOptions: {
				enabled: crm.enabled,
				config: {
					crm_sync_days: crm.sync.enabled ? Number.parseInt(crm.sync.periodValue, 10) || 0 : null,
					crm_new_entity_in: crm.incoming.enabled ? crm.incoming.createAction : '',
					crm_new_entity_out: crm.outgoing.enabled ? crm.outgoing.createAction : '',
					crm_lead_source: crm.source,
					crm_lead_resp: crm.responsibleQueue.map(item => Number(item.id)),
					crm_new_lead_for: crm.leadCreationAddresses.split(/[\n,]/).map(item => item.trim()).filter(Boolean),
					crm_public: crm.assignKnownClientEmails,
					crm_vcf: crm.vcf
				}
			}
		};
	}
	function setGeneralSettingsBaseline(state, snapshot = createGeneralSettingsSnapshot(state)) {
		const generalSettingsBaseline = {
			...snapshot,
			shareAccess: [...snapshot.shareAccess],
			crmOptions: {
				...snapshot.crmOptions,
				config: {
					...snapshot.crmOptions.config,
					crm_lead_resp: [...snapshot.crmOptions.config.crm_lead_resp],
					crm_new_lead_for: [...snapshot.crmOptions.config.crm_new_lead_for]
				}
			}
		};
		Object.assign(state, {
			generalSettingsBaseline
		});
	}
	function getChangedFields(current, baseline) {
		const patch = {};
		for (const key of Object.keys(current)) {
			const value = current[key];
			const previousValue = baseline[key];
			const unchanged = main_core.Type.isArray(value) && main_core.Type.isArray(previousValue) ? value.length === previousValue.length && value.every((item, index) => item === previousValue[index]) : value === previousValue;
			if (!unchanged) {
				patch[key] = value;
			}
		}
		return patch;
	}
	function buildGeneralSettingsPatch(state, snapshot = createGeneralSettingsSnapshot(state)) {
		const baseline = state.generalSettingsBaseline;
		if (!baseline) {
			throw new Error('Saved mailbox settings are required to build a patch.');
		}
		const {
			crmOptions,
			...generalSettings
		} = snapshot;
		const {
			crmOptions: savedCrmOptions,
			...savedGeneralSettings
		} = baseline;
		const patch = getChangedFields(generalSettings, savedGeneralSettings);
		if (!state.permissions.canEditAccess) {
			delete patch.shareAccess;
		}
		if (!state.permissions.isCalendarAvailable) {
			delete patch.iCalAccess;
		}
		if (state.permissions.canEditCrm && state.permissions.isCrmAvailable) {
			const config = getChangedFields(crmOptions.config, savedCrmOptions.config);
			if (crmOptions.enabled !== savedCrmOptions.enabled) {
				patch.crmOptions = {
					enabled: crmOptions.enabled
				};
			}
			if (Object.keys(config).length > 0) {
				patch.crmOptions = {
					...patch.crmOptions,
					config
				};
			}
		}
		return patch;
	}
	function acceptGeneralSettingsPatch(state, patch) {
		const baseline = state.generalSettingsBaseline;
		if (!baseline) {
			throw new Error('Saved mailbox settings are required to accept a patch.');
		}
		setGeneralSettingsBaseline(state, {
			...baseline,
			...patch,
			crmOptions: {
				...baseline.crmOptions,
				...patch.crmOptions,
				config: {
					...baseline.crmOptions.config,
					...patch.crmOptions?.config
				}
			}
		});
	}
	function createConnectionState(service) {
		return {
			email: '',
			server: service?.server ?? '',
			port: service?.port !== undefined && service?.port !== null ? Number(service.port) || null : null,
			ssl: service?.encryption !== 'N',
			login: '',
			password: '',
			isOAuth: Boolean(service?.oauth),
			oauthUid: null,
			oauthUser: null,
			userPrincipalName: null,
			oauthEmailNeedsConfirmation: false,
			oauthEmailCheckStatus: 'idle'
		};
	}
	function createFormState(initialData = {}) {
		const rawConfig = initialData.settingsConfig ?? {};
		const mapped = mail_connecting_settingsConfig.mapSettingsConfigToState(rawConfig);
		const service = normalizeService(initialData.service);
		const connectionRequest = initialData.connectionRequest ?? null;
		const connectionRequestId = initialData.connectionRequestId ?? (connectionRequest ? Number(connectionRequest.requestId) || null : null);
		const requesterId = connectionRequest ? Number(connectionRequest.requesterId) || null : null;
		return ui_vue3.reactive({
			mode: initialData.mode ?? 'create',
			mailboxId: initialData.mailboxId ?? null,
			connectionRequestId,
			lastMailCheck: null,
			providerRestriction: null,
			settingsConfig: rawConfig,
			settingsOptions: {
				mailSync: mapped.mailSyncOptions,
				crmSync: mapped.crmSyncOptions,
				crmEntity: mapped.crmEntityOptions,
				crmSource: mapped.crmSourceOptions
			},
			connection: createConnectionState(service),
			smtp: {
				enabled: true,
				server: service?.smtp?.server ?? '',
				port: service?.smtp?.port !== undefined && service?.smtp?.port !== null ? Number(service.smtp.port) || null : null,
				ssl: true,
				login: '',
				password: '',
				useLimit: false,
				limit: 250,
				uploadOutgoing: Boolean(service?.upload_outgoing)
			},
			mailbox: {
				name: '',
				link: service?.link ?? '',
				senderName: '',
				useSenderName: false,
				messageMaxAge: Number(mapped.messageMaxAge) || 7
			},
			avatar: createMailboxAvatarState(initialData.mailboxId ?? null),
			crmSettings: {
				enabled: mapped.crmEnabled,
				sync: {
					enabled: mapped.crmSyncEnabled,
					periodValue: mapped.crmSyncPeriod
				},
				assignKnownClientEmails: mapped.crmAssignKnownClientEmails,
				vcf: mapped.crmVcf,
				incoming: {
					enabled: mapped.crmIncomingCreate,
					createAction: mapped.crmIncomingEntity
				},
				outgoing: {
					enabled: mapped.crmOutgoingCreate,
					createAction: mapped.crmOutgoingEntity
				},
				source: mapped.crmSource,
				leadCreationAddresses: '',
				responsibleQueue: []
			},
			calendarSettings: {
				enabled: false,
				autoAddEvents: mapped.calendarAutoAddEvents
			},
			access: {
				sharedWith: requesterId ? [`U${requesterId}`] : [],
				ownerId: requesterId
			},
			service,
			paths: {
				messageList: initialData.paths?.messageList ?? '',
				home: initialData.paths?.home ?? '',
				configDirs: initialData.paths?.configDirs ?? '/mail/config/dirs'
			},
			changedDirs: false,
			migrationActive: false,
			sourceGenerationId: null,
			hasSourceGenerationId: false,
			generalSettingsBaseline: null,
			permissions: createPermissions(initialData, mapped),
			loading: false,
			isDataReady: initialData.mode !== 'edit',
			errors: {
				generalItems: []
			},
			fieldSyncFlags: {
				loginManual: false,
				nameManual: false,
				smtpLoginManual: false,
				smtpPasswordManual: false
			}
		});
	}

	function loc(phraseCode, replacements = {}) {
		return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
	}

	const ConnectionSettings = ui_vue3.defineComponent({
		name: 'connection-settings',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		setup() {
			return {
				state: useFormState(),
				loc,
				InputSize: ui_system_input.InputSize,
				InputDesign: ui_system_input.InputDesign
			};
		},
		props: {
			passwordPlaceholder: {
				type: String,
				default: ''
			},
			connectionSettingsLocked: {
				type: Boolean,
				default: false
			}
		},
		emits: ['oauth-email-blur'],
		data() {
			return {
				showExtraParams: false
			};
		},
		computed: {
			isEditMode() {
				return this.state.mode === 'edit';
			},
			credentialsReadOnly() {
				return this.connectionSettingsLocked || this.state.migrationActive;
			},
			isOAuthService() {
				return Boolean(this.state.service?.oauth) || Boolean(this.state.connection.isOAuth);
			},
			showEmailField() {
				if (this.isEditMode) {
					return false;
				}
				return !this.isOAuthService || this.state.connection.oauthEmailNeedsConfirmation;
			},
			oauthEmailStatusHint() {
				if (!this.state.connection.oauthEmailNeedsConfirmation) {
					return '';
				}
				switch (this.state.connection.oauthEmailCheckStatus) {
					case 'checking':
						return loc('MAIL_CONFIG_FORM_OAUTH_EMAIL_CHECKING');
					case 'success':
						return loc('MAIL_CONFIG_FORM_OAUTH_EMAIL_CHECK_SUCCESS');
					case 'error':
						return loc('MAIL_CONFIG_FORM_OAUTH_EMAIL_CHECK_ERROR');
					default:
						return loc('MAIL_CONFIG_FORM_OAUTH_EMAIL_NEEDS_CONFIRMATION_HINT');
				}
			},
			oauthEmailStatusModifier() {
				if (!this.state.connection.oauthEmailNeedsConfirmation) {
					return '';
				}
				switch (this.state.connection.oauthEmailCheckStatus) {
					case 'checking':
						return '--checking';
					case 'success':
						return '--success';
					case 'error':
						return '--error';
					default:
						return '';
				}
			},
			portModel: {
				get() {
					return this.state.connection.port?.toString() ?? '';
				},
				set(value) {
					const port = parseInt(value, 10);
					this.state.connection.port = Number.isNaN(port) ? null : port;
				}
			},
			showSenderNameHere() {
				return !this.state.permissions.isSmtpAvailable;
			},
			credentialsAreExternal() {
				return Boolean(this.state.service?.externalCredentials);
			},
			hasCustomImapServer() {
				return !this.state.service?.server;
			},
			showServerFields() {
				return !this.credentialsAreExternal && this.hasCustomImapServer;
			},
			showCredentialFields() {
				return !this.credentialsAreExternal && !this.isOAuthService;
			}
		},
		watch: {
			'state.connection.email'(newVal) {
				if (!this.state.fieldSyncFlags.loginManual) {
					this.state.connection.login = newVal;
				}
				if (!this.state.fieldSyncFlags.nameManual) {
					this.state.mailbox.name = newVal;
				}
				if (!this.state.fieldSyncFlags.smtpLoginManual) {
					this.state.smtp.login = newVal;
				}
			},
			'state.connection.login'(newVal) {
				if (!this.state.fieldSyncFlags.smtpLoginManual) {
					this.state.smtp.login = newVal;
				}
			},
			'state.connection.password'(newVal) {
				if (!this.state.fieldSyncFlags.smtpPasswordManual) {
					this.state.smtp.password = newVal;
				}
			}
		},
		methods: {
			onLoginChange(value) {
				this.state.connection.login = value;
				this.state.fieldSyncFlags.loginManual = true;
			},
			onNameChange(value) {
				this.state.mailbox.name = value;
				this.state.fieldSyncFlags.nameManual = true;
			},
			openDirsSlider() {
				if (this.credentialsReadOnly) {
					return;
				}
				const url = main_core.Uri.addParam('/mail/config/dirs', {
					mailboxId: this.state.mailboxId
				});
				const sidePanel = BX.SidePanel?.Instance;
				sidePanel?.open(url, {
					width: 640,
					cacheable: false,
					allowChangeHistory: false
				});
			},
			onEmailBlur() {
				if (this.state.connection.oauthEmailNeedsConfirmation) {
					this.$emit('oauth-email-blur');
				}
			}
		},
		template: `
		<div class="mail-config-form__input-content" data-test-id="mail_config-form__connection-settings">
			<template v-if="!credentialsReadOnly">
				<div
					v-if="showEmailField"
					class="mail-config-form__email-field"
					:class="oauthEmailStatusModifier"
					data-test-id="mail_config-form__connection-email-group"
				>
					<BInput
						:label="loc('MAIL_CONFIG_FORM_EMAIL_LABEL')"
						:size="InputSize.Md"
						v-model="state.connection.email"
						:design="InputDesign.DEFAULT"
						:error="state.errors.email"
						:placeholder="loc('MAIL_CONFIG_FORM_EMAIL_LABEL_PLACEHOLDER')"
						data-test-id="mail_config-form__connection-email_field"
						@blur="onEmailBlur"
					/>
					<div
						v-if="state.connection.oauthEmailNeedsConfirmation"
						class="mail-config-form__email-hint"
						:class="oauthEmailStatusModifier"
						data-test-id="mail_config-form__connection-email-hint"
					>{{ oauthEmailStatusHint }}</div>
				</div>
				<div
					class="mail-config-form__input-group_checkbox"
					v-if="showServerFields"
					data-test-id="mail_config-form__connection-server-group"
				>
					<div class="mail-config-form__input-group">
						<BInput
							class="mail-config-form__input-group_main"
							:label="loc('MAIL_CONFIG_FORM_SERVER_LABEL')"
							:size="InputSize.Md"
							:design="InputDesign.DEFAULT"
							v-model="state.connection.server"
							:placeholder="loc('MAIL_CONFIG_FORM_SERVER_LABEL_PLACEHOLDER')"
							data-test-id="mail_config-form__connection-server_field"
						/>
						<BInput
							class="mail-config-form__input-group_port"
							:label="loc('MAIL_CONFIG_FORM_PORT_LABEL')"
							type="number"
							:size="InputSize.Md"
							:design="InputDesign.DEFAULT"
							v-model="portModel"
							:placeholder="loc('MAIL_CONFIG_FORM_PORT_PLACEHOLDER')"
							data-test-id="mail_config-form__connection-port_field"
						/>
					</div>
					<div class="mail-config-form__checkbox-row">
						<input
							type="checkbox"
							id="mail-config-imap-ssl"
							class="mail-config-form__checkbox"
							v-model="state.connection.ssl"
							data-test-id="mail_config-form__connection-ssl_checkbox"
						/>
						<label class="mail-config-form__checkbox-label --connection-settings" for="mail-config-imap-ssl">
							{{ loc('MAIL_CONFIG_FORM_USE_SSL_LABEL') }}
						</label>
					</div>
				</div>
				<BInput
					v-if="showCredentialFields"
					:label="loc('MAIL_CONFIG_FORM_LOGIN_LABEL')"
					:size="InputSize.Md"
					:design="isEditMode ? InputDesign.Disabled : InputDesign.DEFAULT"
					:model-value="state.connection.login"
					:error="state.errors.login"
					data-test-id="mail_config-form__connection-login_field"
					@update:model-value="onLoginChange"
				/>
				<div
					v-if="showCredentialFields"
					class="mail-config-form__password-field"
					data-id="mail-config-form-password-field"
					data-test-id="mail_config-form__connection-password_field"
				>
					<BInput
						:label="loc('MAIL_CONFIG_FORM_PASSWORD_LABEL')"
						type="password"
						:size="InputSize.Md"
						:design="InputDesign.DEFAULT"
						v-model="state.connection.password"
						:placeholder="isEditMode ? passwordPlaceholder : ''"
						:error="state.errors.password"
						data-test-id="mail_config-form__connection-password_field"
					/>
				</div>
				<a v-if="isEditMode && state.mailboxId"
					class="mail-config-form__dirs-link"
					href="#"
					@click.prevent="openDirsSlider"
					data-test-id="mail_config-form__dirs_link"
				>{{ loc('MAIL_CONFIG_FORM_DIRS_LINK') }}</a>
			</template>
			<slot name="after-fields"></slot>
			<a class="mail-config-form__extra-params-link"
				href="#"
				@click.prevent="showExtraParams = !showExtraParams"
				data-test-id="mail_config-form__extra-params_toggle"
			>{{ loc('MAIL_CONFIG_FORM_EXTRA_PARAMS_LINK') }}</a>
			<transition name="mail-config-form__collapse">
				<div
					v-if="showExtraParams"
					class="mail-config-form__extra-params-content"
					data-test-id="mail_config-form__extra-params_content"
				>
					<BInput
						:label="loc('MAIL_CONFIG_FORM_MAILBOX_NAME_LABEL')"
						:size="InputSize.Md"
						:design="InputDesign.DEFAULT"
						:model-value="state.mailbox.name"
						data-test-id="mail_config-form__mailbox-name_field"
						@update:model-value="onNameChange"
					/>
					<BInput
						:label="loc('MAIL_CONFIG_FORM_LINK_LABEL')"
						:size="InputSize.Md"
						:design="InputDesign.DEFAULT"
						v-model="state.mailbox.link"
						:error="state.errors.link"
						data-test-id="mail_config-form__mailbox-link_field"
					/>
					<div class="mail-config-form__checkbox-row" v-if="showSenderNameHere">
						<input
							type="checkbox"
							id="mail-config-use-sender-name"
							class="mail-config-form__checkbox"
							v-model="state.mailbox.useSenderName"
							data-test-id="mail_config-form__use-sender-name_checkbox"
						/>
						<label for="mail-config-use-sender-name">
							{{ loc('MAIL_CONFIG_FORM_USE_SENDER_NAME_LABEL') }}
						</label>
					</div>
					<transition name="mail-config-form__collapse">
						<div
							v-if="showSenderNameHere && state.mailbox.useSenderName"
							class="mail-config-form__collapse-field"
						>
							<BInput
								:size="InputSize.Md"
								:design="InputDesign.DEFAULT"
								v-model="state.mailbox.senderName"
								:placeholder="loc('MAIL_CONFIG_FORM_SENDER_NAME_PLACEHOLDER')"
								data-test-id="mail_config-form__sender-name_field"
							/>
						</div>
					</transition>
				</div>
			</transition>
		</div>
	`
	});

	const MicrosoftConnection = ui_vue3.defineComponent({
		name: 'microsoft-connection',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		setup() {
			return {
				state: useFormState(),
				InputSize: ui_system_input.InputSize,
				InputDesign: ui_system_input.InputDesign,
				loc
			};
		},
		computed: {
			userPrincipalName: {
				get() {
					return this.state.connection.userPrincipalName ?? '';
				},
				set(value) {
					this.state.connection.userPrincipalName = value;
				}
			}
		},
		template: `
		<div v-if="state.connection.isOAuth" data-test-id="mail_config-form__microsoft-connection">
			<BInput
				:label="loc('MAIL_CONFIG_FORM_UPN_LABEL')"
				:size="InputSize.Lg"
				:design="InputDesign.DEFAULT"
				v-model="userPrincipalName"
				:disabled="state.migrationActive"
				data-test-id="mail_config-form__microsoft-upn_field"
			/>
			<div
				class="mail-config-form__field-description"
				data-test-id="mail_config-form__microsoft-upn_hint"
			>{{ loc('MAIL_CONFIG_FORM_UPN_HINT') }}</div>
		</div>
	`
	});

	const ProviderBadge = ui_vue3.defineComponent({
		name: 'provider-badge',
		components: {
			UiButton: ui_vue3_components_button.Button,
			TextLg: ui_system_typography_vue.TextLg,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			iconKey: {
				type: String,
				default: 'other'
			},
			title: {
				type: String,
				required: true
			},
			email: {
				type: String,
				default: ''
			},
			avatar: {
				type: String,
				default: ''
			},
			buttonText: {
				type: String,
				default: ''
			},
			buttonDisabled: {
				type: Boolean,
				default: false
			},
			secondaryButtonText: {
				type: String,
				default: ''
			},
			secondaryButtonDisabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['button-click', 'secondary-button-click', 'avatar-error'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				loc
			};
		},
		data() {
			return {
				failedAvatar: ''
			};
		},
		computed: {
			showAvatar() {
				return Boolean(this.avatar) && this.avatar !== this.failedAvatar;
			}
		},
		watch: {
			avatar() {
				this.failedAvatar = '';
			}
		},
		methods: {
			onAvatarError(event) {
				const url = event.target.getAttribute('src') ?? '';
				if (url === this.avatar) {
					this.failedAvatar = url;
					this.$emit('avatar-error', url);
				}
			},
			onButtonClick() {
				this.$emit('button-click');
			},
			onSecondaryButtonClick() {
				this.$emit('secondary-button-click');
			}
		},
		template: `
		<div class="mail-config-form__provider-badge" data-test-id="mail_config-form__provider-badge">
			<div class="mail-provider-img-container">
				<div :class="'mail-provider-' + iconKey + '-img'"></div>
			</div>
			<template v-if="showAvatar">
				<div class="mail-config-form__provider-divider"></div>
				<div class="mail-config-form__provider-account">
					<img
						:key="avatar"
						class="mail-config-form__provider-avatar"
						:src="avatar"
						alt=""
						data-test-id="mail_config-form__provider-avatar"
						@error="onAvatarError"
					/>
					<TextLg
						v-if="email"
						:accent="true"
					>
						{{ email }}
					</TextLg>
				</div>
			</template>
			<div v-else class="mail-config-form__provider-info">
				<TextLg
					:accent="true"
				>
					{{ title }}
				</TextLg>
				<TextSm
					v-if="email"
					className="mail-config-form__provider-email"
				>
					{{ email }}
				</TextSm>
			</div>
			<div
				v-if="buttonText || secondaryButtonText"
				class="mail-config-form__provider-action"
				data-id="mail-config-form-provider-action"
				data-test-id="mail_config-form__provider-action"
			>
				<span
					v-if="secondaryButtonText"
					data-id="mail-config-form-provider-reauthorization"
					data-test-id="mail_config-form__provider-reauthorization"
				>
					<UiButton
						:text="secondaryButtonText"
						:style="AirButtonStyle.PLAIN_NO_ACCENT"
						:disabled="secondaryButtonDisabled"
						:dataset="{ testId: 'mail_config-form__provider-reauthorization_button' }"
						@click="onSecondaryButtonClick"
					/>
				</span>
				<UiButton
					v-if="buttonText"
					:text="buttonText"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:disabled="buttonDisabled"
					:dataset="{ testId: 'mail_config-form__provider-action_button' }"
					@click="onButtonClick"
				/>
			</div>
		</div>
	`
	});

	function loadUploaderStack() {
		return main_core.Runtime.loadExtension('ui.uploader.core', 'ui.uploader.vue', 'ui.uploader.tile-widget');
	}

	const TileWidgetComponent = ui_vue3.defineAsyncComponent({
		loader: () => loadUploaderStack().then(stack => stack.TileWidgetComponent)
	});
	function createPixelFilter(stack, uploader) {
		const {
			Filter,
			UploaderError
		} = stack;
		class AvatarPixelFilter extends Filter {
			apply(file) {
				if ((file.getWidth() ?? 0) * (file.getHeight() ?? 0) > 4_194_304) {
					return Promise.reject(new UploaderError('MAIL_AVATAR_LIMIT_EXCEEDED', loc('MAIL_CONFIG_FORM_AVATAR_LIMIT_ERROR')));
				}
				return Promise.resolve();
			}
		}
		return new AvatarPixelFilter(uploader);
	}
	const MailboxAvatar = ui_vue3.defineComponent({
		name: 'MailConfigMailboxAvatar',
		components: {
			UiButton: ui_vue3_components_button.Button,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs,
			TileWidgetComponent
		},
		props: {
			avatar: {
				type: Object,
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['selection-change', 'delete', 'reset', 'retry', 'image-error'],
		setup() {
			return {
				loc,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				adapter: null,
				uploaderStack: null,
				editorState: 'idle',
				activeFileId: '',
				disposed: false,
				focusRestoreRequest: null,
				browseNode: null,
				widgetOptions: {
					compact: true,
					autoCollapse: false,
					readonly: this.disabled,
					hideDropArea: this.disabled,
					forceDisableSelection: this.disabled,
					enableDropzone: !this.disabled,
					removeFromServer: true
				}
			};
		},
		computed: {
			canEdit() {
				return this.avatar.confirmed?.supported === true && this.avatar.confirmed.canEdit === true;
			},
			hasPendingSelection() {
				return Boolean(this.avatar.selection);
			},
			showSavedImage() {
				return this.avatar.confirmed?.hasAvatar === true && Boolean(this.avatar.confirmed.url) && !this.avatar.intent && !this.avatar.selection && !this.avatar.imageErrorUrl;
			},
			imageUnavailable() {
				return Boolean(this.avatar.imageErrorUrl) || this.avatar.confirmed?.hasAvatar === true && !this.avatar.confirmed.url && !this.avatar.intent;
			},
			controlsDisabled() {
				return this.disabled || this.avatar.loading || this.avatar.needsRefresh || Boolean(this.avatar.error);
			},
			statusMessage() {
				if (this.avatar.error && !this.avatar.confirmed) {
					return '';
				}
				if (this.avatar.loading) {
					return loc('MAIL_CONFIG_FORM_AVATAR_LOADING');
				}
				if (this.avatar.intent?.operation === 'delete') {
					return loc('MAIL_CONFIG_FORM_AVATAR_DELETE_PENDING');
				}
				if (this.avatar.selection?.status === 'loading') {
					return loc('MAIL_CONFIG_FORM_AVATAR_UPLOADING');
				}
				if (this.avatar.intent) {
					return loc('MAIL_CONFIG_FORM_AVATAR_UNSAVED');
				}
				return loc(this.avatar.confirmed?.hasAvatar ? 'MAIL_CONFIG_FORM_AVATAR_SAVED' : 'MAIL_CONFIG_FORM_AVATAR_EMPTY');
			}
		},
		watch: {
			disabled(disabled) {
				if (disabled) {
					this.cancelFocusRestore();
				}
			},
			'avatar.mailboxId': 'cancelFocusRestore',
			'avatar.requestId': function (requestId) {
				if (this.focusRestoreRequest?.requestId !== requestId) {
					this.cancelFocusRestore();
				}
			},
			'avatar.loading': function (loading) {
				if (!loading) {
					void this.$nextTick(this.restoreFocus);
				}
			},
			controlsDisabled: {
				immediate: true,
				handler(disabled) {
					Object.assign(this.widgetOptions, {
						readonly: disabled,
						hideDropArea: disabled || this.hasPendingSelection,
						forceDisableSelection: disabled,
						enableDropzone: !disabled
					});
				}
			},
			hasPendingSelection(pending) {
				this.widgetOptions.hideDropArea = this.controlsDisabled || pending;
			},
			'avatar.resetKey': function () {
				if (!this.avatar.selection) {
					this.clearSelection();
				}
			},
			canEdit: {
				immediate: true,
				handler(canEdit) {
					if (canEdit && !this.adapter) {
						void this.createUploader();
					}
				}
			}
		},
		mounted() {
			this.bindBrowseButton();
		},
		updated() {
			this.bindBrowseButton();
		},
		beforeUnmount() {
			this.disposed = true;
			this.cancelFocusRestore();
		},
		unmounted() {
			this.clearSelection();
			this.unbindBrowseButton();
			this.adapter?.destroy();
			this.adapter = null;
		},
		methods: {
			holdFocus() {
				this.cancelFocusRestore();
				const root = this.$refs.avatar;
				if (root?.contains(ui_a11y.FocusNavigator.getActiveElement(root))) {
					ui_a11y.FocusNavigator.focusContainer(root, {
						preventScroll: true
					});
					this.focusRestoreRequest = {
						mailboxId: this.avatar.mailboxId,
						requestId: this.avatar.requestId
					};
				}
			},
			cancelFocusRestore() {
				this.focusRestoreRequest = null;
			},
			onRootFocusOut(event) {
				if (event.target === event.currentTarget) {
					this.cancelFocusRestore();
				}
			},
			isFocusRestoreCurrent(request) {
				return !this.disposed && !this.disabled && request.mailboxId === this.avatar.mailboxId && request.requestId === this.avatar.requestId;
			},
			restoreFocus() {
				const request = this.focusRestoreRequest;
				if (!request || this.avatar.loading) {
					return;
				}
				this.cancelFocusRestore();
				const root = this.$refs.avatar;
				if (this.isFocusRestoreCurrent(request) && root?.isConnected && ui_a11y.FocusNavigator.getActiveElement(root) === root) {
					const actions = this.$refs.actions;
					const scope = actions?.querySelector('button') ? actions : root;
					ui_a11y.FocusNavigator.focusFirst(scope, {
						preventScroll: true
					});
				}
			},
			async createUploader() {
				if (this.editorState !== 'idle' || !this.avatar.mailboxId) {
					return;
				}
				this.editorState = 'pending';
				const stack = await loadUploaderStack().catch(() => null);
				if (!stack) {
					this.editorState = 'failed';
					return;
				}
				if (this.disposed || !this.canEdit || !this.avatar.mailboxId) {
					this.editorState = 'idle';
					return;
				}
				const uploader = new stack.Uploader({
					controller: 'mail.fileUploader.mailboxAvatarUploaderController',
					controllerOptions: {
						mailboxId: this.avatar.mailboxId
					},
					multiple: false,
					allowReplaceSingle: true,
					acceptedFileTypes: ['image/jpeg', 'image/png'],
					acceptOnlyImages: true,
					maxFileSize: 5 * 1024 * 1024,
					imageMaxFileSize: 5 * 1024 * 1024,
					imageMaxWidth: 4096,
					imageMaxHeight: 4096,
					imagePreviewWidth: 300,
					imagePreviewHeight: 300,
					imagePreviewUpscale: false,
					events: {
						[stack.UploaderEvent.BEFORE_FILES_ADD]: this.handleBeforeFilesAdd,
						[stack.UploaderEvent.FILE_ADD_START]: this.handleFileAdd,
						[stack.UploaderEvent.FILE_STATE_CHANGE]: this.handleFileChange,
						[stack.UploaderEvent.FILE_COMPLETE]: this.handleFileChange,
						[stack.UploaderEvent.FILE_ERROR]: this.handleFileChange,
						[stack.UploaderEvent.FILE_REMOVE]: this.handleFileRemove,
						[stack.UploaderEvent.BEFORE_BROWSE]: this.handleBeforeBrowse,
						[stack.UploaderEvent.ERROR]: this.handleUploaderError
					}
				});
				uploader.addFilter(stack.FilterType.VALIDATION, createPixelFilter(stack, uploader));
				this.uploaderStack = ui_vue3.markRaw(stack);
				this.adapter = ui_vue3.markRaw(new stack.VueUploaderAdapter(uploader));
				this.editorState = 'ready';
			},
			bindBrowseButton() {
				const node = this.$refs.selectButton;
				if (!node || !this.adapter || this.browseNode === node) {
					return;
				}
				this.unbindBrowseButton();
				this.adapter.getUploader().assignBrowse(node);
				this.browseNode = ui_vue3.markRaw(node);
			},
			unbindBrowseButton() {
				if (this.browseNode) {
					this.adapter?.getUploader().unassignBrowse(this.browseNode);
					this.browseNode = null;
				}
			},
			handleBeforeBrowse(event) {
				if (this.controlsDisabled || !this.canEdit || this.disposed) {
					event.preventDefault();
				}
			},
			onPreviewError(event) {
				const url = event.target?.src ?? '';
				if (!this.disposed && url) {
					this.$emit('image-error', url);
				}
			},
			handleBeforeFilesAdd(event) {
				if (this.controlsDisabled || !this.canEdit || this.disposed) {
					event.preventDefault();
				}
			},
			handleFileAdd(event) {
				this.activeFileId = event.getData().file.getId();
				this.handleFileChange(event);
			},
			handleFileChange(event) {
				const stack = this.uploaderStack;
				const file = event.getData().file;
				if (this.disposed || !stack || file.getId() !== this.activeFileId) {
					return;
				}
				const status = file.getStatus();
				const failed = status === stack.FileStatus.LOAD_FAILED || status === stack.FileStatus.UPLOAD_FAILED;
				const token = file.getServerFileId();
				const selection = {
					id: file.getId(),
					status: failed ? 'error' : 'loading',
					previewUrl: failed ? '' : file.getPreviewUrl() || '',
					uploadToken: null,
					error: file.getError()?.getMessage() || ''
				};
				if (status === stack.FileStatus.COMPLETE && main_core.Type.isStringFilled(token)) {
					selection.status = 'complete';
					selection.uploadToken = String(token);
				}
				this.$emit('selection-change', selection);
			},
			handleFileRemove(event) {
				const file = event.getData().file;
				file.revokeClientPreviewUrl();
				if (!this.disposed && file.getId() === this.activeFileId) {
					this.activeFileId = '';
					this.$emit('reset');
				}
			},
			handleUploaderError(event) {
				if (!this.disposed) {
					this.$emit('selection-change', {
						id: this.activeFileId,
						status: 'error',
						previewUrl: '',
						uploadToken: null,
						error: event.getData().error.getMessage()
					});
				}
			},
			clearSelection() {
				this.activeFileId = '';
				if (!this.adapter) {
					return;
				}
				const uploader = this.adapter.getUploader();
				uploader.getFiles().forEach(file => {
					uploader.removeFile(file, {
						removeFromServer: file.getId() !== this.avatar.preservedUploadId
					});
				});
			},
			handleReset() {
				if (!this.disabled) {
					this.holdFocus();
					this.clearSelection();
					this.$emit('reset');
					void this.$nextTick(this.restoreFocus);
				}
			},
			handleDelete() {
				if (!this.controlsDisabled) {
					this.holdFocus();
					this.clearSelection();
					this.$emit('delete');
					void this.$nextTick(this.restoreFocus);
				}
			},
			handleRetry() {
				if (this.disabled || this.avatar.loading) {
					return;
				}
				this.holdFocus();
				this.$emit('retry');
				if (this.focusRestoreRequest) {
					this.focusRestoreRequest.requestId = this.avatar.requestId;
				}
				void this.$nextTick(this.restoreFocus);
			}
		},
		template: `
		<div
			v-if="avatar.loading || avatar.error || canEdit"
			ref="avatar"
			class="mail-config-form__mailbox-avatar"
			data-test-id="mail_config-form__mailbox-avatar"
			data-testid="mail-avatar"
			@focusout="onRootFocusOut"
		>
			<TextSm>{{ loc('MAIL_CONFIG_FORM_AVATAR_TITLE') }}</TextSm>
			<div v-if="statusMessage" role="status" aria-live="polite" data-testid="mail-avatar-status">
				<TextXs>{{ statusMessage }}</TextXs>
			</div>
			<div v-if="avatar.error || imageUnavailable" role="alert" data-testid="mail-avatar-error">
				<TextXs className="mail-config-form__mailbox-avatar-error">
					{{ avatar.error || loc('MAIL_CONFIG_FORM_AVATAR_IMAGE_ERROR') }}
				</TextXs>
				<UiButton
					:dataset="{ testid: 'mail-avatar-retry' }"
					:text="loc('MAIL_CONFIG_FORM_AVATAR_RETRY')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.SMALL"
					:disabled="disabled || avatar.loading"
					@click="handleRetry"
				/>
			</div>
			<template v-if="canEdit">
				<div v-if="editorState === 'failed'" role="alert" data-testid="mail-avatar-editor-error">
					<TextXs className="mail-config-form__mailbox-avatar-error">
						{{ loc('MAIL_CONFIG_FORM_ERROR_AJAX') }}
					</TextXs>
				</div>
				<template v-else-if="adapter">
					<img
						v-if="showSavedImage"
						:key="avatar.confirmed.url"
						class="mail-config-form__mailbox-avatar-image"
						:src="avatar.confirmed.url"
						alt=""
						data-testid="mail-avatar-image"
						@error="onPreviewError"
					>
					<template v-else>
						<TextXs className="mail-config-form__mailbox-avatar-hint">
							{{ loc('MAIL_CONFIG_FORM_AVATAR_HINT') }}
						</TextXs>
						<TileWidgetComponent :uploaderAdapter="adapter" :widgetOptions="widgetOptions"/>
					</template>
					<div ref="selectButton" class="mail-config-form__mailbox-avatar-select">
						<UiButton
							:dataset="{ testid: 'mail-avatar-select' }"
							:text="loc('MAIL_CONFIG_FORM_AVATAR_SELECT')"
							:style="AirButtonStyle.PLAIN"
							:size="ButtonSize.SMALL"
							:disabled="controlsDisabled"
						/>
					</div>
				</template>
				<div v-if="avatar.selection?.error" role="alert" data-testid="mail-avatar-selection-error">
					<TextXs className="mail-config-form__mailbox-avatar-error">{{ avatar.selection.error }}</TextXs>
				</div>
				<div
					ref="actions"
					class="mail-config-form__mailbox-avatar-actions"
					data-test-id="mail_config-form__mailbox-avatar-actions"
				>
					<UiButton
						v-if="avatar.confirmed.hasAvatar && avatar.intent?.operation !== 'delete'"
						:dataset="{ testid: 'mail-avatar-delete' }"
						:text="loc('MAIL_CONFIG_FORM_AVATAR_DELETE')"
						:style="AirButtonStyle.PLAIN"
						:size="ButtonSize.SMALL"
						:disabled="controlsDisabled"
						@click="handleDelete"
					/>
					<UiButton
						v-if="avatar.intent"
						:dataset="{ testid: 'mail-avatar-reset' }"
						:text="loc('MAIL_CONFIG_FORM_AVATAR_RESET')"
						:style="AirButtonStyle.PLAIN"
						:size="ButtonSize.SMALL"
						:disabled="disabled"
						@click="handleReset"
					/>
				</div>
			</template>
		</div>
	`
	});

	const SmtpSettings = ui_vue3.defineComponent({
		name: 'smtp-settings',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			BInput: ui_system_input_vue.BInput,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		setup() {
			return {
				state: useFormState(),
				loc,
				InputSize: ui_system_input.InputSize,
				InputDesign: ui_system_input.InputDesign
			};
		},
		props: {
			passwordPlaceholder: {
				type: String,
				default: ''
			},
			connectionSettingsLocked: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			isEditMode() {
				return this.state.mode === 'edit';
			},
			credentialsReadOnly() {
				return this.connectionSettingsLocked || this.state.migrationActive;
			},
			isOAuthService() {
				return Boolean(this.state.service?.oauth) || Boolean(this.state.connection.isOAuth);
			},
			outline() {
				return ui_iconSet_api_vue.Outline;
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					showStateTitle: false,
					useAirDesign: true
				};
			},
			credentialsAreExternal() {
				return Boolean(this.state.service?.externalCredentials);
			},
			showServerFields() {
				return !this.credentialsAreExternal && !this.state.service?.smtp?.server;
			},
			showLoginField() {
				return !this.credentialsAreExternal && !this.isOAuthService && !this.state.service?.smtp?.login;
			},
			showPasswordField() {
				return !this.credentialsAreExternal && !this.isOAuthService && !this.state.service?.smtp?.password;
			},
			smtpPortModel: {
				get() {
					return this.state.smtp.port?.toString() ?? '';
				},
				set(value) {
					const port = parseInt(value, 10);
					this.state.smtp.port = Number.isNaN(port) ? null : port;
				}
			},
			limitModel: {
				get() {
					return this.state.smtp.limit?.toString() ?? '';
				},
				set(value) {
					const limit = parseInt(value, 10);
					this.state.smtp.limit = Number.isNaN(limit) ? null : limit;
				}
			}
		},
		methods: {
			toggleSmtp() {
				if (!this.credentialsReadOnly) {
					this.state.smtp.enabled = !this.state.smtp.enabled;
				}
			},
			onSmtpLoginChange(value) {
				this.state.smtp.login = value;
				this.state.fieldSyncFlags.smtpLoginManual = true;
			},
			onSmtpPasswordChange(value) {
				this.state.smtp.password = value;
				this.state.fieldSyncFlags.smtpPasswordManual = true;
			}
		},
		template: `
		<div
			class="mail-config-form__section"
			data-test-id="mail_config-form__smtp-section"
		>
			<div class="mail-config-form__section-header" data-test-id="mail_config-form__smtp-header">
				<div class="mail_massconnect__integration-block_icon --mail"></div>
				<div class="mail-config-form__section-title-block --centered">
					<HeadlineSm>{{ loc('MAIL_CONFIG_FORM_SMTP_TITLE') }}</HeadlineSm>
				</div>
				<div class="mail-config-form__switcher-container">
					<Switcher
						v-if="!credentialsReadOnly && (isEditMode || !isOAuthService)"
						:isChecked="state.smtp.enabled"
						:options="switcherOptions"
						@click="toggleSmtp"
						data-test-id="mail_config-form__smtp-switcher"
					/>
				</div>
			</div>
			<transition name="mail-config-form__collapse">
				<div
					class="mail-config-form__section-content"
					data-test-id="mail_config-form__smtp-content"
				>
					<div class="mail-config-form__checkbox-row">
						<input
							type="checkbox"
							id="mail-config-smtp-use-sender-name"
							class="mail-config-form__checkbox"
							v-model="state.mailbox.useSenderName"
							data-test-id="mail_config-form__smtp-use-sender-name_checkbox"
						/>
						<label class="mail-config-form__checkbox-label --smtp-settings" for="mail-config-smtp-use-sender-name">
							{{ loc('MAIL_CONFIG_FORM_USE_SENDER_NAME_LABEL') }}
						</label>
					</div>
					<transition name="mail-config-form__collapse">
						<div v-if="state.mailbox.useSenderName" class="mail-config-form__collapse-field">
							<BInput
								:size="InputSize.Md"
								:design="InputDesign.DEFAULT"
								v-model="state.mailbox.senderName"
								:placeholder="loc('MAIL_CONFIG_FORM_SENDER_NAME_PLACEHOLDER')"
								:stretched="true"
								data-test-id="mail_config-form__smtp-sender-name_field"
							/>
						</div>
					</transition>
					<template v-if="!credentialsReadOnly && state.smtp.enabled">
						<div class="mail-config-form__checkbox-row">
							<input
								type="checkbox"
								id="mail-config-smtp-use-limit"
								class="mail-config-form__checkbox"
								v-model="state.smtp.useLimit"
								data-test-id="mail_config-form__smtp-use-limit_checkbox"
							/>
							<label class="mail-config-form__checkbox-label --smtp-settings" for="mail-config-smtp-use-limit">
								{{ loc('MAIL_CONFIG_FORM_SMTP_LIMIT_LABEL') }}
							</label>
						</div>
						<transition name="mail-config-form__collapse">
							<div v-if="state.smtp.useLimit" class="mail-config-form__collapse-field">
								<BInput
									type="number"
									:size="InputSize.Md"
									:design="InputDesign.DEFAULT"
									v-model="limitModel"
									:stretched="true"
									:error="state.errors.smtpLimit"
									data-test-id="mail_config-form__smtp-limit_field"
								/>
							</div>
						</transition>
						<div
							class="mail-config-form__alert-container"
							v-if="showServerFields"
							data-test-id="mail_config-form__smtp-warning"
						>
							<span class="mail-config-form__alert-message">{{ loc('MAIL_CONFIG_FORM_SMTP_WARNING_ALERT') }}</span>
						</div>
						<div
							class="mail-config-form__input-group"
							v-if="showServerFields"
							data-test-id="mail_config-form__smtp-server-group"
						>
							<BInput
								class="mail-config-form__input-group_main"
								:label="loc('MAIL_CONFIG_FORM_SMTP_SERVER_LABEL')"
								:size="InputSize.Md"
								:design="InputDesign.DEFAULT"
								v-model="state.smtp.server"
								data-test-id="mail_config-form__smtp-server_field"
							/>
							<BInput
								class="mail-config-form__input-group_port"
								:label="loc('MAIL_CONFIG_FORM_SMTP_PORT_LABEL')"
								:aria-label="loc('MAIL_CONFIG_FORM_SMTP_PORT_LABEL')"
								type="number"
								:size="InputSize.Md"
								:design="InputDesign.DEFAULT"
								v-model="smtpPortModel"
								placeholder="587"
								data-test-id="mail_config-form__smtp-port_field"
							/>
						</div>
						<div class="mail-config-form__checkbox-row" v-if="showServerFields">
							<input
								type="checkbox"
								id="mail-config-smtp-ssl"
								class="mail-config-form__checkbox"
								v-model="state.smtp.ssl"
								data-test-id="mail_config-form__smtp-ssl_checkbox"
							/>
							<label class="mail-config-form__checkbox-label --smtp-settings" for="mail-config-smtp-ssl">
								{{ loc('MAIL_CONFIG_FORM_USE_SSL_LABEL') }}
							</label>
						</div>
						<BInput
							v-if="showLoginField"
							:label="loc('MAIL_CONFIG_FORM_SMTP_LOGIN_LABEL')"
							:size="InputSize.Md"
							:design="InputDesign.DEFAULT"
							:model-value="state.smtp.login"
							data-test-id="mail_config-form__smtp-login_field"
							@update:model-value="onSmtpLoginChange"
						/>
						<BInput
							v-if="showPasswordField"
							:label="loc('MAIL_CONFIG_FORM_SMTP_PASSWORD_LABEL')"
							type="password"
							:size="InputSize.Md"
							:design="InputDesign.DEFAULT"
							:model-value="state.smtp.password"
							:placeholder="isEditMode ? passwordPlaceholder : ''"
							data-test-id="mail_config-form__smtp-password_field"
							@update:model-value="onSmtpPasswordChange"
							:error="state.errors.smtpPassword"
						/>
						<div class="mail-config-form__checkbox-row" v-if="!isOAuthService">
							<input
								type="checkbox"
								id="mail-config-smtp-upload-outgoing"
								class="mail-config-form__checkbox"
								v-model="state.smtp.uploadOutgoing"
								data-test-id="mail_config-form__smtp-upload-outgoing_checkbox"
							/>
							<label class="mail-config-form__checkbox-label --smtp-settings" for="mail-config-smtp-upload-outgoing">
								{{ loc('MAIL_CONFIG_FORM_SMTP_UPLOAD_OUTGOING_LABEL') }}
							</label>
							<BIcon
								class="mail-config-form__checkbox-hint-icon"
								:name="outline.ALERT"
								:size="16"
								color="var(--ui-color-base-5)"
								v-hint="loc('MAIL_CONFIG_FORM_SMTP_UPLOAD_OUTGOING_HINT')"
							/>
						</div>
					</template>
				</div>
			</transition>
		</div>
	`
	});

	function getAccessUserSelectorItems(users) {
		return users.map(user => ({
			entityId: 'user',
			id: user.id,
			title: user.title,
			...(user.imageUrl ? {
				avatar: user.imageUrl
			} : {}),
			hidden: true
		}));
	}
	function resolvePopupTargetContainer$2(element) {
		return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
	}
	const AccessSharing = ui_vue3.defineComponent({
		name: 'access-sharing',
		components: {
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			users: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				state: useFormState(),
				loc
			};
		},
		data() {
			return {
				selectorInstance: null,
				warningIconName: ui_iconSet_api_vue.Set.WARNING
			};
		},
		computed: {
			canEditAccess() {
				return Boolean(this.state.permissions.canEditAccess);
			},
			isLimitReached() {
				return Boolean(this.state.permissions.sharedMailboxLimitReached);
			},
			isSelectorLocked() {
				return !this.canEditAccess || this.isLimitReached;
			},
			limitTitleText() {
				return this.isLimitReached ? main_core.Loc.getMessage('MAIL_CONFIG_FORM_ACCESS_LIMIT_TITLE') ?? '' : '';
			},
			descriptionText() {
				if (!this.canEditAccess) {
					return main_core.Loc.getMessage('MAIL_CONFIG_FORM_ACCESS_OWNER_ONLY') ?? '';
				}
				if (this.isLimitReached) {
					const limit = Number(this.state.permissions.sharedMailboxLimit ?? 0);
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_ACCESS_LIMIT_HINT', limit, {
						'#LIMIT#': String(limit)
					}) ?? '';
				}
				return main_core.Loc.getMessage('MAIL_CONFIG_FORM_ACCESS_DESCRIPTION') ?? '';
			},
			hintModifierClass() {
				return this.isLimitReached ? '--warning' : '';
			},
			showWarningIcon() {
				return this.isLimitReached;
			}
		},
		mounted() {
			const selectorContainer = this.$refs.selectorContainer;
			const ownerId = this.state.access.ownerId;
			const undeselectedItems = ownerId ? [['user', ownerId]] : [];
			const userOptions = mail_lib_entitySelector.getIntranetUserSelectorOptions();
			this.selectorInstance = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
				multiple: true,
				dialogOptions: {
					targetNode: selectorContainer,
					items: getAccessUserSelectorItems(this.users),
					popupOptions: {
						targetContainer: resolvePopupTargetContainer$2(selectorContainer)
					},
					context: 'MAIL_SHARE_ACCESS',
					preselectedItems: this.state.access.sharedWith.map(code => mail_lib_entitySelector.getSelectorItemByAccessCode(code)).filter(item => item !== null),
					undeselectedItems,
					entities: [{
						id: 'user',
						dynamicLoad: true,
						dynamicSearch: true,
						options: userOptions
					}, {
						id: 'department',
						dynamicLoad: true,
						dynamicSearch: true,
						options: {
							selectMode: 'usersAndDepartments',
							allowSelectRootDepartment: true,
							allowFlatDepartments: true,
							userOptions
						}
					}]
				},
				events: {
					onAfterTagAdd: () => this.updateAccess(),
					onAfterTagRemove: event => this.handleTagRemove(event)
				}
			}));
			this.selectorInstance.renderTo(this.$refs.selectorContainer);
			this.applyLockState();
		},
		watch: {
			isSelectorLocked() {
				this.applyLockState();
			}
		},
		beforeUnmount() {
			if (this.selectorInstance) {
				const dialog = this.selectorInstance.getDialog();
				if (dialog) {
					dialog.destroy();
				}
			}
		},
		methods: {
			handleTagRemove(event) {
				const tag = event.getData().tag;
				const dialog = this.selectorInstance?.getDialog();
				const item = dialog?.getItem({
					id: tag.getId(),
					entityId: tag.getEntityId()
				});
				if (item?.isHidden()) {
					dialog?.removeItem(item);
				}
				this.updateAccess();
			},
			updateAccess() {
				if (!this.selectorInstance) {
					return;
				}
				this.state.access.sharedWith = this.selectorInstance.getTags().map(tag => mail_lib_entitySelector.getAccessCodeBySelectorTag(tag)).filter(code => code !== null);
			},
			applyLockState() {
				if (!this.selectorInstance) {
					return;
				}
				this.$nextTick(() => {
					if (!this.selectorInstance) {
						return;
					}
					if (this.isSelectorLocked) {
						this.selectorInstance.lock();
					} else {
						this.selectorInstance.unlock();
					}
				});
			}
		},
		template: `
		<div class="mail-config-form__section" data-test-id="mail_config-form__access-section">
			<div class="mail-config-form__section-header">
				<div class="mail_massconnect__integration-block_icon --access"></div>
				<div class="mail-config-form__section-title-block">
					<HeadlineSm>{{ loc('MAIL_CONFIG_FORM_ACCESS_LABEL') }}</HeadlineSm>
				</div>
			</div>
			<div class="mail-config-form__section-content">
				<div
					class="mail-config-form__alert-container"
					:class="hintModifierClass"
					data-test-id="mail_config-form__access-hint"
				>
					<BIcon
						v-if="showWarningIcon"
						class="mail-config-form__alert-icon"
						:name="warningIconName"
						:size="20"
					/>
					<div class="mail-config-form__alert-body">
						<HeadlineSm v-if="limitTitleText" class="mail-config-form__alert-title">{{ limitTitleText }}</HeadlineSm>
						<span class="mail-config-form__alert-message" style="white-space: pre-line">{{ descriptionText }}</span>
					</div>
				</div>
				<div
					class="mail-config-form__selector-wrapper"
					:class="{ '--locked': isSelectorLocked }"
					data-test-id="mail_config-form__access-selector"
				>
					<div ref="selectorContainer"></div>
				</div>
			</div>
		</div>
	`
	});

	function resolvePopupTargetContainer$1(element) {
		return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
	}
	const MailboxOwnership = ui_vue3.defineComponent({
		name: 'mailbox-ownership',
		components: {
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		setup() {
			return {
				state: useFormState(),
				loc
			};
		},
		data() {
			return {
				selectorInstance: null
			};
		},
		beforeUnmount() {
			if (this.selectorInstance) {
				const dialog = this.selectorInstance.getDialog();
				if (dialog) {
					dialog.destroy();
				}
			}
		},
		mounted() {
			const selectorContainer = this.$refs.selectorContainer;
			const preselected = this.state.access.ownerId ? [['user', this.state.access.ownerId]] : [];
			this.selectorInstance = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
				multiple: false,
				dialogOptions: {
					targetNode: selectorContainer,
					popupOptions: {
						targetContainer: resolvePopupTargetContainer$1(selectorContainer)
					},
					context: 'MAIL_CHANGE_OWNER',
					preselectedItems: preselected,
					undeselectedItems: preselected,
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true,
							emailUsers: false
						}
					}],
					events: {
						'Item:onSelect': event => {
							const selectedItem = event.getData().item;
							const ownerId = parseInt(selectedItem.getId(), 10);
							this.state.access.ownerId = Number.isNaN(ownerId) ? null : ownerId;
							selectedItem.setDeselectable(false);
						}
					}
				}
			}));
			this.selectorInstance.renderTo(this.$refs.selectorContainer);
		},
		template: `
		<div class="mail-config-form__section" data-test-id="mail_config-form__owner-section">
			<div class="mail-config-form__section-header">
				<div class="mail_massconnect__integration-block_icon --mail"></div>
				<div class="mail-config-form__section-title-block">
					<HeadlineSm :accent="true">{{ loc('MAIL_CONFIG_FORM_OWNER_LABEL') }}</HeadlineSm>
				</div>
			</div>
			<div class="mail-config-form__section-content">
				<div ref="selectorContainer" data-test-id="mail_config-form__owner-selector"></div>
			</div>
		</div>
	`
	});

	function resolvePopupTargetContainer(element) {
		return element?.closest('.side-panel-content-container, .ui-slider-content-box') ?? document.body;
	}
	const ConnectionRequestOwner = ui_vue3.defineComponent({
		name: 'connection-request-owner',
		setup() {
			return {
				state: useFormState(),
				loc
			};
		},
		data() {
			return {
				selectorInstance: null
			};
		},
		beforeUnmount() {
			if (this.selectorInstance) {
				const dialog = this.selectorInstance.getDialog();
				if (dialog) {
					dialog.destroy();
				}
			}
		},
		mounted() {
			const requesterId = this.state.access.ownerId;
			if (!requesterId) {
				return;
			}
			const selectorContainer = this.$refs.selectorContainer;
			const preselected = [['user', requesterId]];
			this.selectorInstance = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
				multiple: false,
				showAddButton: false,
				dialogOptions: {
					targetNode: selectorContainer,
					popupOptions: {
						targetContainer: resolvePopupTargetContainer(selectorContainer)
					},
					context: 'MAIL_CLIENT_CONFIG_CONNECTION_REQUEST_OWNER',
					preselectedItems: preselected,
					undeselectedItems: preselected,
					entities: [{
						id: 'user',
						options: {
							inviteEmployeeLink: false,
							intranetUsersOnly: true,
							emailUsers: false
						}
					}]
				}
			}));
			this.selectorInstance.renderTo(selectorContainer);
		},
		template: `
		<div
			class="mail-config-form__owner-inline-field"
			data-test-id="mail_config-form__connection-request-owner"
		>
			<label class="mail-config-form__owner-inline-label">
				{{ loc('MAIL_CONFIG_FORM_CONNECTION_REQUEST_OWNER_LABEL') }}
			</label>
			<div
				class="mail-config-form__selector-wrapper --locked"
				data-test-id="mail_config-form__connection-request-owner-selector"
			>
				<div ref="selectorContainer"></div>
			</div>
		</div>
	`
	});

	const FormActions = ui_vue3.defineComponent({
		name: 'form-actions',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				state: useFormState(),
				loc,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle
			};
		},
		props: {
			isEditMode: {
				type: Boolean,
				default: false
			},
			saveDisabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['save', 'cancel'],
		methods: {
			onSave() {
				if (this.saveDisabled || this.state.loading || !this.state.isDataReady) {
					return;
				}
				this.$emit('save');
			},
			onCancel() {
				this.$emit('cancel');
			}
		},
		template: `
		<div class="mail-config-form__actions" data-test-id="mail_config-form__actions">
			<UiButton
				:text="isEditMode ? loc('MAIL_CONFIG_FORM_SAVE_BUTTON') : loc('MAIL_CONFIG_FORM_CONNECT_BUTTON')"
				:style="AirButtonStyle.FILLED"
				:loading="state.loading"
				:disabled="state.loading || !state.isDataReady || saveDisabled"
				:dataset="{ testId: 'mail_config-form__save_button' }"
				@click="onSave"
			/>
			<UiButton
				:text="loc('MAIL_CONFIG_FORM_CANCEL_BUTTON')"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:dataset="{ testId: 'mail_config-form__cancel_button' }"
				@click="onCancel"
			/>
		</div>
	`
	});

	const CONTROLLER = 'mail.api.mailboxconnecting';
	function runAction(action, data = {}) {
		return main_core.ajax.runAction(`${CONTROLLER}.${action}`, {
			data
		});
	}
	const Api = {
		getServices() {
			return runAction('getServices');
		},
		getMailbox(mailboxId) {
			return runAction('getMailbox', {
				mailboxId
			});
		},
		getMailboxAvatar(mailboxId) {
			return main_core.ajax.runAction('mail.api.mailboxavatar.get', {
				method: 'POST',
				data: {
					mailboxId
				}
			});
		},
		getOauthUser(mailboxId) {
			return runAction('getOauthUser', {
				mailboxId
			});
		},
		getOauthUrl(serviceName, type = 'web') {
			return runAction('getUrlOauth', {
				serviceName,
				type
			});
		},
		connectMailbox(data) {
			return runAction('connectMailbox', data);
		},
		connectMailboxByConnectionRequest(connectionRequestId, data) {
			return runAction('connectMailboxByConnectionRequest', {
				connectionRequestId,
				...data
			});
		},
		updateMailbox(mailboxId, data) {
			return main_core.ajax.runAction(`${CONTROLLER}.updateMailbox`, {
				method: 'POST',
				json: {
					mailboxId,
					...data
				}
			});
		},
		updateGeneralSettings(params) {
			return main_core.ajax.runAction(`${CONTROLLER}.updateGeneralSettings`, {
				method: 'POST',
				json: params
			});
		},
		deleteMailbox(mailboxId) {
			return runAction('deleteMailbox', {
				mailboxId
			});
		},
		checkEmailAvailability(params) {
			return runAction('checkEmailAvailability', params);
		},
		syncMailbox(id) {
			return runAction('syncMailbox', {
				id
			});
		}
	};

	function resolveYesNoFlag(value) {
		return value === true || value === 'Y';
	}
	function normalizeLeadCreationAddresses(rawValue) {
		if (Array.isArray(rawValue)) {
			return rawValue.join('\n');
		}
		if (typeof rawValue !== 'string' || rawValue.length === 0) {
			return '';
		}
		return rawValue.split(/[,\n]/).map(item => item.trim()).filter(Boolean).join('\n');
	}
	function mapResponsibleQueue(crm) {
		const crmUsers = crm.config?.crm_lead_resp_users ?? [];
		const crmUserMap = new Map(crmUsers.map(item => [item.id, item.title]));
		const ids = crm.leadResp ?? crm.config?.crm_lead_resp ?? [];
		return ids.map(id => ({
			id,
			entityId: 'user',
			name: crmUserMap.get(id) ?? ''
		}));
	}
	function mapMailboxCrmOptionsToStatePatch(crm, currentState) {
		const config = crm.config ?? {};
		const syncDays = crm.syncDays ?? config.crm_sync_days;
		const incomingEntity = crm.newEntityIn ?? config.crm_new_entity_in ?? '';
		const outgoingEntity = crm.newEntityOut ?? config.crm_new_entity_out ?? '';
		const leadSource = crm.leadSource ?? config.crm_lead_source;
		const publicFlag = crm.public ?? config.crm_public;
		const enabled = resolveYesNoFlag(crm.enabled);
		return {
			enabled,
			sync: syncDays === null || syncDays === undefined ? {
				...currentState.sync
			} : {
				enabled: true,
				periodValue: String(syncDays)
			},
			assignKnownClientEmails: resolveYesNoFlag(publicFlag),
			vcf: config.crm_vcf === undefined ? currentState.vcf : resolveYesNoFlag(config.crm_vcf),
			incoming: enabled ? {
				enabled: Boolean(incomingEntity),
				createAction: incomingEntity || currentState.incoming.createAction
			} : {
				...currentState.incoming
			},
			outgoing: enabled ? {
				enabled: Boolean(outgoingEntity),
				createAction: outgoingEntity || currentState.outgoing.createAction
			} : {
				...currentState.outgoing
			},
			source: leadSource || currentState.source,
			leadCreationAddresses: normalizeLeadCreationAddresses(crm.newLeadFor ?? config.crm_new_lead_for),
			responsibleQueue: mapResponsibleQueue(crm)
		};
	}

	const EMAIL_ATOM = "[=a-z0-9_+~'!$&*^`|#%/?{}-]";
	const EMAIL_REGEX = new RegExp(`^\\s*${EMAIL_ATOM}+(\\.${EMAIL_ATOM}+)*@([a-z0-9-]+\\.)+[a-z0-9-]{2,20}\\s*$`, 'i');
	const HOSTNAME_REGEX = /^\s*((?:http|https|ssl|tls|imap|smtp):\/\/)?([\dA-Za-z](-*[\dA-Za-z])*\.?)+\s*$/i;
	const LINK_REGEX = /^\s*(https?:\/\/)?([\dA-Za-z](-*[\dA-Za-z])*\.?)+(:\d+)?\/?.*$/i;
	function validateEmail(email) {
		return EMAIL_REGEX.test(email);
	}
	function validateHostname(hostname) {
		return HOSTNAME_REGEX.test(hostname);
	}
	function validateLink(link) {
		return LINK_REGEX.test(link);
	}
	function validatePort(port) {
		const portNum = parseInt(String(port), 10);
		return portNum >= 1 && portNum <= 65535;
	}
	function validateSmtpPassword(password) {
		if (password.startsWith('^')) {
			return false;
		}
		return !password.includes('\0');
	}
	function validateForm(state) {
		const errors = {};
		if (state.mode === 'create') {
			if (!state.connection.email || !validateEmail(state.connection.email)) {
				errors.email = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_EMAIL') ?? '';
			}
			if (!state.connection.isOAuth) {
				if (!state.connection.password) {
					errors.password = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_EMPTY_PASSWORD') ?? '';
				}
				if (!state.connection.login && !state.connection.email) {
					errors.login = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_EMPTY_LOGIN') ?? '';
				}
			}
		}
		if (state.connection.server && !validateHostname(state.connection.server)) {
			errors.server = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SERVER') ?? '';
		}
		if (state.connection.port && !validatePort(state.connection.port)) {
			errors.port = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_PORT') ?? '';
		}
		if (state.mailbox.link && !validateLink(state.mailbox.link)) {
			errors.link = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_LINK') ?? '';
		}
		if (state.smtp.enabled) {
			if (state.smtp.server && !validateHostname(state.smtp.server)) {
				errors.smtpServer = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SERVER') ?? '';
			}
			if (state.smtp.port && !validatePort(state.smtp.port)) {
				errors.smtpPort = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_PORT') ?? '';
			}
			if (state.smtp.password && !validateSmtpPassword(state.smtp.password)) {
				errors.smtpPassword = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SMTP_PASSWORD') ?? '';
			}
			if (state.smtp.useLimit) {
				const limit = Number(state.smtp.limit);
				if (!Number.isFinite(limit) || limit <= 0) {
					errors.smtpLimit = main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_INVALID_SMTP_LIMIT') ?? '';
				}
			}
		}
		return errors;
	}

	const HELPDESK_ARTICLE_ID = '19083990';
	const LOCALES = {
		oauth: {
			title: 'MAIL_CONFIG_FORM_SYNC_FAILED_OAUTH_TOUR_TITLE',
			text: 'MAIL_CONFIG_FORM_SYNC_FAILED_OAUTH_TOUR_TEXT'
		},
		password: {
			title: 'MAIL_CONFIG_FORM_SYNC_FAILED_PASSWORD_TOUR_TITLE',
			text: 'MAIL_CONFIG_FORM_SYNC_FAILED_PASSWORD_TOUR_TEXT'
		}
	};
	function findTargetElement(selector) {
		if (!selector) {
			return null;
		}
		try {
			return document.querySelector(selector);
		} catch {
			return null;
		}
	}
	function buildStep(mode, selector) {
		const locales = LOCALES[mode];
		return {
			target: selector,
			title: main_core.Loc.getMessage(locales.title) ?? '',
			text: main_core.Loc.getMessage(locales.text) ?? '',
			position: 'bottom',
			article: HELPDESK_ARTICLE_ID
		};
	}
	function showSyncFailureGuide(options) {
		if (!findTargetElement(options.targetSelector)) {
			return null;
		}
		const guide = new ui_tour.Guide({
			id: `mail-config-form-sync-failed-${options.mode}-tour`,
			simpleMode: true,
			steps: [buildStep(options.mode, options.targetSelector)]
		});
		guide.start();
		return guide;
	}
	function showOauthDeniedGuide(options) {
		if (!findTargetElement(options.targetSelector)) {
			return null;
		}
		const guide = new ui_tour.Guide({
			id: 'mail-config-form-oauth-denied-tour',
			simpleMode: true,
			steps: [{
				target: options.targetSelector,
				title: options.title,
				text: options.text,
				position: 'bottom',
				article: HELPDESK_ARTICLE_ID
			}]
		});
		guide.start();
		return guide;
	}

	function showProviderRestrictionPopup(providerName, onConfirm) {
		const replace = {
			'#PROVIDER#': providerName
		};
		const message = key => main_core.Loc.getMessage(key, replace) ?? '';
		const content = main_core.Tag.render`
		<div class="mail-provider-restriction-popup__content">
			<div class="mail-provider-restriction-popup__icon"></div>
			<div class="mail-provider-restriction-popup__title">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_TITLE')}</div>
			<p class="mail-provider-restriction-popup__text">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_TEXT_1')}</p>
			<p class="mail-provider-restriction-popup__text">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_TEXT_2')}</p>
			<div class="mail-provider-restriction-popup__subtitle">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_WHAT_TODO')}</div>
			<ul class="mail-provider-restriction-popup__list">
				<li>${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_STEP_1')}</li>
				<li>${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_STEP_2')}</li>
			</ul>
			<p class="mail-provider-restriction-popup__note">${message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_NOTE')}</p>
		</div>
	`;
		let box;
		const okButton = new ui_buttons.Button({
			text: message('MAIL_CONFIG_FORM_PROVIDER_RESTRICTION_OK'),
			useAirDesign: true,
			style: ui_buttons.AirButtonStyle.FILLED,
			onclick: () => {
				box.close();
				onConfirm?.();
				return {};
			}
		});
		box = new ui_dialogs_messagebox.MessageBox({
			message: content,
			minWidth: 620,
			maxWidth: 620,
			buttons: [okButton],
			popupOptions: {
				className: 'mail-provider-restriction-popup'
			}
		});
		box.show();
	}

	const PROVIDER_ACTION_GUIDE_TARGET = '[data-id="mail-config-form-provider-action"]';
	const PROVIDER_REAUTHORIZATION_GUIDE_TARGET = '[data-id="mail-config-form-provider-reauthorization"]';
	const SYNC_FAILURE_GUIDE_TARGETS = {
		oauth: PROVIDER_REAUTHORIZATION_GUIDE_TARGET,
		password: '[data-id="mail-config-form-password-field"]'
	};
	const OAUTH_DENIED_ADMIN_CONSENT_SCENARIO = 'admin_consent';
	const AVATAR_UPLOAD_REFUSAL_CODES = new Set(['MAIL_AVATAR_UPLOAD_INVALID', 'MAIL_AVATAR_FORMAT_INVALID', 'MAIL_AVATAR_IMAGE_INVALID', 'MAIL_AVATAR_LIMIT_EXCEEDED']);
	async function notifyFallback(text) {
		const topBX = getTopBX();
		let center = topBX?.UI?.Notification?.Center ?? getRootBX().UI?.Notification?.Center ?? null;
		if (!center) {
			const loader = topBX?.Runtime ?? getRootBX().Runtime;
			if (loader) {
				await loader.loadExtension('ui.notification');
			} else {
				await main_core.Runtime.loadExtension('ui.notification');
			}
			center = getTopBX()?.UI?.Notification?.Center ?? getRootBX().UI?.Notification?.Center ?? null;
		}
		center?.notify({
			content: text
		});
	}
	function toSpokenLines(title, text) {
		const plainText = text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
		return [title, ...plainText.split('\n')].flatMap(block => block.replace(/([.!?])\s+/g, '$1\n').split('\n')).map(line => line.trim()).filter(Boolean).map(line => /[.!?:;]$/.test(line) ? line : `${line}.`);
	}
	async function announceRefusal(title, text) {
		const lines = toSpokenLines(title, text);
		if (lines.length === 0) {
			return;
		}
		const topBX = getTopBX();
		let announcer = topBX?.UI?.Accessibility?.LiveAnnouncer ?? getRootBX().UI?.Accessibility?.LiveAnnouncer ?? null;
		if (!announcer) {
			const loader = topBX?.Runtime ?? getRootBX().Runtime;
			if (loader) {
				await loader.loadExtension('ui.a11y');
			} else {
				await main_core.Runtime.loadExtension('ui.a11y');
			}
			announcer = getTopBX()?.UI?.Accessibility?.LiveAnnouncer ?? getRootBX().UI?.Accessibility?.LiveAnnouncer ?? null;
		}
		const [reason, ...rest] = lines;
		announcer?.announce(reason, 'assertive');
		rest.forEach(line => announcer?.announce(line, 'polite'));
	}
	function sanitizeAnalyticsValue(value) {
		return value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50);
	}
	const PORTAL_EMAIL_CONFLICT_ERROR_CODE = 'EXISTS_ON_PORTAL_ERROR';
	const MAILBOX_LIST_PATH = '/mail/mailbox-list';
	const OAUTH_USER_PROFILE_WAIT_TIMEOUT = 3000;
	const providerDisplayNameMap = {
		gmail: 'Gmail',
		yandex: 'Яндекс',
		'mail.ru': 'Mail.ru',
		mailru: 'Mail.ru',
		'outlook.com': 'Outlook',
		outlook: 'Outlook',
		office365: 'Office365',
		exchangeOnline: 'Exchange',
		exchange: 'Exchange',
		aol: 'Aol',
		yahoo: 'Yahoo!',
		icloud: 'iCloud'
	};
	function getRootBX() {
		return BX;
	}
	function getTopWindow() {
		return window.top ?? window;
	}
	function getTopBX() {
		return getTopWindow().BX;
	}
	function getCurrentSidePanel() {
		return getRootBX().SidePanel?.Instance;
	}
	function getTopSidePanel() {
		return getTopBX()?.SidePanel?.Instance;
	}
	function createEmptyErrors() {
		return {
			generalItems: []
		};
	}
	function normalizeCustomData(value) {
		if (value === null || value === undefined || value === '') {
			return null;
		}
		if (Array.isArray(value)) {
			return value.length > 0 ? value : null;
		}
		if (typeof value === 'object') {
			return Object.keys(value).length > 0 ? value : null;
		}
		return value;
	}
	function createGeneralErrorItem(message, customData = null, occupiedEmail = '') {
		return {
			message,
			customData: normalizeCustomData(customData),
			expanded: false,
			occupiedEmail
		};
	}
	function extractOccupiedEmail(error) {
		if (error.code !== PORTAL_EMAIL_CONFLICT_ERROR_CODE) {
			return '';
		}
		const email = error.customData?.email;
		return main_core.Type.isStringFilled(email) ? email : '';
	}
	function createServerErrorItem(error) {
		const occupiedEmail = extractOccupiedEmail(error);
		return createGeneralErrorItem(error.message || main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_GENERAL') || '',
		occupiedEmail === '' ? error.customData : null, occupiedEmail);
	}
	function mapOauthUser(user) {
		if (!user) {
			return null;
		}
		return {
			email: user.email ?? '',
			firstName: user.first_name ?? '',
			lastName: user.last_name ?? '',
			fullName: user.full_name ?? '',
			picture: user.image ?? ''
		};
	}
	function extractAjaxErrors(error) {
		const candidate = error?.errors;
		if (!Array.isArray(candidate)) {
			return [];
		}
		return candidate.filter(item => {
			return typeof item === 'object' && item !== null && 'message' in item;
		});
	}
	function isConnectionRequestResult(result) {
		return 'connectionRequestCompleted' in result;
	}
	function createConnectionSettingsSnapshot(state) {
		return {
			email: state.connection.email,
			login: state.connection.login,
			server: state.connection.server,
			port: state.connection.port,
			ssl: state.connection.ssl,
			serviceId: state.service?.id ?? null,
			oauthUid: state.connection.oauthUid,
			userPrincipalName: state.connection.userPrincipalName,
			password: state.connection.password,
			smtpEnabled: state.smtp.enabled,
			smtpServer: state.smtp.server,
			smtpPort: state.smtp.port,
			smtpSsl: state.smtp.ssl,
			smtpLogin: state.smtp.login,
			smtpPassword: state.smtp.password,
			smtpUseLimit: state.smtp.useLimit,
			smtpLimit: state.smtp.limit,
			uploadOutgoing: state.smtp.uploadOutgoing,
			ownerId: state.permissions.canChangeOwner ? state.access.ownerId : null
		};
	}
	const App = ui_vue3.defineComponent({
		name: 'mailbox-config-app',
		components: {
			ConnectionSettings,
			MicrosoftConnection,
			ProviderBadge,
			MailboxAvatar,
			SmtpSettings,
			CrmIntegration: mail_connecting_crmIntegration.CrmIntegration,
			CalendarIntegration: mail_connecting_calendarIntegration.CalendarIntegration,
			MailIntegration: mail_connecting_mailSyncSettings.MailIntegration,
			AccessSharing,
			MailboxOwnership,
			ConnectionRequestOwner,
			FormActions,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			BIcon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				state: useFormState(),
				loc,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				passwordPlaceholder: '••••••••••••',
				oauthUserProfileWaitTimeout: OAUTH_USER_PROFILE_WAIT_TIMEOUT,
				oauthPending: false,
				warningIconName: ui_iconSet_api_vue.Set.WARNING,
				boundSlider: null,
				onSliderMessage: null,
				onSliderClose: null,
				syncFailureGuide: null,
				lastMailSyncPeriodValue: '7',
				verifyEmailRequestSeq: 0,
				formDisposed: false,
				migrationStatusReady: false,
				connectionSettingsReady: false,
				migrationStatusRevision: -1,
				mailboxLoadSeq: 0,
				mailboxLoadRetryTimer: null,
				mailboxLoadRetryAttempts: 0,
				mailboxLoadFailed: false,
				mailboxDataVersion: 0,
				shareAccessUsers: [],
				connectionSettingsBaseline: null,
				migrationStateHolder: ui_vue3.markRaw({
					current: null
				}),
				migrationStateUnsubscribe: null,
				oauthPopupHolder: ui_vue3.markRaw({
					current: null
				}),
				oauthPopupWatcher: null,
				oauthUserProfileRequest: ui_vue3.markRaw({
					current: null
				})
			};
		},
		computed: {
			isEditMode() {
				return this.state.mode === 'edit';
			},
			connectionSettingsLocked() {
				return this.isEditMode && (!this.migrationStatusReady || !this.connectionSettingsReady || this.state.migrationActive);
			},
			isMicrosoftService() {
				const serviceName = this.state.service?.name;
				return typeof serviceName === 'string' && ['office365', 'exchangeOnline', 'outlook.com'].includes(serviceName);
			},
			showCrm() {
				return this.state.permissions.isCrmAvailable;
			},
			showCalendar() {
				return this.state.permissions.isCalendarAvailable;
			},
			isConnectionRequestMode() {
				return this.state.mode === 'create' && Number(this.state.connectionRequestId) > 0;
			},
			lastCheckText() {
				if (!this.isEditMode) {
					return '';
				}
				const date = this.state.lastMailCheck?.date;
				if (!date) {
					return main_core.Loc.getMessage('MAIL_CONFIG_FORM_LAST_CHECK_NO_DATA') ?? '';
				}
				return this.formatLastCheck(Number(date));
			},
			mailSyncModel: {
				get() {
					const messageMaxAge = this.state.mailbox.messageMaxAge;
					const enabled = messageMaxAge !== 0;
					return {
						sync: {
							enabled,
							periodValue: String(enabled ? messageMaxAge : this.lastMailSyncPeriodValue)
						}
					};
				},
				set(value) {
					if (!value?.sync) {
						return;
					}
					if (value.sync.enabled) {
						const parsed = parseInt(value.sync.periodValue, 10);
						const messageMaxAge = Number.isNaN(parsed) ? 7 : parsed;
						this.lastMailSyncPeriodValue = String(messageMaxAge);
						this.state.mailbox.messageMaxAge = messageMaxAge;
					} else {
						const parsed = parseInt(value.sync.periodValue, 10);
						if (!Number.isNaN(parsed) && parsed !== 0) {
							this.lastMailSyncPeriodValue = String(parsed);
						}
						this.state.mailbox.messageMaxAge = 0;
					}
				}
			},
			isOAuthService() {
				return Boolean(this.state.service?.oauth) || Boolean(this.state.connection.isOAuth);
			},
			isOAuthConnected() {
				return Boolean(this.state.connection.oauthUid);
			},
			providerIconKey() {
				const name = this.state.service?.name ?? 'other';
				switch (name) {
					case 'mail.ru':
					case 'mailru':
						return 'mailru';
					case 'outlook.com':
					case 'outlook':
						return 'outlook';
					case 'exchangeOnline':
					case 'exchange':
						return 'exchange';
					case 'ukr.net':
						return 'ukrnet';
					case 'imap':
						return 'other';
					default:
						return name;
				}
			},
			providerTitle() {
				const name = this.state.service?.name;
				if (!name || name === 'other' || name === 'imap') {
					return main_core.Loc.getMessage('MAIL_CONFIG_FORM_PROVIDER_TITLE_IMAP') ?? '';
				}
				if (name === 'mailhost') {
					return main_core.Loc.getMessage('MAIL_CONFIG_FORM_PROVIDER_TITLE_MAILHOST') ?? '';
				}
				const displayName = providerDisplayNameMap[name] ?? `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
				return main_core.Loc.getMessage('MAIL_CONFIG_FORM_PROVIDER_TITLE_PREFIXED', {
					'#NAME#': displayName
				}) ?? '';
			},
			providerEmail() {
				if (this.isEditMode || this.isOAuthService && this.isOAuthConnected) {
					return this.state.connection.email || '';
				}
				return '';
			},
			avatarSaveBlocked() {
				return isMailboxAvatarSaveBlocked(this.state);
			},
			providerAvatar() {
				const avatarUrl = this.isEditMode ? getMailboxAvatarUrl(this.state) : '';
				if (avatarUrl) {
					return avatarUrl;
				}
				if (this.isOAuthService && this.isOAuthConnected) {
					return this.state.connection.oauthUser?.picture || '';
				}
				return '';
			},
			generalErrorItems() {
				const items = this.state.errors.generalItems;
				return Array.isArray(items) ? items : [];
			},
			canViewMailboxList() {
				return this.state.permissions.canViewMailboxList;
			},
			providerButtonText() {
				if (this.connectionSettingsLocked) {
					return '';
				}
				if (this.isEditMode || this.isOAuthConnected) {
					return main_core.Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_DISCONNECT') ?? '';
				}
				if (!this.isOAuthService) {
					return '';
				}
				return main_core.Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_CONNECT') ?? '';
			},
			providerReauthorizationButtonText() {
				if (!this.isEditMode || !this.isOAuthService) {
					return '';
				}
				return main_core.Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_CONNECT') ?? '';
			}
		},
		watch: {
			'state.mailboxId': function () {
				if (this.formDisposed || !this.isEditMode) {
					return;
				}
				this.mailboxLoadSeq++;
				this.clearMailboxLoadRetry();
				this.unbindMigrationState();
				this.handleOauthAborted();
				this.closeSyncFailureGuide();
				this.migrationStatusReady = false;
				this.migrationStatusRevision = -1;
				this.connectionSettingsReady = false;
				this.connectionSettingsBaseline = null;
				this.mailboxDataVersion = 0;
				this.mailboxLoadFailed = false;
				this.mailboxLoadRetryAttempts = 0;
				this.state.isDataReady = false;
				this.state.migrationActive = false;
				this.state.generalSettingsBaseline = null;
				this.state.hasSourceGenerationId = false;
				this.state.sourceGenerationId = null;
				this.state.connection.oauthUser = null;
				this.state.connection.oauthUid = null;
				this.state.connection.userPrincipalName = null;
				this.oauthUserProfileRequest.current = null;
				this.bindMigrationState();
				void this.loadMailboxAvatar();
			}
		},
		mounted() {
			this.state.calendarSettings.enabled = true;
			if (this.isEditMode && this.state.mailboxId) {
				this.bindMigrationState();
				void this.loadMailboxAvatar();
			}
			window.addEventListener('online', this.recoverMailboxData);
			window.addEventListener('focus', this.recoverMailboxData);
			this.bindSidePanelListeners();
		},
		beforeUnmount() {
			this.disposeForm();
			main_core_events.EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
			main_core_events.EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
			this.stopOauthPopupWatcher();
			this.oauthPopupHolder.current = null;
			this.unbindSidePanelListeners();
			this.closeSyncFailureGuide();
		},
		methods: {
			getMailboxMigrationState(mailboxId) {
				return mail_migrationState.getMigrationState(mailboxId);
			},
			bindMigrationState() {
				const mailboxId = Number(this.state.mailboxId);
				if (!Number.isInteger(mailboxId) || mailboxId <= 0) {
					return;
				}
				this.unbindMigrationState();
				const migrationState = this.getMailboxMigrationState(mailboxId);
				this.migrationStateHolder.current = migrationState;
				this.migrationStateUnsubscribe = migrationState.subscribe(({
					active
				}) => {
					this.applyMigrationStatus(migrationState, active);
				});
				void this.initializeMigrationState();
			},
			async initializeMigrationState() {
				const migrationState = this.migrationStateHolder.current;
				if (!migrationState || this.formDisposed) {
					return;
				}
				this.state.loading = true;
				await migrationState.initialize();
				if (this.formDisposed || this.migrationStateHolder.current !== migrationState) {
					return;
				}
				if (!migrationState.isInitialized()) {
					this.state.loading = false;
					this.mailboxLoadFailed = true;
					return;
				}
				this.applyMigrationStatus(migrationState, migrationState.isActive());
			},
			applyMigrationStatus(migrationState, active) {
				if (this.formDisposed || this.migrationStateHolder.current !== migrationState || !migrationState.isInitialized() || this.migrationStatusRevision === migrationState.getRevision()) {
					return;
				}
				this.clearMailboxLoadRetry();
				this.mailboxLoadRetryAttempts = 0;
				this.mailboxLoadFailed = false;
				this.migrationStatusRevision = migrationState.getRevision();
				this.migrationStatusReady = true;
				this.state.migrationActive = active;
				this.connectionSettingsReady = false;
				this.mailboxLoadSeq++;
				this.closeSyncFailureGuide();
				if (active) {
					this.handleOauthAborted();
					if (this.state.isDataReady) {
						return;
					}
				}
				void this.loadMailboxData();
			},
			unbindMigrationState() {
				this.migrationStateUnsubscribe?.();
				this.migrationStateUnsubscribe = null;
				this.migrationStateHolder.current = null;
			},
			disposeForm() {
				this.formDisposed = true;
				resetMailboxAvatarIntent(this.state);
				this.state.avatar.saving = false;
				invalidateMailboxAvatarRead(this.state);
				this.clearMailboxLoadRetry();
				window.removeEventListener('online', this.recoverMailboxData);
				window.removeEventListener('focus', this.recoverMailboxData);
				this.mailboxLoadSeq++;
				this.unbindMigrationState();
			},
			formatLastCheck(timestamp) {
				const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
				if (diffSeconds < 60) {
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_SECONDS', diffSeconds, {
						'#COUNT#': String(diffSeconds)
					}) ?? '';
				}
				if (diffSeconds < 3600) {
					const minutes = Math.floor(diffSeconds / 60);
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_MINUTES', minutes, {
						'#COUNT#': String(minutes)
					}) ?? '';
				}
				if (diffSeconds < 86400) {
					const hours = Math.floor(diffSeconds / 3600);
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_HOURS', hours, {
						'#COUNT#': String(hours)
					}) ?? '';
				}
				const days = Math.floor(diffSeconds / 86400);
				return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_DAYS', days, {
					'#COUNT#': String(days)
				}) ?? '';
			},
			clearMailboxLoadRetry() {
				if (this.mailboxLoadRetryTimer !== null) {
					clearTimeout(this.mailboxLoadRetryTimer);
					this.mailboxLoadRetryTimer = null;
				}
			},
			recoverMailboxAvatar() {
				const avatar = this.state.avatar;
				if (avatar.saving || avatar.loading || !(avatar.needsRefresh || avatar.error)) {
					return;
				}
				void this.loadMailboxAvatar();
			},
			recoverMailboxData() {
				if (this.formDisposed) {
					return;
				}
				this.recoverMailboxAvatar();
				if (!this.mailboxLoadFailed || this.state.loading || this.state.isDataReady) {
					return;
				}
				if (!this.migrationStateHolder.current?.isInitialized()) {
					void this.initializeMigrationState();
					return;
				}
				this.mailboxLoadRetryAttempts = 0;
				void this.loadMailboxData();
			},
			async loadMailboxAvatar() {
				const savingCurrentMailbox = this.state.avatar.saving && this.state.avatar.mailboxId === this.state.mailboxId;
				if (this.formDisposed || !this.isEditMode || !this.state.permissions.isAvatarAvailable || savingCurrentMailbox && !this.state.avatar.needsRefresh) {
					return;
				}
				const mailboxId = this.state.mailboxId;
				const requestId = beginMailboxAvatarRead(this.state);
				if (!mailboxId) {
					invalidateMailboxAvatarRead(this.state);
					return;
				}
				try {
					const response = await Api.getMailboxAvatar(mailboxId);
					if (this.formDisposed) {
						return;
					}
					if (response.status !== 'success' || response.errors?.length) {
						throw response;
					}
					acceptMailboxAvatarRead(this.state, requestId, response.data);
				} catch (error) {
					if (!this.formDisposed) {
						const message = extractAjaxErrors(error)[0]?.message || loc('MAIL_CONFIG_FORM_AVATAR_READ_ERROR');
						rejectMailboxAvatarRead(this.state, requestId, message);
					}
				}
			},
			onAvatarSelectionChange(selection) {
				if (!this.formDisposed) {
					setMailboxAvatarSelection(this.state, selection);
				}
			},
			onAvatarDelete() {
				if (!this.formDisposed) {
					deleteMailboxAvatar(this.state);
				}
			},
			onAvatarReset() {
				if (!this.formDisposed && !this.state.loading) {
					resetMailboxAvatarIntent(this.state);
				}
			},
			onAvatarImageError(url) {
				if (!this.formDisposed && url === getMailboxAvatarUrl(this.state)) {
					this.state.avatar.imageErrorUrl = url;
				}
			},
			async loadMailboxData() {
				const mailboxId = this.state.mailboxId;
				const migrationState = this.migrationStateHolder.current;
				if (!mailboxId || !migrationState?.isInitialized() || this.formDisposed) {
					return;
				}
				this.clearMailboxLoadRetry();
				this.mailboxLoadFailed = false;
				const requestSeq = ++this.mailboxLoadSeq;
				const revision = migrationState.getRevision();
				const isCurrent = () => !this.formDisposed && this.state.mailboxId === mailboxId && this.mailboxLoadSeq === requestSeq && this.migrationStateHolder.current === migrationState && migrationState.getRevision() === revision;
				this.state.loading = true;
				this.state.isDataReady = false;
				this.connectionSettingsReady = false;
				try {
					const response = await Api.getMailbox(mailboxId);
					if (!isCurrent()) {
						return;
					}
					if (response.status !== 'success') {
						throw response;
					}
					this.mailboxLoadRetryAttempts = 0;
					this.state.errors = createEmptyErrors();
					this.state.migrationActive = this.state.migrationActive || response.data.migrationActive === true;
					this.mapMailboxData(response.data);
					this.mailboxDataVersion++;
					setSourceGeneration(this.state, response.data);
					setGeneralSettingsBaseline(this.state);
					this.connectionSettingsBaseline = createConnectionSettingsSnapshot(this.state);
					this.connectionSettingsReady = !this.state.migrationActive;
					if (this.connectionSettingsReady) {
						this.oauthUserProfileRequest.current = this.loadOauthUserProfile();
					}
				} catch (error) {
					if (isCurrent()) {
						this.mailboxLoadFailed = true;
						this.migrationStatusRevision = -1;
						this.onSaveError(error);
						if (this.mailboxLoadRetryAttempts < 3) {
							this.mailboxLoadRetryAttempts++;
							this.mailboxLoadRetryTimer = setTimeout(() => {
								this.mailboxLoadRetryTimer = null;
								if (isCurrent() && this.mailboxLoadFailed && !this.state.isDataReady) {
									void this.loadMailboxData();
								}
							}, 5000 * this.mailboxLoadRetryAttempts);
						}
					}
				} finally {
					if (isCurrent()) {
						this.state.loading = false;
					}
				}
			},
			async loadOauthUserProfile() {
				const mailboxId = this.state.mailboxId;
				const oauthUid = this.state.connection.oauthUid;
				if (!mailboxId || !this.state.connection.isOAuth || !oauthUid) {
					return;
				}
				const requestSeq = this.mailboxLoadSeq;
				const principalNameBeforeRequest = this.state.connection.userPrincipalName;
				try {
					const response = await Api.getOauthUser(mailboxId);
					if (this.formDisposed || mailboxId !== this.state.mailboxId || requestSeq !== this.mailboxLoadSeq || this.connectionSettingsLocked) {
						return;
					}
					this.applyOauthUserProfile(response.data, {
						oauthUid,
						principalName: principalNameBeforeRequest
					});
				} catch (error) {
					console.error('Failed to load OAuth user profile:', error);
				}
			},
			applyOauthUserProfile(profile, requested) {
				if (this.state.connection.oauthUid !== requested.oauthUid) {
					return;
				}
				if (profile === null) {
					return;
				}
				this.state.connection.oauthUser = mapOauthUser(profile);
				if (this.state.connection.userPrincipalName === requested.principalName) {
					this.state.connection.userPrincipalName = profile.userPrincipalName ?? '';
					if (this.connectionSettingsBaseline?.userPrincipalName === requested.principalName) {
						this.connectionSettingsBaseline.userPrincipalName = this.state.connection.userPrincipalName;
					}
				}
			},
			mapMailboxData(data) {
				this.state.connection.password = '';
				this.state.smtp.password = '';
				this.state.connection.email = data.imap.email || '';
				this.state.connection.login = data.imap.login || '';
				this.state.connection.server = data.imap.server || '';
				this.state.connection.port = Number(data.imap.port) || 993;
				this.state.connection.ssl = data.imap.ssl === 'Y';
				this.state.connection.isOAuth = Boolean(data.imap.isOAuth);
				this.state.connection.oauthUid = data.imap.oauthUid || null;
				this.state.connection.oauthUser = null;
				this.state.connection.userPrincipalName = null;
				this.state.smtp.enabled = data.smtp.enabled === 'Y';
				this.state.smtp.server = data.smtp.server || '';
				this.state.smtp.port = Number(data.smtp.port) || 587;
				this.state.smtp.ssl = data.smtp.ssl === 'Y';
				this.state.smtp.login = data.smtp.login || '';
				this.state.smtp.useLimit = Boolean(data.smtp.useLimit);
				this.state.smtp.limit = data.smtp.limit || 250;
				this.state.service = {
					...(this.state.service ?? {}),
					id: data.imap.serviceId,
					oauth: data.imap.isOAuth,
					name: data.service.name,
					type: data.service.type,
					link: data.service.link,
					externalCredentials: Boolean(data.service.externalCredentials),
					smtp: {
						server: data.service.smtpServer ?? this.state.service?.smtp?.server ?? '',
						port: this.state.service?.smtp?.port ?? '',
						login: Boolean(data.service.smtpLoginAsImap),
						password: Boolean(data.service.smtpPasswordAsImap)
					}
				};
				this.state.mailbox.link = data.mailbox?.link ?? data.service.link ?? '';
				this.state.mailbox.name = data.mailboxName || '';
				this.state.mailbox.senderName = data.senderName || '';
				this.state.mailbox.useSenderName = Boolean(data.useSenderName);
				this.state.smtp.uploadOutgoing = data.denyUpload !== true;
				this.state.calendarSettings.enabled = true;
				this.state.calendarSettings.autoAddEvents = data.iCalAccess === 'Y';
				if (data.crmOptions) {
					this.mapCrmData(data.crmOptions);
				}
				if (Array.isArray(data.shareAccess)) {
					this.state.access.sharedWith = data.shareAccess;
				}
				this.shareAccessUsers = Array.isArray(data.shareAccessUsers) ? data.shareAccessUsers : [];
				this.state.access.ownerId = data.userId || null;
				this.state.lastMailCheck = data.lastMailCheck || null;
				this.state.providerRestriction = data.providerRestriction ?? null;
				this.state.isDataReady = true;
				this.state.fieldSyncFlags.loginManual = true;
				this.state.fieldSyncFlags.nameManual = true;
				this.state.fieldSyncFlags.smtpLoginManual = true;
				this.state.fieldSyncFlags.smtpPasswordManual = true;
				void this.$nextTick(() => {
					this.triggerSyncFailureGuide();
				});
			},
			triggerSyncFailureGuide() {
				if (this.formDisposed || this.connectionSettingsLocked) {
					return;
				}
				const lastCheck = this.state.lastMailCheck;
				if (!lastCheck || lastCheck.date === null || lastCheck.isSuccess !== false) {
					return;
				}
				if (this.syncFailureGuide) {
					return;
				}
				const providerCode = this.state.providerRestriction;
				if (providerCode) {
					const providerName = main_core.Loc.getMessage(`MAIL_CONFIG_FORM_PROVIDER_NAME_${providerCode.toUpperCase()}`) ?? providerCode;
					this.sendProviderRestrictionAnalytics(providerCode, 'popup_view');
					showProviderRestrictionPopup(providerName, () => {
						this.sendProviderRestrictionAnalytics(providerCode, 'popup_ok_button');
					});
					return;
				}
				const mode = this.state.connection.isOAuth ? 'oauth' : 'password';
				const guide = showSyncFailureGuide({
					mode,
					targetSelector: SYNC_FAILURE_GUIDE_TARGETS[mode]
				});
				this.syncFailureGuide = guide ? ui_vue3.markRaw(guide) : null;
			},
			closeSyncFailureGuide() {
				this.syncFailureGuide?.close?.();
				this.syncFailureGuide = null;
			},
			mapCrmData(crm) {
				const mappedCrmSettings = mapMailboxCrmOptionsToStatePatch(crm, this.state.crmSettings);
				this.state.crmSettings.enabled = mappedCrmSettings.enabled;
				this.state.crmSettings.sync.enabled = mappedCrmSettings.sync.enabled;
				this.state.crmSettings.sync.periodValue = mappedCrmSettings.sync.periodValue;
				this.state.crmSettings.assignKnownClientEmails = mappedCrmSettings.assignKnownClientEmails;
				this.state.crmSettings.vcf = mappedCrmSettings.vcf;
				this.state.crmSettings.incoming.enabled = mappedCrmSettings.incoming.enabled;
				this.state.crmSettings.incoming.createAction = mappedCrmSettings.incoming.createAction;
				this.state.crmSettings.outgoing.enabled = mappedCrmSettings.outgoing.enabled;
				this.state.crmSettings.outgoing.createAction = mappedCrmSettings.outgoing.createAction;
				this.state.crmSettings.source = mappedCrmSettings.source;
				this.state.crmSettings.leadCreationAddresses = mappedCrmSettings.leadCreationAddresses;
				this.state.crmSettings.responsibleQueue = mappedCrmSettings.responsibleQueue;
			},
			buildCrmOptions() {
				if (!this.state.crmSettings.enabled) {
					return {
						enabled: 'N'
					};
				}
				const config = {};
				if (this.state.crmSettings.sync.enabled) {
					config.crm_sync_days = parseInt(this.state.crmSettings.sync.periodValue, 10) || 0;
				}
				if (this.state.crmSettings.assignKnownClientEmails) {
					config.crm_public = 'Y';
				}
				if (this.state.crmSettings.vcf) {
					config.crm_vcf = 'Y';
				}
				if (this.state.crmSettings.incoming.enabled) {
					config.crm_new_entity_in = this.state.crmSettings.incoming.createAction;
				}
				if (this.state.crmSettings.outgoing.enabled) {
					config.crm_new_entity_out = this.state.crmSettings.outgoing.createAction;
				}
				config.crm_lead_source = this.state.crmSettings.source;
				if (this.state.crmSettings.responsibleQueue.length > 0) {
					config.crm_lead_resp = this.state.crmSettings.responsibleQueue.map(item => Number(item.id));
				}
				if (this.state.crmSettings.leadCreationAddresses.length > 0) {
					config.crm_new_lead_for = this.state.crmSettings.leadCreationAddresses;
				}
				return {
					enabled: 'Y',
					config
				};
			},
			buildConnectionPayload() {
				const state = this.state;
				const payload = {
					email: state.connection.email,
					login: state.connection.login || state.connection.email,
					server: state.connection.server,
					port: String(state.connection.port ?? ''),
					ssl: state.connection.ssl,
					serviceId: state.service?.id ?? null,
					storageOauthUid: state.connection.oauthUid || '',
					useSmtp: state.smtp.enabled,
					serverSmtp: state.smtp.server,
					portSmtp: String(state.smtp.port ?? ''),
					sslSmtp: state.smtp.ssl,
					loginSmtp: state.smtp.login || state.connection.login || state.connection.email,
					useLimitSmtp: state.smtp.useLimit,
					limitSmtp: state.smtp.limit,
					uploadOutgoing: state.smtp.uploadOutgoing
				};
				if (state.connection.userPrincipalName !== null) {
					payload.userPrincipalName = state.connection.userPrincipalName;
				}
				return payload;
			},
			buildBasePayload() {
				const state = this.state;
				return {
					...this.buildConnectionPayload(),
					mailboxName: state.mailbox.name || state.connection.email,
					senderName: state.mailbox.senderName,
					useSenderName: state.mailbox.useSenderName,
					iCalAccess: state.calendarSettings.enabled && state.calendarSettings.autoAddEvents,
					crmOptions: this.buildCrmOptions(),
					link: state.mailbox.link,
					shareAccess: state.access.sharedWith
				};
			},
			buildCreatePayload() {
				const state = this.state;
				return {
					...this.buildBasePayload(),
					password: state.connection.password,
					passwordSMTP: state.smtp.password || state.connection.password,
					syncAfterConnection: true,
					messageMaxAge: state.mailbox.messageMaxAge,
					serviceConfig: {
						serviceType: 'imap',
						name: state.service?.name ?? 'other'
					}
				};
			},
			buildUpdatePayload(avatar) {
				const state = this.state;
				const payload = {
					...this.buildConnectionPayload(),
					...buildGeneralSettingsPatch(state),
					...(avatar ? {
						avatar
					} : {})
				};
				if (this.connectionSettingsLocked || this.formDisposed) {
					throw new Error(loc('MAIL_MIGRATION_CREDENTIALS_LOCKED'));
				}
				if (state.service?.externalCredentials) {
					['email', 'userPrincipalName', 'login', 'server', 'port', 'ssl', 'serviceId', 'storageOauthUid', 'serverSmtp', 'portSmtp', 'sslSmtp', 'loginSmtp'].forEach(field => {
						delete payload[field];
					});
				} else {
					if (state.connection.password && state.connection.password !== this.passwordPlaceholder) {
						payload.password = state.connection.password;
					}
					if (state.smtp.password && state.smtp.password !== this.passwordPlaceholder) {
						payload.passwordSMTP = state.smtp.password;
					}
				}
				if (state.permissions.canChangeOwner && state.access.ownerId) {
					payload.userIdToConnect = state.access.ownerId;
				}
				return {
					...payload,
					...getSourceGenerationPrecondition(state)
				};
			},
			async submitSave(onSubmit, avatarSnapshot = null) {
				if (this.isMicrosoftService && this.oauthUserProfileRequest.current) {
					let timeoutId = null;
					try {
						await Promise.race([this.oauthUserProfileRequest.current, new Promise(resolve => {
							timeoutId = setTimeout(resolve, this.oauthUserProfileWaitTimeout);
						})]);
					} finally {
						if (timeoutId !== null) {
							clearTimeout(timeoutId);
						}
					}
				}
				if (this.formDisposed) {
					return null;
				}
				if (this.state.mode === 'edit') {
					const mailboxId = this.state.mailboxId;
					if (!mailboxId) {
						throw new Error('Mailbox id is required in edit mode.');
					}
					if (onSubmit && !onSubmit()) {
						return null;
					}
					const payload = this.buildUpdatePayload(avatarSnapshot?.change);
					return this.submitMailboxUpdate(Api.updateMailbox(mailboxId, payload), avatarSnapshot);
				}
				const payload = this.buildCreatePayload();
				if (this.isConnectionRequestMode) {
					const response = await Api.connectMailboxByConnectionRequest(Number(this.state.connectionRequestId), payload);
					return response.data;
				}
				const response = await Api.connectMailbox(payload);
				return response.data;
			},
			hasConnectionSettingsChanges() {
				if (this.connectionSettingsLocked || !this.connectionSettingsBaseline) {
					return false;
				}
				const baseline = this.connectionSettingsBaseline;
				const current = createConnectionSettingsSnapshot(this.state);
				return Object.keys(current).some(key => current[key] !== baseline[key]);
			},
			hasPendingEditChanges() {
				return Object.keys(buildGeneralSettingsPatch(this.state)).length > 0 || this.hasConnectionSettingsChanges() || this.state.avatar.intent !== null;
			},
			async submitMailboxUpdate(request, snapshot) {
				if (snapshot?.change.operation === 'replace' && this.isCurrentSaveMailbox(snapshot.mailboxId) && isMailboxAvatarSaveCurrent(this.state, snapshot)) {
					this.state.avatar.preservedUploadId = snapshot.selectionId;
				}
				try {
					const response = await request;
					if (response.status !== 'success' || response.errors?.length) {
						throw response;
					}
					if (snapshot && this.isCurrentSaveMailbox(snapshot.mailboxId) && isMailboxAvatarSaveCurrent(this.state, snapshot)) {
						this.state.avatar.preservedUploadId = null;
					}
					return response.data;
				} catch (error) {
					throw await this.resolveAvatarSaveError(error, snapshot);
				}
			},
			async resolveAvatarSaveError(error, snapshot) {
				if (!snapshot || this.formDisposed || !isMailboxAvatarSaveCurrent(this.state, snapshot)) {
					return error;
				}
				const errors = extractAjaxErrors(error);
				const unknownResult = errors.length === 0 || errors.some(item => item.code === 'NETWORK_ERROR');
				if (!unknownResult) {
					this.state.avatar.preservedUploadId = null;
				}
				const refusal = errors.find(item => AVATAR_UPLOAD_REFUSAL_CODES.has(String(item.code)));
				if (refusal) {
					const reason = refusal.message || loc('MAIL_CONFIG_FORM_AVATAR_UPLOAD_RETRY');
					rejectMailboxAvatarUpload(this.state, snapshot, reason);
					return error;
				}
				const conflict = errors.some(item => item.code === 'MAIL_AVATAR_VERSION_CONFLICT');
				if (conflict || unknownResult) {
					requireMailboxAvatarRefresh(this.state);
					await this.loadMailboxAvatar();
				}
				if (unknownResult) {
					return {
						errors: [{
							message: loc('MAIL_CONFIG_FORM_AVATAR_SAVE_RESULT_UNKNOWN')
						}]
					};
				}
				return error;
			},
			async acceptAvatarSaveResult(snapshot, avatar) {
				if (!snapshot || this.formDisposed || !isMailboxAvatarSaveCurrent(this.state, snapshot)) {
					return;
				}
				if (acceptMailboxAvatarSave(this.state, snapshot, avatar)) {
					return;
				}
				requireMailboxAvatarRefresh(this.state);
				await this.loadMailboxAvatar();
			},
			async submitEditSave() {
				const mailboxId = this.state.mailboxId;
				if (!mailboxId || !this.migrationStatusReady || !this.state.isDataReady || this.formDisposed) {
					return null;
				}
				let sentPatch = buildGeneralSettingsPatch(this.state);
				const hasConnectionChanges = this.hasConnectionSettingsChanges();
				const sentAvatar = createMailboxAvatarSaveSnapshot(this.state);
				if (!this.hasPendingEditChanges()) {
					return null;
				}
				const requestSeq = this.mailboxLoadSeq;
				const dataVersion = this.mailboxDataVersion;
				let sentConnectionSettings = null;
				let result = null;
				if (hasConnectionChanges) {
					result = await this.submitSave(() => {
						if (this.formDisposed || this.connectionSettingsLocked || requestSeq !== this.mailboxLoadSeq) {
							return false;
						}
						sentPatch = buildGeneralSettingsPatch(this.state);
						sentConnectionSettings = createConnectionSettingsSnapshot(this.state);
						return true;
					}, sentAvatar);
				} else {
					result = await this.submitMailboxUpdate(Api.updateGeneralSettings({
						mailboxId,
						patch: sentPatch,
						...(sentAvatar ? {
							avatar: sentAvatar.change
						} : {})
					}), sentAvatar);
				}
				if (!result || this.formDisposed || mailboxId !== this.state.mailboxId) {
					return null;
				}
				await this.acceptAvatarSaveResult(sentAvatar, result.avatar);
				if (!this.isCurrentSaveMailbox(mailboxId)) {
					return null;
				}
				if (dataVersion !== this.mailboxDataVersion) {
					await this.loadMailboxData();
					return null;
				}
				acceptGeneralSettingsPatch(this.state, sentPatch);
				if (sentConnectionSettings) {
					this.connectionSettingsBaseline = sentConnectionSettings;
				}
				return result;
			},
			isCurrentSaveMailbox(mailboxId) {
				return !this.formDisposed && this.state.mailboxId === mailboxId;
			},
			async onSave() {
				if (this.formDisposed || this.oauthPending || this.state.loading || !this.state.isDataReady || isMailboxAvatarSaveBlocked(this.state) || this.isEditMode && !this.migrationStatusReady) {
					return;
				}
				const independentOnly = this.isEditMode && !this.hasConnectionSettingsChanges();
				const generalPatch = this.isEditMode ? buildGeneralSettingsPatch(this.state) : {};
				if (independentOnly && !this.hasPendingEditChanges()) {
					return;
				}
				const errors = independentOnly ? generalPatch.link && !validateLink(generalPatch.link) ? {
					link: loc('MAIL_CONFIG_FORM_ERROR_INVALID_LINK')
				} : {} : validateForm(this.state);
				if (Object.keys(errors).length > 0) {
					this.state.errors = {
						...createEmptyErrors(),
						...errors
					};
					return;
				}
				const saveMailboxId = this.state.mailboxId;
				this.state.loading = true;
				this.state.avatar.saving = true;
				this.state.errors = createEmptyErrors();
				try {
					const result = this.isEditMode ? await this.submitEditSave() : await this.submitSave();
					if (!result || !this.isCurrentSaveMailbox(saveMailboxId)) {
						return;
					}
					if (this.isEditMode && this.hasPendingEditChanges()) {
						return;
					}
					this.onSaveSuccess(result);
				} catch (error) {
					if (this.isCurrentSaveMailbox(saveMailboxId)) {
						this.onSaveError(error);
					}
				} finally {
					if (this.isCurrentSaveMailbox(saveMailboxId)) {
						this.state.loading = false;
						this.state.avatar.saving = false;
					}
				}
			},
			sendOauthDeniedAnalytics(errorCode) {
				const analytics = getRootBX().UI?.Analytics;
				if (!analytics?.sendData) {
					return;
				}
				analytics.sendData({
					tool: 'mail',
					event: this.isEditMode ? 'mailbox_edit' : 'mailbox_connect',
					type: this.state.service?.name ?? '',
					category: 'mail_general_ops',
					c_section: 'menu',
					status: 'error',
					p1: `oauthDenied_${OAUTH_DENIED_ADMIN_CONSENT_SCENARIO}`,
					p2: `errorCode_${sanitizeAnalyticsValue(errorCode)}`
				});
			},
			sendProviderRestrictionAnalytics(providerCode, element) {
				const analytics = getRootBX().UI?.Analytics;
				if (!analytics?.sendData) {
					return;
				}
				analytics.sendData({
					tool: 'mail',
					event: 'provider_restriction_notice',
					type: providerCode,
					category: 'mail_general_ops',
					c_section: 'mailbox_edit',
					c_element: element
				});
			},
			sendAnalytics(status) {
				const analytics = getRootBX().UI?.Analytics;
				if (!analytics?.sendData) {
					return;
				}
				const sharedCount = Array.isArray(this.state.access.sharedWith) ? this.state.access.sharedWith.length : 0;
				const isShared = sharedCount > 1;
				const isCrm = Boolean(this.state.crmSettings.enabled);
				const isIcal = Boolean(this.state.calendarSettings.enabled && this.state.calendarSettings.autoAddEvents);
				analytics.sendData({
					tool: 'mail',
					event: this.isEditMode ? 'mailbox_edit' : 'mailbox_connect',
					type: this.state.service?.name ?? '',
					category: 'mail_general_ops',
					c_section: 'menu',
					status,
					p1: `integrationCalendar_${isIcal ? 'true' : 'false'}`,
					p2: `integrationCRM_${isCrm ? 'true' : 'false'}`,
					p3: `shared_${isShared ? 'true' : 'false'}`
				});
			},
			onSaveSuccess(result) {
				this.sendAnalytics('success');
				const mailboxId = Number(result?.id) || 0;
				if (this.state.mode === 'edit') {
					if (mailboxId > 0) {
						this.postSliderMessage('mail-mailbox-config-success', {
							id: mailboxId,
							changed: this.state.changedDirs
						});
					}
					this.closeForm(mailboxId);
					return;
				}
				if (mailboxId <= 0) {
					this.closeForm(0);
					return;
				}
				if (isConnectionRequestResult(result) && result.connectionRequestCompleted) {
					this.postSliderMessage('mail-mailbox-connection-request-completed', {
						id: mailboxId
					});
					this.closeForm(mailboxId);
					return;
				}
				this.openDirsSlider(mailboxId);
			},
			onSaveError(error) {
				if (this.handleSmtpConfirm(error)) {
					return;
				}
				this.sendAnalytics('error');
				const serverErrors = extractAjaxErrors(error);
				if (serverErrors.length > 0) {
					this.state.errors.generalItems = [createServerErrorItem(serverErrors[0])];
				} else {
					this.state.errors.generalItems = [createGeneralErrorItem(main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_AJAX') ?? '')];
				}
				void this.$nextTick(() => {
					const el = this.$refs.errorAlert;
					el?.scrollIntoView({
						behavior: 'smooth',
						block: 'center'
					});
				});
			},
			handleSmtpConfirm(error) {
				const errors = extractAjaxErrors(error);
				const mainMailConfirm = getTopWindow().BXMainMailConfirm;
				if (errors.length !== 1 || errors[0].message !== 'MAIL_CLIENT_CONFIG_SMTP_CONFIRM' || !mainMailConfirm) {
					return false;
				}
				mainMailConfirm.showForm(() => {
					void this.onSave();
				}, {
					mode: 'confirm',
					data: {
						email: this.state.connection.email
					}
				});
				return true;
			},
			async onDelete() {
				if (this.connectionSettingsLocked || this.formDisposed) {
					return;
				}
				const mailboxId = this.state.mailboxId;
				if (!mailboxId) {
					return;
				}
				this.state.loading = true;
				this.state.errors.generalItems = [];
				try {
					await Api.deleteMailbox(mailboxId);
					if (this.formDisposed) {
						return;
					}
					this.postSliderMessage('mail-mailbox-config-delete', {
						id: mailboxId
					});
					this.closeForm(0);
				} catch (error) {
					if (!this.formDisposed) {
						this.onSaveError(error);
					}
				} finally {
					if (!this.formDisposed) {
						this.state.loading = false;
					}
				}
			},
			openMailboxListWithFilter(email) {
				const params = new URLSearchParams({
					EMAIL: email,
					apply_filter: 'Y'
				});
				getCurrentSidePanel()?.open(`${MAILBOX_LIST_PATH}?${params.toString()}`, {
					cacheable: false,
					data: {
						resetFilterOnClose: true
					}
				});
			},
			openDirsSlider(mailboxId) {
				const url = getRootBX().util.add_url_param(this.state.paths.configDirs || '/mail/config/dirs', {
					mailboxId,
					INIT: 'Y'
				});
				getCurrentSidePanel()?.open(url, {
					width: 640,
					cacheable: false,
					allowChangeHistory: false,
					events: {
						onClose: () => {
							this.closeForm(mailboxId);
							this.postSliderMessage('mail-mailbox-config-success', {
								id: mailboxId,
								changed: this.state.changedDirs
							});
						}
					}
				});
			},
			closeForm(id) {
				this.disposeForm();
				const slider = getTopSidePanel()?.getSliderByWindow?.(window) || getCurrentSidePanel()?.getTopSlider?.();
				if (slider) {
					slider.setCacheable(false);
					slider.close();
					return;
				}
				if (id > 0 && this.state.paths.messageList) {
					window.location.href = this.state.paths.messageList.replace('#id#', String(id)).replace('#start_sync_with_showing_stepper#', 'true');
					return;
				}
				if (this.state.paths.home) {
					window.location.href = this.state.paths.home;
				}
			},
			postSliderMessage(eventId, data) {
				getTopSidePanel()?.postMessage?.(window, eventId, data);
			},
			bindSidePanelListeners() {
				const onSliderMessage = event => {
					if (event.getEventId() === 'mail-mailbox-config-dirs-success') {
						this.state.changedDirs = Boolean(event.data?.changed);
					}
				};
				this.onSliderMessage = onSliderMessage;
				getRootBX().addCustomEvent('SidePanel.Slider:onMessage', onSliderMessage);
				const slider = getTopSidePanel()?.getSliderByWindow?.(window);
				if (slider) {
					this.boundSlider = slider;
					const onSliderClose = () => {
						this.disposeForm();
						this.postSliderMessage('mail-mailbox-config-close', {
							changed: this.state.changedDirs
						});
					};
					this.onSliderClose = onSliderClose;
					getRootBX().addCustomEvent(slider, 'SidePanel.Slider:onClose', onSliderClose);
				}
			},
			unbindSidePanelListeners() {
				if (this.onSliderMessage) {
					getRootBX().removeCustomEvent('SidePanel.Slider:onMessage', this.onSliderMessage);
					this.onSliderMessage = null;
				}
				if (this.boundSlider && this.onSliderClose) {
					getRootBX().removeCustomEvent(this.boundSlider, 'SidePanel.Slider:onClose', this.onSliderClose);
					this.boundSlider = null;
					this.onSliderClose = null;
				}
			},
			onCancel() {
				this.closeForm(0);
			},
			onProviderButtonClick() {
				if (this.state.loading || this.connectionSettingsLocked || this.formDisposed) {
					return;
				}
				if (this.isEditMode) {
					this.confirmDelete();
					return;
				}
				if (this.isOAuthConnected) {
					this.disconnectOAuth();
					return;
				}
				if (this.isOAuthService) {
					void this.startOAuth();
				}
			},
			onProviderReauthorizationButtonClick() {
				if (this.state.loading || this.connectionSettingsLocked || this.formDisposed || !this.isEditMode || !this.isOAuthService) {
					return;
				}
				void this.startOAuth();
			},
			confirmDelete() {
				ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('MAIL_CONFIG_FORM_DELETE_CONFIRM_TITLE') ?? '', null, messageBox => {
					messageBox.close();
					void this.onDelete();
				}, main_core.Loc.getMessage('MAIL_CONFIG_FORM_DELETE_CONFIRM_OK') ?? '', null, null, true);
			},
			async startOAuth() {
				if (this.oauthPending || this.state.loading || this.formDisposed || this.connectionSettingsLocked) {
					return;
				}
				const requestSeq = this.mailboxLoadSeq;
				const serviceName = this.state.service?.name;
				if (!serviceName) {
					return;
				}
				this.oauthPending = true;
				try {
					const response = await Api.getOauthUrl(serviceName);
					if (this.formDisposed || this.connectionSettingsLocked || requestSeq !== this.mailboxLoadSeq) {
						this.handleOauthAborted();
						return;
					}
					const url = response.data;
					if (!url) {
						this.handleOauthAborted();
						return;
					}
					const popup = getRootBX().util.popup(url, 800, 600);
					if (!popup) {
						this.handleOauthAborted();
						return;
					}
					this.oauthPopupHolder.current = popup;
					main_core_events.EventEmitter.subscribe('OnMailOAuthBCompleted', this.onOAuthCompleted, {
						compatMode: true
					});
					main_core_events.EventEmitter.subscribe('OnMailOAuthBError', this.onOAuthDenied, {
						compatMode: true
					});
					this.startOauthPopupWatcher();
				} catch (error) {
					this.handleOauthAborted();
					console.error('OAuth URL error:', error);
				}
			},
			startOauthPopupWatcher() {
				this.stopOauthPopupWatcher();
				this.oauthPopupWatcher = setInterval(() => {
					const popup = this.oauthPopupHolder.current;
					if (!popup || popup.closed) {
						this.handleOauthAborted();
					}
				}, 500);
			},
			stopOauthPopupWatcher() {
				if (this.oauthPopupWatcher !== null) {
					clearInterval(this.oauthPopupWatcher);
					this.oauthPopupWatcher = null;
				}
			},
			handleOauthAborted() {
				if (!this.oauthPending) {
					return;
				}
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
				this.oauthPending = false;
				this.oauthPopupHolder.current = null;
				this.stopOauthPopupWatcher();
			},
			onOAuthDenied(_uid, scenario, title, text, errorCode) {
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
				this.stopOauthPopupWatcher();
				this.oauthPopupHolder.current = null;
				this.oauthPending = false;
				if (this.formDisposed || this.connectionSettingsLocked) {
					return;
				}
				if (scenario === OAUTH_DENIED_ADMIN_CONSENT_SCENARIO) {
					this.sendOauthDeniedAnalytics(errorCode ?? '');
				}
				if (!text) {
					return;
				}
				this.closeSyncFailureGuide();
				announceRefusal(title ?? '', text).catch(error => {
					console.error('Mail: cannot announce the OAuth refusal', error);
				});
				const guide = showOauthDeniedGuide({
					targetSelector: this.isEditMode ? PROVIDER_REAUTHORIZATION_GUIDE_TARGET : PROVIDER_ACTION_GUIDE_TARGET,
					title: title ?? '',
					text
				});
				if (guide) {
					this.syncFailureGuide = ui_vue3.markRaw(guide);
					return;
				}
				notifyFallback(text).catch(error => {
					console.error('Mail: cannot show the OAuth refusal notification', error);
				});
			},
			onOAuthCompleted(uid, _url, user) {
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
				this.stopOauthPopupWatcher();
				this.oauthPopupHolder.current = null;
				this.oauthPending = false;
				if (this.formDisposed || this.connectionSettingsLocked || !uid) {
					return;
				}
				this.state.connection.oauthUid = uid;
				this.state.connection.isOAuth = true;
				if (!user) {
					return;
				}
				this.state.connection.oauthUser = mapOauthUser(user);
				this.state.connection.userPrincipalName = user.userPrincipalName || '';
				this.state.connection.oauthEmailNeedsConfirmation = false;
				this.state.connection.oauthEmailCheckStatus = 'idle';
				if (this.isEditMode) {
					return;
				}
				if (user.email) {
					this.state.connection.email = user.email;
				}
				if (user.emailIsIntended === true && user.email) {
					void this.verifyOauthEmail(user.email);
				}
			},
			async verifyOauthEmail(email) {
				const serviceId = Number(this.state.service?.id);
				const oauthUid = this.state.connection.oauthUid;
				if (!serviceId || !oauthUid || !email) {
					return;
				}
				if (this.state.connection.oauthEmailCheckStatus === 'checking') {
					return;
				}
				const sequence = ++this.verifyEmailRequestSeq;
				this.state.connection.oauthEmailCheckStatus = 'checking';
				try {
					const response = await Api.checkEmailAvailability({
						serviceId,
						email,
						oauthUid
					});
					if (sequence !== this.verifyEmailRequestSeq) {
						return;
					}
					if (response.data === true) {
						this.state.connection.email = email;
						this.state.connection.oauthEmailNeedsConfirmation = false;
						this.state.connection.oauthEmailCheckStatus = 'success';
						return;
					}
					this.state.connection.email = '';
					this.state.connection.oauthEmailNeedsConfirmation = true;
					this.state.connection.oauthEmailCheckStatus = 'error';
				} catch {
					if (sequence !== this.verifyEmailRequestSeq) {
						return;
					}
					this.state.connection.oauthEmailNeedsConfirmation = true;
					this.state.connection.oauthEmailCheckStatus = 'error';
				}
			},
			onOauthEmailBlur() {
				if (!this.state.connection.oauthEmailNeedsConfirmation) {
					return;
				}
				if (this.state.connection.oauthEmailCheckStatus === 'checking') {
					return;
				}
				const email = this.state.connection.email.trim();
				if (!email) {
					this.state.connection.oauthEmailCheckStatus = 'idle';
					return;
				}
				void this.verifyOauthEmail(email);
			},
			disconnectOAuth() {
				this.state.connection.oauthUid = null;
				this.state.connection.isOAuth = false;
				this.state.connection.oauthUser = null;
				this.state.connection.userPrincipalName = '';
				this.state.connection.oauthEmailNeedsConfirmation = false;
				this.state.connection.oauthEmailCheckStatus = 'idle';
			}
		},
		template: `
		<template v-if="state.isDataReady || mailboxDataVersion > 0">
			<div v-show="state.isDataReady" class="mail-config-form" data-test-id="mail_config-form__root">
				<div
					v-if="state.migrationActive"
					class="mail-config-form__alert-container --warning"
					data-test-id="mail_config-form__migration-warning"
					role="status"
					aria-atomic="true"
				>
					<BIcon
						class="mail-config-form__alert-icon"
						:name="warningIconName"
						:size="24"
					/>
					<span class="mail-config-form__alert-message">
						{{ loc('MAIL_MIGRATION_CREDENTIALS_LOCKED') }}
					</span>
				</div>
				<div
					class="mail-config-form__section"
					data-test-id="mail_config-form__connection-section"
				>
					<div class="mail-config-form__section-header">
						<div class="mail_massconnect__integration-block_icon --mail"></div>
						<div class="mail-config-form__section-title-block" :class="{ '--centered': !isEditMode }">
							<HeadlineSm>
								{{ loc('MAIL_CONFIG_FORM_SELECTED_CLIENT_TITLE') }}
							</HeadlineSm>
							<div
								v-if="isEditMode"
								class="mail-config-form__section-subtitle"
								data-test-id="mail_config-form__last-check"
							>
								{{ lastCheckText }}
							</div>
						</div>
					</div>
					<div class="mail-config-form__section-content">
						<ProviderBadge
							:icon-key="providerIconKey"
							:title="providerTitle"
							:email="providerEmail"
							:avatar="providerAvatar"
							:button-text="providerButtonText"
							:button-disabled="oauthPending || state.loading || connectionSettingsLocked"
							:secondary-button-text="providerReauthorizationButtonText"
							:secondary-button-disabled="oauthPending || state.loading || connectionSettingsLocked"
							@button-click="onProviderButtonClick"
							@secondary-button-click="onProviderReauthorizationButtonClick"
							@avatar-error="onAvatarImageError"
						/>
						<MailboxAvatar
							v-if="isEditMode && state.permissions.isAvatarAvailable"
							:key="state.mailboxId"
							:avatar="state.avatar"
							:disabled="state.loading || formDisposed"
							@selection-change="onAvatarSelectionChange"
							@delete="onAvatarDelete"
							@reset="onAvatarReset"
							@retry="loadMailboxAvatar"
							@image-error="onAvatarImageError"
						/>
						<ConnectionRequestOwner v-if="isConnectionRequestMode" />
						<ConnectionSettings
							v-if="isEditMode || !isOAuthService || isOAuthConnected"
							:password-placeholder="passwordPlaceholder"
							:connection-settings-locked="connectionSettingsLocked"
							@oauth-email-blur="onOauthEmailBlur"
						>
							<template #after-fields>
								<MailIntegration
									v-if="!isEditMode"
									:compact="true"
									:sync-period-options="state.settingsOptions.mailSync"
									v-model="mailSyncModel"
								/>
							</template>
						</ConnectionSettings>
						<MicrosoftConnection v-if="isMicrosoftService && !connectionSettingsLocked" />
					</div>
				</div>

				<MailboxOwnership v-if="isEditMode && state.permissions.canChangeOwner && !connectionSettingsLocked" />

				<SmtpSettings
					v-if="state.permissions.isSmtpAvailable"
					:connection-settings-locked="connectionSettingsLocked"
					:password-placeholder="passwordPlaceholder"
				/>

				<CrmIntegration
					v-if="showCrm"
					v-model="state.crmSettings"
					:can-edit-crm-integration="state.permissions.canEditCrm"
					:sync-period-options="state.settingsOptions.crmSync"
					:entity-options="state.settingsOptions.crmEntity"
					:source-options="state.settingsOptions.crmSource"
					:is-edit-mode="isEditMode"
					:show-vcf-option="true"
				/>

				<CalendarIntegration
					v-if="showCalendar"
					v-model="state.calendarSettings"
					:show-switcher="false"
				/>

				<AccessSharing :users="shareAccessUsers" />

				<div
					v-if="generalErrorItems.length > 0"
					ref="errorAlert"
					role="alert"
					class="mail-config-form__alert-container --danger"
					data-test-id="mail_config-form__error"
				>
					<BIcon
						class="mail-config-form__alert-icon"
						:name="warningIconName"
						:size="24"
					/>
					<div class="mail-config-form__alert-body">
						<div
							v-for="(item, index) in generalErrorItems"
							:key="index"
							class="mail-config-form__alert-message"
							:data-test-id="'mail_config-form__error-item_' + index"
						>
							<span>{{ item.message }}</span>
							<UiButton
								v-if="item.occupiedEmail && canViewMailboxList"
								class="mail-config-form__alert-action"
								:text="loc('MAIL_CONFIG_FORM_ERROR_FIND_MAILBOX')"
								:style="AirButtonStyle.PLAIN_ACCENT"
								:size="ButtonSize.EXTRA_SMALL"
								:dataset="{ testId: 'mail_config-form__error-find-mailbox_' + index }"
								@click="openMailboxListWithFilter(item.occupiedEmail)"
							/>
							<template v-if="item.customData">
								<button
									v-if="!item.expanded"
									type="button"
									class="mail-config-form__alert-toggle"
									@click="item.expanded = true"
									:data-test-id="'mail_config-form__error-details-toggle_' + index"
								>{{ loc('MAIL_CONFIG_FORM_ERROR_DETAILS') }}</button>
								<div
									v-else
									class="mail-config-form__alert-details"
									:data-test-id="'mail_config-form__error-details_' + index"
								>{{ item.customData }}</div>
							</template>
						</div>
					</div>
				</div>
			</div>
		</template>
			<div
				v-if="!state.isDataReady"
				class="mail-config-form --loading"
				data-test-id="mail_config-form__loader"
			>
				<div class="mail-config-form__loader"></div>
				<div v-if="generalErrorItems.length" class="mail-config-form__alert-message">
					{{ generalErrorItems[0].message }}
				</div>
			</div>
			<FormActions
				:is-edit-mode="isEditMode"
				:save-disabled="oauthPending || avatarSaveBlocked"
				@save="onSave"
				@cancel="onCancel"
			/>
		`
	});

	function readConnectionRequestFromSlider() {
		const topWindow = window.top ?? window;
		const slider = topWindow.BX?.SidePanel?.Instance?.getTopSlider?.();
		const params = slider?.getRequestParams?.();
		const cr = params?.connectionRequest;
		if (!cr) {
			return null;
		}
		const requestId = Number(cr.requestId);
		const requesterId = Number(cr.requesterId);
		if (!requestId || !requesterId) {
			return null;
		}
		return {
			requestId,
			requesterId
		};
	}
	class MailboxConfigForm {
		containerId;
		initialData;
		#app = null;
		#state = null;
		constructor(options = {}) {
			this.containerId = options.containerId ?? 'mail-mailbox-config-container';
			this.initialData = options.initialData ?? {};
		}
		start() {
			const container = document.getElementById(this.containerId);
			if (!container) {
				return;
			}
			const connectionRequest = this.initialData.connectionRequest ?? readConnectionRequestFromSlider();
			const initialData = connectionRequest ? {
				...this.initialData,
				connectionRequest
			} : this.initialData;
			this.#state = createFormState(initialData);
			this.#app = ui_vue3.BitrixVue.createApp(App);
			this.#app.config.globalProperties.loc = (phraseCode, replacements = {}) => {
				return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
			};
			this.#app.provide(formStateKey, this.#state);
			this.#app.mount(container);
		}
		destroy() {
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
			this.#state = null;
		}
	}

	exports.MailboxConfigForm = MailboxConfigForm;

})(this.BX.Mail.Connecting.ConfigForm = this.BX.Mail.Connecting.ConfigForm || {}, BX, BX.Vue3, BX.Event, BX.UI.Dialogs, BX.UI.System.Typography.Vue, BX.UI.IconSet, BX.Vue3.Components, BX.Mail.Connecting.CrmIntegration, BX.Mail.Connecting.CalendarIntegration, BX.Mail.Connecting.MailSyncSettings, BX.Mail, BX.UI.System.Input, BX.UI.System.Input.Vue, BX.Mail.Connecting.SettingsConfig, BX.UI.Accessibility, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Directives, BX.UI.EntitySelector, BX.Mail.Lib.EntitySelector, BX.UI.Tour, BX.UI);
//# sourceMappingURL=config-form.bundle.js.map
