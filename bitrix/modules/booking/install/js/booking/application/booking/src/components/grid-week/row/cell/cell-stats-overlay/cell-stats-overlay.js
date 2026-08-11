import { mapGetters } from 'ui.vue3.vuex';
import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { Counter as UiCounter } from 'ui.vue3.components.counter';
import { CounterSize, CounterStyle } from 'ui.cnt';

import { Model } from 'booking.const';

import './cell-stats-overlay.css';

// @vue/component
export const CellStatsOverlay = {
	name: 'CellStatsOverlay',
	components: {
		UiCounter,
		UiButton,
	},
	props: {
		/** @type { HoveredPlacementSlot } */
		cell: {
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			ButtonColor,
			ButtonSize,
			CounterSize,
			CounterStyle,
		};
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
		}),
		busyCount(): number
		{
			return this.cell.stats?.busySlotsCount ?? 0;
		},
		freeCount(): number
		{
			return this.cell.stats?.freeSlotsCount ?? 0;
		},
	},
	methods: {
		goToDayMode(): void
		{
			void this.$store.dispatch(`${Model.Interface}/goToDayMode`, {
				selectedDateTs: this.cell.fromTs + this.offset,
				resourceId: this.cell.resourceId,
			});
		},
	},
	template: `
		<div class="booking-booking__week-cell-stats-overlay">
			<div class="booking-booking__week-cell-stats-overlay__content">
				<div class="booking-booking__week-cell-stats-overlay__rows">
					<div class="booking-booking__week-cell-stats-overlay__row">
						<span class="booking-booking__week-cell-stats-overlay__row_label">
							{{ loc('BOOKING_BOOKING_WEEK_STATS_CELL_BUSY') }}
						</span>
						<div class="booking-booking__week-cell-stats-overlay__row_counter">
							<UiCounter
								:value="busyCount"
								:maxValue="999"
								:size="CounterSize.LARGE"
								:style="CounterStyle.FILLED_NO_ACCENT"
							/>
						</div>
					</div>
					<div class="booking-booking__week-cell-stats-overlay__row">
						<span class="booking-booking__week-cell-stats-overlay__row_label">
							{{ loc('BOOKING_BOOKING_WEEK_STATS_CELL_FREE') }}
						</span>
						<div class="booking-booking__week-cell-stats-overlay__row_counter">
							<UiCounter
								:value="freeCount"
								:maxValue="999"
								:size="CounterSize.LARGE"
								:style="CounterStyle.FILLED_SUCCESS"
							/>
						</div>
					</div>
				</div>
				<div class="booking-booking__week-cell-stats-overlay__button-container">
					<UiButton
						class="booking-booking__week-cell-stats-overlay__button-container_button"
						:text="loc('BOOKING_BOOKING_SELECT')"
						:size="ButtonSize.EXTRA_EXTRA_SMALL"
						:color="ButtonColor.PRIMARY"
						@click="goToDayMode()"
					/>
				</div>
			</div>
		</div>
	`,
};
