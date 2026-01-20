import { Button, ButtonSize, ButtonColor } from 'booking.component.button';

// @vue/component
export const ConfirmButton = {
	name: 'ConfirmButton',
	components: {
		UiButton: Button,
	},
	props: {
		buttonText: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
		};
	},
	template: `
		<UiButton
			:text="buttonText"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.PRIMARY"
			:disabled
			noCaps
			useAirDesign
		/>
	`,
};
