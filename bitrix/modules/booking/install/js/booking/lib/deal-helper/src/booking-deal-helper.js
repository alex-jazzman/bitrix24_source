import { Core } from 'booking.core';
import { CrmEntity, Model } from 'booking.const';
import { bookingService } from 'booking.provider.service.booking-service';
import { mainPageService } from 'booking.provider.service.main-page-service';
import type { BookingModel, DealData } from 'booking.model.bookings';

import { DealHelper } from './deal-helper';

export class BookingDealHelper extends DealHelper
{
	#bookingId: number;

	constructor(bookingId: number)
	{
		super();
		this.#bookingId = bookingId;
	}

	hasDeal(): boolean
	{
		return Boolean(this.#deal);
	}

	get #deal(): DealData | null
	{
		return this.#booking?.externalData?.find((data) => data.entityTypeId === CrmEntity.Deal) || null;
	}

	get #booking(): BookingModel
	{
		return Core.getStore().getters[`${Model.Bookings}/getById`](this.#bookingId);
	}

	openDeal(): void
	{
		super.openDealSidePanel({
			deal: this.#deal,
			onClose: async (deal: DealData | null): Promise<void> => {
				if (deal?.value)
				{
					void bookingService.getById(this.#bookingId);
					void mainPageService.fetchCounters();
				}
			},
		});
	}

	async createDeal(): void
	{
		await bookingService.createDeal(this.#bookingId);
		this.openDeal();
	}

	saveDeal(dealData: DealData | null): void
	{
		const externalData = this.#booking.externalData.filter((data) => data.entityTypeId !== CrmEntity.Deal);

		if (dealData)
		{
			externalData.push(dealData);
		}

		void bookingService.update({
			id: this.#bookingId,
			externalData,
		});
	}
}
