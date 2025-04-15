import { h } from 'ui.vue3';
import { RemoveButton } from 'booking.component.actions-popup';
import { RemoveBooking } from 'booking.lib.remove-booking';

function BookingRemoveBtn(props, { emit }): void
{
	const bookingId = props.bookingId;
	const removeBooking = () => {
		emit('close');

		new RemoveBooking(bookingId);
	};

	return h(
		RemoveButton,
		{
			dataId: bookingId,
			dataElementPrefix: 'booking',
			onRemove: removeBooking,
		},
	);
}

type BookingRemoveBtnProps = {
	bookingId: string | number,
}
const bookingRemoveBtnProps: Array<$Keys<BookingRemoveBtnProps>> = ['bookingId'];

BookingRemoveBtn.props = bookingRemoveBtnProps;
BookingRemoveBtn.emits = ['close'];

export { BookingRemoveBtn };
