import { defineComponent } from 'ui.vue3';
import { Uri } from 'main.core';
import { InputDesign, InputSize } from 'ui.system.input';
import { BInput } from 'ui.system.input.vue';
import { useFormState } from '../state';
import { loc } from '../utils/loc';

// @vue/component
export const ConnectionSettings = defineComponent({
	name: 'connection-settings',

	components: { BInput },

	setup()
	{
		return {
			state: useFormState(),
			loc,
			InputSize,
			InputDesign,
		};
	},

	props: {
		passwordPlaceholder: { type: String, default: '' },
	},

	emits: ['oauth-email-blur'],

	data()
	{
		return {
			showExtraParams: false,
		};
	},

	computed: {
		isEditMode(): boolean
		{
			return this.state.mode === 'edit';
		},
		isOAuthService(): boolean
		{
			return Boolean(this.state.service?.oauth) || Boolean(this.state.connection.isOAuth);
		},
		showEmailField(): boolean
		{
			if (this.isEditMode)
			{
				return false;
			}

			return !this.isOAuthService || this.state.connection.oauthEmailNeedsConfirmation;
		},
		oauthEmailStatusHint(): string
		{
			if (!this.state.connection.oauthEmailNeedsConfirmation)
			{
				return '';
			}

			switch (this.state.connection.oauthEmailCheckStatus)
			{
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
		oauthEmailStatusModifier(): string
		{
			if (!this.state.connection.oauthEmailNeedsConfirmation)
			{
				return '';
			}

			switch (this.state.connection.oauthEmailCheckStatus)
			{
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
			get(): string
			{
				return this.state.connection.port?.toString() ?? '';
			},
			set(value: string): void
			{
				const port = parseInt(value, 10);
				this.state.connection.port = Number.isNaN(port) ? null : port;
			},
		},
		showSenderNameHere(): boolean
		{
			return !this.state.permissions.isSmtpAvailable;
		},
		hasCustomImapServer(): boolean
		{
			return !this.state.service?.server;
		},
	},

	watch: {
		'state.connection.email'(newVal: string): void
		{
			if (!this.state.fieldSyncFlags.loginManual)
			{
				this.state.connection.login = newVal;
			}

			if (!this.state.fieldSyncFlags.nameManual)
			{
				this.state.mailbox.name = newVal;
			}

			if (!this.state.fieldSyncFlags.smtpLoginManual)
			{
				this.state.smtp.login = newVal;
			}
		},
		'state.connection.login'(newVal: string): void
		{
			if (!this.state.fieldSyncFlags.smtpLoginManual)
			{
				this.state.smtp.login = newVal;
			}
		},
		'state.connection.password'(newVal: string): void
		{
			if (!this.state.fieldSyncFlags.smtpPasswordManual)
			{
				this.state.smtp.password = newVal;
			}
		},
	},

	methods: {
		onLoginChange(value: string): void
		{
			this.state.connection.login = value;
			this.state.fieldSyncFlags.loginManual = true;
		},
		onNameChange(value: string): void
		{
			this.state.mailbox.name = value;
			this.state.fieldSyncFlags.nameManual = true;
		},
		openDirsSlider(): void
		{
			const url = Uri.addParam('/mail/config/dirs', {
				mailboxId: this.state.mailboxId,
			});
			const sidePanel = (BX as unknown as {
				SidePanel?: {
					Instance?: {
						open: (targetUrl: string, options: {
							width: number;
							cacheable: boolean;
							allowChangeHistory: boolean;
						}) => void;
					};
				};
			}).SidePanel?.Instance;

			sidePanel?.open(url, {
				width: 640,
				cacheable: false,
				allowChangeHistory: false,
			});
		},
		onEmailBlur(): void
		{
			if (this.state.connection.oauthEmailNeedsConfirmation)
			{
				this.$emit('oauth-email-blur');
			}
		},
	},

	// language=Vue
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
	`,
});
