import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize, ButtonState } from 'ui.vue3.components.button';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';

import { ahaMoments } from 'booking.lib.aha-moments';
import { limit } from 'booking.lib.limit';
import { optionService } from 'booking.provider.service.option-service';
import { AhaMoment, Grid, LimitFeatureId, Model, Option } from 'booking.const';

import './switch-view-button.css';

// @vue/component
export const SwitchViewButton = {
	name: 'SwitchViewButton',
	components: {
		Icon,
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
			IconSet,
		};
	},
	computed: {
		...mapGetters({
			gridMode: `${Model.Interface}/gridMode`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
			isLoaded: `${Model.Interface}/isLoaded`,
		}),
		isMultidayFeatureEnabled(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingLong;
		},
	},
	watch: {
		async gridMode(newValue, oldValue): void
		{
			if (newValue !== oldValue)
			{
				await optionService.set(Option.GridMode, newValue);
			}
		},
		isLoaded(): void
		{
			void this.tryShowAhaMoment();
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
				void this.$store.dispatch(`${Model.Interface}/setGridMode`, mode);
			}
		},
		handleWeekClick(): void
		{
			if (!this.isMultidayFeatureEnabled)
			{
				void limit.show(LimitFeatureId.MultidayBooking);

				return;
			}

			this.setGridMode(Grid.Mode.Week);
		},
		async tryShowAhaMoment(): Promise<void>
		{
			if (!ahaMoments.shouldShow(AhaMoment.WeekView))
			{
				return;
			}

			await ahaMoments.show({
				id: 'booking-week-view',
				title: this.loc('BOOKING_AHA_WEEK_VIEW_TITLE'),
				text: this.loc('BOOKING_AHA_WEEK_VIEW_TEXT'),
				target: this.$refs.weekButton,
			});

			ahaMoments.setShown(AhaMoment.WeekView);
		},
	},
	template: `
		<div class="booking-booking__switch-view-container" ref="dayWeekButton">
			<UiButton
				class="booking-booking__switch-view-button"
				:dataset="{ id: 'booking-booking-switch-view-day-button' }"
				:text="loc('BOOKING_BOOKING_SWITZER_DAY_BUTTON')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:state="!isWeekMode ? ButtonState.ACTIVE : null"
				removeRightCorners
				@click="setGridMode(Grid.Mode.Day)"
			/>
			<div
				ref="weekButton"
				class="booking-booking__switch-view-button"
				data-id="booking-booking-switch-view-week-button"
				:class="{'--locked': !isMultidayFeatureEnabled}"
				@click="handleWeekClick"
			>
				<UiButton
					:text="loc('BOOKING_BOOKING_SWITZER_WEEK_BUTTON')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.OUTLINE_NO_ACCENT"
					:state="isWeekMode ? ButtonState.ACTIVE : null"
					removeLeftCorners
				/>
				<Icon v-if="!isMultidayFeatureEnabled" :name="IconSet.LOCK"/>
			</div>
		</div>
	`,
};
