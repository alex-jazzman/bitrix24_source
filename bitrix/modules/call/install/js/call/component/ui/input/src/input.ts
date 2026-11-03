import { defineComponent } from 'ui.vue3';

import './css/input.css';

export const CallInput = defineComponent({
	name: 'CallInput',
	inheritAttrs: false,
	props: {
		placeholder: {
			type: String,
			default: '',
		},
		modelValue: {
			type: String,
			default: '',
		},
		name: {
			type: String,
			default: 'call-input',
		},
	},
	emits: ['update:modelValue', 'enter'],
	template: /* HTML */`
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
	`,
});
