import { useProjectStore } from 'socialnetwork.v2.model.project';
import { projectService } from 'socialnetwork.v2.provider.services.project-service';

export class GetProjectFeature
{
	async getProject(projectId: number): Promise<void>
	{
		const projectStore = useProjectStore();

		const [error, project] = await projectService.get(projectId);

		if (!error && project)
		{
			projectStore.patchProject(project);
		}
	}

	async getAvailableFeatures(projectId: ?number = null): Promise<?Error>
	{
		const projectStore = useProjectStore();

		const [error, availableFeatures] = await projectService.getAvailableFeatures(projectId);

		if (!error && availableFeatures)
		{
			projectStore.patchProject({
				availableFeatures,
			});
		}

		return error;
	}
}
