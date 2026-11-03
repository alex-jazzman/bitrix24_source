/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3) {
	'use strict';

	const CallInput = ui_vue3.defineComponent({
		name: 'CallInput',
		inheritAttrs: false,
		props: {
			placeholder: {
				type: String,
				default: ''
			},
			modelValue: {
				type: String,
				default: ''
			},
			name: {
				type: String,
				default: 'call-input'
			}
		},
		emits: ['update:modelValue', 'enter'],
		template: `
		<div class="call-input">
			<input
				:name="name"
				type="text"
				class="call-input__field"
				:placeholder="placeholder"
				:value="modelValue"
				@input="$emit('update:modelValue', $event.target.value)"
				@keydown.enter.prevent="$emit('enter', modelValue)"
				v-bind="$attrs"
			/>
			<div v-if="$slots.right" class="call-input__right">
				<slot name="right"></slot>
			</div>
		</div>
	`
	});

	exports.CallInput = CallInput;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3);
//# sourceMappingURL=input.bundle.js.map
