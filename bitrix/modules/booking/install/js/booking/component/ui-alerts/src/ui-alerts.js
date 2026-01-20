import { Alert, AlertColor, AlertSize, AlertIcon } from 'ui.alerts';

export { AlertColor, AlertSize, AlertIcon };

// @vue/component
export const UiAlerts = {
	name: 'UiAlert',
	props: {
		text: {
			type: String,
			required: true,
		},
		color: {
			type: String,
			default: null,
		},
		size: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		closeBtn: {
			type: Boolean,
			default: false,
		},
		animated: {
			type: Boolean,
			default: false,
		},
		customClass: {
			type: String,
			default: null,
		},
	},
	watch: {
		text: {
			handler(text): void
			{
				this.alert?.setText(text);
			},
		},
	},
	created(): void
	{
		this.createAlert();
	},
	mounted(): void
	{
		this.renderAlert();
	},
	unmount(): void
	{
		this.alert?.destroy();
	},
	methods: {
		createAlert(): void
		{
			this.alert = new Alert({
				text: this.text,
				color: this.color,
				size: this.size,
				icon: this.icon,
				closeBtn: this.closeBtn,
				animated: this.animated,
				customClass: this.customClass,
			});
		},
		renderAlert(): void
		{
			if (!this.alert)
			{
				this.createAlert();
			}

			this.alert.renderTo(this.$refs.alert);
		},
	},
	template: `
		<div ref="alert"></div>
	`,
};
