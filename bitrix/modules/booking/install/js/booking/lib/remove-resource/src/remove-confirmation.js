import { Loc } from 'main.core';
import { CloseIconSize } from 'main.popup';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import type { ResourceModel } from 'booking.model.resources';

export class RemoveConfirmation
{
	static confirmDelete(resourceId: number): Promise<boolean>
	{
		return new Promise((resolve) => {
			const messageBox = MessageBox.create({
				title: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE_TITLE'),
				yesCaption: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_DELETE_YES'),
				modal: true,
				buttons: MessageBoxButtons.YES_CANCEL,
				popupOptions: {
					id: `booking-resource-remove-confirm-${resourceId}`,
					closeByEsc: true,
					closeIcon: true,
					closeIconSize: CloseIconSize.LARGE,
				},
				useAirDesign: true,
				onYes: async (box) => {
					box.close();
					resolve(true);
				},
				onCancel: (box) => {
					box.close();
					resolve(false);
				},
			});

			messageBox.show();
		});
	}

	static confirmMoveFutureBooking(resourceId: number): Promise<boolean>
	{
		return new Promise((resolve) => {
			const messageBox = MessageBox.create({
				title: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_TITLE'),
				message: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_TEXT'),
				yesCaption: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_YES'),
				noCaption: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_MOVE_FUTURE_BOOKINGS_NO'),
				buttons: MessageBoxButtons.YES_NO,
				popupOptions: {
					id: `booking-resource-remove-confirm-move-future-booking-${resourceId}`,
					closeByEsc: true,
					closeIcon: true,
					closeIconSize: CloseIconSize.LARGE,
				},
				useAirDesign: true,
				onYes: async (box) => {
					box.close();
					resolve(true);
				},
				onNo: (box) => {
					box.close();
					resolve(false);
				},
			});

			messageBox.show();
		});
	}

	static confirmAfterMoveFutureBooking(resource: ResourceModel): Promise<boolean>
	{
		return new Promise((resolve) => {
			const messageBox = MessageBox.create({
				title: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_TITLE'),
				message: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_TEXT'),
				yesCaption: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_YES'),
				noCaption: Loc.getMessage('BOOKING_RESOURCE_CONFIRM_AFTER_MOVE_FUTURE_BOOKINGS_NO'),
				buttons: MessageBoxButtons.YES_NO,
				popupOptions: {
					id: `booking-resource-remove-confirmation-after-move-future-bookings-${resource.id}`,
					closeByEsc: true,
					closeIcon: true,
					closeIconSize: CloseIconSize.LARGE,
				},
				useAirDesign: true,
				onYes: async (box) => {
					box.close();
					resolve(true);
				},
				onNo: (box) => {
					box.close();
					resolve(false);
				},
			});

			messageBox.show();
		});
	}
}
