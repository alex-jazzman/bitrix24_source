/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Connecting = this.BX.Mail.Connecting || {};
(function (exports, main_core, ui_vue3, main_core_events, ui_dialogs_messagebox, ui_system_typography_vue, ui_iconSet_api_vue, mail_connecting_crmIntegration, mail_connecting_calendarIntegration, mail_connecting_mailSyncSettings, ui_system_input, ui_system_input_vue, mail_connecting_settingsConfig, ui_vue3_components_button, ui_vue3_components_switcher, ui_switcher, ui_vue3_directives_hint, ui_entitySelector, ui_tour) {
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
			isSmtpAvailable: rawPermissions?.isSmtpAvailable ?? false,
			isCrmAvailable: rawPermissions?.isCrmAvailable ?? mapped.crmAvailable,
			isCalendarAvailable: rawPermissions?.isCalendarAvailable ?? false,
			syncOldLimit: rawPermissions?.syncOldLimit ?? 90,
			sharedMailboxLimit,
			sharedMailboxLimitReached: rawPermissions?.sharedMailboxLimitReached ?? false,
			sharedMailboxesCount: rawPermissions?.sharedMailboxesCount ?? null
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
			settingsConfig: rawConfig,
			settingsOptions: {
				mailSync: mapped.mailSyncOptions,
				crmSync: mapped.crmSyncOptions,
				crmEntity: mapped.crmEntityOptions,
				crmSource: mapped.crmSourceOptions
			},
			connection: {
				email: '',
				server: service?.server ?? '',
				port: service?.port !== undefined && service?.port !== null ? Number(service.port) || null : null,
				ssl: service?.encryption !== 'N',
				login: '',
				password: '',
				isOAuth: Boolean(service?.oauth),
				oauthUid: null,
				oauthUser: null,
				userPrincipalName: '',
				oauthEmailNeedsConfirmation: false,
				oauthEmailCheckStatus: 'idle'
			},
			smtp: {
				enabled: true,
				server: service?.smtp?.server ?? '',
				port: service?.smtp?.port !== undefined && service?.smtp?.port !== null ? Number(service.smtp.port) || 587 : 587,
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
			hasCustomImapServer() {
				return !this.state.service?.server;
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
				v-if="hasCustomImapServer"
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
				v-if="!isOAuthService"
				:label="loc('MAIL_CONFIG_FORM_LOGIN_LABEL')"
				:size="InputSize.Md"
				:design="isEditMode ? InputDesign.Disabled : InputDesign.DEFAULT"
				:model-value="state.connection.login"
				:disabled="isEditMode"
				:error="state.errors.login"
				data-test-id="mail_config-form__connection-login_field"
				@update:model-value="onLoginChange"
			/>
			<div
				v-if="!isOAuthService"
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
				/>
			</div>
			<a v-if="isEditMode && state.mailboxId"
				class="mail-config-form__dirs-link"
				href="#"
				@click.prevent="openDirsSlider"
				data-test-id="mail_config-form__dirs_link"
			>{{ loc('MAIL_CONFIG_FORM_DIRS_LINK') }}</a>
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
		template: `
		<div v-if="state.connection.isOAuth" data-test-id="mail_config-form__microsoft-connection">
			<BInput
				:label="loc('MAIL_CONFIG_FORM_UPN_LABEL')"
				:size="InputSize.Lg"
				:design="InputDesign.DEFAULT"
				v-model="state.connection.userPrincipalName"
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
			}
		},
		emits: ['button-click'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				loc
			};
		},
		computed: {
			avatarStyle() {
				return this.avatar ? {
					backgroundImage: `url("${encodeURI(this.avatar)}")`
				} : null;
			}
		},
		methods: {
			onButtonClick() {
				this.$emit('button-click');
			}
		},
		template: `
		<div class="mail-config-form__provider-badge" data-test-id="mail_config-form__provider-badge">
			<div class="mail-provider-img-container">
				<div :class="'mail-provider-' + iconKey + '-img'"></div>
			</div>
			<template v-if="avatar">
				<div class="mail-config-form__provider-divider"></div>
				<div class="mail-config-form__provider-account">
					<div
						class="mail-config-form__provider-avatar"
						:style="avatarStyle"
						data-test-id="mail_config-form__provider-avatar"
					></div>
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
				v-if="buttonText"
				class="mail-config-form__provider-action"
				data-id="mail-config-form-provider-action"
				data-test-id="mail_config-form__provider-action"
			>
				<UiButton
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
			}
		},
		computed: {
			isEditMode() {
				return this.state.mode === 'edit';
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
			showServerFields() {
				return !this.state.service?.smtp?.server;
			},
			showLoginField() {
				return !this.isOAuthService && !this.state.service?.smtp?.login;
			},
			showPasswordField() {
				return !this.isOAuthService && !this.state.service?.smtp?.password;
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
			:class="{ '--disabled': !state.smtp.enabled }"
			data-test-id="mail_config-form__smtp-section"
		>
			<div class="mail-config-form__section-header" data-test-id="mail_config-form__smtp-header">
				<div class="mail_massconnect__integration-block_icon --mail"></div>
				<div class="mail-config-form__section-title-block --centered">
					<HeadlineSm>{{ loc('MAIL_CONFIG_FORM_SMTP_TITLE') }}</HeadlineSm>
				</div>
				<div class="mail-config-form__switcher-container">
					<Switcher
						v-if="isEditMode || !isOAuthService"
						:isChecked="state.smtp.enabled"
						:options="switcherOptions"
						@click="state.smtp.enabled = !state.smtp.enabled"
						data-test-id="mail_config-form__smtp-switcher"
					/>
				</div>
			</div>
			<transition name="mail-config-form__collapse">
				<div
					class="mail-config-form__section-content"
					v-if="state.smtp.enabled"
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
							type="number"
							:size="InputSize.Md"
							:design="InputDesign.DEFAULT"
							v-model="smtpPortModel"
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
				</div>
			</transition>
		</div>
	`
	});

	function getAccessUserOptions() {
		return {
			intranetUsersOnly: true,
			emailUsers: false,
			inviteEmployeeLink: false,
			inviteGuestLink: false
		};
	}
	function getSelectorItemByAccessCode(code) {
		const userMatch = code.match(/^U(\d+)$/);
		if (userMatch) {
			return ['user', userMatch[1]];
		}
		const recursiveDepartmentMatch = code.match(/^DR(\d+)$/);
		if (recursiveDepartmentMatch) {
			return ['department', recursiveDepartmentMatch[1]];
		}
		const flatDepartmentMatch = code.match(/^D(\d+)$/);
		if (flatDepartmentMatch) {
			return ['department', `${flatDepartmentMatch[1]}:F`];
		}
		return null;
	}
	function getAccessCodeBySelectorTag(tag) {
		const entityId = tag.getEntityId();
		const itemId = String(tag.getId());
		if (entityId === 'user') {
			return `U${itemId}`;
		}
		if (entityId === 'department') {
			const flatDepartmentMatch = itemId.match(/^(\d+):F$/);
			if (flatDepartmentMatch) {
				return `D${flatDepartmentMatch[1]}`;
			}
			const recursiveDepartmentMatch = itemId.match(/^\d+$/);
			if (recursiveDepartmentMatch) {
				return `DR${itemId}`;
			}
		}
		return null;
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
			const userOptions = getAccessUserOptions();
			this.selectorInstance = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
				multiple: true,
				dialogOptions: {
					targetNode: selectorContainer,
					popupOptions: {
						targetContainer: resolvePopupTargetContainer$2(selectorContainer)
					},
					context: 'MAIL_SHARE_ACCESS',
					preselectedItems: this.state.access.sharedWith.map(code => getSelectorItemByAccessCode(code)).filter(item => item !== null),
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
					onAfterTagRemove: () => this.updateAccess()
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
			updateAccess() {
				if (!this.selectorInstance) {
					return;
				}
				this.state.access.sharedWith = this.selectorInstance.getTags().map(tag => getAccessCodeBySelectorTag(tag)).filter(code => code !== null);
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
			}
		},
		emits: ['save', 'cancel'],
		methods: {
			onSave() {
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
				:disabled="state.loading"
				:dataset="{ testId: 'mail_config-form__save_button' }"
				@click="onSave"
			/>
			<UiButton
				:text="loc('MAIL_CONFIG_FORM_CANCEL_BUTTON')"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:disabled="state.loading"
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
			return runAction('updateMailbox', {
				mailboxId,
				...data
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

	const SYNC_FAILURE_GUIDE_TARGETS = {
		oauth: '[data-id="mail-config-form-provider-action"]',
		password: '[data-id="mail-config-form-password-field"]'
	};
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
	function createGeneralErrorItem(message, customData = null) {
		return {
			message,
			customData: normalizeCustomData(customData),
			expanded: false
		};
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
	const App = ui_vue3.defineComponent({
		name: 'mailbox-config-app',
		components: {
			ConnectionSettings,
			MicrosoftConnection,
			ProviderBadge,
			SmtpSettings,
			CrmIntegration: mail_connecting_crmIntegration.CrmIntegration,
			CalendarIntegration: mail_connecting_calendarIntegration.CalendarIntegration,
			MailIntegration: mail_connecting_mailSyncSettings.MailIntegration,
			AccessSharing,
			MailboxOwnership,
			ConnectionRequestOwner,
			FormActions,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		setup() {
			return {
				state: useFormState(),
				loc
			};
		},
		data() {
			return {
				passwordPlaceholder: '••••••••••••',
				oauthPending: false,
				warningIconName: ui_iconSet_api_vue.Set.WARNING,
				boundSlider: null,
				onSliderMessage: null,
				onSliderClose: null,
				syncFailureGuide: null,
				lastMailSyncPeriodValue: '7',
				verifyEmailRequestSeq: 0,
				oauthPopup: null,
				oauthPopupWatcher: null
			};
		},
		computed: {
			isEditMode() {
				return this.state.mode === 'edit';
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
				return main_core.Loc.getMessage('MAIL_CONFIG_FORM_LAST_CHECK_TITLE', {
					'#TIME_AGO#': this.formatTimeAgo(Number(date))
				}) ?? '';
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
			providerAvatar() {
				if (this.isOAuthService && this.isOAuthConnected) {
					return this.state.connection.oauthUser?.picture || '';
				}
				return '';
			},
			generalErrorItems() {
				const items = this.state.errors.generalItems;
				return Array.isArray(items) ? items : [];
			},
			providerButtonText() {
				if (this.isEditMode || this.isOAuthConnected) {
					return main_core.Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_DISCONNECT') ?? '';
				}
				if (!this.isOAuthService) {
					return '';
				}
				return main_core.Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_CONNECT') ?? '';
			}
		},
		mounted() {
			this.state.calendarSettings.enabled = true;
			if (this.isEditMode && this.state.mailboxId) {
				void this.loadMailboxData();
			}
			this.bindSidePanelListeners();
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
			this.stopOauthPopupWatcher();
			this.oauthPopup = null;
			this.unbindSidePanelListeners();
			this.closeSyncFailureGuide();
		},
		methods: {
			formatTimeAgo(timestamp) {
				const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
				if (diffSeconds < 60) {
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_SECONDS', diffSeconds, {
						'#COUNT#': String(diffSeconds)
					}) ?? `${diffSeconds} сек назад`;
				}
				if (diffSeconds < 3600) {
					const minutes = Math.floor(diffSeconds / 60);
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_MINUTES', minutes, {
						'#COUNT#': String(minutes)
					}) ?? `${minutes} мин назад`;
				}
				if (diffSeconds < 86400) {
					const hours = Math.floor(diffSeconds / 3600);
					return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_HOURS', hours, {
						'#COUNT#': String(hours)
					}) ?? `${hours} ч назад`;
				}
				const days = Math.floor(diffSeconds / 86400);
				return main_core.Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_DAYS', days, {
					'#COUNT#': String(days)
				}) ?? `${days} дн назад`;
			},
			async loadMailboxData() {
				const mailboxId = this.state.mailboxId;
				if (!mailboxId) {
					return;
				}
				this.state.loading = true;
				try {
					const response = await Api.getMailbox(mailboxId);
					this.mapMailboxData(response.data);
				} catch (error) {
					console.error('Failed to load mailbox data:', error);
				} finally {
					this.state.loading = false;
				}
			},
			mapMailboxData(data) {
				this.state.connection.email = data.imap.email || '';
				this.state.connection.login = data.imap.login || '';
				this.state.connection.server = data.imap.server || '';
				this.state.connection.port = Number(data.imap.port) || 993;
				this.state.connection.ssl = data.imap.ssl === 'Y';
				this.state.connection.isOAuth = Boolean(data.imap.isOAuth);
				this.state.connection.oauthUid = data.imap.oauthUid || null;
				this.state.connection.oauthUser = mapOauthUser(data.imap.oauthUser);
				this.state.smtp.enabled = data.smtp.enabled === 'Y';
				this.state.smtp.server = data.smtp.server || '';
				this.state.smtp.port = Number(data.smtp.port) || 587;
				this.state.smtp.ssl = data.smtp.ssl === 'Y';
				this.state.smtp.login = data.smtp.login || '';
				this.state.smtp.useLimit = Boolean(data.smtp.useLimit);
				this.state.smtp.limit = data.smtp.limit || 250;
				this.state.service = {
					...(this.state.service ?? {}),
					name: data.service.name,
					type: data.service.type,
					link: data.service.link,
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
				this.state.access.ownerId = data.userId || null;
				this.state.lastMailCheck = data.lastMailCheck || null;
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
				const lastCheck = this.state.lastMailCheck;
				if (!lastCheck || lastCheck.date === null || lastCheck.isSuccess !== false) {
					return;
				}
				if (this.syncFailureGuide) {
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
			buildBasePayload() {
				const state = this.state;
				return {
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
					mailboxName: state.mailbox.name || state.connection.email,
					senderName: state.mailbox.senderName,
					useSenderName: state.mailbox.useSenderName,
					iCalAccess: state.calendarSettings.enabled && state.calendarSettings.autoAddEvents,
					crmOptions: this.buildCrmOptions(),
					uploadOutgoing: state.smtp.uploadOutgoing,
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
			buildUpdatePayload() {
				const state = this.state;
				const payload = this.buildBasePayload();
				if (state.connection.password && state.connection.password !== this.passwordPlaceholder) {
					payload.password = state.connection.password;
				}
				if (state.smtp.password && state.smtp.password !== this.passwordPlaceholder) {
					payload.passwordSMTP = state.smtp.password;
				}
				if (state.access.ownerId) {
					payload.userIdToConnect = state.access.ownerId;
				}
				return payload;
			},
			async submitSave() {
				if (this.state.mode === 'edit') {
					const mailboxId = this.state.mailboxId;
					if (!mailboxId) {
						throw new Error('Mailbox id is required in edit mode.');
					}
					const payload = this.buildUpdatePayload();
					const response = await Api.updateMailbox(mailboxId, payload);
					return response.data;
				}
				const payload = this.buildCreatePayload();
				if (this.isConnectionRequestMode) {
					const response = await Api.connectMailboxByConnectionRequest(Number(this.state.connectionRequestId), payload);
					return response.data;
				}
				const response = await Api.connectMailbox(payload);
				return response.data;
			},
			async onSave() {
				const errors = validateForm(this.state);
				if (Object.keys(errors).length > 0) {
					this.state.errors = {
						...createEmptyErrors(),
						...errors
					};
					return;
				}
				this.state.loading = true;
				this.state.errors = createEmptyErrors();
				try {
					const result = await this.submitSave();
					this.onSaveSuccess(result);
				} catch (error) {
					this.onSaveError(error);
				} finally {
					this.state.loading = false;
				}
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
					this.state.errors.generalItems = serverErrors.map(item => {
						return createGeneralErrorItem(item.message || main_core.Loc.getMessage('MAIL_CONFIG_FORM_ERROR_GENERAL') || '', item.customData || null);
					});
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
				const mailboxId = this.state.mailboxId;
				if (!mailboxId) {
					return;
				}
				this.state.loading = true;
				this.state.errors.generalItems = [];
				try {
					await Api.deleteMailbox(mailboxId);
					this.postSliderMessage('mail-mailbox-config-delete', {
						id: mailboxId
					});
					this.closeForm(0);
				} catch (error) {
					this.onSaveError(error);
				} finally {
					this.state.loading = false;
				}
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
			confirmDelete() {
				ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('MAIL_CONFIG_FORM_DELETE_CONFIRM_TITLE') ?? '', null, messageBox => {
					messageBox.close();
					void this.onDelete();
				}, main_core.Loc.getMessage('MAIL_CONFIG_FORM_DELETE_CONFIRM_OK') ?? '', null, null, true);
			},
			async startOAuth() {
				const serviceName = this.state.service?.name;
				if (!serviceName) {
					return;
				}
				try {
					const response = await Api.getOauthUrl(serviceName);
					const url = response.data;
					if (url) {
						const popup = getRootBX().util.popup(url, 800, 600);
						this.oauthPending = true;
						this.oauthPopup = popup;
						main_core_events.EventEmitter.subscribe('OnMailOAuthBCompleted', this.onOAuthCompleted, {
							compatMode: true
						});
						this.startOauthPopupWatcher();
					}
				} catch (error) {
					console.error('OAuth URL error:', error);
				}
			},
			startOauthPopupWatcher() {
				this.stopOauthPopupWatcher();
				this.oauthPopupWatcher = setInterval(() => {
					const popup = this.oauthPopup;
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
				this.oauthPending = false;
				this.oauthPopup = null;
				this.stopOauthPopupWatcher();
			},
			onOAuthCompleted(uid, _url, user) {
				main_core_events.EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
				this.stopOauthPopupWatcher();
				this.oauthPopup = null;
				this.oauthPending = false;
				if (!uid || !user) {
					return;
				}
				this.state.connection.oauthUid = uid;
				this.state.connection.isOAuth = true;
				this.state.connection.oauthUser = mapOauthUser(user);
				this.state.connection.userPrincipalName = user.userPrincipalName || '';
				this.state.connection.oauthEmailNeedsConfirmation = false;
				this.state.connection.oauthEmailCheckStatus = 'idle';
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
				this.state.connection.oauthEmailNeedsConfirmation = false;
				this.state.connection.oauthEmailCheckStatus = 'idle';
			}
		},
		template: `
		<template v-if="state.isDataReady">
			<div class="mail-config-form" data-test-id="mail_config-form__root">
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
							:button-disabled="oauthPending"
							@button-click="onProviderButtonClick"
						/>
						<ConnectionRequestOwner v-if="isConnectionRequestMode" />
						<ConnectionSettings
							v-if="isEditMode || !isOAuthService || isOAuthConnected"
							:password-placeholder="passwordPlaceholder"
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
						<MicrosoftConnection v-if="isMicrosoftService" />
					</div>
				</div>

				<MailboxOwnership v-if="isEditMode && state.permissions.canChangeOwner" />

				<SmtpSettings
					v-if="state.permissions.isSmtpAvailable"
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

				<AccessSharing />

				<div
					v-if="generalErrorItems.length > 0"
					ref="errorAlert"
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

				<FormActions
					:is-edit-mode="isEditMode"
					@save="onSave"
					@cancel="onCancel"
				/>
			</div>
		</template>
			<div
				v-else
				class="mail-config-form --loading"
				data-test-id="mail_config-form__loader"
			>
				<div class="mail-config-form__loader"></div>
			</div>
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

})(this.BX.Mail.Connecting.ConfigForm = this.BX.Mail.Connecting.ConfigForm || {}, BX, BX.Vue3, BX.Event, BX.UI.Dialogs, BX.UI.System.Typography.Vue, BX.UI.IconSet, BX.Mail.Connecting.CrmIntegration, BX.Mail.Connecting.CalendarIntegration, BX.Mail.Connecting.MailSyncSettings, BX.UI.System.Input, BX.UI.System.Input.Vue, BX.Mail.Connecting.SettingsConfig, BX.Vue3.Components, BX.UI.Vue3.Components, BX.UI, BX.Vue3.Directives, BX.UI.EntitySelector, BX.UI.Tour);
//# sourceMappingURL=config-form.bundle.js.map
