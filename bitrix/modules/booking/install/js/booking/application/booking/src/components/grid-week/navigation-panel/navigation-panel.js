import { DateTimeFormat } from 'main.date';
import { EventEmitter } from 'main.core.events';

import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';

import { EventName, Model } from 'booking.const';
import './navigation-panel.css';

// @vue/component
export const NavigationPanel = {
	name: 'NavigationPanel',
	components: {
		UiButton,
	},
	setup(): {AirButtonStyle: typeof AirButtonStyle, ButtonSize: typeof ButtonSize, Outline: typeof Outline }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	computed: {
		selectedDateTs(): number
		{
			return this.$store.getters[`${Model.Interface}/selectedDateTs`];
		},
		dateFormatted(): string
		{
			return DateTimeFormat.format('f', this.selectedDateTs / 1000);
		},
	},
	methods: {
		showPreviousWeek(): void
		{
			EventEmitter.emit(EventName.MultiBookingShowPreviousPeriod);
		},
		showNextWeek(): void
		{
			EventEmitter.emit(EventName.MultiBookingShowNextPeriod);
		},
		setToday(): void
		{
			const today = new Date();
			void this.$store.dispatch(
				`${Model.Interface}/setSelectedDateTs`,
				new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
			);
		},
	},
	template: `
		<div class="booking-booking__grid-navigation-panel_container">
			<div class="booking-booking__grid-navigation-panel_container-title">{{ dateFormatted }}</div>

			<div class="booking-booking__grid-navigation-panel_container-nav-block">
				<UiButton
					data-element="booking-week-grid-navigation-panel-button-back"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.CHEVRON_LEFT_L"
					@click="showPreviousWeek"
				/>
				<UiButton
					:text="loc('BOOKING_BOOKING_WEEK_GRID_NAVIGATION_PANEL_BUTTON_TODAY')"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					data-element="booking-week-grid-navigation-panel-button-today"
					@click="setToday"
				/>
				<UiButton
					data-element="booking-week-grid-navigation-panel-button-next"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.CHEVRON_RIGHT_L"
					@click="showNextWeek"
				/>
			</div>
		</div>
	`,
};
