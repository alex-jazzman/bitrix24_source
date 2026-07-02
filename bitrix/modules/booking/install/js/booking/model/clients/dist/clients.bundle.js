/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_vue3_vuex, booking_const) {
	'use strict';

	class Clients extends ui_vue3_vuex.BuilderModel {
		getName() {
			return booking_const.Model.Clients;
		}
		getState() {
			return {
				providerModuleId: null,
				contactCollection: {},
				companyCollection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				name: '',
				type: {
					module: booking_const.Module.Crm,
					code: booking_const.CrmEntity.Contact
				},
				contactId: null,
				phones: [],
				emails: []
			};
		}
		getGetters() {
			return {
				/** @function clients/providerModuleId */
				providerModuleId: state => state.providerModuleId,
				/** @function clients/getContacts */
				getContacts: state => Object.values(state.contactCollection),
				/** @function clients/getCompanies */
				getCompanies: state => Object.values(state.companyCollection),
				/** @function clients/getByClientData */
				getByClientData: state => clientData => {
					const contact = state.contactCollection[clientData.id];
					const company = state.companyCollection[clientData.id];
					switch (clientData.type.code) {
						case booking_const.CrmEntity.Contact:
							return contact ? {
								...contact
							} : undefined;
						case booking_const.CrmEntity.Company:
							return company ? {
								...company
							} : undefined;
						default:
							return null;
					}
				}
			};
		}
		getActions() {
			return {
				/** @function clients/setProviderModuleId */
				setProviderModuleId: (store, providerModuleId) => {
					store.commit('setProviderModuleId', providerModuleId);
				},
				/** @function clients/insertMany */
				insertMany: (store, clients) => {
					clients.forEach(client => store.commit('insert', client));
				},
				/** @function clients/upsert */
				upsert: (store, client) => {
					store.commit('upsert', client);
				},
				/** @function clients/upsertMany */
				upsertMany: (store, clients) => {
					clients.forEach(client => store.commit('upsert', client));
				},
				/** @function clients/update */
				update: (store, payload) => {
					store.commit('update', payload);
				}
			};
		}
		getMutations() {
			return {
				setProviderModuleId: (state, providerModuleId) => {
					state.providerModuleId = providerModuleId;
				},
				insert: (state, client) => {
					if (!client) {
						return;
					}
					if (client.type.code === booking_const.CrmEntity.Contact) {
						state.contactCollection[client.id] ??= client;
					}
					if (client.type.code === booking_const.CrmEntity.Company) {
						state.companyCollection[client.id] ??= client;
					}
				},
				upsert: (state, client) => {
					if (!client) {
						return;
					}
					if (client.type.code === booking_const.CrmEntity.Contact) {
						state.contactCollection[client.id] ??= client;
						Object.assign(state.contactCollection[client.id], client);
					}
					if (client.type.code === booking_const.CrmEntity.Company) {
						state.companyCollection[client.id] ??= client;
						Object.assign(state.companyCollection[client.id], client);
					}
				},
				update: (state, {
					id,
					client
				}) => {
					if (client.type.code === booking_const.CrmEntity.Contact) {
						const updatedClient = {
							...state.contactCollection[id],
							...client
						};
						delete state.contactCollection[id];
						state.contactCollection[client.id] = updatedClient;
					}
					if (client.type.code === booking_const.CrmEntity.Company) {
						const updatedClient = {
							...state.companyCollection[id],
							...client
						};
						delete state.companyCollection[id];
						state.companyCollection[client.id] = updatedClient;
					}
				}
			};
		}
	}

	exports.Clients = Clients;

})(this.BX.Booking.Model = this.BX.Booking.Model || {}, BX.Vue3.Vuex, BX.Booking.Const);
//# sourceMappingURL=clients.bundle.js.map
