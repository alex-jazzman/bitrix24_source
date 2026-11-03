import { ajax } from 'main.core';

import { type ProjectViewInfo } from '../../../model/project-view-info/types';
import { mapDtoToProjectViewInfo } from './mappers';
import { type ProjectViewInfoDto } from './types';

class ProjectViewInfoService
{
	async get(projectId: number): Promise<ProjectViewInfo>
	{
		const response = await ajax.runAction('socialnetwork.V2.Project.getViewInfo', {
			json: { projectId },
		});

		return mapDtoToProjectViewInfo(response.data as ProjectViewInfoDto);
	}
}

export const projectViewInfoService = new ProjectViewInfoService();
