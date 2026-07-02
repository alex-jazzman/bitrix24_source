import type { BookingModel } from 'booking.model.bookings';
import type { Occupancy } from 'booking.model.interface';

type TimeRange = {
	fromTs: number,
	toTs: number,
};

type CalcFreeSpaceProps = {
	booking: BookingModel,
	colliding: Occupancy[],
	selectedDateTs: number,
	draggedBookingResourcesIds: number[],
};

type CalcTimeForDroppedBookingProps = {
	freeSpace: Occupancy,
	booking: BookingModel,
	droppedBooking: BookingModel,
};

export class OverbookingTimeCalculator
{
	static calcFreeSpace(props: CalcFreeSpaceProps): ?TimeRange
	{
		const {
			booking,
			colliding,
			selectedDateTs,
			draggedBookingResourcesIds,
		} = props;

		const minTs = new Date(selectedDateTs).setHours(0, 0, 0, 0);
		const maxTs = new Date(selectedDateTs).setHours(24, 0, 0, 0);
		const freeSpace = { fromTs: minTs, toTs: maxTs };

		if (draggedBookingResourcesIds.length > 1)
		{
			const bookingColliding = colliding.find(({ fromTs }) => fromTs === booking.dateFromTs);
			if (bookingColliding && draggedBookingResourcesIds.every((id) => bookingColliding.resourcesIds.includes(id)))
			{
				return null;
			}
		}

		for (const { fromTs, toTs } of colliding)
		{
			if (toTs <= booking.dateFromTs)
			{
				freeSpace.fromTs = Math.max(freeSpace.fromTs, toTs);
			}

			if (booking.dateToTs <= fromTs)
			{
				freeSpace.toTs = Math.min(freeSpace.toTs, fromTs);
			}
		}

		if (freeSpace.fromTs === minTs && freeSpace.toTs === maxTs)
		{
			return null;
		}

		return freeSpace;
	}

	static calcTimeForDroppedBooking(props: CalcTimeForDroppedBookingProps): TimeRange
	{
		const { freeSpace, booking, droppedBooking } = props;
		const duration = droppedBooking.dateToTs - droppedBooking.dateFromTs;

		if (booking.dateFromTs >= freeSpace.fromTs && booking.dateFromTs + duration <= freeSpace.toTs)
		{
			return {
				fromTs: booking.dateFromTs,
				toTs: booking.dateFromTs + duration,
			};
		}

		if (booking.dateToTs - duration >= freeSpace.fromTs && booking.dateToTs <= freeSpace.toTs)
		{
			return {
				fromTs: booking.dateToTs - duration,
				toTs: booking.dateToTs,
			};
		}

		return {
			fromTs: freeSpace.fromTs,
			toTs: freeSpace.fromTs + duration,
		};
	}
}
