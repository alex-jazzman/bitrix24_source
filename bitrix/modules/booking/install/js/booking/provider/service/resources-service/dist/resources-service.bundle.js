/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
this.BX.Booking.Provider = this.BX.Booking.Provider || {};
(function (exports, booking_lib_utils, booking_const, booking_core, booking_lib_apiClient) {
	'use strict';

	function mapDtoToModel(resourceDto) {
		return {
			id: resourceDto.id,
			typeId: resourceDto.type.id,
			name: resourceDto.name,
			description: resourceDto.description,
			avatar: resourceDto?.avatar ? {
				id: resourceDto.avatar.id,
				url: resourceDto.avatar.url
			} : null,
			slotRanges: resourceDto.slotRanges.map(slotRange => ({
				...slotRange,
				weekDays: Object.values(slotRange.weekDays)
			})),
			counter: resourceDto.counter,
			isMain: resourceDto.isMain,
			isPrimary: resourceDto.isPrimary,
			isDeleted: resourceDto.isDeleted,
			createdBy: resourceDto.createdBy,
			createdAt: resourceDto.createdAt,
			updatedAt: resourceDto.updatedAt,
			deletedAt: resourceDto.deletedAt,
			senderCode: resourceDto.senderCode,
			// info
			isInfoNotificationOn: resourceDto.isInfoNotificationOn,
			templateTypeInfo: resourceDto.templateTypeInfo,
			infoNotificationDelay: resourceDto.infoNotificationDelay,
			// cancellation
			isCancellationNotificationOn: resourceDto.isCancellationNotificationOn,
			cancellationNotificationDelay: resourceDto.cancellationNotificationDelay,
			// confirmation
			isConfirmationNotificationOn: resourceDto.isConfirmationNotificationOn,
			templateTypeConfirmation: resourceDto.templateTypeConfirmation,
			confirmationNotificationDelay: resourceDto.confirmationNotificationDelay,
			confirmationNotificationRepetitions: resourceDto.confirmationNotificationRepetitions,
			confirmationNotificationRepetitionsInterval: resourceDto.confirmationNotificationRepetitionsInterval,
			confirmationCounterDelay: resourceDto.confirmationCounterDelay,
			// reminder
			isReminderNotificationOn: resourceDto.isReminderNotificationOn,
			templateTypeReminder: resourceDto.templateTypeReminder,
			reminderNotificationDelay: resourceDto.reminderNotificationDelay,
			// delayed
			isDelayedNotificationOn: resourceDto.isDelayedNotificationOn,
			templateTypeDelayed: resourceDto.templateTypeDelayed,
			delayedNotificationDelay: resourceDto.delayedNotificationDelay,
			delayedCounterDelay: resourceDto.delayedCounterDelay,
			// feedback
			isFeedbackNotificationOn: resourceDto.isFeedbackNotificationOn,
			templateTypeFeedback: resourceDto.templateTypeFeedback,
			// integrationCalendar
			entities: resourceDto.entities || [],
			// skus
			skus: resourceDto.skus,
			skusYandex: resourceDto.skusYandex
		};
	}
	async function mapModelToDto(resource) {
		return {
			id: resource.id,
			type: {
				id: resource.typeId
			},
			name: resource.name,
			description: resource.description,
			avatar: resource?.avatar ? {
				id: resource.avatar.id,
				url: resource.avatar.url,
				encodedFile: resource.avatar.file ? await booking_lib_utils.Utils.file.getBase64(resource.avatar.file) : null
			} : null,
			slotRanges: resource.slotRanges,
			counter: null,
			isMain: resource.isMain,
			isDeleted: resource.isDeleted,
			createdBy: null,
			createdAt: null,
			updatedAt: null,
			senderCode: resource.senderCode,
			// info
			isInfoNotificationOn: resource.isInfoNotificationOn,
			templateTypeInfo: resource.templateTypeInfo,
			infoNotificationDelay: resource.infoNotificationDelay,
			// cancellation
			isCancellationNotificationOn: resource.isCancellationNotificationOn,
			cancellationNotificationDelay: resource.cancellationNotificationDelay,
			// confirmation
			isConfirmationNotificationOn: resource.isConfirmationNotificationOn,
			templateTypeConfirmation: resource.templateTypeConfirmation,
			confirmationNotificationDelay: resource.confirmationNotificationDelay,
			confirmationNotificationRepetitions: resource.confirmationNotificationRepetitions,
			confirmationNotificationRepetitionsInterval: resource.confirmationNotificationRepetitionsInterval,
			confirmationCounterDelay: resource.confirmationCounterDelay,
			// reminder
			isReminderNotificationOn: resource.isReminderNotificationOn,
			templateTypeReminder: resource.templateTypeReminder,
			reminderNotificationDelay: resource.reminderNotificationDelay,
			// delayed
			isDelayedNotificationOn: resource.isDelayedNotificationOn,
			templateTypeDelayed: resource.templateTypeDelayed,
			delayedNotificationDelay: resource.delayedNotificationDelay,
			delayedCounterDelay: resource.delayedCounterDelay,
			// feedback
			isFeedbackNotificationOn: resource.isFeedbackNotificationOn,
			templateTypeFeedback: resource.templateTypeFeedback,
			// integrationCalendar
			entities: entitiesToDto(resource.entities),
			// skus
			skus: resource.skus,
			skusYandex: resource.skusYandex
		};
	}
	function entitiesToDto(entities) {
		return checkEntityCalendar(entities);
	}
	function checkEntityCalendar(entities) {
		// eslint-disable-next-line max-len
		return entities.filter(entity => !(entity.entityType === booking_const.ResourceEntityType.Calendar && entity.data?.userIds.length === 0));
	}
	function mapResourceSkuRelationsDtoToModel(resource) {
		return {
			id: resource.id,
			typeId: resource.type?.id,
			name: resource.name,
			skus: resource.skus,
			avatar: resource?.avatar ? {
				id: resource.avatar.id,
				url: resource.avatar.url
			} : null
		};
	}

	// eslint-disable-next-line max-len
	function mapResourceSkuRelationsModelToDto(resource) {
		return {
			id: resource.id,
			type: {
				id: resource.typeId
			},
			name: resource.name,
			skus: resource.skus,
			avatar: resource?.avatar ? {
				id: resource.avatar.id,
				url: resource.avatar.url
			} : null
		};
	}

	class ResourceService {
		async add(resource) {
			try {
				const resourceDto = await mapModelToDto(resource);
				const data = await new booking_lib_apiClient.ApiClient().post('Resource.add', {
					resource: resourceDto
				});
				const createdResource = mapDtoToModel(data);
				booking_core.Core.getStore().commit('resources/upsert', createdResource);
				if (createdResource.isMain) {
					await booking_core.Core.getStore().dispatch(`${booking_const.Model.Favorites}/add`, createdResource.id);
				}
				if (booking_core.Core.getStore().getters[`${booking_const.Model.Interface}/canTurnOnTrial`]) {
					void this.#turnOnTrial();
				}
				this.#updateResourcesFromFavorites();
				return data;
			} catch (error) {
				console.error('ResourceService: add error', error);
				return error;
			}
		}
		async update(resource) {
			const id = resource.id;
			const resourceBeforeUpdate = {
				...booking_core.Core.getStore().getters['resources/getById'](id)
			};
			try {
				const resourceDto = await mapModelToDto(resource);
				const data = await new booking_lib_apiClient.ApiClient().post('Resource.update', {
					resource: resourceDto
				});
				const updatedResource = mapDtoToModel(data);
				booking_core.Core.getStore().commit('resources/upsert', updatedResource);
				if (resourceBeforeUpdate.isMain && !updatedResource.isMain) {
					await booking_core.Core.getStore().dispatch(`${booking_const.Model.Favorites}/delete`, id);
				}
				this.#updateResourcesFromFavorites();
				return data;
			} catch (error) {
				console.error('ResourceService: update error', error);
				return error;
			}
		}
		#updateResourcesFromFavorites() {
			const isFilterMode = booking_core.Core.getStore().getters[`${booking_const.Model.Filter}/isFilterMode`];
			if (isFilterMode) {
				return;
			}
			const favorites = booking_core.Core.getStore().getters[`${booking_const.Model.Favorites}/get`];
			void booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setResourcesIds`, favorites);
		}
		async delete(resourceId, withFutureBookings = false) {
			try {
				const action = withFutureBookings ? 'Resource.forceDelete' : 'Resource.delete';
				const {
					removedBookingIds
				} = await new booking_lib_apiClient.ApiClient().post(action, {
					id: resourceId
				});
				const $store = booking_core.Core.getStore();
				const updateStoreActions = [$store.dispatch(`${booking_const.Model.Resources}/delete`, resourceId), $store.dispatch(`${booking_const.Model.Favorites}/delete`, resourceId), $store.dispatch(`${booking_const.Model.Interface}/deleteResourceId`, resourceId), $store.dispatch(`${booking_const.Model.Interface}/removeDeletingResource`, resourceId)];
				if (removedBookingIds) {
					updateStoreActions.push($store.dispatch(`${booking_const.Model.Bookings}/deleteMany`, removedBookingIds));
				}
				await Promise.all(updateStoreActions);
			} catch (error) {
				console.error('ResourceService: delete error', error);
			}
		}
		async hasFutureBookings(resourceId) {
			try {
				return new booking_lib_apiClient.ApiClient().post('Resource.hasFutureBookings', {
					resourceId
				});
			} catch (error) {
				console.error('ResourceService: hasFutureBookings error', error);
			}
			return Promise.resolve();
		}
		async #turnOnTrial() {
			await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setCanTurnOnTrial`, false), booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setIsFeatureEnabled`, true)]);
			await new Promise(resolve => setTimeout(resolve, 2000));
			await booking_core.Core.getStore().dispatch(`${booking_const.Model.Interface}/setIsShownTrialPopup`, true);
		}
		async loadResourceSkuRelations() {
			try {
				const {
					resources
				} = await new booking_lib_apiClient.ApiClient().get('ResourceSkuRelations.get');
				const resourcesSkuRelationsModel = resources.map(resourceSkuRelationsDto => {
					return mapResourceSkuRelationsDtoToModel(resourceSkuRelationsDto);
				});
				await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Resources}/setResourcesSkuRelations`, resourcesSkuRelationsModel)]);
			} catch (error) {
				console.error('BookingLoadResourceSkuRelations: error', error);
			}
		}
		async updateResourceSkuRelations(resources) {
			try {
				const resourcesSkuRelationsDto = resources.map(resourceSkuRelationsModel => {
					return mapResourceSkuRelationsModelToDto(resourceSkuRelationsModel);
				});
				await new booking_lib_apiClient.ApiClient().post('ResourceSkuRelations.save', {
					resources: resourcesSkuRelationsDto
				});
				await Promise.all([booking_core.Core.getStore().dispatch(`${booking_const.Model.Sku}/setReloadRelations`, true)]);
			} catch (error) {
				console.error('ResourceService updateResourceSkuRelations API error:', error);
			}
		}
	}
	const resourceService = new ResourceService();

	const ResourceMappers = {
		mapModelToDto,
		mapDtoToModel,
		mapResourceSkuRelationsDtoToModel
	};

	exports.ResourceMappers = ResourceMappers;
	exports.resourceService = resourceService;

})(this.BX.Booking.Provider.Service = this.BX.Booking.Provider.Service || {}, BX.Booking, BX.Booking.Const, BX.Booking, BX.Booking.Lib);
//# sourceMappingURL=resources-service.bundle.js.map
