import { Button as UiButton, AirButtonStyle, ButtonSize } from 'booking.component.button';

import { SkusSelector } from './skus-selector';

// @vue/component
export const AddSkusButton = {
	name: 'AddServiceButton',
	components: {
		SkusSelector,
		UiButton,
	},
	props: {
		skus: {
			type: Array,
			default: () => [],
		},
	},
	setup(): { AirButtonStyle: typeof AirButtonStyle, ButtonSize: typeof ButtonSize }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { shownPopup: boolean }
	{
		return {
			shownPopup: false,
		};
	},
	methods: {
		togglePopup(): void
		{
			this.shownPopup = !this.shownPopup;
		},
	},
	template: `
		<div>
			<UiButton
				ref="btn"
				:text="loc('BOOKING_SRE_ADD_SKU_BUTTON')"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				noCaps
				useAirDesign
				@click="togglePopup"
			/>
			<SkusSelector
				v-if="shownPopup"
				:targetNode="$refs.btn.$el"
				:skus
				@close="shownPopup = false"
			/>
		</div>
	`,
};
