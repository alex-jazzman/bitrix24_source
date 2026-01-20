import './ui-error-message.css';

// @vue/component
export const UiErrorMessage = {
	name: 'UiErrorMessage',
	props: {
		message: {
			type: String,
			default: '',
		},
	},
	template: `
		<div class="booking__ui-error-message_container">
			<div class="booking__ui-error-message">
				<span class="booking__ui-error-message_icon ui-icon-set --warning"></span>
				<span>{{ message }}</span>
			</div>
		</div>
	`,
};
