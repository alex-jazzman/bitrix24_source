import { Dom, Loc, Type } from 'main.core';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';
import { mapState } from 'ui.vue3.pinia';
import { LocalizationMixin } from '../../../mixins/localization-mixin';
import { Api } from '../../../api';
import { EventName } from '../../../event';
import { MailboxPayload } from '../../../store/type';
import { sendData as analyticsSendData } from 'ui.analytics';
import './connection-status.css';
import { useWizardStore } from '../../../store/wizard';

// @vue/component
export const ConnectionStatus = {
	name: 'connection-status',

	components: {
		UiButton,
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
		};
	},

	data(): Object
	{
		return {
			totalMailboxes: 0,
			processedCount: 0,
			successfulCount: 0,
			errorCount: 0,
			errorDetails: [],
			isCancelled: false,
			isFinished: false,
		};
	},

	computed: {
		...mapState(useWizardStore, ['analyticsSource', 'calendarSettings', 'crmSettings']),
		hasErrors(): boolean
		{
			return this.isFinished && this.errorCount > 0;
		},
		isSuccess(): boolean
		{
			return this.isFinished && this.errorCount === 0;
		},
		statusText(): string
		{
			return this.loc('MAIL_MASSCONNECT_FORM_CONNECTION_STATUS', {
				'#SUCCESSFUL_CNT#': this.successfulCount,
				'#TOTAL_CNT#': this.totalMailboxes,
				'#ERROR_CNT#': this.errorCount,
			});
		},
		errorText(): string
		{
			return Loc.getMessagePlural(
				'MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_TITLE',
				this.errorCount,
				{ '#ERROR_CNT#': this.errorCount },
			);
		},
	},

	created(): void
	{
		Dom.hide(document.querySelector('.ui-side-panel-toolbar'));
		this.totalMailboxes = this.mailboxes.length;
		this.startProcessing();
	},

	methods: {
		async startProcessing(): void
		{
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
				let message = '';
				if (Type.isArray(error.errors) && error.errors[0])
				{
					message = error.errors[0]?.message;
				}
				else
				{
					message = error.message;
				}

				this.errorDetails = this.mailboxes.map((mailbox) => ({
					customData: { userIdToConnect: mailbox.userIdToConnect },
					message,
				}));
				this.errorCount = this.mailboxes.length;
				this.isFinished = true;

				return;
			}

			this.processMailboxes(this.mailboxes, massConnectId);
		},

		async processMailboxes(mailboxes: MailboxPayload[], massConnectId: number): void
		{
			for (const mailbox of this.mailboxes)
			{
				if (this.isCancelled)
				{
					// push cancellation error for each unprocessed mailbox to show in the error fixing step
					this.errorDetails.push({
						code: 0,
						customData: { userIdToConnect: mailbox.userIdToConnect },
						message: '', // ToDo: localize cancellation message
					});

					continue;
				}

				try
				{
					// eslint-disable-next-line no-await-in-loop
					await Api.connectMailbox(mailbox, massConnectId);

					this.successfulCount++;
				}
				catch (error)
				{
					this.errorCount++;

					if (error.errors[0])
					{
						this.errorDetails.push(error.errors[0]);
					}
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

		handleCancel(): void
		{
			this.isCancelled = true;
			this.isFinished = true;
		},

		handleFixErrors(): void
		{
			Dom.show(document.querySelector('.ui-side-panel-toolbar'));
			this.$emit('fix-errors', this.errorDetails, this.successfulCount);
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
				class="mail_massconnect__connection-status-view_content"
				data-test-id="mail_massconnect__connection-status-view_processing"
			>
				<div class="mail_massconnect__connection-status-view_icon --processing"></div>
				<span class="mail_massconnect__connection-status-view_text">{{ statusText }}</span>
				<UiButton
					:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_CANCEL_BUTTON_TITLE')"
					:style="AirButtonStyle.FILLED"
					@click="handleCancel"
				/>
			</div>

			<div 
				v-if="isSuccess" 
				class="mail_massconnect__connection-status-view_content"
				data-test-id="mail_massconnect__connection-status-view_success"
			>
				<div class="mail_massconnect__connection-status-view_icon --success"></div>
				<span class="mail_massconnect__connection-status-view_text">
					{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_SUCCESS_ALL_CONNECTED') }}
				</span>
				<UiButton
					:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_CLOSE_WIZARD_BUTTON_TITLE')"
					:style="AirButtonStyle.FILLED"
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
						{{ errorText }}
					</div>
					<div class="mail_massconnect__connection-status_failure-text-description">
						{{ loc('MAIL_MASSCONNECT_FORM_CONNECTION_FAILURE_DESCRIPTION') }}
					</div>
				</div>
				<div
					class="mail_massconnect__connection-status-view_buttons"
					data-test-id="mail_massconnect__connection-status-view_has-errors_buttons"
				>
					<UiButton
						:text="loc('MAIL_MASSCONNECT_FORM_CONNECTION_FIX_BUTTON_TITLE')"
						:style="AirButtonStyle.FILLED"
						:rightCounterValue="errorCount"
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
