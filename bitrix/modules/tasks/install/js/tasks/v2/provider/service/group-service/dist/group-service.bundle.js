/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, tasks_v2_core, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_provider_service_taskService) {
	'use strict';

	function mapDtoToModel(groupDto) {
		const stagesIds = (main_core.Type.isArray(groupDto.stages) ? groupDto.stages : []).map(stage => Number(stage.id) || 0).filter(id => id > 0);
		return {
			id: groupDto.id,
			name: groupDto.name,
			image: groupDto.image?.src,
			type: groupDto.type,
			stagesIds
		};
	}
	function mapStageDtoToModel(stageDto) {
		const stage = {
			id: stageDto.id,
			title: stageDto.title,
			color: stageDto.color,
			systemType: stageDto.systemType,
			sort: stageDto.sort
		};
		return Object.fromEntries(Object.entries(stage).filter(([, value]) => !main_core.Type.isNil(value)));
	}

	class GroupService {
		async getUrl(id, type) {
			if (tasks_v2_core.Core.getParams().features.isNewProjectsOn) {
				return this.getProjectUrl(id, type);
			}
			if (type !== tasks_v2_const.GroupType.Collab) {
				return `/workgroups/group/${id}/`;
			}
			try {
				return tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.GroupUrlGet, {
					group: {
						id,
						type
					}
				});
			} catch (error) {
				console.error('GroupService: getUrl error', error);
				return '';
			}
		}
		async getStages(id) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.GroupStageList, {
					group: {
						id
					}
				});
				const stages = data.map(stage => mapStageDtoToModel(stage));
				const stagesIds = stages.map(stage => stage.id);
				await Promise.all([tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Stages}/upsertMany`, stages), tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Groups}/update`, {
					id,
					fields: {
						stagesIds
					}
				})]);
			} catch (error) {
				console.error('GroupService: getStages error', error);
			}
		}
		async getGroup(id) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.GroupGet, {
					group: {
						id
					}
				});
				const group = mapDtoToModel(data);
				await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Groups}/insert`, group);
				return group;
			} catch (error) {
				console.error('GroupService: getGroup error', error);
				return null;
			}
		}
		async getGroupByTaskId(id) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.GroupGetByTaskId, {
					task: {
						id
					}
				});
				const group = mapDtoToModel(data);
				await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Groups}/insert`, group);
				return group;
			} catch (error) {
				console.error('GroupService: getGroupByTaskId error', error);
				return null;
			}
		}
		#scrumInfoPromises = {};
		async getScrumInfo(taskId) {
			if (this.hasScrumInfo(taskId)) {
				await this.#scrumInfoPromises[taskId];
				return;
			}
			this.#scrumInfoPromises[taskId] = new Resolvable();
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.ScrumGetTaskInfo, {
					taskId
				});
				await Promise.all([tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Epics}/upsert`, data.epic), tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					storyPoints: data.storyPoints,
					epicId: data.epic?.id
				})]);
				this.#scrumInfoPromises[taskId].resolve();
			} catch (error) {
				console.error('GroupService: getScrumInfo error', error);
			}
		}
		setHasScrumInfo(taskId) {
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
				epicId: 0,
				storyPoints: ''
			});
			this.#scrumInfoPromises[taskId] = new Resolvable();
			this.#scrumInfoPromises[taskId].resolve();
		}
		hasScrumInfo(taskId) {
			return Number.isInteger(taskId) && taskId > 0 ? taskId in this.#scrumInfoPromises : true;
		}
		#groupInfoPromises = {};
		async getGroupInfo(groupId) {
			if (this.#groupInfoPromises[groupId]) {
				return this.#groupInfoPromises[groupId];
			}
			this.#groupInfoPromises[groupId] = new Resolvable();
			try {
				const GroupFields = Object.freeze({
					OwnerData: 'OWNER_DATA',
					DateCreate: 'DATE_CREATE',
					SubjectData: 'SUBJECT_DATA',
					NumberOfMembers: 'NUMBER_OF_MEMBERS'
				});
				const {
					data
				} = await BX.ajax.runAction('socialnetwork.api.workgroup.get', {
					data: {
						params: {
							select: Object.values(GroupFields),
							groupId
						}
					}
				});
				this.#groupInfoPromises[groupId].resolve({
					ownerId: data[GroupFields.OwnerData]?.ID,
					ownerName: data[GroupFields.OwnerData]?.FORMATTED_NAME,
					dateCreate: data[GroupFields.DateCreate],
					subjectTitle: data[GroupFields.SubjectData]?.NAME,
					numberOfMembers: data[GroupFields.NumberOfMembers]
				});
				return this.#groupInfoPromises[groupId];
			} catch (error) {
				const emptyGroupInfo = {};
				this.#groupInfoPromises[groupId].resolve(emptyGroupInfo);
				console.error('GroupService: getGroupInfo error', error);
				return emptyGroupInfo;
			}
		}
		getProjectUrl(id, type) {
			if (type === tasks_v2_const.GroupType.Scrum) {
				return `/workgroups/group/${id}/tasks/?scrum=y`;
			}
			return `/workgroups/group/${id}/`;
		}
	}
	const groupService = new GroupService();
	function Resolvable() {
		const promise = new Promise(resolve => {
			this.resolve = resolve;
		});
		promise.resolve = this.resolve;
		return promise;
	}

	function createGroupDto(raw) {
		return {
			id: raw.id ?? null,
			name: raw.name ?? '',
			image: raw.image ?? null,
			type: raw.type ?? null,
			stages: main_core.Type.isArray(raw.stages) ? raw.stages.map(stage => createStageDto(stage)) : []
		};
	}
	function createStageDto(raw) {
		return {
			id: raw.id ?? null,
			title: raw.title ?? '',
			color: raw.color ?? '',
			systemType: raw.systemType ?? '',
			sort: raw.sort ?? 0
		};
	}

	const GroupMappers = {
		mapDtoToModel,
		mapStageDtoToModel
	};

	exports.GroupMappers = GroupMappers;
	exports.createGroupDto = createGroupDto;
	exports.groupService = groupService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=group-service.bundle.js.map
