/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, ui_vue3_vuex, tasks_v2_const, tasks_v2_core, tasks_v2_lib_apiClient, tasks_v2_lib_calendar) {
	'use strict';

	function mapDtoToModel(absenceDto) {
		return {
			id: absenceDto.id,
			userId: absenceDto.userId,
			fromTs: tasks_v2_lib_calendar.calendar.parseDateTs(absenceDto.dateTimeFrom),
			toTs: tasks_v2_lib_calendar.calendar.parseDateTs(absenceDto.dateTimeTo),
			viewed: false
		};
	}

	class AbsenceService {
		async getUsersAbsenceInfo(userIds) {
			try {
				const requestedUserIds = this.#filterExistingUserAbsences(userIds);
				if (requestedUserIds.length === 0) {
					return;
				}
				const userAbsences = await this.#requestAbsences(requestedUserIds);
				await this.$store.dispatch(`${tasks_v2_const.Model.Absences}/upsertMany`, userAbsences);
			} catch (error) {
				console.error('Task.AbsenceService. Get user absence info error', error);
			}
		}
		async #requestAbsences(userIds) {
			const absenceDtoCollection = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.AbsenceGet, {
				userIds
			});
			return absenceDtoCollection.map(dto => mapDtoToModel(dto));
		}
		#filterExistingUserAbsences(userIds) {
			const existingUserIds = new Set(this.$store.getters[`${tasks_v2_const.Model.Absences}/getAll`].map(({
				userId
			}) => userId));
			return userIds.filter(userId => !existingUserIds.has(userId));
		}
		async setViewed(absenceId, userId) {
			try {
				await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.AbsenceView, {
					absenceId,
					userId
				});
				await this.$store.dispatch(`${tasks_v2_const.Model.Absences}/update`, {
					id: absenceId,
					fields: {
						viewed: true
					}
				});
			} catch (error) {
				console.error('Task.AbsenceService. Set viewed error', error);
			}
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const absenceService = new AbsenceService();

	exports.AbsenceService = AbsenceService;
	exports.absenceService = absenceService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Vue3.Vuex, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=absence-service.bundle.js.map
