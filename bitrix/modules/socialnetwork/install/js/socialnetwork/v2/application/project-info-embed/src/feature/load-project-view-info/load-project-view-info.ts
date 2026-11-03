import { projectViewInfoService } from '../../infrastructure/service/project-view-info/project-view-info';
import { type ProjectViewInfo } from '../../model/project-view-info/types';

type LoadProjectViewInfoOptions = {
	projectId: number,
	isDestroyed: () => boolean,
	applyProject: (project: ProjectViewInfo) => void,
	showContent: () => void,
	waitForDomUpdate: () => Promise<void>,
	onReady: () => void,
};

export async function loadProjectViewInfo(options: LoadProjectViewInfoOptions): Promise<void>
{
	let project: ProjectViewInfo | null = null;

	try
	{
		project = await projectViewInfoService.get(options.projectId);
	}
	catch
	{
		project = null;
	}

	if (options.isDestroyed())
	{
		return;
	}

	if (project)
	{
		options.applyProject(project);
	}

	options.showContent();
	await options.waitForDomUpdate();

	if (!options.isDestroyed())
	{
		options.onReady();
	}
}
