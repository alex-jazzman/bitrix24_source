/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, booking_core, booking_const, booking_lib_apiClient, booking_lib_bookingFilter, booking_lib_datePeriod, booking_lib_deepToRaw, booking_lib_requestRevisionGuard, booking_provider_service_mainPageService, booking_provider_service_clientService, booking_provider_service_resourcesService) {
	'use strict';

	function mapModelToDto(booking) {
		const mappings = {
			id: () => Number(booking.id) || 0,
			resources: () => booking.resourcesIds.map(id => ({
				id
			})),
			primaryClient: () => booking.clients?.[0],
			clients: () => booking.clients,
			name: () => booking.name,
			datePeriod: () => ({
				from: {
					timestamp: booking.dateFromTs / 1000,
					timezone: booking.timezoneFrom
				},
				to: {
					timestamp: booking.dateToTs / 1000,
					timezone: booking.timezoneTo
				}
			}),
			isConfirmed: () => booking.isConfirmed,
			rrule: () => booking.rrule,
			note: () => booking.note,
			visitStatus: () => booking.visitStatus,
			externalData: () => booking.externalData,
			skus: () => booking.skus,
			payment: () => booking.payment
		};
		const dependentFields = new Map([['resources', ['resourcesIds']], ['datePeriod', ['dateFromTs', 'dateToTs']]]);
		return Object.keys(mappings).reduce((result, field) => {
			const dependencies = dependentFields.get(field);
			const hasDependencies = dependencies ? dependencies.every(dep => dep in booking) : true;
			if (hasDependencies && (field in booking || dependencies)) {
				const value = mappings[field]();
				if (value !== undefined) {
					// eslint-disable-next-line no-param-reassign
					result[field] = value;
				}
			}
			return result;
		}, {});
	}
	function mapDtoToModel(bookingDto) {
		const clients = bookingDto.clients.filter(client => main_core.Type.isArrayFilled(Object.values(client.data)));
		const booking = {
			id: bookingDto.id,
			updatedAt: bookingDto.updatedAt,
			resourcesIds: getSortedResourcesByPrimary(bookingDto),
			primaryClient: clients?.[0],
			clients,
			counter: bookingDto.counter,
			counters: bookingDto.counters,
			createdAt: bookingDto.createdAt,
			name: bookingDto.name,
			dateFromTs: bookingDto.datePeriod.from.timestamp * 1000,
			timezoneFrom: bookingDto.datePeriod.from.timezone,
			dateToTs: bookingDto.datePeriod.to.timestamp * 1000,
			timezoneTo: bookingDto.datePeriod.to.timezone,
			isConfirmed: bookingDto.isConfirmed,
			rrule: bookingDto.rrule,
			note: bookingDto.note,
			visitStatus: bookingDto.visitStatus,
			externalData: bookingDto.externalData,
			isConfirmationSent: bookingDto.isConfirmationSent ?? false,
			skus: bookingDto.skus,
			payment: bookingDto.payment,
			source: bookingDto.source
		};
		return Object.fromEntries(Object.entries(booking).filter(([, value]) => !main_core.Type.isUndefined(value)));
	}
	function getSortedResourcesByPrimary({
		resources
	}) {
		return [resources.find(resource => resource.isPrimary), ...resources.filter(resource => !resource.isPrimary)].map(({
			id
		}) => id);
	}
	function mapModelToCreateFromWaitListItemDto(waitListItemId, booking) {
		return {
			waitListItemId,
			resources: booking.resourcesIds.map(id => ({
				id
			})),
			datePeriod: {
				from: {
					timestamp: booking.dateFromTs / 1000,
					timezone: booking.timezoneFrom
				},
				to: {
					timestamp: booking.dateToTs / 1000,
					timezone: booking.timezoneTo
				}
			}
		};
	}

	class BookingDataExtractor {
		#response;
		constructor(response) {
			this.#response = response;
		}
		getBookings() {
			return this.#response.map(bookingDto => mapDtoToModel(bookingDto));
		}
		getBookingsIds() {
			return this.#response.map(({
				id
			}) => id);
		}
		getClients() {
			return this.#response.flatMap(({
				clients
			}) => clients).map(clientDto => {
				return booking_provider_service_clientService.ClientMappers.mapDtoToModel(clientDto);
			});
		}
		getResources() {
			return this.#response.flatMap(({
				resources
			}) => resources).map(resourceDto => {
				return booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto);
			});
		}
	}

	class BookingService {
		#filterRequests = {};
		#lastFilterRequest;
		#bookingsForResourceRequests = {};
		#updateRequestRevisionGuard = new booking_lib_requestRevisionGuard.RequestRevisionGuard();
		async add(booking) {
			const id = booking.id;
			const $store = booking_core.Core.getStore();
			try {
				await $store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, id);
				await $store.dispatch(`${booking_const.Model.Filter}/addQuickFilterIgnoredBookingId`, id);
				await $store.dispatch(`${booking_const.Model.Bookings}/add`, booking);
				const bookingDto = mapModelToDto(booking);
				const data = await new booking_lib_apiClient.ApiClient().post('Booking.add', {
					booking: bookingDto
				});
				const createdBooking = mapDtoToModel(data);
				const clients = new BookingDataExtractor([data]).getClients();
				void $store.dispatch(`${booking_const.Model.Clients}/upsertMany`, clients);
				await $store.dispatch(`${booking_const.Model.Interface}/setAnimationPause`, true);
				await $store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, createdBooking.id);
				await $store.dispatch(`${booking_const.Model.Filter}/addQuickFilterIgnoredBookingId`, createdBooking.id);
				await $store.dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: createdBooking
				});
				main_core.Event.EventEmitter.emit(booking_const.EventName.CreateBookings, {
					bookings: [createdBooking]
				});
				void booking_provider_service_mainPageService.mainPageService.fetchCounters();
				return {
					success: true,
					booking: createdBooking
				};
			} catch (error) {
				void $store.dispatch(`${booking_const.Model.Bookings}/delete`, id);
				console.error('BookingService: add error', error);
				return {
					success: false
				};
			} finally {
				await $store.dispatch(`${booking_const.Model.Interface}/setAnimationPause`, false);
			}
		}
		async addList(bookings) {
			const $store = booking_core.Core.getStore();
			try {
				await $store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, bookings.map(({
					id
				}) => id));
				const bookingList = bookings.map(booking => mapModelToDto(booking));
				const api = new booking_lib_apiClient.ApiClient();
				const data = await api.post('Booking.addList', {
					bookingList
				});
				const createdBookings = data.map(d => mapDtoToModel(d));
				await Promise.all([$store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, createdBookings.map(({
					id
				}) => id)), $store.dispatch(`${booking_const.Model.Bookings}/upsertMany`, createdBookings)]);
				main_core.Event.EventEmitter.emit(booking_const.EventName.CreateBookings, {
					bookings: createdBookings
				});
				void booking_provider_service_mainPageService.mainPageService.fetchCounters();
				return createdBookings;
			} catch (error) {
				console.error('BookingService: add list error', error);
				return [];
			}
		}
		async update(booking) {
			const id = booking.id;
			const bookingBeforeUpdate = {
				...booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getById`](id)
			};
			const updateRevision = this.#updateRequestRevisionGuard.next(id);
			try {
				if (booking.clients) {
					// eslint-disable-next-line no-param-reassign
					booking.primaryClient ??= booking.clients[0];
				}
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking
				});
				const bookingDto = mapModelToDto(booking);
				const data = await new booking_lib_apiClient.ApiClient().post('Booking.update', {
					booking: bookingDto
				});
				const updatedBooking = mapDtoToModel(data);
				if (!this.#updateRequestRevisionGuard.isActual(id, updateRevision)) {
					return;
				}
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: updatedBooking
				});
				const clients = new BookingDataExtractor([data]).getClients();
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/upsertMany`, clients);
				main_core.Event.EventEmitter.emit(booking_const.EventName.UpdateBooking, {
					oldBooking: booking_lib_deepToRaw.deepToRaw(bookingBeforeUpdate),
					newBooking: booking_lib_deepToRaw.deepToRaw(updatedBooking)
				});
				void booking_provider_service_mainPageService.mainPageService.fetchCounters();
			} catch (error) {
				if (!this.#updateRequestRevisionGuard.isActual(id, updateRevision)) {
					return;
				}
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: bookingBeforeUpdate
				});
				console.error('BookingService: update error', error);
			}
		}
		async confirm(id, isConfirmed) {
			const bookingBeforeUpdate = {
				...booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getById`](id)
			};
			try {
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: {
						id,
						isConfirmed
					}
				});
				const data = await new booking_lib_apiClient.ApiClient().post('Booking.confirm', {
					id,
					isConfirmed
				});
				const updatedBooking = mapDtoToModel(data);
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: updatedBooking
				});
				void booking_provider_service_mainPageService.mainPageService.fetchCounters();
			} catch (error) {
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: bookingBeforeUpdate
				});
				console.error('BookingService: confirm error', error);
			}
		}
		async delete(id) {
			const bookingBeforeDelete = {
				...booking_core.Core.getStore().getters[`${booking_const.Model.Bookings}/getById`](id)
			};
			try {
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/delete`, id);
				await new booking_lib_apiClient.ApiClient().post('Booking.delete', {
					id
				});
				main_core.Event.EventEmitter.emit(booking_const.EventName.DeleteBooking, {
					booking: booking_lib_deepToRaw.deepToRaw(bookingBeforeDelete)
				});
				await this.#onAfterDelete(id);
			} catch (error) {
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/upsert`, bookingBeforeDelete);
				console.error('BookingService: delete error', error);
			}
		}
		async deleteList(ids) {
			try {
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/deleteMany`, ids);
				await new booking_lib_apiClient.ApiClient().post('Booking.deleteList', {
					ids
				});
				await Promise.all(ids.map(id => this.#onAfterDelete(id)));
			} catch (error) {
				console.error('BookingService: delete list error', error);
			}
		}
		async createFromWaitListItem(waitListItemId, booking) {
			const $store = booking_core.Core.getStore();
			const id = booking.id;
			const waitListItem = {
				...$store.getters[`${booking_const.Model.WaitList}/getById`](waitListItemId)
			};
			try {
				if ($store.getters[`${booking_const.Model.Interface}/isWaitListItemCreatedFromEmbed`](waitListItemId)) {
					await $store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, id);
				}
				await $store.dispatch(`${booking_const.Model.WaitList}/delete`, waitListItemId);
				await $store.dispatch(`${booking_const.Model.Bookings}/add`, booking);
				const createFromWaitListItemDto = mapModelToCreateFromWaitListItemDto(waitListItemId, booking);
				const data = await new booking_lib_apiClient.ApiClient().post('Booking.createFromWaitListItem', createFromWaitListItemDto);
				const createdBooking = mapDtoToModel(data);
				await $store.dispatch(`${booking_const.Model.Interface}/setAnimationPause`, true);
				const clients = new BookingDataExtractor([data]).getClients();
				await Promise.all([$store.dispatch(`${booking_const.Model.Clients}/upsertMany`, clients), $store.dispatch(`${booking_const.Model.Filter}/addQuickFilterIgnoredBookingId`, createdBooking.id), $store.dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: createdBooking
				}), $store.dispatch(`${booking_const.Model.Interface}/addCreatedFromEmbedBooking`, createdBooking.id)]);
				main_core.Event.EventEmitter.emit(booking_const.EventName.CreateBookings, {
					bookings: [createdBooking]
				});
				void booking_provider_service_mainPageService.mainPageService.fetchCounters();
				return {
					success: true,
					booking: createdBooking
				};
			} catch (error) {
				await $store.dispatch(`${booking_const.Model.Bookings}/delete`, id);
				await $store.dispatch(`${booking_const.Model.WaitList}/upsert`, waitListItem);
				console.error('BookingService: add from wait list item error', error);
				return {
					success: false
				};
			} finally {
				await $store.dispatch(`${booking_const.Model.Interface}/setAnimationPause`, false);
			}
		}
		async createDeal(id) {
			try {
				const data = await new booking_lib_apiClient.ApiClient().post('Booking.createDeal', {
					bookingId: id
				});
				const updatedBooking = mapDtoToModel(data);
				void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/update`, {
					id,
					booking: updatedBooking
				});
				void booking_provider_service_mainPageService.mainPageService.fetchCounters();
			} catch (error) {
				console.error('BookingService: create deal error', error);
			}
		}
		async #onAfterDelete(id) {
			const editingBookingId = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/editingBookingId`];
			if (id === editingBookingId) {
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setEditingBookingId`, 0);
				await booking_provider_service_mainPageService.mainPageService.loadData(booking_lib_datePeriod.DatePeriod.createByCurrentGridMode());
				const resourcesIds = booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/resourcesIds`];
				booking_provider_service_mainPageService.mainPageService.clearCache(resourcesIds);
			}
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/addDeletingBooking`, id);
		}
		clearFilterCache() {
			this.#filterRequests = {};
		}
		async filter(fields) {
			try {
				const filter = booking_lib_bookingFilter.bookingFilter.prepareFilter(fields);
				const key = JSON.stringify(filter);
				this.#filterRequests[key] ??= this.#requestFilter(filter);
				this.#lastFilterRequest = this.#filterRequests[key];
				const data = await this.#filterRequests[key];
				void this.#extractFilterData({
					data,
					key
				});
			} catch (error) {
				console.error('BookingService: filter error', error);
			}
		}
		async getById(id) {
			try {
				const data = await this.#requestFilter({
					ID: [id]
				});
				const extractor = new BookingDataExtractor(data);
				await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/upsertMany`, extractor.getResources()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/upsertMany`, extractor.getBookings()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/upsertMany`, extractor.getClients())]);
			} catch (error) {
				console.error('BookingService: getById error', error);
			}
		}
		async #extractFilterData({
			data,
			key
		}) {
			const extractor = new BookingDataExtractor(data);
			await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/insertMany`, extractor.getResources()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/insertMany`, extractor.getBookings()), booking_core.Core.getStore().dispatch(`${booking_const.Model.Clients}/insertMany`, extractor.getClients())]);
			if (this.#filterRequests[key] !== this.#lastFilterRequest) {
				return;
			}
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Filter}/setFilteredBookingsIds`, extractor.getBookingsIds());
		}
		async #requestFilter(filter) {
			return new booking_lib_apiClient.ApiClient().post('Booking.list', {
				filter,
				select: ['RESOURCES', 'CLIENTS', 'EXTERNAL_DATA', 'NOTE', 'SKUS'],
				withCounters: true,
				withClientData: true,
				withExternalData: true,
				withSkus: true
			}, {
				navigation: {
					page: 'all'
				}
			});
		}
		async getBookingsByResourceId(resourceId, dateFromTs, dateToTs, excludeBookingId = null) {
			try {
				const key = JSON.stringify({
					resourceId,
					dateFromTs,
					dateToTs,
					excludeBookingId
				});
				this.#bookingsForResourceRequests[key] ??= this.#requestBookingsForResource(resourceId, dateFromTs, dateToTs, excludeBookingId);
				return await this.#bookingsForResourceRequests[key];
			} catch (error) {
				console.error('BookingService: getBookingsByResourceId error', error);
				return [];
			}
		}
		async canChangeDate(bookingId, dateFromTs, dateToTs) {
			try {
				return await new booking_lib_apiClient.ApiClient().post('Booking.canChangeDate', {
					bookingId,
					dateFromTs: Math.floor(dateFromTs / 1000),
					dateToTs: Math.floor(dateToTs / 1000)
				});
			} catch (error) {
				console.error('BookingService: canChangeDate error', error);
				return false;
			}
		}
		#requestBookingsForResource(resourceId, dateFromTs, dateToTs, excludeBookingId) {
			const filter = {
				RESOURCE_ID: [resourceId],
				WITHIN: {
					DATE_FROM: dateFromTs,
					DATE_TO: dateToTs
				}
			};
			if (excludeBookingId !== null) {
				filter['!ID'] = [excludeBookingId];
			}
			return new booking_lib_apiClient.ApiClient().post('Booking.list', {
				filter,
				select: []
			});
		}
	}
	const bookingService = new BookingService();

	const BookingMappers = {
		mapModelToDto,
		mapDtoToModel
	};

	exports.BookingMappers = BookingMappers;
	exports.bookingService = bookingService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX, BX.Booking, BX.Booking.Const, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Lib, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service);
//# sourceMappingURL=booking-service.bundle.js.map
