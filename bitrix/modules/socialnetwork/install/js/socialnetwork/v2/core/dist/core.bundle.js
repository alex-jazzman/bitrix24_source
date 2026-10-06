/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
(function (exports, main_core, ui_vue3_pinia, socialnetwork_v2_model_interface, socialnetwork_v2_model_project) {
	'use strict';

	const settingsExtension = main_core.Extension.getSettings('socialnetwork.v2.core');
	class CoreApplication {
		getSettings() {
			return settingsExtension;
		}
		createStore() {
			return ui_vue3_pinia.createPinia();
		}
		initStores(params) {
			const {
				action,
				projectId,
				publication,
				scrollToStartupTool
			} = params;
			const settings = this.getSettings();
			const isCreate = action === socialnetwork_v2_model_interface.TYPES_PROJECT_WIZARD_ACTION.CREATE || !action;
			const notificationDefaults = isCreate && socialnetwork_v2_model_project.isValidNotificationCatalog(settings.notificationDefaults) ? settings.notificationDefaults : null;
			const optionsStoreProject = {
				projectId: projectId || null,
				publication,
				notifications: notificationDefaults
			};
			const optionsStoreInterface = {
				...settings,
				action,
				scrollToStartupTool: scrollToStartupTool === true
			};
			socialnetwork_v2_model_project.useProjectStore().init(optionsStoreProject);
			socialnetwork_v2_model_interface.useInterfaceStore().init(optionsStoreInterface);
		}
	}
	const Core = new CoreApplication();

	exports.Core = Core;

})(this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {}, BX, BX.Vue3.Pinia, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Model);
//# sourceMappingURL=core.bundle.js.map
