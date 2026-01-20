import type { Store } from 'ui.vue3.vuex';

import { Model, Endpoint } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { UserMappers } from 'tasks.v2.provider.service.user-service';
import type { ElapsedTimeModel } from 'tasks.v2.model.elapsed-times';
import type { UserModel } from 'tasks.v2.model.users';
import type { UserDto } from 'tasks.v2.provider.service.user-service';

import { mapDtoToModel, mapModelToDto } from './mappers';

export class TimeTrackingService
{
	#state: { [taskId: number]: { page: number, size: number, isLoading: boolean, hasMore: boolean } } = {};

	async list(taskId: number, options: { reset?: boolean, size?: number } = {}): Promise<void>
	{
		if (!Number.isInteger(taskId))
		{
			return;
		}

		const requestedSize = Number.isInteger(options.size) ? Number(options.size) : undefined;

		if (!this.#state[taskId] || options.reset)
		{
			this.#state[taskId] = { page: 0, size: requestedSize ?? 20, isLoading: false, hasMore: true };
		}

		const state = this.#state[taskId];

		if (state.isLoading || !state.hasMore)
		{
			return;
		}

		const nextPage = state.page + 1;
		const pageSize = requestedSize ?? state.size;

		state.isLoading = true;

		try
		{
			const data = await apiClient.post(Endpoint.TaskTimeTrackingList, {
				taskId,
				navigation: {
					page: nextPage,
					size: pageSize,
				},
			});

			await this.$store.dispatch(`${Model.ElapsedTimes}/upsertMany`, data.map((it) => mapDtoToModel(it)));

			state.page = nextPage;
			state.size = pageSize;
			state.hasMore = Array.isArray(data) ? data.length === pageSize : false;
		}
		catch (error)
		{
			console.error('ElapsedTime.list', error);
		}
		finally
		{
			this.#state[taskId].isLoading = false;
		}
	}

	isLoading(taskId: number): boolean
	{
		const state = this.#state[taskId];

		return state && state.isLoading;
	}

	async listParticipants(taskId: number): Promise<[UserModel[], []]>
	{
		try
		{
			const data = await apiClient.post(Endpoint.TaskTimeTrackingListParticipants, { taskId });

			const users = data.users.map((user: UserDto) => UserMappers.mapDtoToModel(user));

			await this.$store.dispatch(`${Model.Users}/upsertMany`, users);

			return [users, data.contribution];
		}
		catch (error)
		{
			console.error('ElapsedTime.listParticipants', error);

			return [];
		}
	}

	async add(taskId: number, elapsedTime: ElapsedTimeModel): Promise<?number>
	{
		try
		{
			const task = taskService.getStoreTask(taskId);
			void taskService.updateStoreTask(taskId, {
				numberOfElapsedTimes: task.numberOfElapsedTimes + 1,
				timeSpent: task.timeSpent + elapsedTime.seconds,
			});

			void this.$store.dispatch(`${Model.ElapsedTimes}/insert`, elapsedTime);

			const savedElapsedTime = await apiClient.post(Endpoint.TaskTimeTrackingAdd, {
				task: {
					id: taskId,
					elapsedTime: mapModelToDto(elapsedTime),
				},
			});

			void this.$store.dispatch(`${Model.ElapsedTimes}/update`, {
				id: elapsedTime.id,
				fields: mapDtoToModel(savedElapsedTime),
			});

			return savedElapsedTime.id;
		}
		catch (error)
		{
			console.error('ElapsedTime.add', error);

			return null;
		}
	}

	async update(taskId: number, elapsedTime: ElapsedTimeModel): Promise<void>
	{
		try
		{
			const currentElapsedTime = this.$store.getters[`${Model.ElapsedTimes}/getById`](elapsedTime.id);
			const timeSpentDifference = elapsedTime.seconds - currentElapsedTime.seconds;

			const task = taskService.getStoreTask(taskId);
			void taskService.updateStoreTask(taskId, {
				timeSpent: task.timeSpent + timeSpentDifference,
			});

			void this.$store.dispatch(`${Model.ElapsedTimes}/update`, {
				id: elapsedTime.id,
				fields: elapsedTime,
			});

			await apiClient.post(Endpoint.TaskTimeTrackingUpdate, {
				elapsedTime: mapModelToDto(elapsedTime),
			});
		}
		catch (error)
		{
			console.error('ElapsedTime.update', error);
		}
	}

	async delete(taskId: number, elapsedTime: ElapsedTimeModel): Promise<void>
	{
		try
		{
			const task = taskService.getStoreTask(taskId);
			void taskService.updateStoreTask(taskId, {
				numberOfElapsedTimes: task.numberOfElapsedTimes - 1,
				timeSpent: task.timeSpent - elapsedTime.seconds,
			});

			void this.$store.dispatch(`${Model.ElapsedTimes}/delete`, elapsedTime.id);

			await apiClient.post(Endpoint.TaskTimeTrackingDelete, {
				elapsedTimeId: elapsedTime.id,
			});
		}
		catch (error)
		{
			console.error('ElapsedTime.delete', error);
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
