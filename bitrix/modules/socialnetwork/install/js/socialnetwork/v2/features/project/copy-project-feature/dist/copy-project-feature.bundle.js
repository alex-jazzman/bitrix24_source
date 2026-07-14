/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Features = this.BX.Socialnetwork.V2.Features || {};
(function (exports, main_core, socialnetwork_v2_const, socialnetwork_v2_model_project, socialnetwork_v2_model_interface, socialnetwork_v2_provider_services_projectService) {
	'use strict';

	class CopyProjectFeature {
		async copy() {
			const projectStore = socialnetwork_v2_model_project.useProjectStore();
			const interfaceStore = socialnetwork_v2_model_interface.useInterfaceStore();
			const {
				invalid
			} = this.#validate(projectStore.$state);
			if (invalid) {
				return null;
			}
			const dataCopyProject = {
				sourceProjectId: projectStore.$state.id,
				project: projectStore.$state,
				copyOptions: interfaceStore.copyOptions
			};
			const [error, project] = await socialnetwork_v2_provider_services_projectService.projectService.copy(dataCopyProject);
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

	exports.CopyProjectFeature = CopyProjectFeature;

})(this.BX.Socialnetwork.V2.Features.Project = this.BX.Socialnetwork.V2.Features.Project || {}, BX, BX.Socialnetwork.V2, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Provider.Services);
//# sourceMappingURL=copy-project-feature.bundle.js.map
