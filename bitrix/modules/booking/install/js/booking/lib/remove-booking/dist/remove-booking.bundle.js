/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, ui_notification, booking_const, booking_core, booking_provider_service_bookingService) {
	'use strict';

	const secondsToDelete = 5;
	class RemoveBooking {
		#balloon;
		#bookingId;
		#secondsLeft;
		#cancelingTheDeletion;
		#interval;
		constructor(bookingId) {
			this.#bookingId = bookingId;
			this.#removeBooking();
		}
		#removeBooking() {
			this.#secondsLeft = secondsToDelete;
			this.#balloon = BX.UI.Notification.Center.notify({
				id: `booking-notify-remove-${this.#bookingId}`,
				content: this.#getBalloonTitle(),
				actions: [{
					title: main_core.Loc.getMessage('BB_BOOKING_REMOVE_BALLOON_CANCEL'),
					events: {
						mouseup: this.#cancelDeletion
					}
				}],
				events: {
					onClose: this.#onBalloonClose
				}
			});
			this.#startDeletion();
		}
		#startDeletion() {
			this.#interval = setInterval(() => {
				this.#secondsLeft--;
				this.#balloon.update({
					content: this.#getBalloonTitle()
				});
				if (this.#secondsLeft <= 0) {
					this.#balloon.close();
				}
			}, 1000);
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/addDeletingBooking`, this.#bookingId);
		}
		#getBalloonTitle() {
			return main_core.Loc.getMessage('BB_BOOKING_REMOVE_BALLOON_TEXT', {
				'#countdown#': this.#secondsLeft
			});
		}
		#cancelDeletion = () => {
			this.#cancelingTheDeletion = true;
			this.#balloon.close();
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/removeDeletingBooking`, this.#bookingId);
		};
		#onBalloonClose = () => {
			clearInterval(this.#interval);
			if (this.#cancelingTheDeletion) {
				this.#cancelingTheDeletion = false;
				return;
			}
			void booking_provider_service_bookingService.bookingService.delete(this.#bookingId);
		};
	}

	exports.RemoveBooking = RemoveBooking;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX, BX.UI.Notification, BX.Booking.Const, BX.Booking, BX.Booking.Provider.Service);
//# sourceMappingURL=remove-booking.bundle.js.map
