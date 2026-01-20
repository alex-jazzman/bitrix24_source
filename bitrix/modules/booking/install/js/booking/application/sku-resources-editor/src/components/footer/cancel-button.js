import { Button, ButtonSize, ButtonColor } from 'booking.component.button';

// @vue/component
export const CancelButton = {
	name: 'CancelButton',
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
			class="booking-sre-app__cancel-button"
			:text="loc('BOOKING_SRE_APP_CANCEL_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.LINK"
			noCaps
			@click="$emit('click')"
		/>
	`,
};
