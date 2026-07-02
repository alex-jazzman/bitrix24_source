import { sendData as analyticsSendData } from 'ui.analytics';
import { InputDesign, InputSize } from 'ui.system.input';
import { BInput } from 'ui.system.input.vue';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';
import { useWizardStore } from '../../../../store/wizard.js';
import {
	ERROR_TYPE_IMAP_CONNECTION,
	ERROR_TYPE_SMTP_CONNECTION,
} from '../../../../utils/const/connection-error';
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
		...mapState(useWizardStore, ['connectionSettings', 'analyticsSource', 'errorState']),
		imapPortModel: {
			get(): string
			{
				return this.connectionSettings.imapPort?.toString() ?? '';
			},
			set(value)
			{
				const port = parseInt(value, 10);
				this.connectionSettings.imapPort = Number.isNaN(port) ? null : port;
			},
		},
		smtpPortModel: {
			get(): string
			{
				return this.connectionSettings.smtpSettings.port?.toString() ?? '';
			},
			set(value)
			{
				const port = parseInt(value, 10);
				this.connectionSettings.smtpSettings.port = Number.isNaN(port) ? null : port;
			},
		},
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
		isFixingImapError(): boolean
		{
			return this.errorState?.errorType === ERROR_TYPE_IMAP_CONNECTION;
		},
		isFixingSmtpError(): boolean
		{
			return this.errorState?.errorType === ERROR_TYPE_SMTP_CONNECTION;
		},
		imapServerError(): ?string
		{
			if (this.isFixingImapError)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_CONNECTION_ERROR');
			}

			return this.showErrors && !this.connectionSettings.imapServer
				? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_INPUT_ERROR')
				: null;
		},
		imapPortError(): ?string
		{
			if (this.isFixingImapError)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_CONNECTION_ERROR');
			}

			return this.showErrors && !this.connectionSettings.imapPort
				? this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_IMAP_PORTS_INPUT_ERROR')
				: null;
		},
		smtpServerError(): ?string
		{
			if (!this.connectionSettings.smtpSettings.enabled)
			{
				return null;
			}

			if (this.isFixingSmtpError)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_INPUT_CONNECTION_ERROR');
			}

			if (!this.showErrors)
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
			if (!this.connectionSettings.smtpSettings.enabled)
			{
				return null;
			}

			if (this.isFixingSmtpError)
			{
				return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_DATA_SMTP_PORTS_INPUT_CONNECTION_ERROR');
			}

			if (!this.showErrors)
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
		imapWatchKey(): string
		{
			return `${this.connectionSettings.imapServer ?? ''}|${this.connectionSettings.imapPort ?? ''}`;
		},
		smtpWatchKey(): string
		{
			return `${this.connectionSettings.smtpSettings.server ?? ''}|${this.connectionSettings.smtpSettings.port ?? ''}`;
		},
	},

	watch: {
		isValid: {
			handler(isValid: boolean): void
			{
				this.$emit('update:validity', isValid);
			},
			immediate: true,
		},
		imapWatchKey(): void
		{
			if (this.isFixingImapError)
			{
				this.disableErrorState();
			}
		},
		smtpWatchKey(): void
		{
			if (this.isFixingSmtpError)
			{
				this.disableErrorState();
			}
		},
	},

	methods: {
		...mapActions(useWizardStore, ['disableErrorState']),
		onStepComplete(): void
		{
			analyticsSendData({
				tool: 'mail',
				event: 'mailbox_mass_step1',
				category: 'mail_mass_ops',
				c_section: this.analyticsSource,
			});
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
						v-model="imapPortModel"
						:error="imapPortError"
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
						v-model="smtpPortModel"
						:error="smtpPortError"
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
