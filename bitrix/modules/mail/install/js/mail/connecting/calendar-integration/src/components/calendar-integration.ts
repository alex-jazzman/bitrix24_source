import { defineComponent, type PropType } from 'ui.vue3';
import { Switcher } from 'ui.vue3.components.switcher';
import { SwitcherSize } from 'ui.switcher';
import { HeadlineSm } from 'ui.system.typography.vue';

import { loc } from '../mixins/localization-mixin';
import type { CalendarIntegrationSettingsType } from '../utils/calendar-integration-settings-type';
import '../css/calendar-integration.css';

// @vue/component
export const CalendarIntegration = defineComponent({
	name: 'calendar-integration',

	components: {
		Switcher,
		HeadlineSm,
	},

	setup()
	{
		return {
			loc,
		};
	},

	props: {
		modelValue: {
			type: Object as PropType<CalendarIntegrationSettingsType>,
			required: true,
		},
		backgroundColor: {
			type: String,
			default: '',
		},
		showSwitcher: {
			type: Boolean,
			default: true,
		},
	},

	emits: ['update:modelValue'],

	computed: {
		localModelValue: {
			get(): CalendarIntegrationSettingsType
			{
				return this.modelValue;
			},
			set(newValue: CalendarIntegrationSettingsType): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		switcherOptions(): { size: string; showStateTitle: boolean; useAirDesign: boolean }
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
		<div
			class="mail_massconnect__integration-block"
			:class="{ '--disabled': showSwitcher && !localModelValue.enabled }"
			:style="backgroundColor && (localModelValue.enabled || !showSwitcher) ? { background: backgroundColor } : undefined"
			data-test-id="mail_massconnect__settings_calendar-integration"
		>
			<div
				class="mail_massconnect__integration-block_header"
				data-test-id="mail_massconnect__settings_calendar-integration_header"
			>
				<div class="mail_massconnect__integration-block_title_group">
					<div class="mail_massconnect__integration-block_icon --calendar"></div>
					<HeadlineSm>{{ loc('MAIL_MASSCONNECT_FORM_MAILBOX_SETTINGS_INTEGRATION_CALENDAR_TITLE') }}</HeadlineSm>
				</div>
				<Switcher
					v-if="showSwitcher"
					:isChecked="localModelValue.enabled"
					:options="switcherOptions"
					@click="localModelValue.enabled = !localModelValue.enabled"
					data-test-id="mail_massconnect__settings_calendar-integration_switcher"
				/>
			</div>
			<transition name="mail_massconnect__integration-block_slide-down">
				<div v-if="localModelValue.enabled || !showSwitcher" class="mail_massconnect__integration-block_content">
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
});
