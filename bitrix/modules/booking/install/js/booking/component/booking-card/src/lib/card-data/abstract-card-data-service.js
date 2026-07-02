import type { Store } from 'ui.vue3.vuex';

import { Loc } from 'main.core';
import { Core } from 'booking.core';
import type { EntityDataAttribute } from 'booking.const';

import type { DealHelper } from 'booking.lib.deal-helper';
import type { BookingModel, SkuModel } from 'booking.model.bookings';
import type { ClientData, ClientModel } from 'booking.model.clients';
import type { WaitListItemModel } from 'booking.model.wait-list';

import { buildBookingCardDataAttributes } from '../../lib/data-attributes';

export class AbstractCardDataService
{
	#itemId: number;
	#dealHelper: DealHelper;

	constructor(itemId: number)
	{
		this.#itemId = itemId;
	}

	buildDataAttributes(element: string): {[key: string]: string | number}
	{
		return buildBookingCardDataAttributes({
			id: this.itemId,
			kind: this.dataKindAttribute,
			element,
		});
	}

	get dataKindAttribute(): $Values<typeof EntityDataAttribute>
	{
		throw new Error('You must implement dataKindAttribute() method.');
	}

	get item(): BookingModel | WaitListItemModel
	{
		throw new Error('You must implement item() method.');
	}

	get primaryClient(): ClientModel | null
	{
		throw new Error('You must implement primaryClient() method.');
	}

	createDealHelper(): DealHelper
	{
		throw new Error('You must implement createDealHelper() method.');
	}

	get skus(): SkuModel[]
	{
		throw new Error('You must implement skus() method.');
	}

	async saveNote(note: string): Promise<void>
	{
		throw new Error('You must implement saveNote() method.');
	}

	async addClients(clients: ClientData[]): Promise<void>
	{
		throw new Error('You must implement addClients() method.');
	}

	get itemId(): number
	{
		return this.#itemId;
	}

	set itemId(value: number)
	{
		this.#itemId = value;
	}

	get title(): string
	{
		return this.primaryClient?.name
			|| this.item.name
			|| Loc.getMessage('BOOKING_CARD_DATA_DEFAULT_BOOKING_NAME')
		;
	}

	get note(): string
	{
		return this.item.note ?? '';
	}

	get dealHelper(): DealHelper | null
	{
		if (!this.#dealHelper)
		{
			this.#dealHelper = this.createDealHelper();
		}

		return this.#dealHelper;
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
