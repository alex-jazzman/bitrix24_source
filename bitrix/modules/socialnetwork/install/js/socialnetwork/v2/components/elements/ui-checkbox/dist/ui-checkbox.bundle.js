/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports) {
	'use strict';

	// @vue/component
	const UiCheckbox = {
		props: {
			isChecked: {
				type: Boolean,
				default: false
			},
			isDisabled: {
				type: Boolean,
				default: false
			},
			isHighlighted: {
				type: Boolean,
				default: false
			},
			tag: {
				type: String,
				default: 'label'
			}
		},
		emits: ['change', 'click'],
		data() {
			return {
				isCheckedInner: false
			};
		},
		watch: {
			isChecked(value) {
				this.isCheckedInner = value;
			},
			isCheckedInner(value) {
				this.$emit('change', value);
			}
		},
		mounted() {
			this.isCheckedInner = this.isChecked;
		},
		methods: {
			handleClick(event) {
				event.stopPropagation();
				this.$emit('click', event);
			}
		},
		template: `
		<component
			:is="tag"
			class="socnet-checkbox"
			:class="{
				'socnet-checkbox_checked': isCheckedInner,
				'socnet-checkbox_disabled': isDisabled,
				'socnet-checkbox_highlighted': isHighlighted,
			}"
			@click="handleClick"
		>
			<input
				v-model="isCheckedInner"
				class="socnet-checkbox__native"
				type="checkbox"
				:disabled="isDisabled"
			>
			<span
				class="socnet-checkbox__checkmark"
			></span>
		</component>
	`
	};

	exports.UiCheckbox = UiCheckbox;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {});
//# sourceMappingURL=ui-checkbox.bundle.js.map
