import { Button, ButtonSize, ButtonColor } from 'booking.component.button';

// @vue/component
export const CancelButton = {
	name: 'CancelButton',
	components: {
		UiButton: Button,
	},
	setup(): { ButtonSize: typeof ButtonSize, ButtonColor: typeof ButtonColor }
	{
		return {
			ButtonSize,
			ButtonColor,
		};
	},
	template: `
		<UiButton
			class="booking-yiw__cancel-button"
			:text="loc('YANDEX_WIZARD_FOOTER_CANCEL_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.LINK"
			data-element="booking-yiw-btn-cancel"
			noCaps
		/>
	`,
};
