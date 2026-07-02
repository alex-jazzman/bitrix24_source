import { AbstractCardDataService } from 'booking.component.booking-card';
import { CrmEntity, EntityDataAttribute, Model } from 'booking.const';
import { WaitListDealHelper } from 'booking.lib.deal-helper';
import { waitListService } from 'booking.provider.service.wait-list-service';

import type { SkuModel } from 'booking.model.bookings';
import type { DealHelper } from 'booking.lib.deal-helper';
import type { WaitListItemModel } from 'booking.model.wait-list';
import type { ClientData, ClientModel } from 'booking.model.clients';

export class WaitListCardDataService extends AbstractCardDataService
{
	get dataKindAttribute(): $Values<typeof EntityDataAttribute>
	{
		return EntityDataAttribute.WaitListItem;
	}

	get item(): WaitListItemModel
	{
		return this.$store.getters[`${Model.WaitList}/getById`](this.itemId);
	}

	get primaryClient(): ClientModel | null
	{
		const primaryClientData = this.item.clients?.[0];
		if (!primaryClientData)
		{
			return null;
		}

		return this.$store.getters[`${Model.Clients}/getByClientData`](primaryClientData);
	}

	createDealHelper(): DealHelper
	{
		return new WaitListDealHelper(this.itemId);
	}

	get skus(): SkuModel[]
	{
		const deal = this.item.externalData?.find(
			(data) => data.entityTypeId === CrmEntity.Deal,
		);

		if (!deal)
		{
			return [];
		}

		const opportunity = Number(deal.data?.opportunity);
		const currencyId = deal.data?.currencyId;

		if (!Number.isFinite(opportunity) || !currencyId)
		{
			return [];
		}

		return [{
			id: deal.value ?? this.itemId,
			name: '',
			price: opportunity,
			currencyId,
		}];
	}

	async saveNote(note: string): Promise<void>
	{
		await waitListService.update({
			id: this.itemId,
			note,
		});
	}

	async addClients(clients: ClientData[]): Promise<void>
	{
		await waitListService.update({
			id: this.itemId,
			clients,
		});
	}
}
