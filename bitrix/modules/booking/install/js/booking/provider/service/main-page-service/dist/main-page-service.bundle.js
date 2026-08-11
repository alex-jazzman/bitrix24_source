/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, main_core_cache, booking_core, booking_const, booking_lib_datePeriod, booking_lib_resourcesDateCache, booking_lib_apiClient, booking_provider_service_bookingService, booking_provider_service_clientService, booking_provider_service_resourcesService, booking_provider_service_resourcesTypeService, booking_provider_service_waitListService) {
	'use strict';

	class MainPageDataExtractor {
		#response;
		constructor(response) {
			this.#response = response;
		}
		getFavoriteIds() {
			return this.#response.favorites.resources.map(resource => resource.id);
		}
		getBookings() {
			return this.#response.bookings.map(booking => {
				return booking_provider_service_bookingService.BookingMappers.mapDtoToModel(booking);
			});
		}
		getClientsProviderModuleId() {
			return this.#response.clients.providerModuleId;
		}
		getClients() {
			return [...this.#extractClients(booking_const.CrmEntity.Contact), ...this.#extractClients(booking_const.CrmEntity.Company), ...this.#extractClientsFromWaitListItems(), ...this.#extractClientsFromBookings()];
		}
		#extractClients(code) {
			const module = this.#response.clients.providerModuleId;
			if (!module) {
				return [];
			}
			return Object.values(this.#response.clients.recent[code]).map(client => ({
				...client,
				type: {
					module,
					code
				}
			}));
		}
		#extractClientsFromBookings() {
			return MainPageDataExtractor.#extractClientsFromItem(this.#response.bookings);
		}
		#extractClientsFromWaitListItems() {
			return MainPageDataExtractor.#extractClientsFromItem(this.#response.waitListItems);
		}
		static #extractClientsFromItem(items) {
			return items.flatMap(({
				clients
			}) => clients.map(client => {
				return booking_provider_service_clientService.ClientMappers.mapDtoToModel(client);
			}));
		}
		getCounters() {
			return this.#response.counters;
		}
		getResources() {
			const favoriteResources = this.#response.favorites?.resources ?? [];
			const bookingResources = this.#response.bookings.flatMap(({
				resources
			}) => resources);
			const result = {};
			[...favoriteResources, ...bookingResources].forEach(resourceDto => {
				result[resourceDto.id] ??= booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto);
			});
			return Object.values(result);
		}
		getResourceTypes() {
			return this.#response.resourceTypes.map(resourceTypeDto => {
				return booking_provider_service_resourcesTypeService.ResourceTypeMappers.mapDtoToModel(resourceTypeDto);
			});
		}
		getWaitListItems() {
			return this.#response.waitListItems.map(waitListItemDto => {
				return booking_provider_service_waitListService.WaitListMappers.mapDtoToModel(waitListItemDto);
			});
		}
		getIntersectionMode() {
			return this.#response.isIntersectionForAll;
		}
		getShouldShowWhatsAppEmergency() {
			return this.#response.shouldShowWhatsAppEmergency;
		}
		getAiCallBannerMode() {
			return this.#response.aiCallBannerMode ?? null;
		}
		getCatalogSkuEntityOptions() {
			return this.#response.catalogSkuEntityOptions;
		}
		getSenders() {
			return this.#response.senders ?? [];
		}
	}

	class CountersExtractor {
		#response;
		constructor(response) {
			this.#response = response;
		}
		getCounters() {
			return this.#response.counters;
		}
		getTotalClients() {
			return this.#response.clientStatistics.total;
		}
		getTotalNewClientsToday() {
			return this.#response.clientStatistics.totalToday;
		}
		getMoneyStatistics() {
			return this.#response.moneyStatistics;
		}
	}

	class MainPageService {
		#dateCache = new Set();
		#timezonesLocalStorageKey = 'bookingTimezones';
		clearCache(ids) {
			this.#dateCache = new Set([...this.#dateCache].filter(date => booking_lib_resourcesDateCache.resourcesDateCache.isDateLoaded(date, ids)));
		}
		async fetchData(datePeriod) {
			const periodDates = booking_lib_datePeriod.DatePeriod.getDates(datePeriod);
			const isCachedDates = periodDates.every(dateTs => this.#dateCache.has(dateTs));
			if (isCachedDates) {
				return;
			}
			await this.loadData(datePeriod);
			for (const dateTs of periodDates) {
				this.#dateCache.add(dateTs);
			}
		}
		async loadData(datePeriod) {
			try {
				if (booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/editingBookingId`] > 0) {
					await this.#requestDataForBooking(datePeriod);
				} else {
					await this.#requestData(datePeriod);
				}
			} catch (error) {
				console.error('BookingMainPageGetRequest: error', error);
			}
		}
		async #requestData(datePeriod) {
			const data = await new booking_lib_apiClient.ApiClient().get('MainPage.get', {
				dateFromTs: datePeriod.fromTs,
				dateToTs: datePeriod.toTs
			});
			const extractor = new MainPageDataExtractor(data);
			const favoriteIds = extractor.getFavoriteIds();
			for (const dateTs of booking_lib_datePeriod.DatePeriod.getDates(datePeriod)) {
				booking_lib_resourcesDateCache.resourcesDateCache.upsertIds(dateTs, favoriteIds);
			}
			await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Favorites}/set`, favoriteIds), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setResourcesIds`, favoriteIds), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setIntersectionMode`, extractor.getIntersectionMode()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/upsertMany`, extractor.getResources()), booking_core.Core.getStore().dispatch(`${booking_const.Model.ResourceTypes}/upsertMany`, extractor.getResourceTypes()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Counters}/set`, extractor.getCounters()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/upsertMany`, extractor.getBookings()), booking_core.Core.getStore().dispatch(`${booking_const.Model.WaitList}/upsertMany`, extractor.getWaitListItems()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/upsertMany`, extractor.getClients()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/setProviderModuleId`, extractor.getClientsProviderModuleId()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setShouldShowWhatsAppEmergency`, extractor.getShouldShowWhatsAppEmergency()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setAiCallBannerMode`, extractor.getAiCallBannerMode()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Sku}/setCatalogSkuEntityOptions`, extractor.getCatalogSkuEntityOptions()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Notifications}/upsertManySenders`, extractor.getSenders())]);
		}
		async #requestDataForBooking(datePeriod) {
			const bookingId = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/editingBookingId`];
			const resourcesIds = booking_core.Core.getStore().getters[`${booking_const.Model.Favorites}/get`];
			const data = await new booking_lib_apiClient.ApiClient().get('MainPage.getForBooking', {
				dateFromTs: datePeriod.fromTs,
				dateToTs: datePeriod.toTs,
				bookingId,
				resourcesIds
			});
			const extractor = new MainPageDataExtractor(data);
			const promises = [booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setIntersectionMode`, extractor.getIntersectionMode()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/upsertMany`, extractor.getResources()), booking_core.Core.getStore().dispatch(`${booking_const.Model.ResourceTypes}/upsertMany`, extractor.getResourceTypes()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Counters}/set`, extractor.getCounters()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/upsertMany`, extractor.getBookings()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/upsertMany`, extractor.getClients()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/setProviderModuleId`, extractor.getClientsProviderModuleId()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setShouldShowWhatsAppEmergency`, extractor.getShouldShowWhatsAppEmergency()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Notifications}/upsertManySenders`, extractor.getSenders())];
			const editingBooking = extractor.getBookings().find(booking => booking.id === bookingId);
			if (!editingBooking) {
				promises.push(booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setEditingBookingId`, 0));
			}
			let selectedResourcesIds = resourcesIds;
			if (editingBooking && resourcesIds.length === 0) {
				selectedResourcesIds = [editingBooking.resourcesIds[0]];
				promises.push(booking_core.Core.getStore().dispatch(`${booking_const.Model.Favorites}/set`, [editingBooking.resourcesIds[0]]), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setResourcesIds`, [editingBooking.resourcesIds[0]]));
			}
			const catalogSkuEntityOptions = booking_core.Core.getStore().state[booking_const.Model.Sku].catalogSkuEntityOptions;
			if (main_core.Type.isNull(catalogSkuEntityOptions) || Object.keys(catalogSkuEntityOptions).length === 0) {
				promises.push(booking_core.Core.getStore().dispatch(`${booking_const.Model.Sku}/setCatalogSkuEntityOptions`, extractor.getCatalogSkuEntityOptions()));
			}
			for (const dateTs of booking_lib_datePeriod.DatePeriod.getDates(datePeriod)) {
				booking_lib_resourcesDateCache.resourcesDateCache.upsertIds(dateTs, selectedResourcesIds);
			}
			await Promise.all(promises);
		}
		async fetchCounters() {
			try {
				const data = await new booking_lib_apiClient.ApiClient().get('MainPage.getCounters');
				const extractor = new CountersExtractor(data);
				await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setTotalClients`, extractor.getTotalClients()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setTotalNewClientsToday`, extractor.getTotalNewClientsToday()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setMoneyStatistics`, extractor.getMoneyStatistics()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Counters}/set`, extractor.getCounters())]);
			} catch (error) {
				console.error('BookingMainPageGetCountersRequest: error', error);
			}
		}
		async activateDemo() {
			try {
				return await new booking_lib_apiClient.ApiClient().get('MainPage.activateDemo');
			} catch (error) {
				console.error('BookingMainPageActivateDemoRequest: error', error);
			}
			return Promise.resolve(false);
		}
		async switchAllToAiCall() {
			try {
				await new booking_lib_apiClient.ApiClient().post('AiCallBanner.switchAllToAiCall', {});
				const store = booking_core.Core.getStore();
				store.dispatch(`${booking_const.Model.Resources}/setSenderCodeForAll`, booking_const.Communication.AiCall);
				store.dispatch(`${booking_const.Model.ResourceTypes}/setSenderCodeForAll`, booking_const.Communication.AiCall);
				return true;
			} catch (error) {
				console.error('BookingAiCallBannerSwitchAllToAiCallRequest: error', error);
			}
			return Promise.resolve(false);
		}
		async registerAiCallBannerShown() {
			try {
				return await new booking_lib_apiClient.ApiClient().post('AiCallBanner.registerShown');
			} catch (error) {
				console.error('BookingAiCallBannerRegisterShownRequest: error', error);
			}
			return Promise.resolve(false);
		}
		async getTimezones() {
			try {
				const ls = new main_core_cache.LocalStorageCache();
				let timezones = this.#parseTimezonesFromLocalStorage(ls.get(this.#timezonesLocalStorageKey, null));
				if (main_core.Type.isArrayFilled(timezones)) {
					return timezones;
				}
				timezones = await booking_lib_apiClient.apiClient.get('MainPage.getTimezones');
				ls.set(this.#timezonesLocalStorageKey, timezones);
				return timezones;
			} catch (error) {
				console.error('BookingMainPage.GetTimezonesRequest: error', error);
			}
		}
		#parseTimezonesFromLocalStorage(storageValue = null) {
			if (main_core.Type.isStringFilled(storageValue)) {
				const timezones = JSON.parse(storageValue) || [];
				return main_core.Type.isArrayFilled(timezones) ? timezones : null;
			}
			return null;
		}
	}
	const mainPageService = new MainPageService();

	exports.mainPageService = mainPageService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Cache, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service);
//# sourceMappingURL=main-page-service.bundle.js.map
