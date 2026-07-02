import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize, ButtonState } from 'ui.vue3.components.button';

import { optionService } from 'booking.provider.service.option-service';
import { Model, Grid, Option } from 'booking.const';

import './switch-view-button.css';

// @vue/component
export const SwitchViewButton = {
	name: 'SwitchViewButton',
	components: {
		UiButton,
	},
	props: {
		container: {
			type: HTMLElement,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonColor,
			ButtonSize,
			ButtonState,
			Grid,
		};
	},
	computed: {
		...mapGetters({
			gridMode: `${Model.Interface}/gridMode`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
		}),
	},
	watch: {
		async gridMode(newValue, oldValue): void
		{
			if (newValue !== oldValue)
			{
				await optionService.set(Option.GridMode, newValue);
			}
		},
	},
	mounted(): void
	{
		this.container.after(this.$refs.dayWeekButton);
	},
	methods: {
		setGridMode(mode: $Values<typeof Grid.Mode>): void
		{
			if (this.gridMode !== mode)
			{
				this.$store.dispatch(`${Model.Interface}/setGridMode`, mode);
			}
		},
	},
	template: `
		<div class="booking-booking__switch-view-button" ref="dayWeekButton">
			<UiButton
				:text="loc('BOOKING_BOOKING_SWITZER_DAY_BUTTON')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:state="!isWeekMode ? ButtonState.ACTIVE : null"
				removeRightCorners
				@click="setGridMode(Grid.Mode.Day)"
			/>
			<UiButton
				:text="loc('BOOKING_BOOKING_SWITZER_WEEK_BUTTON')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:state="isWeekMode ? ButtonState.ACTIVE : null"
				removeLeftCorners
				@click="setGridMode(Grid.Mode.Week)"
			/>
		</div>
	`,
};
