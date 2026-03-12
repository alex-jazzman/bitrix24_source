import './style.css';

export const ToastColorScheme: Record<string, string> = {
	Warning: 'warning',
};

// @vue/component
export const Toast = {
	// eslint-disable-next-line vue/multi-word-component-names
	name: 'Toast',
	props: {
		colorScheme: {
			type: String,
			default: ToastColorScheme.Warning,
			validator: (value) => Object.values(ToastColorScheme).includes(value),
			required: false,
		},
	},
	computed: {
		colorClass(): string
		{
			return `--${this.colorScheme}`;
		},
	},
	template: `
		<div class="bizprocdesigner-editor-toast" :class="colorClass">
			<slot></slot>
		</div>
	`,
};
