import { Dom, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { Ears } from 'ui.ears';

import { AhaMoment, DraggedElementKind, Model } from 'booking.const';
import { ahaMoments } from 'booking.lib.aha-moments';
import { gridFactory } from 'booking.lib.grid';
import { type BookingModel } from 'booking.model.bookings';

import { LeftPanel } from './left-panel/left-panel';
import { NowLine } from '../grid/now-line/now-line';
import { Bookings } from './bookings/bookings';
import { Column } from './column/column';
import { ScalePanel } from '../grid/scale-panel/scale-panel';
import { DragDelete } from './drag-delete/drag-delete';
import { expandOffHours } from '../../lib/expand-off-hours/expand-off-hours';
import { DragMixin } from '../../lib/drag-mixin/drag-mixin';

import './grid-day.css';

type GridData = {
	scrolledToBooking: boolean,
};

// @vue/component
export const GridDay = {
	name: 'BookingGridDay',
	components: {
		LeftPanel,
		NowLine,
		Column,
		Bookings,
		ScalePanel,
		DragDelete,
	},
	mixins: [DragMixin],
	data(): GridData
	{
		return {
			scrolledToBooking: false,
		};
	},
	computed: {
		...mapGetters({
			resourcesIds: `${Model.Interface}/resourcesIds`,
			scroll: `${Model.Interface}/scroll`,
			editingBookingId: `${Model.Interface}/editingBookingId`,
			editingWaitListItemId: `${Model.Interface}/editingWaitListItemId`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
			isLoaded: `${Model.Interface}/isLoaded`,
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
			filteredBookingsIds: `${Model.Filter}/filteredBookingsIds`,
			isFilterMode: `${Model.Filter}/isFilterMode`,
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
		editingBooking(): BookingModel | null
		{
			return this.$store.getters['bookings/getById'](this.editingBookingId) ?? null;
		},
	},
	watch: {
		scroll(value): void
		{
			this.$refs.columnsContainer.scrollLeft = value;
		},
		editingBooking(): void
		{
			this.scrollToEditingBooking();
		},
		isLoaded(isLoaded): void
		{
			if (isLoaded)
			{
				this.setupDrag();
			}
		},
		editingBookingId(id: number | string): void
		{
			if (id)
			{
				this.createDragManager(id, DraggedElementKind.Booking);
			}
		},
		editingWaitListItemId(id: number | string): void
		{
			if (id)
			{
				this.createDragManager(id, DraggedElementKind.WaitListItem);
			}
		},
		filteredBookingsIds(ids: number[]): void
		{
			if (!this.isFilterMode || ids.length === 0)
			{
				return;
			}

			const booking: BookingModel | null = this.$store.getters['bookings/getById'](ids[0]) ?? null;
			if (booking !== null)
			{
				this.scrollToBooking(booking);
			}
		},
	},
	mounted(): void
	{
		this.ears = new Ears({
			container: this.$refs.columnsContainer,
			smallSize: true,
			className: 'booking-booking-grid-columns-ears',
		}).init();

		expandOffHours.setExpanded(true);

		if (this.isLoaded)
		{
			this.setupDrag();
		}

		EventEmitter.subscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
		EventEmitter.subscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	},
	unmounted()
	{
		EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
		EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
	},
	methods: {
		updateEars(): void
		{
			this.ears.toggleEars();

			this.tryShowAhaMoment();
		},
		areEarsShown(): boolean
		{
			const shownClass = 'ui-ear-show';

			return (
				Dom.hasClass(this.ears.getRightEar(), shownClass)
				|| Dom.hasClass(this.ears.getLeftEar(), shownClass)
			);
		},
		scrollToEditingBooking(): void
		{
			if (!this.editingBooking || this.scrolledToBooking)
			{
				return;
			}

			this.scrollToBooking(this.editingBooking);
		},
		scrollToBooking(booking: BookingModel): void
		{
			const top = this.grid.calculateTop(booking.dateFromTs);
			const height = this.grid.calculateHeight(booking.dateFromTs, booking.dateToTs);
			this.$refs.inner.scrollTop = top + height / 2 + this.$refs.inner.offsetHeight / 2;
			this.scrolledToBooking = true;
		},
		tryShowAhaMoment(): void
		{
			if (this.areEarsShown() && ahaMoments.shouldShow(AhaMoment.ExpandGrid))
			{
				Event.EventEmitter.unsubscribe('BX.Main.Popup:onAfterClose', this.tryShowAhaMoment);
				Event.EventEmitter.unsubscribe('BX.Main.Popup:onDestroy', this.tryShowAhaMoment);
				void this.$refs.scalePanel.showAhaMoment();
			}
		},
	},
	template: `
		<div class="booking-booking__base-component_grid booking-horizontal-scroll-bar">
			<div ref="bookingContainer" class="booking-booking-grid">
				<div
					id="booking-booking-grid-wrap"
					class="booking-booking-grid-inner booking-vertical-scroll-bar"
					ref="inner"
				>
					<LeftPanel/>
					<NowLine/>
					<div
						id="booking-booking-grid-columns"
						class="booking-booking-grid-columns booking-horizontal-scroll-bar"
						ref="columnsContainer"
						@scroll="$store.dispatch('interface/setScroll', $refs.columnsContainer.scrollLeft)"
					>
						<Bookings/>
						<TransitionGroup
							name="booking-transition-resource"
							@after-leave="updateEars"
							@after-enter="updateEars"
						>
							<template v-for="resourceId of resourcesIds" :key="resourceId">
								<Column :resourceId="resourceId"/>
							</template>
						</TransitionGroup>
					</div>
				</div>
				<ScalePanel
					:getFitToScreenContainer="() => $refs.columnsContainer"
					ref="scalePanel"
				/>
				<DragDelete/>
			</div>
		</div>
	`,
};
