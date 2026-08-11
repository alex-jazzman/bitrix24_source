import { mapGetters } from 'ui.vue3.vuex';

import { BookingCard } from 'booking.component.booking-card';
import { Model } from 'booking.const';
import { bookingService } from 'booking.lib.booking';
import { Duration } from 'booking.lib.duration';
import { gridFactory } from 'booking.lib.grid';
import { mousePosition } from 'booking.lib.mouse-position';
import { DatePeriod } from 'booking.lib.date-period';
import { type EnabledFeatures } from 'booking.model.interface';

import { Actions, type ActionsPopupOptions } from './components/actions/actions';
import { BookingAddClient } from './components/add-client/add-client';
import { BookingDuration } from './components/booking-duration/booking-duration';
import { Counter } from './components/counter/counter';
import { BookingPreviewPopup } from './components/preview-popup/preview-popup';
import { Resize } from './components/resize/resize';
import { MinDetailedBookingDurationMs } from './const';
import { BookingCardDataService } from './lib/card-data/booking-card-data-service';
import { bookingStatesMixin } from './mixins/booking-states-mixin';
import { dropHandlerMixin } from './mixins/drop-handler-mixin';
import { lockedAnimationMixin } from './mixins/locked-animation-mixin';
import { overbookingLayoutMixin } from './mixins/overbooking-layout-mixin';
import { visibilityMixin } from './mixins/visibility-mixin';

import './booking.css';

// @vue/component
export const BookingBase = {
	name: 'GridBooking',
	components: {
		Actions,
		BookingAddClient,
		BookingCard,
		BookingDuration,
		Counter,
		Resize,
		BookingPreviewPopup,
	},
	mixins: [
		visibilityMixin,
		dropHandlerMixin,
		lockedAnimationMixin,
		overbookingLayoutMixin,
		bookingStatesMixin,
	],
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
		nowTs: {
			type: Number,
			required: true,
		},
		/**
		 * @param {BookingUiGroup[]} bookingUiGroups
		 */
		bookingUiGroups: {
			type: Array,
			default: () => [],
		},
	},
	data(): Object
	{
		return {
			resizeFromTs: null,
			resizeToTs: null,
			isPreviewPopupShown: false,
		};
	},
	computed: {
		...mapGetters({
			getBookingById: `${Model.Bookings}/getById`,
			deletingBookingsMap: `${Model.Interface}/deletingBookings`,
			animationPause: `${Model.Interface}/animationPause`,
			zoom: `${Model.Interface}/zoom`,
			scroll: `${Model.Interface}/scroll`,
			resourcesIds: `${Model.Interface}/resourcesIds`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
		booking(): BookingModel
		{
			return this.getBookingById(this.bookingId);
		},
		dateFromTs(): number
		{
			return this.resizeFromTs ?? this.booking.dateFromTs;
		},
		isPayable(): boolean
		{
			return Boolean(this.booking.payment?.id);
		},
		isPaid(): boolean
		{
			return Boolean(this.booking.payment?.isPaid)
				|| Boolean(this.booking.payment?.isPaidManually)
			;
		},
		dateFromTsRounded(): number
		{
			return this.roundTimestamp(this.resizeFromTs) ?? this.dateFromTs;
		},
		dateToTs(): number
		{
			return this.resizeToTs ?? this.booking.dateToTs;
		},
		dateToTsRounded(): number
		{
			return this.roundTimestamp(this.resizeToTs) ?? this.dateToTs;
		},
		deletingBookings(): number[]
		{
			return Object.values(this.deletingBookingsMap);
		},
		enabledFeature(): EnabledFeatures
		{
			return this.$store.state[Model.Interface].enabledFeature;
		},
		actionsPopupOptions(): ActionsPopupOptions
		{
			return {
				overbooking: {
					disabled: this.overbooking !== null,
					hidden: this.isDeletedResource,
				},
				waitList: {
					hidden: this.isDeletedResource,
				},
			};
		},
		dataAttributes(): Object
		{
			return {
				...this.cardDataService.buildDataAttributes('booking-booking-card-container'),
				'data-resource-id': this.resourceId,
			};
		},
		bookingDurationMs(): number
		{
			return this.booking.dateToTs - this.booking.dateFromTs;
		},
		visibleBookingDurationMs(): number
		{
			const visiblePeriod = DatePeriod.createByCurrentGridMode();

			return bookingService.getVisibleDuration(this.booking, {
				fromTs: visiblePeriod.fromTs * 1000,
				toTs: visiblePeriod.toTs * 1000,
			});
		},
		isWeekGridDetailed(): Boolean
		{
			return this.visibleBookingDurationMs > MinDetailedBookingDurationMs;
		},
		isVisibleStartBooking(): boolean
		{
			return false;
		},
		isVisibleEndBooking(): boolean
		{
			return false;
		},
		isVisibleMiddleBooking(): boolean
		{
			return false;
		},
		isMinimalView(): boolean
		{
			return !this.isWeekMode || (this.isWeekMode && this.isWeekGridDetailed);
		},
		shouldBeHidden(): boolean
		{
			return false;
		},
		bookingClasses(): Object
		{
			return {
				'--short': this.overlappingBookings.length > 1,
				'--overbooking': this.hasOverbooking,
				'--overbooking-bg': this.hasOverbooking || this.overbooking !== null,
				'--shifted': this.isShifted && !this.realBooking,
				'--drop-area': this.dropArea,
				'--accent': this.hasAccent,
				'--shaded': this.isShaded,
				'not-transition': this.animationPause,
				'--locked': this.isLockedAnimation,
				'--not-real': !this.isReal,
				'--zoom-is-less-than-08': this.zoom < 0.8,
				'--compact-mode': this.realHeight < 40 || this.zoom < 0.8,
				'--small': this.realHeight > 15 && this.realHeight <= 20,
				'--extra-small': this.realHeight <= 15,
				'--long': this.realHeight >= 65,
				'--disabled': this.disabled,
				'--confirmed': this.booking.isConfirmed && !this.isNotVisited,
				'--expired': this.isExpiredBooking,
				'--not-visited': this.isNotVisited,
				'--resizing': this.resizeFromTs && this.resizeToTs,
				'--no-pointer-events': this.disabledHover,
				'--is-payable': this.isPayable,
				'--not-paid': this.isPayable && !this.isPaid,
				'--week-grid-detailed': this.isWeekGridDetailed,
				'--start-booking': this.isVisibleStartBooking,
				'--end-booking': this.isVisibleEndBooking,
				'--middle-booking': this.isVisibleMiddleBooking,
			};
		},
	},
	created(): void
	{
		this.previewPopupShowTimeout = null;
		this.cardDataService = new BookingCardDataService(this.bookingId);
	},
	mounted(): void
	{
		setTimeout(() => {
			if (!this.isReal && mousePosition.isMousePressed())
			{
				void this.$refs.resize.startResize();
			}
		}, 300);
	},
	beforeUnmount(): void
	{
		this.hidePreviewPopup();

		if (this.deletingBookingsMap[this.bookingId] || !this.booking?.resourcesIds.includes(this.resourceId))
		{
			this.$el.remove();
		}
	},
	methods: {
		showPreviewPopup(): void
		{
			if (!this.isWeekMode || this.disabledHover)
			{
				return;
			}

			if (this.visibleBookingDurationMs >= Duration.getUnitDurations().d * 1.5)
			{
				return;
			}

			this.clearPreviewPopupTimeout();
			this.previewPopupShowTimeout = setTimeout(() => {
				this.isPreviewPopupShown = true;
			}, 100);
		},
		clearPreviewPopupTimeout(): void
		{
			clearTimeout(this.previewPopupShowTimeout);
			this.previewPopupShowTimeout = null;
		},
		hidePreviewPopup(): void
		{
			this.clearPreviewPopupTimeout();
			this.isPreviewPopupShown = false;
		},
		resizeUpdate(resizeFromTs: number | null, resizeToTs: number | null): void
		{
			this.resizeFromTs = resizeFromTs;
			this.resizeToTs = resizeToTs;
		},
		roundTimestamp(timestamp: number | null): number | null
		{
			const fiveMinutes = Duration.getUnitDurations().i * 5;

			return timestamp ? Math.round(timestamp / fiveMinutes) * fiveMinutes : null;
		},
	},
	template: `
		<BookingCard
			ref="card"
			v-show="!shouldBeHidden"
			:styles="[geometryVariables]"
			:classes="['booking-booking-booking', 'booking--draggable-item', bookingClasses]"
			:isMinimalView
			:disabled
			:cardDataService
			:dataAttributes
			@mouseenter="showPreviewPopup"
			@mouseleave="hidePreviewPopup"
			@click="hidePreviewPopup"
			@communicationMouseenter="hidePreviewPopup"
		>
			<template #start>
				<Counter :bookingId="bookingId" :nowTs="nowTs"/>
				<BookingPreviewPopup
					v-if="isPreviewPopupShown"
					:bindElement="$refs.card.$el"
					:title="cardDataService.title"
					:bookingId
					:dateFromTs
					:dateToTs
				/>
			</template>
			<template #upper-content-row>
				<BookingDuration
					:bookingId="bookingId"
					:resourceId="resourceId"
					:startTs="dateFromTsRounded"
					:endTs="dateToTsRounded"
				/>
			</template>
			<template #lower-content-row>
				<BookingDuration
					:bookingId="bookingId"
					:resourceId="resourceId"
					:startTs="dateFromTsRounded"
					:endTs="dateToTsRounded"
				/>
			</template>
			<template #add-client-button>
				<BookingAddClient :cardDataService :expired="isExpiredBooking"/>
			</template>
			<template #actions>
				<Actions
					:bookingId
					:resourceId
					:actionsPopupOptions
				/>
			</template>
			<template #resize v-if="!isWeekMode">
				<Resize
					v-if="!disabled"
					:bookingId="bookingId"
					:resourceId="resourceId"
					ref="resize"
					@update="resizeUpdate"
				/>
			</template>
		</BookingCard>
	`,
};
