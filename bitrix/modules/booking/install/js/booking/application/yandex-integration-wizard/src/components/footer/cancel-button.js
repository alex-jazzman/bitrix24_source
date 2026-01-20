import { Button, ButtonSize, ButtonColor } from 'booking.component.button';

// @vue/component
export const CancelButton = {
	name: 'CancelButton',
	components: {
		UiButton: Button,
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
			class="yandex-integration-wizard__cancel-button"
			:text="loc('YANDEX_WIZARD_FOOTER_CANCEL_BUTTON')"
			:size="ButtonSize.LARGE"
			:color="ButtonColor.LINK"
			noCaps
		/>
	`,
};
