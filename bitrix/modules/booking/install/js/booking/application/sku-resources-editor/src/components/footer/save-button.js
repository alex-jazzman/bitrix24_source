import { Button, ButtonSize, ButtonColor } from 'booking.component.button';

// @vue/component
export const SaveButton = {
	name: 'SaveButton',
	components: {
		UiButton: Button,
	},
	emits: ['click'],
	setup(): { ButtonSize: typeof ButtonSize, ButtonColor: typeof ButtonColor }
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
