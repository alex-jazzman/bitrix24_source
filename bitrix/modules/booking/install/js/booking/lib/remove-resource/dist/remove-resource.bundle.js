/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, ui_notification, booking_const, booking_core, booking_provider_service_resourcesService, main_popup, ui_dialogs_messagebox) {
	'use strict';

	class RemoveConfirmation {
		static confirmDelete(resourceId) {
			return new Promise(resolve => {
				const messageBox = ui_dialogs_messagebox.MessageBox.create({
					title: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE_TITLE'),
					yesCaption: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE_YES'),
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
					popupOptions: {
						id: `booking-resource-remove-confirm-${resourceId}`,
						closeByEsc: true,
						closeIcon: true,
						closeIconSize: main_popup.CloseIconSize.LARGE
					},
					useAirDesign: true,
					onYes: async box => {
						box.close();
						resolve(true);
					},
					onCancel: box => {
						box.close();
						resolve(false);
					}
				});
				messageBox.show();
			});
		}
		static confirmMoveFutureBooking(resourceId) {
			return new Promise(resolve => {
				const messageBox = ui_dialogs_messagebox.MessageBox.create({
					title: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_TITLE'),
					message: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_TEXT'),
					yesCaption: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_YES'),
					noCaption: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_NO'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
					popupOptions: {
						id: `booking-resource-remove-confirm-move-future-booking-${resourceId}`,
						closeByEsc: true,
						closeIcon: true,
						closeIconSize: main_popup.CloseIconSize.LARGE
					},
					useAirDesign: true,
					onYes: async box => {
						box.close();
						resolve(true);
					},
					onNo: box => {
						box.close();
						resolve(false);
					}
				});
				messageBox.show();
			});
		}
		static confirmAfterMoveFutureBooking(resource) {
			return new Promise(resolve => {
				const messageBox = ui_dialogs_messagebox.MessageBox.create({
					title: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_TITLE'),
					message: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_TEXT'),
					yesCaption: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_YES'),
					noCaption: main_core.Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_NO'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
					popupOptions: {
						id: `booking-resource-remove-confirmation-after-move-future-bookings-${resource.id}`,
						closeByEsc: true,
						closeIcon: true,
						closeIconSize: main_popup.CloseIconSize.LARGE
					},
					useAirDesign: true,
					onYes: async box => {
						box.close();
						resolve(true);
					},
					onNo: box => {
						box.close();
						resolve(false);
					}
				});
				messageBox.show();
			});
		}
	}

	const secondsToDelete = 5;
	class RemoveResource {
		#resourceId;
		#shouldRemoveFutureBookings = false;
		#futureBookingIds = [];
		#isDeletionCancelled;
		#balloon;
		#secondsLeft;
		#countdownInterval;
		constructor(resourceId) {
			this.#resourceId = resourceId;
		}
		async run() {
			await this.#cancelRemovingResource();
			const hasFutureBookings = await booking_provider_service_resourcesService.resourceService.hasFutureBookings(this.#resourceId);
			if (hasFutureBookings) {
				const shouldMoveFutureBookings = await RemoveConfirmation.confirmMoveFutureBooking(this.#resourceId);
				if (shouldMoveFutureBookings) {
					await booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/setDeletingResourceFilter`, {
						resourceId: this.#resourceId
					});
				} else {
					this.#shouldRemoveFutureBookings = true;
					this.#runCancellableDeletion();
				}
				return;
			}
			const isDeletionConfirmed = await RemoveConfirmation.confirmDelete(this.#resourceId);
			if (isDeletionConfirmed) {
				this.#runCancellableDeletion();
			}
		}
		async runAfterMoveBookings() {
			await this.#cancelRemovingResource();
			const hasFutureBookings = await booking_provider_service_resourcesService.resourceService.hasFutureBookings(this.#resourceId);
			if (hasFutureBookings) {
				return;
			}
			const resource = booking_core.Core.getStore().getters[`${booking_const.Model.Resources}/getById`](this.#resourceId);
			const isDeletionConfirmed = await RemoveConfirmation.confirmAfterMoveFutureBooking(resource);
			if (isDeletionConfirmed) {
				this.#runCancellableDeletion();
			}
		}
		#runCancellableDeletion() {
			this.#secondsLeft = secondsToDelete;
			this.#balloon = BX.UI.Notification.Center.notify({
				id: `booking-notify-remove-resource-${this.#resourceId}`,
				content: this.#getBalloonTitle(),
				actions: [{
					title: main_core.Loc.getMessage('BOOKING_RESOURCE_REMOVE_BALLOON_CANCEL'),
					events: {
						mouseup: this.#cancelDeletion
					}
				}],
				events: {
					onClose: this.#onBalloonClose
				}
			});
			this.#runCountdown();
		}
		#runCountdown() {
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/addDeletingResource`, this.#resourceId);
			if (this.#shouldRemoveFutureBookings) {
				const futureBookings = booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getFutureByResourceId`](this.#resourceId);
				this.#futureBookingIds = futureBookings.map(booking => booking.id);
				if (this.#futureBookingIds.length > 0) {
					void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/addDeletingBooking`, this.#futureBookingIds);
				}
			}
			this.#countdownInterval = setInterval(() => {
				this.#secondsLeft--;
				this.#balloon.update({
					content: this.#getBalloonTitle()
				});
				if (this.#secondsLeft <= 0) {
					this.#balloon.close();
				}
			}, 1000);
		}
		#getBalloonTitle() {
			return main_core.Loc.getMessage('BOOKING_RESOURCE_REMOVE_BALLOON_TEXT', {
				'#COUNTDOWN#': this.#secondsLeft
			});
		}
		#cancelDeletion = () => {
			this.#isDeletionCancelled = true;
			this.#balloon.close();
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/removeDeletingResource`, this.#resourceId);
			if (this.#futureBookingIds.length > 0) {
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/removeDeletingBooking`, this.#futureBookingIds);
			}
		};
		#onBalloonClose = () => {
			clearInterval(this.#countdownInterval);
			if (this.#isDeletionCancelled) {
				this.#isDeletionCancelled = false;
				return;
			}
			void booking_provider_service_resourcesService.resourceService.delete(this.#resourceId, this.#shouldRemoveFutureBookings);
		};
		async #cancelRemovingResource() {
			const $store = booking_core.Core.getStore();
			if ($store.getters[`${booking_const.Model.Filter}/isDeletingResourceFilterMode`]) {
				await Promise.all([$store.dispatch(`${booking_const.Model.Filter}/clearFilter`), $store.dispatch(`${booking_const.Model.Interface}/setPinnedResourceIds`, [])]);
			}
		}
	}

	exports.RemoveResource = RemoveResource;

})(this.BX.Booking.Lib = this.BX.Booking.Lib || {}, BX, BX, BX.Booking.Const, BX.Booking, BX.Booking.Provider.Service, BX.Main, BX.UI.Dialogs);
//# sourceMappingURL=remove-resource.bundle.js.map
