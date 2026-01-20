import { Core } from 'tasks.v2.core';
import { GroupType, Model, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { GroupModel } from 'tasks.v2.model.groups';

import { mapDtoToModel, mapStageDtoToModel } from './mappers';
import type { GroupInfo } from './types';

class GroupService
{
	async getUrl(id: number, type: string): Promise<string>
	{
		if (type !== GroupType.Collab)
		{
			return `/workgroups/group/${id}/`;
		}

		try
		{
			return apiClient.post(Endpoint.GroupUrlGet, { group: { id, type } });
		}
		catch (error)
		{
			console.error('GroupService: getUrl error', error);

			return '';
		}
	}

	async getStages(id: number): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.GroupStageList, { group: { id } });

			const stages = data.map((stage) => mapStageDtoToModel(stage));
			const stagesIds = stages.map((stage) => stage.id);

			await Promise.all([
				Core.getStore().dispatch(`${Model.Stages}/upsertMany`, stages),
				Core.getStore().dispatch(`${Model.Groups}/update`, {
					id,
					fields: { stagesIds },
				}),
			]);
		}
		catch (error)
		{
			console.error('GroupService: getStages error', error);
		}
	}

	async getGroup(id: number): Promise<?GroupModel>
	{
		try
		{
			const data = await apiClient.post(Endpoint.GroupGet, { group: { id } });

			const group = mapDtoToModel(data);

			await Core.getStore().dispatch(`${Model.Groups}/insert`, group);

			return group;
		}
		catch (error)
		{
			console.error('GroupService: getGroup error', error);

			return null;
		}
	}

	#scrumInfoPromises: { [taskId: number | string]: Promise } = {};

	async getScrumInfo(taskId: number): Promise<void>
	{
		if (this.hasScrumInfo(taskId))
		{
			await this.#scrumInfoPromises[taskId];

			return;
		}

		this.#scrumInfoPromises[taskId] = new Resolvable();

		try
		{
			const data = await apiClient.post(Endpoint.ScrumGetTaskInfo, { taskId });

			await Promise.all([
				Core.getStore().dispatch(`${Model.Epics}/upsert`, data.epic),
				taskService.updateStoreTask(taskId, {
					storyPoints: data.storyPoints,
					epicId: data.epic?.id,
				}),
			]);

			this.#scrumInfoPromises[taskId].resolve();
		}
		catch (error)
		{
			console.error('GroupService: getScrumInfo error', error);
		}
	}

	setHasScrumInfo(taskId: number): boolean
	{
		this.#scrumInfoPromises[taskId] = new Resolvable();
		this.#scrumInfoPromises[taskId].resolve();
	}

	hasScrumInfo(taskId: number | string): boolean
	{
		return (Number.isInteger(taskId) && taskId > 0) ? (taskId in this.#scrumInfoPromises) : true;
	}

	#groupInfoPromises: { [groupId: number]: Promise<GroupInfo> } = {};

	async getGroupInfo(groupId: number): Promise<GroupInfo>
	{
		if (this.#groupInfoPromises[groupId])
		{
			return this.#groupInfoPromises[groupId];
		}

		this.#groupInfoPromises[groupId] = new Resolvable();

		try
		{
			const GroupFields = Object.freeze({
				OwnerData: 'OWNER_DATA',
				DateCreate: 'DATE_CREATE',
				SubjectData: 'SUBJECT_DATA',
				NumberOfMembers: 'NUMBER_OF_MEMBERS',
			});

			const { data } = await BX.ajax.runAction('socialnetwork.api.workgroup.get', {
				data: {
					params: {
						select: Object.values(GroupFields),
						groupId,
					},
				},
			});

			this.#groupInfoPromises[groupId].resolve({
				ownerId: data[GroupFields.OwnerData]?.ID,
				ownerName: data[GroupFields.OwnerData]?.FORMATTED_NAME,
				dateCreate: data[GroupFields.DateCreate],
				subjectTitle: data[GroupFields.SubjectData]?.NAME,
				numberOfMembers: data[GroupFields.NumberOfMembers],
			});

			return this.#groupInfoPromises[groupId];
		}
		catch (error)
		{
			console.error('GroupService: getGroupInfo error', error);

			return {};
		}
	}
}

export const groupService = new GroupService();

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}
