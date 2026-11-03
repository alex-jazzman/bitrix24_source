/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3, ui_vue3_components_switcher) {
	'use strict';

	const AccessibleSwitcher = ui_vue3.defineComponent({
		name: 'AccessibleSwitcher',
		components: {
			UiSwitcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			modelValue: {
				type: Boolean,
				default: false
			},
			ariaLabel: {
				type: String,
				required: true
			},
			options: {
				type: Object,
				default: () => ({})
			}
		},
		emits: ['update:modelValue'],
		methods: {
			onCheck() {
				this.$emit('update:modelValue', true);
			},
			onUncheck() {
				this.$emit('update:modelValue', false);
			},
			onKeyboardToggle() {
				this.$emit('update:modelValue', !this.modelValue);
			}
		},
		template: `
		<div
			class="sonet-elements-accessible-switcher"
			role="switch"
			tabindex="0"
			:aria-checked="modelValue ? 'true' : 'false'"
			:aria-label="ariaLabel"
			@keydown.space.prevent="onKeyboardToggle"
			@keydown.enter.prevent="onKeyboardToggle"
		>
			<UiSwitcher
				:isChecked="modelValue"
				:options="options"
				@check="onCheck"
				@uncheck="onUncheck"
			/>
		</div>
	`
	});

	exports.AccessibleSwitcher = AccessibleSwitcher;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Vue3, BX.UI.Vue3.Components);
//# sourceMappingURL=accessible-switcher.bundle.js.map
