/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_vue3_vuex, booking_const) {
	'use strict';

	class Resources extends ui_vue3_vuex.BuilderModel {
		getName() {
			return booking_const.Model.Resources;
		}
		getState() {
			return {
				collection: {},
				resourcesSkuRelations: []
			};
		}
		getElementState() {
			return {
				id: 0,
				type: '',
				name: '',
				description: '',
				avatar: null,
				linkedResources: [],
				slotRanges: [],
				workLoad: null,
				counter: null,
				isMain: false,
				isPrimary: false,
				isDeleted: false,
				isConfirmationNotificationOn: true,
				isFeedbackNotificationOn: true,
				isInfoNotificationOn: false,
				isDelayedNotificationOn: false,
				isReminderNotificationOn: false,
				templateTypeConfirmation: '',
				templateTypeFeedback: '',
				templateTypeInfo: '',
				templateTypeDelayed: '',
				templateTypeReminder: '',
				createdBy: 0,
				createdAt: 0,
				updatedAt: 0,
				deletedAt: 0,
				senderCode: booking_const.Communication.Bitrix24,
				entities: [],
				skus: [],
				skusYandex: []
			};
		}
		getGetters() {
			return {
				/** @function resources/get */
				get: (state, getters, rootState, rootGetters) => {
					const deletingResources = rootGetters[`${booking_const.Model.Interface}/deletingResources`];
					return Object.values(state.collection).filter(({
						id
					}) => !deletingResources[id]);
				},
				/** @function resources/getById */
				getById: state => id => state.collection[id],
				/** @function resources/isDeleted */
				isDeleted: state => id => {
					if (!id) {
						return false;
					}
					return state.collection[id]?.isDeleted ?? false;
				},
				/** @function resources/getByIds */
				getByIds: state => ids => {
					return ids.map(id => state.collection[id]);
				},
				/** @function resources/getBySkuIds */
				getBySkuIds: state => ids => {
					return Object.values(state.collection).filter(resource => resource.skus.some(sku => ids.includes(sku.id)));
				},
				/** @function resources/resourcesSkuRelations */
				resourcesSkuRelations: state => state.resourcesSkuRelations
			};
		}
		getActions() {
			return {
				/** @function resources/insertMany */
				insertMany: (store, resources) => {
					resources.forEach(resource => store.commit('insert', resource));
				},
				/** @function resources/upsert */
				upsert: (store, resource) => {
					store.commit('upsert', resource);
				},
				/** @function resources/upsertMany */
				upsertMany: (store, resources) => {
					resources.forEach(resource => store.commit('upsert', resource));
				},
				/** @function resources/delete */
				delete: (store, resourceId) => {
					store.commit('delete', resourceId);
				},
				/** @function resources/setResourcesSkuRelations */
				setResourcesSkuRelations: (store, resourcesSkuRelations) => {
					store.commit('setResourcesSkuRelations', resourcesSkuRelations);
				},
				/** @function resources/setSenderCodeForAll */
				setSenderCodeForAll: (store, senderCode) => {
					store.commit('setSenderCodeForAll', senderCode);
				}
			};
		}
		getMutations() {
			return {
				insert: (state, resource) => {
					resource.slotRanges = this.#updateSlotRangesTimezone(resource.slotRanges);
					state.collection[resource.id] ??= resource;
				},
				upsert: (state, resource) => {
					resource.slotRanges = this.#updateSlotRangesTimezone(resource.slotRanges);
					state.collection[resource.id] ??= resource;
					Object.assign(state.collection[resource.id], resource);
				},
				delete: (state, resourceId) => {
					delete state.collection[resourceId];
				},
				setResourcesSkuRelations: (state, resourcesSkuRelations) => {
					state.resourcesSkuRelations = resourcesSkuRelations;
				},
				setSenderCodeForAll: (state, senderCode) => {
					for (const resource of Object.values(state.collection)) {
						resource.senderCode = senderCode;
					}
				}
			};
		}
		#updateSlotRangesTimezone(slotRanges) {
			return slotRanges.map(slotRange => {
				return {
					...slotRange,
					timezone: slotRange.timezone === '' ? Intl.DateTimeFormat().resolvedOptions().timeZone : slotRange.timezone
				};
			});
		}
	}

	exports.Resources = Resources;

})(this.BX.Booking.Model = this.BX.Booking.Model || {}, BX.Vue3.Vuex, BX.Booking.Const);
//# sourceMappingURL=resources.bundle.js.map
