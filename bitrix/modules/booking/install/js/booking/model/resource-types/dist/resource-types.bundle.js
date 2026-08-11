/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_vue3_vuex, booking_const) {
	'use strict';

	class ResourceTypes extends ui_vue3_vuex.BuilderModel {
		getName() {
			return booking_const.Model.ResourceTypes;
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				moduleId: '',
				name: '',
				code: ''
			};
		}
		getGetters() {
			return {
				/** @function resourceTypes/get */
				get: state => Object.values(state.collection),
				/** @function resourceTypes/getById */
				getById: state => id => state.collection[id]
			};
		}
		getActions() {
			return {
				/** @function resourceTypes/upsert */
				upsert: (store, resourceType) => {
					store.commit('upsert', resourceType);
				},
				/** @function resourceTypes/upsertMany */
				upsertMany: (store, resourceTypes) => {
					resourceTypes.forEach(resourceType => store.commit('upsert', resourceType));
				},
				/** @function resourceTypes/setSenderCodeForAll */
				setSenderCodeForAll: (store, senderCode) => {
					store.commit('setSenderCodeForAll', senderCode);
				}
			};
		}
		getMutations() {
			return {
				upsert: (state, resourceType) => {
					state.collection[resourceType.id] ??= resourceType;
					Object.assign(state.collection[resourceType.id], resourceType);
				},
				setSenderCodeForAll: (state, senderCode) => {
					for (const resourceType of Object.values(state.collection)) {
						resourceType.senderCode = senderCode;
					}
				}
			};
		}
	}

	exports.ResourceTypes = ResourceTypes;

})(this.BX.Booking.Model = this.BX.Booking.Model || {}, BX.Vue3.Vuex, BX.Booking.Const);
//# sourceMappingURL=resource-types.bundle.js.map
