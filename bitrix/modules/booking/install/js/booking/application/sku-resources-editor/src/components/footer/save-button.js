import { Button, ButtonSize, ButtonColor } from 'booking.component.button';

// @vue/component
export const SaveButton = {
	name: 'SaveButton',
	components: {
		UiButton: Button,
	},
	emits: ['click'],
	// eslint-disable-next-line flowtype/require-return-type
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
		};
	},
	template: `
		<UiButton
			:text="loc('BOOKING_SRE_APP_SAVE_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.PRIMARY"
			noCaps
			useAirDesign
			@click="$emit('click')"
		/>
	`,
};
