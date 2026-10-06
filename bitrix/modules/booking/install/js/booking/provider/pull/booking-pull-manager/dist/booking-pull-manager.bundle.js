/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, main_core, pull_queuemanager, booking_const, booking_core, booking_provider_service_bookingService, booking_provider_service_clientService, booking_provider_service_resourcesService, booking_provider_service_mainPageService, booking_provider_service_countersService, booking_provider_service_calendarService, booking_provider_service_resourcesTypeService, booking_provider_service_waitListService) {
	'use strict';

	class BasePullHandler {
		constructor() {
			if (new.target === BasePullHandler) {
				throw new TypeError('BasePullHandler: An abstract class cannot be instantiated');
			}
		}
		getMap() {
			return {};
		}
		getDelayedMap() {
			return {};
		}
	}

	class BookingPullHandler extends BasePullHandler {
		getMap() {
			return {
				bookingAdded: this.#handleBookingAdded,
				bookingUpdated: this.#handleBookingAdded,
				bookingDeleted: this.#handleBookingDeleted
			};
		}
		getDelayedMap() {
			return {
				bookingAdded: this.#updateCounters,
				bookingUpdated: this.#updateCounters,
				bookingDeleted: this.#updateCounters
			};
		}
		#handleBookingAdded = params => {
			const bookingDto = params.booking;
			const booking = booking_provider_service_bookingService.BookingMappers.mapDtoToModel(bookingDto);
			const resources = bookingDto.resources.map(resourceDto => {
				return booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto);
			});
			const clients = bookingDto.clients.map(clientDto => {
				return booking_provider_service_clientService.ClientMappers.mapDtoToModel(clientDto);
			});
			void Promise.all([booking_core.Core.getStore().dispatch('resources/upsertMany', resources), booking_core.Core.getStore().dispatch('bookings/upsert', booking), booking_core.Core.getStore().dispatch('clients/upsertMany', clients)]);
		};
		#handleBookingDeleted = params => {
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Bookings}/delete`, params.id);
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/addDeletingBooking`, params.id);
		};
		#updateCounters = async () => {
			await booking_provider_service_mainPageService.mainPageService.fetchCounters();
		};
	}

	class CountersPullHandler extends BasePullHandler {
		getDelayedMap() {
			return {
				countersUpdated: this.#handleCountersUpdated.bind(this)
			};
		}
		async #handleCountersUpdated(params) {
			await booking_provider_service_countersService.countersService.fetchData();
			await booking_provider_service_bookingService.bookingService.getById(params.entityId);
			const isFilterMode = this.#isFilterMode();
			if (!isFilterMode) {
				const viewDateTs = this.#getViewDateTs();
				const forcePull = true;
				await booking_provider_service_calendarService.calendarService.loadCounterMarks(viewDateTs, forcePull);
			}
		}
		#isFilterMode() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/isFilterMode`];
		}
		#getViewDateTs() {
			return booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/viewDateTs`];
		}
	}

	class MessagePullHandler extends BasePullHandler {
		getMap() {
			return {
				messageSent: this.#handleMessageSent
			};
		}
		#handleMessageSent = ({
			entityId: bookingId,
			message
		}) => {
			const booking = this.$store.getters[`${booking_const.Model.Bookings}/getById`](bookingId);
			if (!booking) {
				return;
			}
			const notifications = this.$store.getters[`${booking_const.Model.Dictionary}/getNotifications`];
			const isConfirmation = message.notificationType === notifications.Confirmation?.value;
			void this.$store.dispatch(`${booking_const.Model.Bookings}/update`, {
				id: booking.id,
				booking: {
					...booking,
					isConfirmationSent: booking.isConfirmationSent || isConfirmation
				}
			});
		};
		get $store() {
			return booking_core.Core.getStore();
		}
	}

	class ResourcePullHandler extends BasePullHandler {
		getMap() {
			return {
				resourceAdded: this.#handleResourceAdded.bind(this),
				resourceUpdated: this.#handleResourceUpdated.bind(this),
				resourceDeleted: this.#handleResourceDeleted.bind(this)
			};
		}
		async #handleResourceAdded(params) {
			const resourceDto = params.resource;
			const resource = booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto);
			await booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/upsert`, resource);
			if (resource.isMain) {
				await booking_core.Core.getStore().dispatch(`${booking_const.Model.Favorites}/addMany`, [resource.id]);
			}
			const isFilterMode = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/isFilterMode`];
			if (isFilterMode) {
				return;
			}
			const favorites = booking_core.Core.getStore().getters[`${booking_const.Model.Favorites}/get`];
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setResourcesIds`, favorites);
		}
		#handleResourceUpdated(params) {
			const resourceDto = params.resource;
			const resource = booking_provider_service_resourcesService.ResourceMappers.mapDtoToModel(resourceDto);
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/upsert`, resource);
		}
		#handleResourceDeleted(params) {
			void Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/delete`, params.id), booking_core.Core.getStore().dispatch(`${booking_const.Model.Favorites}/delete`, params.id), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/deleteResourceId`, params.id)]);
		}
	}

	class ResourceTypePullHandler extends BasePullHandler {
		getMap() {
			return {
				resourceTypeAdded: this.#handleResourceTypeAdded.bind(this)
			};
		}
		#handleResourceTypeAdded(params) {
			const resourceTypeDto = params.resourceType;
			const resourceType = booking_provider_service_resourcesTypeService.ResourceTypeMappers.mapDtoToModel(resourceTypeDto);
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.ResourceTypes}/upsert`, resourceType);
		}
	}

	class WaitListItemPullHandler extends BasePullHandler {
		#delayTimeout = null;
		constructor(props) {
			super(props);
			this.handleWaitListItemAdded = this.#handleWaitListItemAdded.bind(this);
			this.handleWaitListItemDeleted = this.#handleWaitListItemDeleted.bind(this);
			this.updateCounters = this.#updateCounters.bind(this);
		}
		getMap() {
			return {
				waitListItemAdded: this.handleWaitListItemAdded,
				waitListItemDeleted: this.handleWaitListItemDeleted
			};
		}
		getDelayedMap() {
			return {
				waitListItemAdded: this.updateCounters,
				waitListItemDeleted: this.updateCounters
			};
		}
		#handleWaitListItemAdded(params) {
			const waitListItemDto = params.waitListItem;
			const waitListItem = booking_provider_service_waitListService.WaitListMappers.mapDtoToModel(waitListItemDto);
			const clients = waitListItemDto.clients.map(clientDto => {
				return booking_provider_service_clientService.ClientMappers.mapDtoToModel(clientDto);
			});
			const $store = booking_core.Core.getStore();
			void Promise.all([$store.dispatch(`${booking_const.Model.WaitList}/upsert`, waitListItem), $store.dispatch(`${booking_const.Model.Clients}/upsertMany`, clients)]);
		}
		#handleWaitListItemDeleted(params) {
			const $store = booking_core.Core.getStore();
			void $store.dispatch(`${booking_const.Model.WaitList}/delete`, params.id);
			void $store.commit(`${booking_const.Model.Interface}/addDeletingWaitListItemId`, params.id);
		}
		async #updateCounters() {
			if (this.#delayTimeout) {
				return;
			}
			this.#delayTimeout = setTimeout(async () => {
				try {
					await booking_provider_service_mainPageService.mainPageService.fetchCounters();
				} finally {
					this.#delayTimeout = null;
				}
			}, 0);
		}
	}

	class BookingPullManager {
		#params;
		#loadItemsDelay = 500;
		#handlers;
		constructor(params) {
			this.#params = params;
			this.#handlers = new Set([new BookingPullHandler(), new ResourcePullHandler(), new ResourceTypePullHandler(), new CountersPullHandler(), new MessagePullHandler(), new WaitListItemPullHandler()]);
		}
		initQueueManager() {
			return new pull_queuemanager.QueueManager({
				moduleId: booking_const.Module.Booking,
				userId: this.#params.currentUserId,
				config: {
					loadItemsDelay: this.#loadItemsDelay
				},
				additionalData: {},
				events: {
					onBeforePull: baseEvent => {
						this.#onBeforePull(baseEvent);
					},
					onPull: baseEvent => {
						this.#onPull(baseEvent);
					}
				},
				callbacks: {
					onBeforeQueueExecute: items => {
						return this.#onBeforeQueueExecute(items);
					},
					onQueueExecute: items => {
						return this.#onQueueExecute(items);
					},
					onReload: () => {
						this.#onReload();
					}
				}
			});
		}
		#onBeforePull(baseEvent) {
			const {
				pullData: {
					command,
					params
				}
			} = baseEvent.data;
			for (const handler of this.#handlers) {
				handler.getMap()[command]?.(params);
			}
		}
		#onPull(baseEvent) {
			const {
				pullData: {
					command,
					params
				},
				promises
			} = baseEvent.data;
			for (const handler of this.#handlers) {
				if (handler.getDelayedMap()[command]) {
					promises.push(Promise.resolve({
						data: {
							id: params.entityId ?? main_core.Text.getRandom(),
							command,
							params
						}
					}));
				}
			}
		}
		#onBeforeQueueExecute(items) {
			return Promise.resolve();
		}
		async #onQueueExecute(items) {
			await this.#executeQueue(items);
		}
		#onReload(event) {}
		#executeQueue(items) {
			return new Promise(resolve => {
				items.forEach(item => {
					const {
						data: {
							command,
							params
						}
					} = item;
					for (const handler of this.#handlers) {
						handler.getDelayedMap()[command]?.(params);
					}
				});
				resolve();
			});
		}
	}

	exports.BookingPullManager = BookingPullManager;

})(this.BX.Booking.Provider.Pull = this.BX.Booking.Provider.Pull || {}, BX, BX.Pull, BX.Booking.Const, BX.Booking, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service, BX.Booking.Provider.Service);
//# sourceMappingURL=booking-pull-manager.bundle.js.map
