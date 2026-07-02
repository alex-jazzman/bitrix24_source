import { Dom, Loc, Type, Tag, Text } from 'main.core';
import { UI } from 'ui.notification';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline, BIcon } from 'ui.icon-set.api.vue';
import { mapState } from 'ui.vue3.pinia';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { sendData as analyticsSendData } from 'ui.analytics';
import { LocalizationMixin } from '../../../mixins/localization-mixin';
import { Api } from '../../../api';
import { EventName } from '../../../event';
import { type MailboxPayload } from '../../../store/type';
import { useWizardStore } from '../../../store/wizard';
import type { StatusPart, ErrorDetail } from '../../../store/type';
import {
	ERROR_TYPE_IMAP_CONNECTION,
	ERROR_TYPE_AUTH,
	ERROR_TYPE_SMTP_CONNECTION,
	ALLOWED_CONNECTION_ERROR_TYPES,
} from '../../../utils/const/connection-error';
import './connection-status.css';

// @vue/component
export const ConnectionStatus = {
	name: 'connection-status',

	directives: {
		hint,
	},

	components: {
		UiButton,
		BIcon,
	},

	mixins: [LocalizationMixin],

	props: {
		/** @type MailboxPayload[] */
		mailboxes: {
			type: Array,
			required: true,
		},
		/** @type MassConnectDataType */
		massConnectData: {
			type: Object,
			required: true,
		},
	},

	emits: ['fix-errors'],

	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},

	data(): Object
	{
		return {
			totalMailboxes: 0,
			processedCount: 0,
			successfulCount: 0,
			errorCount: 0,
			errorDetails: ([]: ErrorDetail[]),
			isCancelled: false,
			isFinished: false,
			detectedErrorType: '',
		};
	},

	computed: {
		...mapState(useWizardStore, [
			'analyticsSource',
			'calendarSettings',
			'crmSettings',
			'passwordlessMode',
			'connectionSettings',
		]),
		outline(): Outline
		{
			return Outline;
		},
		hasErrors(): boolean
		{
			return this.isFinished && this.errorCount > 0;
		},
		isSuccess(): boolean
		{
			return this.isFinished && this.errorCount === 0;
		},
		isImapConnectionError(): boolean
		{
			return this.detectedErrorType === ERROR_TYPE_IMAP_CONNECTION;
		},
		isSmtpConnectionError(): boolean
		{
			return this.detectedErrorType === ERROR_TYPE_SMTP_CONNECTION;
		},
		isGlobalConnectionError(): boolean
		{
			return this.isImapConnectionError || this.isSmtpConnectionError;
		},
		isFixableError(): boolean
		{
			return ALLOWED_CONNECTION_ERROR_TYPES.includes(this.detectedErrorType);
		},
		successMessage(): string
		{
			const langKey = this.passwordlessMode
				? 'MAIL_MASSCONNECT_FORM_CONNECTION_SUCCESS_REQUESTS_SENT'
				: 'MAIL_MASSCONNECT_FORM_CONNECTION_SUCCESS_ALL_CONNECTED';

			return this.loc(langKey);
		},
		successButtonText(): string
		{
			const langKey = this.passwordlessMode
				? 'MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_BUTTON_TITLE'
				: 'MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE';

			return this.loc(langKey);
		},
		successButtonStyle(): string
		{
			return this.passwordlessMode ? AirButtonStyle.PLAIN : AirButtonStyle.FILLED;
		},
		successButtonSize(): string
		{
			return this.passwordlessMode ? ButtonSize.EXTRA_LARGE : ButtonSize.MEDIUM;
		},
		statusParts(): Array<StatusPart>
		{
			const langKey = this.passwordlessMode
				? 'MAIL_MASSCONNECT_FORM_CONNECTION_STATUS_PASSWORDLESS'
				: 'MAIL_MASSCONNECT_FORM_CONNECTION_STATUS';
			const rawString = this.loc(langKey);

			const pattern = /(#REMAINING_CNT#|#TOTAL_CNT#)/g;

			const parts = rawString.split(pattern).filter(Boolean);

			return parts.map((part, index) => {
				if (part === '#REMAINING_CNT#')
				{
					return {
						type: 'counter',
						key: `remaining-${index}`,
						value: this.totalMailboxes - this.processedCount,
					};
				}

				if (part === '#TOTAL_CNT#')
				{
					return {
						type: 'static',
						key: `total-${index}`,
						value: this.totalMailboxes,
					};
				}

				return {
					type: 'text',
					key: `text-${index}`,
					value: part,
				};
			});
		},
		errorStatusParts(): Array<StatusPart>
		{
			if (this.errorCount === 0)
			{
				return [];
			}

			const rawString = Loc.getMessagePlural(
				'MAIL_MASSCONNECT_FORM_CONNECTION_STATUS_FAILURE_CONNECTION',
				this.errorCount,
			);

			const pattern = /(#ERROR_CNT#)/g;

			const parts = rawString.split(pattern).filter(Boolean);

			return parts.map((part, index) => {
				if (part === '#ERROR_CNT#')
				{
					return {
						type: 'counter',
						key: `error-${index}`,
						value: this.errorCount,
					};
				}

				return {
					type: 'text',
					key: `text-${index}`,
					value: part,
				};
			});
		},
		errorTitle(): string
		{
			return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_TITLE');
		},
		errorDescription(): string
		{
			return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_DESCRIPTION');
		},
		fixButtonText(): string
		{
			return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_FIX_BUTTON_TITLE');
		},
		hasErrorDetails(): boolean
		{
			return this.errorDetails.some((item) => {
				return Type.isStringFilled(item.message) || Type.isPlainObject(item.customData);
			});
		},
	},

	created(): void
	{
		Dom.hide(document.querySelector('.ui-side-panel-toolbar'));
		this.totalMailboxes = this.mailboxes.length;
		this.startProcessing();
	},

	methods: {
		getErrorDetailsHintParams(): HintParams
		{
			return {
				interactivity: true,
				popupOptions: {
					id: `mail_massconnect__connection-status_error-details_hint-${Text.getRandom()}`,
					className: 'mail_massconnect__connection-status_error-details_hint',
					darkMode: false,
					offsetTop: 2,
					background: 'var(--ui-color-bg-content-inapp)',
					angle: true,
					targetContainer: document.body,
					offsetLeft: 42,
					cacheable: false,
					content: this.createHintContent(),
				},
			};
		},

		createHintContent(): HTMLElement
		{
			const title = this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_ERROR_DETAILS_HINT_TITLE');

			const errorNodes = this.errorDetails
				.filter((item) => Type.isStringFilled(item.message))
				.map((item) => Tag.render`
					<div class="mail_massconnect-hint-item">
						${Text.encode(item.message)}
					</div>
				`);

			return Tag.render`
				<div class="mail_massconnect__connection-status_error-details_hint_content">
					<div class="mail_massconnect__connection-status_error-details_hint_content_title">
						${title}
					</div>
					<div class="mail_massconnect__connection-status_error-details_hint_content_list">
						${errorNodes}
					</div>
				</div>
			`;
		},

		async startProcessing(): void
		{
			if (this.passwordlessMode)
			{
				this.startPasswordlessProcessing();

				return;
			}

			let massConnectId = null;
			try
			{
				const result = await Api.saveMailboxConnectionData(this.massConnectData);

				massConnectId = result?.data?.id;

				if (!massConnectId)
				{
					throw new Error('Failed to save mailbox connection data');
				}
			}
			catch (error)
			{
				const errorMessages = this.getErrorMessages(error);
				const message = errorMessages.join(' ');

				this.errorDetails = this.mailboxes.map((mailbox) => this.buildErrorDetail({ message }, mailbox));
				this.errorCount = this.mailboxes.length;
				this.isFinished = true;

				return;
			}

			this.processMailboxes(this.mailboxes, massConnectId);
		},

		async processMailboxes(mailboxes: MailboxPayload[], massConnectId: number): void
		{
			for (const mailbox of mailboxes)
			{
				if (this.isCancelled)
				{
					continue;
				}

				try
				{
					// eslint-disable-next-line no-await-in-loop
					await Api.connectMailbox(mailbox, massConnectId);

					this.handleMailboxSuccess();
				}
				catch (error)
				{
					this.handleMailboxError(error, mailbox);
				}
				finally
				{
					this.processedCount++;
				}
			}

			this.isFinished = true;

			const calendarState = this.calendarSettings.enabled ? 'true' : 'false';
			const crmState = this.crmSettings.enabled ? 'true' : 'false';

			analyticsSendData({
				tool: 'mail',
				event: 'mailbox_mass_complete',
				category: 'mail_mass_ops',
				c_section: this.analyticsSource,
				p1: `integrationCalendar_${calendarState}`,
				p2: `integrationCRM_${crmState}`,
			});

			if (this.successfulCount > 0 && !this.isCancelled)
			{
				BX.SidePanel.Instance.postMessage(window, EventName.MAILBOX_APPEND_SUCCESS);
			}
		},
		async startPasswordlessProcessing(): void
		{
			try
			{
				await Api.validateConnectionSettings(this.buildValidationSettings());
			}
			catch (error)
			{
				const errorDetails = this.collectErrorDetails(error);
				this.updateDetectedErrorType(errorDetails);

				this.errorDetails = this.mailboxes.map(
					(mailbox) => this.buildErrorDetail(error?.errors?.[0] ?? error, mailbox),
				);
				this.errorCount = this.mailboxes.length;
				this.processedCount = this.mailboxes.length;
				this.isFinished = true;

				return;
			}

			this.processPasswordlessRequests(this.mailboxes);
		},

		async processPasswordlessRequests(mailboxes: MailboxPayload[]): void
		{
			for (const mailbox of mailboxes)
			{
				if (this.isCancelled)
				{
					continue;
				}

				try
				{
					// eslint-disable-next-line no-await-in-loop
					await Api.createPasswordlessRequest(mailbox);

					this.handleMailboxSuccess();
				}
				catch (error)
				{
					this.handleMailboxError(error, mailbox);
				}
				finally
				{
					this.processedCount++;
				}
			}

			this.isFinished = true;

			if (this.successfulCount > 0 && !this.isCancelled)
			{
				BX.SidePanel.Instance.postMessage(window, EventName.PASSWORDLESS_REQUESTS_SENT);
			}
		},

		buildValidationSettings(): Object
		{
			const settings = {
				server: this.connectionSettings.imapServer,
				port: this.connectionSettings.imapPort,
				ssl: this.connectionSettings.imapSsl,
			};

			if (this.connectionSettings.smtpSettings.enabled)
			{
				settings.serverSmtp = this.connectionSettings.smtpSettings.server;
				settings.portSmtp = this.connectionSettings.smtpSettings.port;
				settings.sslSmtp = this.connectionSettings.smtpSettings.ssl;
			}

			return settings;
		},

		handleMailboxSuccess(): void
		{
			this.successfulCount++;
		},
		handleMailboxError(error: Object, mailbox: MailboxPayload): void
		{
			this.errorCount++;

			const errorDetails = this.collectErrorDetails(error, mailbox);
			errorDetails.forEach((item) => this.errorDetails.push(item));

			this.updateDetectedErrorType(errorDetails);

			// Connection error is global — cancel remaining attempts
			if (this.isGlobalConnectionError)
			{
				this.isCancelled = true;
			}
		},
		updateDetectedErrorType(errorDetails: ErrorDetail[]): void
		{
			const detectedErrorType = this.detectErrorTypeFromDetails(errorDetails);
			if (
				detectedErrorType
				&& (
					detectedErrorType === ERROR_TYPE_IMAP_CONNECTION
					|| detectedErrorType === ERROR_TYPE_SMTP_CONNECTION
					|| !this.detectedErrorType
				)
			)
			{
				this.detectedErrorType = detectedErrorType;
			}
		},

		determineErrorType(errorType: ?string): string
		{
			switch (errorType)
			{
				case 'auth':
					return ERROR_TYPE_AUTH;
				case 'imap_connection':
					return ERROR_TYPE_IMAP_CONNECTION;
				case 'smtp_connection':
					return ERROR_TYPE_SMTP_CONNECTION;
				default:
					return '';
			}
		},
		getErrorMessages(error: Object): string[]
		{
			if (Type.isArray(error?.errors))
			{
				return error.errors
					.map((item) => item?.message)
					.filter((message) => Type.isStringFilled(message));
			}

			if (Type.isStringFilled(error?.message))
			{
				return [error.message];
			}

			return [];
		},
		buildErrorDetail(rawError: Object, mailbox?: MailboxPayload): ErrorDetail
		{
			const message = Type.isString(rawError?.message) ? rawError.message : '';
			const rawCode = rawError?.code;
			const code = (Type.isNumber(rawCode) || Type.isStringFilled(rawCode)) ? rawCode : 0;
			let customData = Type.isPlainObject(rawError?.customData)
				? { ...rawError.customData }
				: null;

			if (mailbox && (!customData || !customData.userIdToConnect))
			{
				customData = {
					...customData,
					userIdToConnect: mailbox.userIdToConnect,
				};
			}

			if (customData && Object.keys(customData).length === 0)
			{
				customData = null;
			}

			return {
				code,
				message,
				customData: customData ?? undefined,
			};
		},
		collectErrorDetails(error: Object, mailbox?: MailboxPayload): ErrorDetail[]
		{
			if (Type.isArray(error?.errors) && error.errors.length > 0)
			{
				return error.errors.map((item) => this.buildErrorDetail(item, mailbox));
			}

			return [this.buildErrorDetail(error, mailbox)];
		},
		detectErrorTypeFromDetails(details: ErrorDetail[]): string
		{
			const detectedTypes = new Set(details
				.map((item: ErrorDetail) => this.determineErrorType(item.customData?.type))
				.filter(Boolean));

			if (detectedTypes.has(ERROR_TYPE_IMAP_CONNECTION))
			{
				return ERROR_TYPE_IMAP_CONNECTION;
			}

			if (detectedTypes.has(ERROR_TYPE_SMTP_CONNECTION))
			{
				return ERROR_TYPE_SMTP_CONNECTION;
			}

			if (detectedTypes.has(ERROR_TYPE_AUTH))
			{
				return ERROR_TYPE_AUTH;
			}

			return '';
		},

		handleCancel(): void
		{
			this.isCancelled = true;
			this.isFinished = true;

			UI.Notification.Center.notify({
				id: 'mail_massconnect_connection_cancelled',
				content: this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_CANCELLED_MESSAGE'),
			});
		},

		handleFixErrors(): void
		{
			Dom.show(document.querySelector('.ui-side-panel-toolbar'));
			this.$emit('fix-errors', this.errorDetails, this.successfulCount, this.detectedErrorType);
		},

		closeWizard(): void
		{
			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				slider.close();
			}
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__connection-status-view">
			<div
				v-if="!isFinished"
				class="mail_massconnect__connection-status-view_content --processing"
				data-test-id="mail_massconnect__connection-status-view_processing"
			>
				<div class="mail_massconnect__connection-status_processing-upper">
					<div class="mail_massconnect__connection-status-view_icon --processing"></div>
					<div class="mail_massconnect__connection-status-view_text">
						<template v-for="part in statusParts" :key="part.key">

							<span v-if="part.type === 'text'">{{ part.value }}</span>

							<span
								v-else-if="part.type === 'counter'"
								class="mail_massconnect__connection-status-view_text_counter"
							>
								<Transition name="mail_massconnect__connection-status-view_text_counter_counter-slide-up">
									<span
										:key="part.key + '-' + part.value"
										class="mail_massconnect__connection-status-view_text_counter_value"
									>
										{{ part.value }}
									</span>
								</Transition>
							</span>

							<span
								v-else
								class="mail_massconnect__connection-status-view_text_counter"
							>
								{{ part.value }}
							</span>

						</template>
					</div>
					<div
						v-if="errorCount > 0"
						class="mail_massconnect__connection-status-view_error-text"
					>
						<BIcon
							:name="outline.ALERT_ACCENT"
							:size="24"
							color="var(--ui-color-text-alert)"
						/>
						<span class="mail_massconnect__connection-status-view_error-text_wrapper">
							<template v-for="part in errorStatusParts" :key="part.key">
								<span v-if="part.type === 'text'">{{ part.value }}</span>

								<span
									v-else-if="part.type === 'counter'"
									class="mail_massconnect__connection-status-view_error-text_counter"
								>
									<Transition name="mail_massconnect__connection-status-view_text_counter_counter-slide-up">
										<span
											:key="part.key + '-' + part.value"
											class="mail_massconnect__connection-status-view_text_counter_value"
										>
											{{ part.value }}
										</span>
									</Transition>
								</span>
							</template>
						</span>
					</div>
				</div>
				<UiButton
					:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_CANCEL_BUTTON_TITLE')"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					@click="handleCancel"
					class="mail_massconnect__connection-status_cancel-button"
				/>
			</div>

			<div
				v-if="isSuccess"
				class="mail_massconnect__connection-status-view_content"
				data-test-id="mail_massconnect__connection-status-view_success"
			>
				<div class="mail_massconnect__connection-status-view_icon --success"></div>
				<div class="mail_massconnect__connection-status-view_text">
					{{ successMessage }}
				</div>
				<UiButton
					:text="successButtonText"
					:style="successButtonStyle"
					:size="successButtonSize"
					@click="closeWizard"
				/>
			</div>

			<div
				v-if="hasErrors"
				class="mail_massconnect__connection-status-view_content"
				data-test-id="mail_massconnect__connection-status-view_has-errors"
			>
				<div class="mail_massconnect__connection-status-view_icon --failure"></div>
				<div class="mail_massconnect__connection-status_failure-text-container">
					<div class="mail_massconnect__connection-status_failure-text-title">
						{{ errorTitle }}
					</div>
					<div class="mail_massconnect__connection-status_failure-text-description">
						{{ errorDescription }}
						<span
							v-if="hasErrorDetails"
							class="mail_massconnect__connection-status_details-link"
							v-hint="getErrorDetailsHintParams"
						>{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_DETAILS_LINK') }}</span>
					</div>
				</div>
				<div
					class="mail_massconnect__connection-status-view_buttons"
					data-test-id="mail_massconnect__connection-status-view_has-errors_buttons"
				>
					<UiButton
						v-if="isFixableError"
						:text="fixButtonText"
						:style="AirButtonStyle.FILLED"
						:rightCounterValue="isGlobalConnectionError ? null : errorCount"
						size="ui-btn-lg"
						class="mail_massconnect__connection-status-view_has-errors_buttons_fix-button"
						@click="handleFixErrors"
					/>
					<UiButton
						:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE')"
						:style="AirButtonStyle.PLAIN"
						class="mail_massconnect__connection-status-view_has-errors_buttons_close-button"
						size="ui-btn-lg"
						@click="closeWizard"
					/>
				</div>
			</div>
		</div>
	`,
};
