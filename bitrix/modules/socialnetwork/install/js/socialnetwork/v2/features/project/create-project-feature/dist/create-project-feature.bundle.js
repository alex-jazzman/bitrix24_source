/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Features = this.BX.Socialnetwork.V2.Features || {};
(function (exports, main_core, ui_notificationManager, socialnetwork_v2_const, socialnetwork_v2_model_project, socialnetwork_v2_model_interface, socialnetwork_v2_provider_services_projectService) {
	'use strict';

	class CreateProjectFeature {
		async create() {
			const projectStore = socialnetwork_v2_model_project.useProjectStore();
			const {
				invalid
			} = this.#validate(projectStore.$state);
			if (invalid) {
				return null;
			}
			const [error, project] = await socialnetwork_v2_provider_services_projectService.projectService.add(projectStore.$state);
			if (error) {
				this.#setInvalidState(error);
				return null;
			}
			projectStore.patchProject(project);
			return project;
		}
		#setInvalidState(error = {}) {
			if (main_core.Type.isPlainObject(error) && error?.code === socialnetwork_v2_const.ProjectErrorCode.GroupNameExist) {
				const interfaceStore = socialnetwork_v2_model_interface.useInterfaceStore();
				interfaceStore.setValidation('title', {
					uniq: true
				});
				return;
			}
			if (main_core.Type.isPlainObject(error) && main_core.Type.isStringFilled(error?.message)) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'socialnetwork-project-wizard-create-error',
					text: error.message
				});
			}
		}
		#validate(project) {
			const interfaceStore = socialnetwork_v2_model_interface.useInterfaceStore();
			const isTitleInvalid = !main_core.Type.isStringFilled(project.title);
			interfaceStore.setValidation('title', {
				required: isTitleInvalid
			});
			return {
				invalid: isTitleInvalid
			};
		}
	}

	exports.CreateProjectFeature = CreateProjectFeature;

})(this.BX.Socialnetwork.V2.Features.Project = this.BX.Socialnetwork.V2.Features.Project || {}, BX, BX.UI.NotificationManager, BX.Socialnetwork.V2, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Provider.Services);
//# sourceMappingURL=create-project-feature.bundle.js.map
