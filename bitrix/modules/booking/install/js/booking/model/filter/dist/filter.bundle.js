/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_core, ui_vue3_vuex, booking_const) {
	'use strict';

	/* eslint-disable no-param-reassign */

	class Filter extends ui_vue3_vuex.BuilderModel {
		getName() {
			return booking_const.Model.Filter;
		}
		getState() {
			return {
				datesCount: {
					count: 0,
					minDate: '',
					maxDate: ''
				},
				fields: {},
				filterDates: [],
				fetchingNextDate: false,
				filteredBookingsIds: [],
				filteredMarks: [],
				isFilterMode: false,
				quickFilter: {
					hovered: {},
					active: {},
					ignoredBookingIds: {}
				},
				deletingResourceFilter: null
			};
		}
		getGetters() {
			return {
				/** @function filter/datesCount */
				datesCount: state => state.datesCount,
				/** @function filter/fields */
				fields: state => state.fields,
				/** @function filter/displayFields */
				displayField: state => state.fields,
				/** @function filter/resquestFields */
				requestFields: (state, getters) => {
					if (getters.isDeletingResourceFilterMode && Object.keys(state.deletingResourceFilter?.requestFields || {}).length > 0) {
						return state.deletingResourceFilter?.requestFields;
					}
					return state.fields;
				},
				/** @function filter/isMaxFilterDate */
				isMaxFilterDate: (state, getters, rootState, rootGetters) => {
					return state.datesCount?.maxDate?.length > 0 && rootGetters[`${booking_const.Model.Interface}/selectedDateTs`] >= new Date(state.datesCount.maxDate).setHours(0, 0, 0, 0);
				},
				/** @function filter/isMinFilterDate */
				isMinFilterDate: (state, getters, rootState, rootGetters) => {
					return state.datesCount?.minDate?.length > 0 && rootGetters[`${booking_const.Model.Interface}/selectedDateTs`] <= new Date(state.datesCount.minDate).setHours(0, 0, 0, 0);
				},
				/** @function filter/fetchingNextDate */
				fetchingNextDate: state => state.fetchingNextDate,
				/** @function interface/filteredBookingsIds */
				filteredBookingsIds: state => state.filteredBookingsIds,
				/** @function interface/filteredMarks */
				filteredMarks: state => state.filteredMarks,
				/** @function interface/isFilterMode */
				isFilterMode: state => state.isFilterMode,
				/** @typedef filter/isDeletingResourceFilterMode */
				isDeletingResourceFilterMode: state => {
					return main_core.Type.isNumber(state.deletingResourceFilter?.resourceId);
				},
				deletingResource: (state, getters, rootState, rootGetters) => {
					if (getters.isDeletingResourceFilterMode) {
						return rootGetters[`${booking_const.Model.Resources}/getById`](state.deletingResourceFilter.resourceId);
					}
					return null;
				},
				/** @function interface/quickFilter */
				quickFilter: state => state.quickFilter
			};
		}
		getActions() {
			return {
				/** @function filter/setFilterFields */
				setFilterFields: ({
					commit
				}, fields) => {
					commit('setFilterFields', fields);
				},
				/** @function filter/setDatesCount */
				setDatesCount: (store, datesCount) => {
					store.commit('setDatesCount', datesCount);
				},
				/** @function filter/addFilterDates */
				addFilterDates: ({
					commit
				}, filterDates) => {
					commit('addFilterDates', filterDates);
				},
				/** @function filter/clearDatesCount */
				clearDatesCount: store => {
					store.commit('setDatesCount', {
						count: 0,
						minDate: '',
						maxDate: ''
					});
				},
				/** @function filter/clearFilter */
				clearFilter: ({
					getters,
					commit
				}) => {
					commit('setFilterFields', {});
					commit('clearFilterDates');
					commit('setDatesCount', {
						count: 0,
						minDate: '',
						maxDate: ''
					});
					if (getters.isDeletingResourceFilterMode) {
						commit('setDeletingResourceFilter', null);
					}
				},
				setFetchingNextDate: ({
					commit
				}, fetchingNextDate) => {
					commit('setFetchingNextDate', fetchingNextDate);
				},
				/** @function interface/setFilteredBookingsIds */
				setFilteredBookingsIds: (store, filteredBookingsIds) => {
					store.commit('setFilteredBookingsIds', filteredBookingsIds);
				},
				/** @function interface/setFilteredMarks */
				setFilteredMarks: (store, dates) => {
					store.commit('setFilteredMarks', dates);
				},
				/** @function interface/setFilterMode */
				setFilterMode: (store, isFilterMode) => {
					store.commit('setFilterMode', isFilterMode);
				},
				/** @function interface/hoverQuickFilter */
				hoverQuickFilter: (store, hour) => {
					store.commit('hoverQuickFilter', hour);
				},
				/** @function interface/fleeQuickFilter */
				fleeQuickFilter: (store, hour) => {
					store.commit('fleeQuickFilter', hour);
				},
				/** @function interface/activateQuickFilter */
				activateQuickFilter: (store, hour) => {
					store.commit('activateQuickFilter', hour);
					store.commit('clearQuickFilterIgnoredBookingIds');
				},
				/** @function interface/deactivateQuickFilter */
				deactivateQuickFilter: (store, hour) => {
					store.commit('deactivateQuickFilter', hour);
					store.commit('clearQuickFilterIgnoredBookingIds');
				},
				/** @function filter/addQuickFilterIgnoredBookingId */
				addQuickFilterIgnoredBookingId: (store, bookingId) => {
					store.commit('addQuickFilterIgnoredBookingId', bookingId);
				},
				/** @function filter/setDeletingResourceFilter */
				setDeletingResourceFilter: ({
					commit
				}, deletingResourceFilter) => {
					commit('setDeletingResourceFilter', deletingResourceFilter);
				},
				/** @function filter/setDeletionResourceFIlterFields */
				setDeletionResourceFilterFields: ({
					commit,
					state
				}, fields) => {
					if (state.deletingResourceFilter && main_core.Type.isNumber(state.deletingResourceFilter.resourceId)) {
						commit('setDeletionResourceFilterFields', fields);
					}
				}
			};
		}
		getMutations() {
			return {
				setFilterFields: (state, fields) => {
					state.fields = fields;
				},
				setDatesCount: (state, datesCount) => {
					state.datesCount = datesCount;
				},
				addFilterDates: (state, filterDates) => {
					const filterDatesSet = new Set([...state.filterDates, ...filterDates.map(date => new Date(date).setHours(0, 0, 0, 0))]);
					state.filterDates = [...filterDatesSet].sort();
				},
				clearFilterDates: state => {
					state.filterDates = [];
				},
				setFetchingNextDate: (state, fetchingNextDate) => {
					state.fetchingNextDate = fetchingNextDate;
				},
				setFilteredBookingsIds: (state, filteredBookingsIds) => {
					state.filteredBookingsIds = [...filteredBookingsIds];
				},
				setFilteredMarks: (state, dates) => {
					state.filteredMarks = dates;
				},
				setFilterMode: (state, isFilterMode) => {
					state.isFilterMode = isFilterMode;
				},
				hoverQuickFilter: (state, hour) => {
					state.quickFilter.hovered[hour] = hour;
				},
				fleeQuickFilter: (state, hour) => {
					delete state.quickFilter.hovered[hour];
				},
				activateQuickFilter: (state, hour) => {
					state.quickFilter.active[hour] = hour;
				},
				deactivateQuickFilter: (state, hour) => {
					delete state.quickFilter.active[hour];
				},
				addQuickFilterIgnoredBookingId: (state, bookingId) => {
					state.quickFilter.ignoredBookingIds[bookingId] = bookingId;
				},
				clearQuickFilterIgnoredBookingIds: state => {
					state.quickFilter.ignoredBookingIds = {};
				},
				setDeletingResourceFilter: (state, deletingResourceFilter) => {
					state.deletingResourceFilter = deletingResourceFilter;
				},
				setDeletionResourceFilterFields: (state, fields) => {
					state.deletingResourceFilter.requestFields = fields;
				}
			};
		}
	}

	exports.Filter = Filter;

})(this.BX.Booking.Model = this.BX.Booking.Model || {}, BX, BX.Vue3.Vuex, BX.Booking.Const);
