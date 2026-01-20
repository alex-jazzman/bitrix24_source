import './checkbox.css';

// @vue/component
export const Checkbox = {
	props: {
		important: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		checked: {
			type: Boolean,
			default: false,
		},
		highlight: {
			type: Boolean,
			default: false,
		},
		tag: {
			type: String,
			default: 'label',
		},
	},
	emits: ['click'],
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
			class="tasks-card-checkbox"
			:class="{
				'--important': important,
				'--disabled': disabled,
				'--highlight': highlight,
			}"
			@click.stop
		>
			<input
				type="checkbox"
				:checked="checked"
				:disabled="disabled"
				@click="handleClick"
			>
			<span></span>
		</component>
	`,
};
