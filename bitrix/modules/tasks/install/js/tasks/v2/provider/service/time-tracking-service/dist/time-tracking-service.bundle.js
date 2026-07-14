/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, tasks_v2_const, tasks_v2_core, tasks_v2_lib_apiClient, tasks_v2_provider_service_taskService, tasks_v2_provider_service_userService) {
	'use strict';

	function mapModelToDto(elapsedTime) {
		return {
			id: elapsedTime.id,
			taskId: elapsedTime.taskId,
			userId: elapsedTime.userId,
			seconds: elapsedTime.seconds,
			source: elapsedTime.source,
			text: elapsedTime.text,
			createdAtTs: elapsedTime.createdAtTs,
			startTs: elapsedTime.startTs,
			stopTs: elapsedTime.stopTs,
			rights: elapsedTime.rights
		};
	}
	function mapDtoToModel(elapsedTimeDto) {
		return {
			id: elapsedTimeDto.id,
			taskId: elapsedTimeDto.taskId,
			userId: elapsedTimeDto.userId,
			seconds: elapsedTimeDto.seconds,
			source: elapsedTimeDto.source,
			text: elapsedTimeDto.text,
			createdAtTs: elapsedTimeDto.createdAtTs,
			startTs: elapsedTimeDto.startTs,
			stopTs: elapsedTimeDto.stopTs,
			rights: elapsedTimeDto.rights
		};
	}

	class TimeTrackingService {
		#state = {};
		async getTaskWithActiveTimer() {
			const task = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTrackingTaskWithActiveTimer, {});
			void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setTaskWithActiveTimer`, task);
		}
		async list(taskId, options = {}) {
			if (!Number.isInteger(taskId)) {
				return;
			}
			const requestedSize = Number.isInteger(options.size) ? Number(options.size) : undefined;
			if (!this.#state[taskId] || options.reset) {
				this.#state[taskId] = {
					page: 0,
					size: requestedSize ?? 20,
					isLoading: false,
					hasMore: true
				};
			}
			const state = this.#state[taskId];
			if (state.isLoading || !state.hasMore) {
				return;
			}
			const nextPage = state.page + 1;
			const pageSize = requestedSize ?? state.size;
			state.isLoading = true;
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingList, {
					taskId,
					navigation: {
						page: nextPage,
						size: pageSize
					}
				});
				await this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/upsertMany`, data.map(it => mapDtoToModel(it)));
				state.page = nextPage;
				state.size = pageSize;
				state.hasMore = Array.isArray(data) ? data.length === pageSize : false;
			} catch (error) {
				console.error('ElapsedTime.list', error);
			} finally {
				this.#state[taskId].isLoading = false;
			}
		}
		getById(entityId) {
			return this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getById`](entityId);
		}
		getIds(taskId) {
			return this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getIds`](taskId);
		}
		getLoadedIds(taskId) {
			return this.getIds(taskId).filter(id => Number.isInteger(id));
		}
		isLoading(taskId) {
			const state = this.#state[taskId];
			return state && state.isLoading;
		}
		hasLoaded(taskId) {
			const state = this.#state[taskId];
			return Boolean(state?.page > 0);
		}
		hasLoadedAll(taskId) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			if (!task) {
				return false;
			}
			return this.getLoadedIds(taskId).length >= task.numberOfElapsedTimes;
		}
		isOutOfLoadedRange(taskId, entityId) {
			if (!Number.isInteger(entityId)) {
				return false;
			}
			const loadedIds = this.getLoadedIds(taskId);
			if (loadedIds.length === 0) {
				return false;
			}
			return entityId < loadedIds[loadedIds.length - 1];
		}
		async listParticipants(taskId) {
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingListParticipants, {
					taskId
				});
				const users = data.users.map(user => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(user));
				await this.$store.dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
				return [users, data.contribution];
			} catch (error) {
				console.error('ElapsedTime.listParticipants', error);
				return [];
			}
		}
		async add(taskId, elapsedTime) {
			try {
				const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
				void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					numberOfElapsedTimes: task.numberOfElapsedTimes + 1,
					timeSpent: task.timeSpent + elapsedTime.seconds
				});
				void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/insert`, elapsedTime);
				const savedElapsedTime = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingAdd, {
					task: {
						id: taskId,
						elapsedTime: mapModelToDto(elapsedTime)
					}
				});
				void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/update`, {
					id: elapsedTime.id,
					fields: mapDtoToModel(savedElapsedTime)
				});
				return savedElapsedTime.id;
			} catch (error) {
				console.error('ElapsedTime.add', error);
				return null;
			}
		}
		async update(taskId, elapsedTime) {
			try {
				const currentElapsedTime = this.$store.getters[`${tasks_v2_const.Model.ElapsedTimes}/getById`](elapsedTime.id);
				const timeSpentDifference = elapsedTime.seconds - currentElapsedTime.seconds;
				const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
				void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					timeSpent: task.timeSpent + timeSpentDifference
				});
				void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/update`, {
					id: elapsedTime.id,
					fields: elapsedTime
				});
				await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingUpdate, {
					elapsedTime: mapModelToDto(elapsedTime)
				});
			} catch (error) {
				console.error('ElapsedTime.update', error);
			}
		}
		async delete(taskId, elapsedTime) {
			try {
				const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
				void tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
					numberOfElapsedTimes: task.numberOfElapsedTimes - 1,
					timeSpent: task.timeSpent - elapsedTime.seconds
				});
				void this.$store.dispatch(`${tasks_v2_const.Model.ElapsedTimes}/delete`, elapsedTime.id);
				await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskTimeTrackingDelete, {
					elapsedTimeId: elapsedTime.id
				});
			} catch (error) {
				console.error('ElapsedTime.delete', error);
			}
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}

	const timeTrackingService = new TimeTrackingService();
	const TimeTrackingMappers = {
		mapModelToDto,
		mapDtoToModel
	};

	exports.TimeTrackingMappers = TimeTrackingMappers;
	exports.timeTrackingService = timeTrackingService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=time-tracking-service.bundle.js.map
