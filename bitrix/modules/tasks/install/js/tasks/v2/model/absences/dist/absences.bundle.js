/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_vue3_vuex, tasks_v2_const) {
	'use strict';

	class Absences extends ui_vue3_vuex.BuilderEntityModel {
		getName() {
			return tasks_v2_const.Model.Absences;
		}
		getState() {
			return {
				collection: {},
				fetching: false
			};
		}
		getGetters() {
			return {
				...super.getGetters(),
				getByUserId: state => userId => {
					return Object.values(state.collection).filter(a => !a.viewed && a.userId === userId);
				},
				getByUserIds: state => userIds => {
					return Object.values(state.collection).filter(a => !a.viewed && userIds.includes(a.userId));
				}
			};
		}
		getActions() {
			return {
				...super.getActions(),
				/** @function absences/setFetching */
				setFetching: (store, fetching) => {
					store.commit('setFetching', fetching);
				}
			};
		}
		getMutations() {
			return {
				...super.getMutations(),
				setFetching: (state, fetching) => {
					state.fetching = fetching;
				}
			};
		}
	}

	exports.Absences = Absences;

})(this.BX.Tasks.V2.Model = this.BX.Tasks.V2.Model || {}, BX.Vue3.Vuex, BX.Tasks.V2.Const);
//# sourceMappingURL=absences.bundle.js.map
