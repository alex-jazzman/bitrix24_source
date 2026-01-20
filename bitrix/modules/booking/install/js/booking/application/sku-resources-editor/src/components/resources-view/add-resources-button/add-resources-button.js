import { Model } from 'booking.const';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'booking.component.button';

import { ResourcesSelector } from './resources-selector';

// @vue/component
export const AddResourcesButton = {
	name: 'AddResourcesButton',
	components: {
		ResourcesSelector,
		UiButton,
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
	computed: {
		resourcesIds(): number[]
		{
			return [...this.$store.state[Model.SkuResourcesEditor].resourcesSkusMap.keys()];
		},
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
				:text="loc('BOOKING_SRE_ADD_RESOURCE_BUTTON')"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				noCaps
				useAirDesign
				@click="togglePopup"
			/>
			<ResourcesSelector
				v-if="shownPopup"
				:targetNode="$refs.btn.$el"
				:resourcesIds
				@close="shownPopup = false"
			/>
		</div>
	`,
};
