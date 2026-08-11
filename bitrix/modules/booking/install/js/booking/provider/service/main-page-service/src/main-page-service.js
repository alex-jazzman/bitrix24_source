import { Type } from 'main.core';
import { LocalStorageCache } from 'main.core.cache';

import { Core } from 'booking.core';
import { Communication, Model } from 'booking.const';
import { DatePeriod } from 'booking.lib.date-period';
import { resourcesDateCache } from 'booking.lib.resources-date-cache';
import { ApiClient, apiClient } from 'booking.lib.api-client';
import type { BookingModel } from 'booking.model.bookings';
import type { DatePeriodTs } from 'booking.lib.date-period';

import { MainPageDataExtractor } from './main-page-data-extractor';
import { CountersExtractor } from './counters-extractor';
import type { TimezonesDto } from './types';

class MainPageService
{
	#dateCache: Set<number> = new Set();
	#timezonesLocalStorageKey = 'bookingTimezones';

	clearCache(ids: number[]): void
	{
		this.#dateCache = new Set(
			[...this.#dateCache].filter((date: number) => resourcesDateCache.isDateLoaded(date, ids)),
		);
	}

	async fetchData(datePeriod: DatePeriodTs): Promise<void>
	{
		const periodDates = DatePeriod.getDates(datePeriod);

		const isCachedDates = periodDates.every((dateTs: number): boolean => this.#dateCache.has(dateTs));
		if (isCachedDates)
		{
			return;
		}

		await this.loadData(datePeriod);

		for (const dateTs of periodDates)
		{
			this.#dateCache.add(dateTs);
		}
	}

	async loadData(datePeriod: DatePeriodTs): Promise<void>
	{
		try
		{
			if (Core.getStore().getters[`${Model.Interface}/editingBookingId`] > 0)
			{
				await this.#requestDataForBooking(datePeriod);
			}
			else
			{
				await this.#requestData(datePeriod);
			}
		}
		catch (error)
		{
			console.error('BookingMainPageGetRequest: error', error);
		}
	}

	async #requestData(datePeriod: DatePeriodTs): Promise<void>
	{
		const data = await new ApiClient().get('MainPage.get', {
			dateFromTs: datePeriod.fromTs,
			dateToTs: datePeriod.toTs,
		});
		const extractor = new MainPageDataExtractor(data);
		const favoriteIds = extractor.getFavoriteIds();

		for (const dateTs of DatePeriod.getDates(datePeriod))
		{
			resourcesDateCache.upsertIds(dateTs, favoriteIds);
		}

		await Promise.all([
			Core.getStore().dispatch(`${Model.Favorites}/set`, favoriteIds),
			Core.getStore().dispatch(`${Model.Interface}/setResourcesIds`, favoriteIds),
			Core.getStore().dispatch(`${Model.Interface}/setIntersectionMode`, extractor.getIntersectionMode()),
			Core.getStore().dispatch(`${Model.Resources}/upsertMany`, extractor.getResources()),
			Core.getStore().dispatch(`${Model.ResourceTypes}/upsertMany`, extractor.getResourceTypes()),
			Core.getStore().dispatch(`${Model.Counters}/set`, extractor.getCounters()),
			Core.getStore().dispatch(`${Model.Bookings}/upsertMany`, extractor.getBookings()),
			Core.getStore().dispatch(`${Model.WaitList}/upsertMany`, extractor.getWaitListItems()),
			Core.getStore().dispatch(`${Model.Clients}/upsertMany`, extractor.getClients()),
			Core.getStore().dispatch(`${Model.Clients}/setProviderModuleId`, extractor.getClientsProviderModuleId()),
			Core.getStore().dispatch(
				`${Model.Interface}/setShouldShowWhatsAppEmergency`,
				extractor.getShouldShowWhatsAppEmergency(),
			),
			Core.getStore().dispatch(
				`${Model.Interface}/setAiCallBannerMode`,
				extractor.getAiCallBannerMode(),
			),
			Core.getStore().dispatch(`${Model.Sku}/setCatalogSkuEntityOptions`, extractor.getCatalogSkuEntityOptions()),
			Core.getStore().dispatch(`${Model.Notifications}/upsertManySenders`, extractor.getSenders()),
		]);
	}

	async #requestDataForBooking(datePeriod: DatePeriodTs): Promise<void>
	{
		const bookingId = Core.getStore().getters[`${Model.Interface}/editingBookingId`];
		const resourcesIds = Core.getStore().getters[`${Model.Favorites}/get`];

		const data = await new ApiClient().get('MainPage.getForBooking', {
			dateFromTs: datePeriod.fromTs,
			dateToTs: datePeriod.toTs,
			bookingId,
			resourcesIds,
		});

		const extractor = new MainPageDataExtractor(data);

		const promises = [
			Core.getStore().dispatch(`${Model.Interface}/setIntersectionMode`, extractor.getIntersectionMode()),
			Core.getStore().dispatch(`${Model.Resources}/upsertMany`, extractor.getResources()),
			Core.getStore().dispatch(`${Model.ResourceTypes}/upsertMany`, extractor.getResourceTypes()),
			Core.getStore().dispatch(`${Model.Counters}/set`, extractor.getCounters()),
			Core.getStore().dispatch(`${Model.Bookings}/upsertMany`, extractor.getBookings()),
			Core.getStore().dispatch(`${Model.Clients}/upsertMany`, extractor.getClients()),
			Core.getStore().dispatch(`${Model.Clients}/setProviderModuleId`, extractor.getClientsProviderModuleId()),
			Core.getStore().dispatch(
				`${Model.Interface}/setShouldShowWhatsAppEmergency`,
				extractor.getShouldShowWhatsAppEmergency(),
			),
			Core.getStore().dispatch(`${Model.Notifications}/upsertManySenders`, extractor.getSenders()),
		];

		const editingBooking = extractor.getBookings()
			.find((booking: BookingModel) => booking.id === bookingId)
		;

		if (!editingBooking)
		{
			promises.push(
				Core.getStore().dispatch(`${Model.Interface}/setEditingBookingId`, 0),
			);
		}

		let selectedResourcesIds = resourcesIds;
		if (editingBooking && resourcesIds.length === 0)
		{
			selectedResourcesIds = [editingBooking.resourcesIds[0]];

			promises.push(
				Core.getStore().dispatch(`${Model.Favorites}/set`, [editingBooking.resourcesIds[0]]),
				Core.getStore().dispatch(`${Model.Interface}/setResourcesIds`, [editingBooking.resourcesIds[0]]),
			);
		}

		const catalogSkuEntityOptions = Core.getStore().state[Model.Sku].catalogSkuEntityOptions;
		if (Type.isNull(catalogSkuEntityOptions) || Object.keys(catalogSkuEntityOptions).length === 0)
		{
			promises.push(
				Core.getStore().dispatch(`${Model.Sku}/setCatalogSkuEntityOptions`, extractor.getCatalogSkuEntityOptions()),
			);
		}

		for (const dateTs of DatePeriod.getDates(datePeriod))
		{
			resourcesDateCache.upsertIds(dateTs, selectedResourcesIds);
		}

		await Promise.all(promises);
	}

	async fetchCounters(): Promise<void>
	{
		try
		{
			const data = await new ApiClient().get('MainPage.getCounters');

			const extractor = new CountersExtractor(data);

			await Promise.all([
				Core.getStore().dispatch(`${Model.Interface}/setTotalClients`, extractor.getTotalClients()),
				Core.getStore().dispatch(
					`${Model.Interface}/setTotalNewClientsToday`,
					extractor.getTotalNewClientsToday(),
				),
				Core.getStore().dispatch(`${Model.Interface}/setMoneyStatistics`, extractor.getMoneyStatistics()),
				Core.getStore().dispatch(`${Model.Counters}/set`, extractor.getCounters()),
			]);
		}
		catch (error)
		{
			console.error('BookingMainPageGetCountersRequest: error', error);
		}
	}

	async activateDemo(): Promise<boolean>
	{
		try
		{
			return await new ApiClient().get('MainPage.activateDemo');
		}
		catch (error)
		{
			console.error('BookingMainPageActivateDemoRequest: error', error);
		}

		return Promise.resolve(false);
	}

	async switchAllToAiCall(): Promise<boolean>
	{
		try
		{
			await new ApiClient().post('AiCallBanner.switchAllToAiCall', {});

			const store = Core.getStore();
			store.dispatch(`${Model.Resources}/setSenderCodeForAll`, Communication.AiCall);
			store.dispatch(`${Model.ResourceTypes}/setSenderCodeForAll`, Communication.AiCall);

			return true;
		}
		catch (error)
		{
			console.error('BookingAiCallBannerSwitchAllToAiCallRequest: error', error);
		}

		return Promise.resolve(false);
	}

	async registerAiCallBannerShown(): Promise<boolean>
	{
		try
		{
			return await new ApiClient().post('AiCallBanner.registerShown');
		}
		catch (error)
		{
			console.error('BookingAiCallBannerRegisterShownRequest: error', error);
		}

		return Promise.resolve(false);
	}

	async getTimezones(): Promise<TimezonesDto>
	{
		try
		{
			const ls = new LocalStorageCache();
			let timezones = this.#parseTimezonesFromLocalStorage(
				ls.get(this.#timezonesLocalStorageKey, null),
			);

			if (Type.isArrayFilled(timezones))
			{
				return timezones;
			}

			timezones = await apiClient.get('MainPage.getTimezones');
			ls.set(this.#timezonesLocalStorageKey, timezones);

			return timezones;
		}
		catch (error)
		{
			console.error('BookingMainPage.GetTimezonesRequest: error', error);
		}
	}

	#parseTimezonesFromLocalStorage(storageValue: string | null = null): TimezonesDto | null
	{
		if (Type.isStringFilled(storageValue))
		{
			const timezones = JSON.parse(storageValue) || [];

			return Type.isArrayFilled(timezones) ? timezones : null;
		}

		return null;
	}
}

export const mainPageService = new MainPageService();
