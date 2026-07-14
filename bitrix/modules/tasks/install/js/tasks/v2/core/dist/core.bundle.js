/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, ui_vue3_vuex, tasks_v2_model_absences, tasks_v2_model_checkList, tasks_v2_model_crmItems, tasks_v2_model_elapsedTimes, tasks_v2_model_epics, tasks_v2_model_flows, tasks_v2_model_ganttLinks, tasks_v2_model_groups, tasks_v2_model_interface, tasks_v2_model_placements, tasks_v2_model_results, tasks_v2_model_stages, tasks_v2_model_tasks, tasks_v2_model_reminders, tasks_v2_model_users, tasks_v2_provider_pull_pullManager) {
	'use strict';

	const params = main_core.Extension.getSettings('tasks.v2.core');
	class CoreApplication {
		#store;
		#builder;
		#initPromise;
		#pullManager = null;
		getParams() {
			return params;
		}
		getStore() {
			return this.#store;
		}
		init() {
			// eslint-disable-next-line no-async-promise-executor
			this.#initPromise ??= new Promise(async resolve => {
				this.#store = await this.#initStore();
				this.#initPull();
				resolve();
			});
			return this.#initPromise;
		}
		async addDynamicModel(vuexBuilderModel) {
			if (!(this.#builder instanceof ui_vue3_vuex.Builder)) {
				throw new TypeError('Builder has not been init');
			}
			if (this.#store.hasModule(vuexBuilderModel.getName())) {
				return;
			}
			await this.#builder.addDynamicModel(vuexBuilderModel);
		}
		removeDynamicModel(vuexModelName) {
			if (this.#builder instanceof ui_vue3_vuex.Builder && this.#store.hasModule(vuexModelName)) {
				this.#builder.removeDynamicModel(vuexModelName);
			}
		}
		async #initStore() {
			this.#builder = ui_vue3_vuex.Builder.init();
			this.#builder.addModel(tasks_v2_model_absences.Absences.create()).addModel(tasks_v2_model_checkList.CheckList.create()).addModel(tasks_v2_model_crmItems.CrmItems.create()).addModel(tasks_v2_model_elapsedTimes.ElapsedTimes.create()).addModel(tasks_v2_model_epics.Epics.create()).addModel(tasks_v2_model_flows.Flows.create()).addModel(tasks_v2_model_ganttLinks.GanttLinks.create()).addModel(tasks_v2_model_groups.Groups.createWithGroups([params.defaultCollab].filter(it => it))).addModel(tasks_v2_model_interface.Interface.createWithVariables(params)).addModel(tasks_v2_model_results.Results.create()).addModel(tasks_v2_model_placements.Placements.create()).addModel(tasks_v2_model_stages.Stages.create()).addModel(tasks_v2_model_tasks.Tasks.createWithVariables(params)).addModel(tasks_v2_model_reminders.Reminders.create()).addModel(tasks_v2_model_users.Users.createWithCurrentUser(params.currentUser));
			const builderResult = await this.#builder.build();
			return builderResult.store;
		}
		#initPull() {
			this.#pullManager = new tasks_v2_provider_pull_pullManager.PullManager({
				currentUserId: params.currentUser.id
			});
			this.#pullManager.initQueueManager();
		}
	}
	const Core = new CoreApplication();

	exports.Core = Core;

})(this.BX.Tasks.V2 = this.BX.Tasks.V2 || {}, BX, BX.Vue3.Vuex, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Model, BX.Tasks.V2.Provider.Pull);
//# sourceMappingURL=core.bundle.js.map
