import { useWizardStore } from '../../../../store/wizard';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { MailIntegration } from 'mail.connecting.mail-sync-settings';
import { CrmIntegration } from 'mail.connecting.crm-integration';
import { CalendarIntegration } from 'mail.connecting.calendar-integration';
import { Switcher } from 'ui.vue3.components.switcher';
import { SwitcherSize } from 'ui.switcher';
import { LocalizationMixin } from '../../../../mixins/localization-mixin';
import { sendData as analyticsSendData } from 'ui.analytics';
import './mailbox-settings.css';

export const MailboxSettings = {
	components: {
		MailIntegration,
		CrmIntegration,
		CalendarIntegration,
		Switcher,
	},

	mixins: [LocalizationMixin],

	computed: {
		...mapState(
			useWizardStore,
			[
				'mailSettings',
				'crmSettings',
				'calendarSettings',
				'analyticsSource',
				'permissions',
				'mailSyncOptions',
				'crmSyncOptions',
				'crmEntityOptions',
				'crmSourceOptions',
				'isCrmAvailable',
			],
		),
		switcherOptions(): Object
		{
			return {
				size: SwitcherSize.large,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
	},

	methods: {
		...mapActions(useWizardStore, ['setMailSettings', 'setCrmSettings', 'setCalendarSettings']),
		onStepComplete(): void
		{
			const calendarState = this.calendarSettings.enabled ? 'true' : 'false';
			const crmState = this.crmSettings.enabled ? 'true' : 'false';

			analyticsSendData({
				tool: 'mail',
				event: 'mailbox_mass_step3',
				category: 'mail_mass_ops',
				c_section: this.analyticsSource,
				p1: `integrationCalendar_${calendarState}`,
				p2: `integrationCRM_${crmState}`,
			});
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__mailbox-settings_form">
			<div class="mail_massconnect__section-title_container">
				<span class="mail_massconnect__section-title">
					{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CARD_TITLE') }}
				</span>
				<span class="mail_massconnect__section-description">
					{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CARD_DESCRIPTION') }}
				</span>
			</div>

			<MailIntegration
				:model-value="mailSettings"
				:sync-period-options="mailSyncOptions"
				@update:model-value="setMailSettings($event)"
			/>

			<CrmIntegration
				v-if="isCrmAvailable"
				:model-value="crmSettings"
				:can-edit-crm-integration="permissions.canEditCrmIntegration"
				:sync-period-options="crmSyncOptions"
				:entity-options="crmEntityOptions"
				:source-options="crmSourceOptions"
				:show-vcf-option="true"
				@update:model-value="setCrmSettings($event)"
			/>

			<CalendarIntegration
				:model-value="calendarSettings"
				@update:model-value="setCalendarSettings($event)"
			/>
		</div>
	`,
};
