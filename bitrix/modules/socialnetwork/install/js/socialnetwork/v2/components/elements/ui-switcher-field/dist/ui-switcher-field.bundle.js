/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3, ui_vue3_components_switcher, ui_switcher, ui_system_typography_vue, socialnetwork_v2_components_elements_questionMark) {
	'use strict';

	// @vue/component
	const UiSwitcherField = ui_vue3.defineComponent({
		name: 'UiSwitcherField',
		components: {
			QuestionMark: socialnetwork_v2_components_elements_questionMark.QuestionMark,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			UiSwitcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			label: {
				type: String,
				default: ''
			},
			modelValue: {
				type: Boolean,
				default: false
			},
			hint: {
				type: [String, null],
				default: null
			},
			hintOptions: {
				type: Object,
				default: null
			}
		},
		emits: ['update:modelValue', 'click'],
		computed: {
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.extraSmall,
					showStateTitle: false,
					useAirDesign: true
				};
			},
			status() {
				return this.modelValue ? this.loc('SONET_EXT_PROJECT_WIZARD_UI_SWITCHER_FIELD_ON') : this.loc('SONET_EXT_PROJECT_WIZARD_UI_SWITCHER_FIELD_OFF');
			}
		},
		methods: {
			onCheck() {
				this.$emit('update:modelValue', true);
			},
			onUncheck() {
				this.$emit('update:modelValue', false);
			},
			onKeyboardToggle() {
				this.$emit('update:modelValue', !this.modelValue);
				this.$emit('click');
			}
		},
		template: `
		<div class="sonet-elements-switcher-field">
			<div class="sonet-elements-switcher-field-toggle socialnetwork--project-wizard--ui-switcher-field--line">
				<div
					class="socialnetwork--project-wizard--ui-switcher-field--left-col"
					role="switch"
					tabindex="0"
					:aria-checked="modelValue ? 'true' : 'false'"
					:aria-label="label"
					@click="$emit('click')"
					@keydown.space.prevent="onKeyboardToggle"
					@keydown.enter.prevent="onKeyboardToggle"
				>
					<UiSwitcher
						:isChecked="modelValue"
						:options="switcherOptions"
						@check="onCheck"
						@uncheck="onUncheck"
					/>
				</div>
				<div class="sonet-elements-switcher-field-label_wrapper">
					<slot name="label" :label="label">
						<div class="sonet-elements-switcher-field-label">
							<TextMd class="sonet-elements-switcher-field-title">
								{{ label }}
							</TextMd>
						</div>
					</slot>
					<QuestionMark
						v-if="hint"
						:hintText="hint"
						:size="hintOptions?.size"
						:hintMaxWidth="hintOptions?.maxWidth"/>
				</div>
			</div>
			<div class="socialnetwork--project-wizard--ui-switcher-field--line">
				<div class="socialnetwork--project-wizard--ui-switcher-field--left-col"></div>
				<slot name="underline" :status="status">
					<TextXs class="socialnetwork--project-wizard--ui-switcher-field--description">
						{{ status }}
					</TextXs>
				</slot>
			</div>
		</div>
	`
	});

	exports.UiSwitcherField = UiSwitcherField;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Vue3, BX.UI.Vue3.Components, BX.UI, BX.UI.System.Typography.Vue, BX.Socialnetwork.V2.Components.Elements);
//# sourceMappingURL=ui-switcher-field.bundle.js.map
