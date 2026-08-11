/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, booking_core, booking_const, booking_lib_resourcesDateCache, booking_lib_apiClient, booking_provider_service_resourcesService, booking_provider_service_bookingService, booking_provider_service_clientService) {
	'use strict';

	class ResourceDialogDataExtractor {
		#response;
		constructor(response) {
			this.#response = response;
		}
		getBookings() {
			return this.#response.bookings.map(booking => {
				return booking_provider_service_bookingService.BookingMappers.mapDtoToModel(booking);
			});
		}
		getClients() {
			return this.#response.bookings.flatMap(({
				clients
			}) => clients.map(client => {
				return booking_provider_service_clientService.ClientMappers.mapDtoToModel(client);
			}));
		}
		getResources() {
			return this.#response.resources.map(resource => {
				return booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resource);
			});
		}
	}

	class MainResourcesExtractor {
		#data;
		constructor(data) {
			this.#data = data;
		}
		getMainResourceIds() {
			return this.#data.map(resource => resource.id);
		}
	}

	const MainResourcesCacheKey = Object.freeze({
		All: 'all',
		ShortSlotsOnly: 'shortSlotsOnly'
	});
	class ResourceDialogService {
		#queryCache = [];
		#loadByIdsPromises = {};
		#loadBySkuIdsPromises = {};
		#mainResourcesCache = new Map();
		async loadByIds(idsToLoad, dateTs) {
			try {
				this.#loadByIdsPromises[dateTs] ??= {};
				const requestedIds = Object.keys(this.#loadByIdsPromises[dateTs]).flatMap(key => key.split(',')).map(id => Number(id));
				const requestedIdsSet = new Set(requestedIds);
				const ids = idsToLoad.filter(id => !requestedIdsSet.has(id));
				if (!main_core.Type.isArrayFilled(ids)) {
					await Promise.all(Object.values(this.#loadByIdsPromises[dateTs]));
					return;
				}
				const idsKey = ids.join(',');
				this.#loadByIdsPromises[dateTs][idsKey] = this.#requestLoadByIds(ids, dateTs);
				const data = await this.#loadByIdsPromises[dateTs][idsKey];
				await this.#upsertResponseData(data, dateTs);
			} catch (error) {
				console.error('ResourceDialogLoadByIdsRequest: error', error);
			}
		}
		async loadBySkuIds(idsToLoad, dateTs) {
			try {
				this.#loadBySkuIdsPromises[dateTs] ??= {};
				const requestedIds = Object.keys(this.#loadBySkuIdsPromises[dateTs]).flatMap(key => key.split(',')).map(id => Number(id));
				const requestedIdsSet = new Set(requestedIds);
				const ids = idsToLoad.filter(id => !requestedIdsSet.has(id));
				if (!main_core.Type.isArrayFilled(ids)) {
					await Promise.all(Object.values(this.#loadBySkuIdsPromises[dateTs]));
					return;
				}
				const idsKey = ids.join(',');
				this.#loadBySkuIdsPromises[dateTs][idsKey] = this.#requestLoadBySkuIds(ids, dateTs);
				const data = await this.#loadBySkuIdsPromises[dateTs][idsKey];
				await this.#upsertResponseData(data, dateTs);
			} catch (error) {
				console.error('ResourceDialogLoadBySkuIdsRequest: error', error);
			}
		}
		async #requestLoadByIds(ids, dateTs) {
			return new booking_lib_apiClient.ApiClient().post('ResourceDialog.loadByIds', {
				ids,
				dateTs
			});
		}
		async #requestLoadBySkuIds(ids, dateTs) {
			return new booking_lib_apiClient.ApiClient().post('ResourceDialog.loadBySkuIds', {
				ids,
				dateTs
			});
		}
		async fillDialog(dateTs) {
			try {
				const data = await new booking_lib_apiClient.ApiClient().post('ResourceDialog.fillDialog', {
					dateTs
				});
				await this.#upsertResponseData(data, dateTs);
			} catch (error) {
				console.error('ResourceDialogFillDialogRequest: error', error);
			}
		}
		async doSearch(query, dateTs, typeIds) {
			if (!main_core.Type.isStringFilled(query) && typeIds.length === 0) {
				return;
			}
			const fullQuery = `${query}-${typeIds.join('-')}`;
			if (this.#isQueryLoaded(fullQuery)) {
				return;
			}
			this.#queryCache.push(fullQuery);
			try {
				const data = await new booking_lib_apiClient.ApiClient().post('ResourceDialog.doSearch', {
					query,
					dateTs,
					typeIds
				});
				await this.#upsertResponseData(data, dateTs);
			} catch (error) {
				console.error('ResourceDialogDoSearchRequest: error', error);
			}
		}
		async #upsertResponseData(data, dateTs) {
			const extractor = new ResourceDialogDataExtractor(data);
			booking_lib_resourcesDateCache.resourcesDateCache.upsertIds(dateTs, extractor.getResources().map(it => it.id));
			await Promise.all([booking_core.Core.getStore().dispatch('bookings/upsertMany', extractor.getBookings()), booking_core.Core.getStore().dispatch('clients/upsertMany', extractor.getClients()), booking_core.Core.getStore().dispatch('resources/upsertMany', extractor.getResources())]);
		}
		#isQueryLoaded(query) {
			return this.#queryCache.some(it => query.startsWith(it));
		}
		async getMainResources(options = {}) {
			try {
				const cacheKey = this.#getMainResourcesCacheKey(options);
				if (!this.#mainResourcesCache.has(cacheKey)) {
					this.#mainResourcesCache.set(cacheKey, this.#requestGetMainResources(options));
				}
				const mainResourcesPromise = this.#mainResourcesCache.get(cacheKey);
				if (!mainResourcesPromise) {
					return [];
				}
				const data = await mainResourcesPromise;
				const extractor = new MainResourcesExtractor(data);
				if (options.shortSlotsOnly !== true) {
					const ids = extractor.getMainResourceIds();
					await booking_core.Core.getStore().dispatch(`${booking_const.Model.MainResources}/setMainResources`, ids);
				}
				const resources = data.map(resourceDto => booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto));
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/upsertMany`, resources);
				return resources;
			} catch (error) {
				console.error('ResourceDialogGetMainResources: error', error);
				return [];
			}
		}
		#getMainResourcesCacheKey(options) {
			return options.shortSlotsOnly === true ? MainResourcesCacheKey.ShortSlotsOnly : MainResourcesCacheKey.All;
		}
		#requestGetMainResources(options) {
			const api = new booking_lib_apiClient.ApiClient();
			return api.post('ResourceDialog.getMainResources', {
				shortSlotsOnly: options.shortSlotsOnly === true
			});
		}
		clearMainResourcesCache() {
			this.#mainResourcesCache.clear();
		}
	}
	const resourceDialogService = new ResourceDialogService();

	exports.resourceDialogService = resourceDialogService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service);
//# sourceMappingURL=resource-dialog-service.bundle.js.map
