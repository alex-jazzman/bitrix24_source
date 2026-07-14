import { Type } from 'main.core';
import { DeleteProjectService, type AjaxError } from '../provider/service/delete-project-service';

type DeleteProjectOptions =	{ projectId?: number; scrumId?: number };

export class DeleteProject
{
	static async delete(options: DeleteProjectOptions): Promise<[Error | AjaxError | undefined, number]>
	{
		const { projectId, scrumId } = options;

		if (!Type.isNil(projectId))
		{
			return DeleteProjectService.deleteProject(projectId);
		}

		if (!Type.isNil(scrumId))
		{
			return DeleteProjectService.deleteScrum(scrumId);
		}

		return [undefined, 0];
	}
}
