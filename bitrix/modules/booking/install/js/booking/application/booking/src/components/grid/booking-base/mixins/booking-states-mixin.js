import { Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';

import { Model, DraggedElementKind, VisitStatus } from 'booking.const';
import { isRealId } from 'booking.lib.is-real-id';

export const bookingStatesMixin = {
	computed: {
		...mapGetters({
			isBookingCreatedFromEmbed: `${Model.Interface}/isBookingCreatedFromEmbed`,
			editingBookingId: `${Model.Interface}/editingBookingId`,
			isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
			offHoursExpanded: `${Model.Interface}/offHoursExpanded`,
			fromHour: `${Model.Interface}/fromHour`,
			toHour: `${Model.Interface}/toHour`,
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
			getResourceById: `${Model.Resources}/getById`,
			isDeletingResourceFilterMode: `${Model.Filter}/isDeletingResourceFilterMode`,
			deletingResource: `${Model.Filter}/deletingResource`,
			isMenuOpenedForBooking: `${Model.Interface}/isMenuOpenedForBooking`,
		}),
		isReal(): boolean
		{
			return isRealId(this.bookingId);
		},
		realBooking(): boolean
		{
			return Type.isNumber(this.bookingId);
		},
		isDeletedResource(): boolean
		{
			return this.getResourceById(this.resourceId)?.isDeleted ?? false;
		},
		disabled(): boolean
		{
			return this.isEditingBookingMode && this.editingBookingId !== this.bookingId;
		},
		disabledHover(): boolean
		{
			return (
				this.draggedDataTransfer.id > 0
				&& (
					this.draggedDataTransfer.kind !== DraggedElementKind.Booking
					|| this.draggedDataTransfer.id !== this.bookingId
				)
			);
		},
		isExpiredBooking(): boolean
		{
			return this.booking.dateToTs < this.nowTs;
		},
		isNotVisited(): boolean
		{
			const started = this.nowTs > this.booking.dateFromTs;
			const statusUnknown = this.booking.visitStatus === VisitStatus.Unknown;
			const statusNotVisited = this.booking.visitStatus === VisitStatus.NotVisited;

			return (started && statusUnknown) || statusNotVisited;
		},
		hasAccent(): boolean
		{
			return this.editingBookingId === this.bookingId
				|| this.isBookingCreatedFromEmbed(this.bookingId)
				|| this.isMenuOpenedForBooking(this.bookingId, this.resourceId);
		},
		isOutOfWorkingHours(): boolean
		{
			const workingHoursStartTs = (new Date(this.selectedDateTs)).setHours(this.fromHour, 0, 0, 0);
			const workingHoursEndTs = (new Date(this.selectedDateTs)).setHours(this.toHour, 0, 0, 0);

			return (this.booking.dateToTs <= workingHoursStartTs) || (this.booking.dateFromTs >= workingHoursEndTs);
		},
		isShaded(): boolean
		{
			return (
				this.isDeletingResourceFilterMode
				&& this.resourceId !== this.deletingResource.id
			);
		},
	},
};
