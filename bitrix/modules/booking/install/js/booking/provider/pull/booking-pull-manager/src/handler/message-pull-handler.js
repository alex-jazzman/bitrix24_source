import { type Store } from 'ui.vue3.vuex';
import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { type MessageModel } from 'booking.model.bookings';

import { BasePullHandler } from './base-pull-handler';

export class MessagePullHandler extends BasePullHandler
{
	getMap(): { [command: string]: Function }
	{
		return {
			messageSent: this.#handleMessageSent,
		};
	}

	#handleMessageSent = ({ entityId: bookingId, message }: { entityId: number, message: MessageModel }): void => {
		const booking = this.$store.getters[`${Model.Bookings}/getById`](bookingId);
		if (!booking)
		{
			return;
		}

		const notifications = this.$store.getters[`${Model.Dictionary}/getNotifications`];
		const isConfirmation = message.notificationType === notifications.Confirmation?.value;

		void this.$store.dispatch(`${Model.Bookings}/update`, {
			id: booking.id,
			booking: {
				...booking,
				isConfirmationSent: booking.isConfirmationSent || isConfirmation,
			},
		});
	};

	get $store(): Store
	{
		return Core.getStore();
	}
}
