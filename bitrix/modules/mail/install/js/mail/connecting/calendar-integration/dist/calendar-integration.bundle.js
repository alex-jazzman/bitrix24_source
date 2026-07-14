/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Connecting = this.BX.Mail.Connecting || {};
(function (exports, ui_vue3, ui_vue3_components_switcher, ui_switcher, ui_system_typography_vue, main_core) {
	'use strict';

	function loc(phraseCode, replacements = {}) {
		return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
	}

	const CalendarIntegration = ui_vue3.defineComponent({
		name: 'calendar-integration',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		setup() {
			return {
				loc
			};
		},
		props: {
			modelValue: {
				type: Object,
				required: true
			},
			backgroundColor: {
				type: String,
				default: ''
			},
			showSwitcher: {
				type: Boolean,
				default: true
			}
		},
		emits: ['update:modelValue'],
		computed: {
			localModelValue: {
				get() {
					return this.modelValue;
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.large,
					showStateTitle: false,
					useAirDesign: true
				};
			}
		},
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
	`
	});

	exports.CalendarIntegration = CalendarIntegration;

})(this.BX.Mail.Connecting.CalendarIntegration = this.BX.Mail.Connecting.CalendarIntegration || {}, BX.Vue3, BX.UI.Vue3.Components, BX.UI, BX.UI.System.Typography.Vue, BX);
//# sourceMappingURL=calendar-integration.bundle.js.map
