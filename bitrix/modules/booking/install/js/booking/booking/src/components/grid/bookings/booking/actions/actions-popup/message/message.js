import { Notifier } from 'ui.notification-manager';
import { Type } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import 'ui.icon-set.main';

import { Model } from 'booking.const';
import { Message } from 'booking.component.actions-popup';
import { bookingActionsService } from 'booking.provider.service.booking-actions-service';
import type { BookingModel } from 'booking.model.bookings';
import type { ResourceModel } from 'booking.model.resources';
import type { ClientData, ClientModel } from 'booking.model.clients';
import type { UpdateNotificationTypePayload } from 'booking.component.actions-popup';

export const BookingMessage = {
	name: 'BookingActionsPopupMessage',
	emits: ['freeze', 'unfreeze'],
	props: {
		bookingId: {
			type: Number,
			required: true,
		},
	},
	data(): Object
	{
		return {
			isLoading: true,
			isPrimaryClientIdUpdated: false,
		};
	},
	mounted(): void
	{
		void this.fetchMessageData();
	},
	computed: {
		...mapGetters({
			getSenderByCode: `${Model.Notifications}/getSenderByCode`,
		}),
		senderCanUse(): boolean
		{
			const sender = this.senderCode ? this.getSenderByCode(this.senderCode) : null;

			return sender?.canUse ?? false;
		},
		booking(): BookingModel
		{
			return this.$store.getters['bookings/getById'](this.bookingId);
		},
		client(): ClientModel | null
		{
			const clientData: ClientData = this.booking.primaryClient;

			return clientData ? this.$store.getters['clients/getByClientData'](clientData) : null;
		},
		clientId(): number
		{
			return this.booking.primaryClient?.id;
		},
		updatedAt(): number
		{
			return this.booking.updatedAt;
		},
		resource(): ResourceModel | null
		{
			const resourceId = this.booking.resourcesIds?.[0];

			return resourceId ? this.$store.getters['resources/getById'](resourceId) : null;
		},
		senderCode(): string
		{
			return this.resource?.senderCode ?? '';
		},
	},
	watch: {
		clientId(): void
		{
			this.isPrimaryClientIdUpdated = true;
		},
		updatedAt(): void
		{
			if (this.isPrimaryClientIdUpdated && this.senderCanUse)
			{
				void this.fetchMessageData();

				this.isPrimaryClientIdUpdated = false;
			}
		},
	},
	methods: {
		async sendMessage({ notificationType }: UpdateNotificationTypePayload): Promise<void>
		{
			try
			{
				await bookingActionsService.sendMessage(this.bookingId, notificationType);
				void this.fetchMessageData();
			}
			catch (result)
			{
				if (Type.isArrayFilled(result.errors))
				{
					Notifier.notify({
						id: 'booking-message-send-error',
						text: result.errors[0].message,
					});
				}
			}
		},
		async fetchMessageData(): Promise<void>
		{
			this.isLoading = true;

			await bookingActionsService.getMessageData(this.bookingId);

			this.isLoading = false;
		},
	},
	components: {
		Message,
	},
	template: `
		<Message
			:id="bookingId"
			:clientData="booking.primaryClient"
			:loading="isLoading"
			:dataId="bookingId"
			:senderCode="senderCode"
			dataElementPrefix="booking"
			@open="$emit('freeze')"
			@close="$emit('unfreeze')"
			@updateNotificationType="sendMessage"
		/>
	`,
};
