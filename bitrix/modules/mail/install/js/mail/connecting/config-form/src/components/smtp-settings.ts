import { defineComponent } from 'ui.vue3';
import { InputDesign, InputSize } from 'ui.system.input';
import { BInput } from 'ui.system.input.vue';
import { Switcher } from 'ui.vue3.components.switcher';
import { SwitcherSize } from 'ui.switcher';
import { HeadlineSm } from 'ui.system.typography.vue';
import { Outline, BIcon } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';

import { useFormState } from '../state';
import { loc } from '../utils/loc';

// @vue/component
export const SmtpSettings = defineComponent({
	name: 'smtp-settings',

	components: { Switcher, BInput, HeadlineSm, BIcon },

	directives: { hint },

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

	computed: {
		isEditMode(): boolean
		{
			return this.state.mode === 'edit';
		},
		isOAuthService(): boolean
		{
			return Boolean(this.state.service?.oauth) || Boolean(this.state.connection.isOAuth);
		},
		outline(): typeof Outline
		{
			return Outline;
		},
		switcherOptions(): { size: string; showStateTitle: boolean; useAirDesign: boolean }
		{
			return {
				size: SwitcherSize.large,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
		showServerFields(): boolean
		{
			return !this.state.service?.smtp?.server;
		},
		showLoginField(): boolean
		{
			return !this.isOAuthService && !this.state.service?.smtp?.login;
		},
		showPasswordField(): boolean
		{
			return !this.isOAuthService && !this.state.service?.smtp?.password;
		},
		smtpPortModel: {
			get(): string
			{
				return this.state.smtp.port?.toString() ?? '';
			},
			set(value: string): void
			{
				const port = parseInt(value, 10);
				this.state.smtp.port = Number.isNaN(port) ? null : port;
			},
		},
		limitModel: {
			get(): string
			{
				return this.state.smtp.limit?.toString() ?? '';
			},
			set(value: string): void
			{
				const limit = parseInt(value, 10);
				this.state.smtp.limit = Number.isNaN(limit) ? null : limit;
			},
		},
	},

	methods: {
		onSmtpLoginChange(value: string): void
		{
			this.state.smtp.login = value;
			this.state.fieldSyncFlags.smtpLoginManual = true;
		},
		onSmtpPasswordChange(value: string): void
		{
			this.state.smtp.password = value;
			this.state.fieldSyncFlags.smtpPasswordManual = true;
		},
	},

	// language=Vue
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
	`,
});
