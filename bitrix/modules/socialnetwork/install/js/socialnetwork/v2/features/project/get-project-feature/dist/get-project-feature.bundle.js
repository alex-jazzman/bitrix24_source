/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Features = this.BX.Socialnetwork.V2.Features || {};
(function (exports, socialnetwork_v2_model_project, socialnetwork_v2_provider_services_projectService) {
	'use strict';

	class GetProjectFeature {
		async getProject(projectId) {
			const projectStore = socialnetwork_v2_model_project.useProjectStore();
			const [error, project] = await socialnetwork_v2_provider_services_projectService.projectService.get(projectId);
			if (!error && project) {
				projectStore.patchProject(project);
			}
		}
		async getAvailableFeatures(projectId = null) {
			const projectStore = socialnetwork_v2_model_project.useProjectStore();
			const [error, availableFeatures] = await socialnetwork_v2_provider_services_projectService.projectService.getAvailableFeatures(projectId);
			if (!error && availableFeatures) {
				projectStore.patchProject({
					availableFeatures
				});
			}
			return error;
		}
	}

	exports.GetProjectFeature = GetProjectFeature;

})(this.BX.Socialnetwork.V2.Features.Project = this.BX.Socialnetwork.V2.Features.Project || {}, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Provider.Services);
//# sourceMappingURL=get-project-feature.bundle.js.map
