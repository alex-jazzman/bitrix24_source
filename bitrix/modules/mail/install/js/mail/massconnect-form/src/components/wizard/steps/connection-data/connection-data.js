import { sendData as analyticsSendData } from 'ui.analytics';
import { InputDesign, InputSize } from 'ui.system.input';
import { BInput } from 'ui.system.input.vue';
import { mapState } from 'ui.vue3.pinia';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';
import { useWizardStore } from '../../../../store/wizard.js';
import './connection-data.css';

// @vue/component
export const ConnectionData = {
	components: {
		BInput,
	},

	mixins: [LocalizationMixin],

	props: {
		validationAttempted: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:validity'],

	disableButtonOnInvalid: false,

	data(): Object
	{
		return {
			InputSize,
			InputDesign,
		};
	},

	computed: {
		...mapState(useWizardStore, ['connectionSettings', 'analyticsSource']),
		isValid(): boolean
		{
			const imapValid = Boolean(this.connectionSettings.imapServer && this.connectionSettings.imapPort);

			if (!this.connectionSettings.smtpSettings.enabled)
			{
				return imapValid;
			}

			const smtpServer = this.connectionSettings.smtpSettings.server;
			const smtpPort = this.connectionSettings.smtpSettings.port;
			const smtpFilled = Boolean(smtpServer || smtpPort);

			if (!smtpFilled)
			{
				return imapValid;
			}

			const smtpValid = Boolean(smtpServer && smtpPort);

			return imapValid && smtpValid;
		},
		showErrors(): boolean
		{
			return this.validationAttempted;
		},
		imapServerError(): ?string
		{
			return this.showErrors && !this.connectionSettings.imapServer
				? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_ERROR')
				: null;
		},
		imapPortError(): ?string
		{
			return this.showErrors && !this.connectionSettings.imapPort
				? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_ERROR')
				: null;
		},
		smtpServerError(): ?string
		{
			if (!this.showErrors || !this.connectionSettings.smtpSettings.enabled)
			{
				return null;
			}

			const smtpServer = this.connectionSettings.smtpSettings.server;
			const smtpPort = this.connectionSettings.smtpSettings.port;

			if (smtpPort && !smtpServer)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_ERROR');
			}

			return null;
		},
		smtpPortError(): ?string
		{
			if (!this.showErrors || !this.connectionSettings.smtpSettings.enabled)
			{
				return null;
			}

			const smtpServer = this.connectionSettings.smtpSettings.server;
			const smtpPort = this.connectionSettings.smtpSettings.port;

			if (smtpServer && !smtpPort)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_ERROR');
			}

			return null;
		},
	},

	watch: {
		isValid: {
			handler(isValid)
			{
				this.$emit('update:validity', isValid);
			},
			immediate: true,
		},
	},

	methods: {
		onStepComplete(): void
		{
			analyticsSendData({
				tool: 'mail',
				event: 'mailbox_mass_step1',
				category: 'mail_mass_ops',
				c_section: this.analyticsSource,
			});
		},
		handleImapPortInput(port: string): void
		{
			this.connectionSettings.imapPort = this.getSanitizedValue(port);
		},
		handleSmtpPortInput(port: string): void
		{
			this.connectionSettings.smtpSettings.port = this.getSanitizedValue(port);
		},
		getSanitizedValue(value: ?string): string
		{
			return String(value ?? '').replaceAll(/\D/g, '');
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__connection-data_form" data-test-id="mail_massconnect__connection-data_form">
			<div class="mail_massconnect__section-title_container">
				<span class="mail_massconnect__section-title">
					{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_CARD_TITLE_MSGVER_1') }}
				</span>
				<span class="mail_massconnect__section-description">
					{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_CARD_DESCRIPTION') }}
				</span>
			</div>

			<div v-if="false" data-test-id="mail_massconnect__connection-data_domain-group">
				<BInput
					class="mail_massconnect__group"
					:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_DOMAIN_INPUT_LABEL')"
					:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_DOMAIN_INPUT_PLACEHOLDER')"
					:size="InputSize.Lg"
					:design="InputDesign.Grey"
					v-model="connectionSettings.email"
				/>
			</div>

			<div class="mail_massconnect__connection-block">
				<div class="mail_massconnect__input-group" data-test-id="mail_massconnect__connection-data_imap-group">
					<BInput
						class="mail_massconnect__input-group_main"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_PLACEHOLDER')"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="connectionSettings.imapServer"
						:error="imapServerError"
					/>
					<BInput
						class="mail_massconnect__input-group_port"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_PLACEHOLDER')"
						type="number"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="connectionSettings.imapPort"
						:error="imapPortError"
						@input="handleImapPortInput(connectionSettings.imapPort)"
					/>
				</div>
				<div class="mail_massconnect__connection-data_checkbox-group">
					<input
						type="checkbox"
						id="mail_massconnect__imap-ssl"
						class="mail_massconnect__checkbox"
						v-model="connectionSettings.imapSsl"
						data-test-id="mail_massconnect__connection-data_imap-ssl-checkbox"
					/>
					<label for="mail_massconnect__imap-ssl">
						{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_SSL_INPUT_LABEL') }}
					</label>
				</div>
			</div>

			<div 
				v-if="connectionSettings.smtpSettings.enabled"
				class="mail_massconnect__connection-block"
			>
				<div class="mail_massconnect__input-group" data-test-id="mail_massconnect__connection-data_smtp-group">
					<BInput
						class="mail_massconnect__input-group_main"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_PLACEHOLDER')"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="connectionSettings.smtpSettings.server"
						:error="smtpServerError"
					/>
					<BInput
						class="mail_massconnect__input-group_port"
						:label="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_LABEL')"
						:placeholder="loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_PLACEHOLDER')"
						type="number"
						:size="InputSize.Lg"
						:design="InputDesign.DEFAULT"
						v-model="connectionSettings.smtpSettings.port"
						:error="smtpPortError"
						@input="handleSmtpPortInput(connectionSettings.smtpSettings.port)"
					/>
				</div>
				<div class="mail_massconnect__connection-data_checkbox-group">
					<input
						type="checkbox"
						id="mail_massconnect__smtp-ssl"
						class="mail_massconnect__checkbox"
						v-model="connectionSettings.smtpSettings.ssl"
						data-test-id="mail_massconnect__connection-data_smtp-ssl-checkbox"
					/>
					<label for="mail_massconnect__smtp-ssl">
						{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_SSL_INPUT_LABEL') }}
					</label>
				</div>
			</div>
		</div>
	`,
};
