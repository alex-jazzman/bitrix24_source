/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports) {
	'use strict';

	// @vue/component
	const UiRadio = {
		name: 'UiRadio',
		props: {
			modelValue: {
				type: [Number, String],
				default: undefined
			},
			value: {
				type: [Number, String],
				required: true
			},
			disabled: {
				type: Boolean,
				default: false
			},
			inputId: {
				type: String,
				default: ''
			},
			inputClassName: {
				type: [Array, Object, String],
				default: ''
			},
			inputName: {
				type: String,
				default: ''
			},
			tag: {
				type: String,
				default: 'span'
			}
		},
		emits: ['update:modelValue', 'change', 'focus', 'blur'],
		computed: {
			model: {
				get() {
					return this.modelValue;
				},
				set(value) {
					this.$emit('update:modelValue', value);
				}
			}
		},
		template: `
		<Component
			:is="tag"
			class="socialnetwork--ui-radio"
		>
			<input
				v-model="model"
				:id="inputId"
				type="radio"
				:disabled
				:value
				:name="inputName"
				:class="[
					'socialnetwork--ui-radio--input',
					inputClassName
				].flat(1)"
				@focus="$emit('focus', $event)"
				@blur="$emit('blur', $event)"
				@change="$emit('change', $event)"
			/>
		</Component>
	`
	};

	exports.UiRadio = UiRadio;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {});
//# sourceMappingURL=ui-radio.bundle.js.map
