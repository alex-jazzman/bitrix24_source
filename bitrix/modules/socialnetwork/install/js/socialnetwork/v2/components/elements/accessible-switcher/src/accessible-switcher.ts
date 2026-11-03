import { defineComponent, type PropType } from 'ui.vue3';
import { Switcher as UiSwitcher } from 'ui.vue3.components.switcher';
import { type SwitcherOptions } from 'ui.switcher';

import './accessible-switcher.css';

// @vue/component
export const AccessibleSwitcher = defineComponent({
	name: 'AccessibleSwitcher',
	components: {
		UiSwitcher,
	},
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		ariaLabel: {
			type: String,
			required: true,
		},
		options: {
			type: Object as PropType<Partial<SwitcherOptions>>,
			default: (): Partial<SwitcherOptions> => ({}),
		},
	},
	emits: ['update:modelValue'],
	methods: {
		onCheck(): void
		{
			this.$emit('update:modelValue', true);
		},
		onUncheck(): void
		{
			this.$emit('update:modelValue', false);
		},
		onKeyboardToggle(): void
		{
			this.$emit('update:modelValue', !this.modelValue);
		},
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
	`,
});
