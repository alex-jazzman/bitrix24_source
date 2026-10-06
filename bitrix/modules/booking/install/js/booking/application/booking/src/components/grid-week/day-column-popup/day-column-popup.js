import { DateTimeFormat } from 'main.date';
import { mapGetters } from 'ui.vue3.vuex';

import { DateFormat, Grid, Model } from 'booking.const';
import { StickyPopup } from 'booking.component.popup';
import { Duration } from 'booking.lib.duration';
import { GridTokenKey, gridTokens } from 'booking.lib.grid';
import { SlotRanges } from 'booking.lib.slot-ranges';
import { type ResourceModel, type SlotRange } from 'booking.model.resources';

import { Bookings } from '../../grid-day/bookings/bookings';
import { Column } from '../../grid-day/column/column';
import { TimeScale } from '../../grid-day/time-scale/time-scale';
import { type BookingGridRenderContext } from '../../grid/types';

import './day-column-popup.css';

const { H: HourDuration, i: MinuteDuration } = Duration.getUnitDurations();
const MinutesInHour = HourDuration / MinuteDuration;
const DayColumnPopupGridPaddingTop = 7;

// @vue/component
export const DayColumnPopup = {
	name: 'DayColumnPopup',
	components: {
		StickyPopup,
		Bookings,
		Column,
		TimeScale,
	},
	provide(): Object
	{
		return {
			gridContext: this.dayGridContext,
			autoHideContext: {
				freeze: () => this.freezePopupAutoHide(),
			},
		};
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		dateTs: {
			type: Number,
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { DayColumnPopupGridPaddingTop: number }
	{
		return {
			DayColumnPopupGridPaddingTop,
		};
	},
	data(): { autoHideFreezeCount: number }
	{
		return {
			autoHideFreezeCount: 0,
		};
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
			fromHour: `${Model.Interface}/fromHour`,
			toHour: `${Model.Interface}/toHour`,
			timezone: `${Model.Interface}/timezone`,
		}),
		dayGridContext(): BookingGridRenderContext
		{
			return {
				gridMode: Grid.Mode.Day,
				resourcesIds: [this.resourceId],
				zoom: 1,
				offHoursExpanded: true,
				multiSelectEnabled: false,
				resizeEnabled: false,
				restrictionPopupEnabled: false,
				quickFilterEnabled: false,
				offHoursControlsEnabled: false,
			};
		},
		popupId(): string
		{
			return `booking-week-day-column-popup-${this.resourceId}-${this.dateTs}`;
		},
		headerDate(): string
		{
			return DateTimeFormat.format('j F Y', (this.dateTs + this.offset) / 1000);
		},
		resource(): ResourceModel | null
		{
			return this.$store.getters[`${Model.Resources}/getById`](this.resourceId) ?? null;
		},
		resourceName(): string
		{
			return this.resource?.name ?? '';
		},
		weekDay(): string
		{
			return DateFormat.WeekDays[new Date(this.dateTs + this.offset).getDay()];
		},
		workingSlotRanges(): SlotRange[]
		{
			return SlotRanges
				.applyTimezone(this.resource?.slotRanges ?? [], this.dateTs, this.timezone)
				.filter((slotRange: SlotRange) => slotRange.weekDays.includes(this.weekDay))
			;
		},
		firstWorkingMinutes(): number
		{
			if (this.workingSlotRanges.length === 0)
			{
				return 0;
			}

			const firstWorkingMinutes = Math.min(
				...this.workingSlotRanges.map((slotRange: SlotRange) => slotRange.from),
			);

			return Math.max(0, firstWorkingMinutes);
		},
		config(): Object
		{
			return {
				className: 'booking-booking-day-column-popup',
				bindElement: this.bindElement,
				offsetLeft: this.bindElement.offsetWidth + 6,
				offsetTop: -56,
				animation: 'fading-slide',
			};
		},
	},
	mounted(): void
	{
		this.scrollToFirstWorkingTime();
	},
	methods: {
		closePopup(): void
		{
			this.$emit('close');
		},
		scrollToFirstWorkingTime(): void
		{
			void this.$nextTick(() => {
				if (!this.$refs.grid)
				{
					return;
				}

				this.$refs.grid.scrollTop = this.getScrollTopByMinutes(this.firstWorkingMinutes);
			});
		},
		getScrollTopByMinutes(minutes: number): number
		{
			if (minutes <= 0)
			{
				return 0;
			}

			const hourHeight = gridTokens.get(GridTokenKey.DayHourHeight);
			const scrollTop = (minutes / MinutesInHour) * hourHeight
				+ DayColumnPopupGridPaddingTop
				- hourHeight / 2
			;

			return Math.max(0, scrollTop);
		},
		freezePopupAutoHide(): () => void
		{
			let unfrozen = false;

			if (this.autoHideFreezeCount === 0)
			{
				this.$refs.popup?.freeze();
			}

			this.autoHideFreezeCount++;

			return (): void => {
				if (unfrozen)
				{
					return;
				}

				unfrozen = true;
				if (this.autoHideFreezeCount === 0)
				{
					return;
				}

				this.autoHideFreezeCount--;
				if (this.autoHideFreezeCount === 0)
				{
					this.$refs.popup?.unfreeze();
				}
			};
		},
	},
	template: `
		<StickyPopup
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div
				class="booking-booking-day-column-popup__content booking-booking__base-component --ui-context-content-light --day-mode"
			>
				<div class="booking-booking-day-column-popup__header">
					<span
						v-if="resourceName"
						class="booking-booking-day-column-popup__resource-name"
						:title="resourceName"
					>
						{{ resourceName }},
					</span>
					<span class="booking-booking-day-column-popup__date">{{ headerDate }}</span>
					<div
						class="ui-icon-set --cross-45"
						data-element="booking-day-column-popup-close"
						@click="closePopup"
					></div>
				</div>
				<div
					class="booking-booking-day-column-popup__grid booking-vertical-scroll-bar"
					ref="grid"
				>
					<div
						class="booking-booking-day-column-popup__grid-inner"
						:style="{
							'--from-hour': fromHour,
							'--to-hour': toHour,
							'--booking-day-column-popup-grid-padding-top': DayColumnPopupGridPaddingTop + 'px',
						}"
					>
						<div class="booking-booking-day-column-popup__time-scale">
							<TimeScale
								:fromHour="fromHour"
								:toHour="toHour"
								:offHoursExpanded="dayGridContext.offHoursExpanded"
							/>
						</div>
						<div class="booking-booking-day-column-popup__column">
							<Bookings/>
							<Column :resourceId="resourceId"/>
						</div>
					</div>
				</div>
			</div>
		</StickyPopup>
	`,
};
