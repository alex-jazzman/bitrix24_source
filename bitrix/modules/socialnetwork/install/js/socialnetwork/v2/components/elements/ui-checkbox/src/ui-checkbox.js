import './ui-checkbox.css';

// @vue/component
export const UiCheckbox = {
	props: {
		isChecked: {
			type: Boolean,
			default: false,
		},
		isDisabled: {
			type: Boolean,
			default: false,
		},
		isHighlighted: {
			type: Boolean,
			default: false,
		},
		tag: {
			type: String,
			default: 'label',
		},
	},
	emits: [
		'change',
		'click',
	],
	data(): Object
	{
		return {
			isCheckedInner: false,
		};
	},
	watch: {
		isChecked(value): void {
			this.isCheckedInner = value;
		},
		isCheckedInner(value): void {
			this.$emit('change', value);
		},
	},
	mounted(): void
	{
		this.isCheckedInner = this.isChecked;
	},
	methods: {
		handleClick(event): void
		{
			event.stopPropagation();
			this.$emit('click', event);
		},
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
	`,
};
