import { Switcher } from 'ui.vue3.components.switcher';
import { SwitcherSize } from 'ui.switcher';
import { LocalizationMixin } from '../../mixins/localization-mixin';
import './integrations.css';
import { CalendarIntegrationSettingsType } from '../../utils/calendar-integration-settings-type';

// @vue/component
export const CalendarIntegration = {
	name: 'calendar-integration',

	components: {
		Switcher,
	},

	mixins: [LocalizationMixin],

	props: {
		/** @type CalendarIntegrationSettingsType */
		modelValue: {
			type: Object,
			required: true,
		},
	},

	emits: [
		'update:modelValue',
	],

	computed: {
		localModelValue: {
			get(): CalendarIntegrationSettingsType
			{
				return this.modelValue;
			},
			set(newValue): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		switcherOptions(): Object
		{
			return {
				size: SwitcherSize.large,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
	},

	// language=Vue
	template: `
		<div class="mail_massconnect__integration-block" :class="{ '--disabled': !localModelValue.enabled }">
			<div 
				class="mail_massconnect__integration-block_header"
				data-test-id="mail_massconnect__settings_calendar-integration_header"
			>
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --calendar"></div>
					<span class="mail_massconnect__integration-block_title">
						{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CALENDAR_TITLE') }}
					</span>
				</div>
				<Switcher
					:isChecked="localModelValue.enabled"
					:options="switcherOptions"
					@click="localModelValue.enabled = !localModelValue.enabled"
				/>
			</div>
			<transition name="mail_massconnect__integration-block_slide-down">
				<div v-if="localModelValue.enabled" class="mail_massconnect__integration-block_content">
					<div class="mail_massconnect__checkbox-group">
						<input
							type="checkbox"
							id="mail_massconnect__auto-add-events"
							v-model="localModelValue.autoAddEvents"
							data-test-id="mail_massconnect__settings_calendar-integration_auto-add-events-checkbox"
						/>
						<label for="mail_massconnect__auto-add-events">
							{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_CALENDAR_AUTO_ADD') }}
						</label>
					</div>
				</div>
			</transition>
		</div>
	`,
};
