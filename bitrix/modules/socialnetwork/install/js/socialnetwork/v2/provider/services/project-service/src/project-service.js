import { apiClient } from 'socialnetwork.v2.lib.api-client';
import { type ProjectModel, type ProjectCopyData } from 'socialnetwork.v2.model.project';

import { mapModelToDto, mapDtoToModel } from './mappers';
import { type ProjectFeatureDto } from './types';

export class ProjectService
{
	async get(projectId: number): Promise<[?Error, ProjectModel]>
	{
		try
		{
			const data = await apiClient.post('Project.get', {
				projectId,
			});

			return [null, mapDtoToModel(data)];
		}
		catch (error)
		{
			console.error('Get project error:', error);

			return [new Error(error.errors?.[0]?.message, 'Get project error', error.errors?.[0])];
		}
	}

	async add(project: ProjectModel): Promise<[?Object, ProjectModel]>
	{
		try
		{
			const projectDto = mapModelToDto(project);
			const data = await apiClient.post('Project.add', {
				project: projectDto,
			});
			const createdProject = mapDtoToModel(data);

			return [null, createdProject];
		}
		catch (error)
		{
			console.error('Create project error:', error);

			return [error.errors?.[0], null];
		}
	}

	async getAvailableFeatures(projectId: ?number = null): Promise<[?Error, ?ProjectFeatureDto[]]>
	{
		try
		{
			const endpoint = projectId > 0 ? 'Project.getFeatures' : 'Project.Feature.getAvailableFeatures';
			const data = await apiClient.post(endpoint, projectId > 0 ? { projectId } : { project: {} });

			return [null, data];
		}
		catch (error)
		{
			console.error('Get available project features error:', error);

			return [
				new Error(
					error.errors?.[0]?.message,
					'Get available project features error',
					error.errors?.[0],
				),
				null,
			];
		}
	}

	async update(project: ProjectModel): Promise<[Object, null] | [null, ProjectModel]>
	{
		try
		{
			const projectDto = mapModelToDto(project);
			const data = await apiClient.post('Project.update', {
				project: projectDto,
			});
			const updatedProject = mapDtoToModel(data);

			return [null, updatedProject];
		}
		catch (error)
		{
			console.error('Update project error:', error);

			return [error.errors?.[0], null];
		}
	}

	async copy(data: ProjectCopyData): Promise<[?Object, ProjectModel]>
	{
		try
		{
			const sourceProjectId = data.sourceProjectId;
			const projectRaw = {
				...data.project,
				id: null,
			};
			const project = mapModelToDto(projectRaw);
			const copyOptions = data.copyOptions;
			const dataRequest = {
				sourceProjectId,
				project,
				copyOptions,
			};

			const response = await apiClient.post('Project.copy', dataRequest);
			const createdProject = mapDtoToModel(response);

			return [null, createdProject];
		}
		catch (error)
		{
			console.error('Copy project error:', error);

			return [error.errors?.[0], null];
		}
	}
}

export const projectService = new ProjectService();
