import { AbstractCardDataService } from 'booking.component.booking-card';
import { bookingService } from 'booking.provider.service.booking-service';
import { EntityDataAttribute, Model } from 'booking.const';
import { BookingDealHelper } from 'booking.lib.deal-helper';

import type { ClientModel, ClientData } from 'booking.model.clients';
import type { BookingModel, SkuModel } from 'booking.model.bookings';

export class BookingCardDataService extends AbstractCardDataService
{
	get dataKindAttribute(): $Values<typeof EntityDataAttribute>
	{
		return EntityDataAttribute.Booking;
	}

	get item(): BookingModel
	{
		return this.$store.getters[`${Model.Bookings}/getById`](this.itemId);
	}

	get primaryClient(): ClientModel | null
	{
		const primaryClientData = this.item.primaryClient;
		if (!primaryClientData)
		{
			return null;
		}

		return this.$store.getters[`${Model.Clients}/getByClientData`](primaryClientData);
	}

	createDealHelper(): BookingDealHelper
	{
		return new BookingDealHelper(this.itemId);
	}

	get skus(): SkuModel[]
	{
		return this.item.skus ?? [];
	}

	async saveNote(note: string): Promise<void>
	{
		await bookingService.update({
			id: this.itemId,
			note,
		});
	}

	async addClients(clients: ClientData[]): Promise<void>
	{
		await bookingService.update({
			id: this.itemId,
			clients,
		});
	}
}
