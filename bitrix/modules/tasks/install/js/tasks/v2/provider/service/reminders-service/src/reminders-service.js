import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Endpoint, Model } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService, TaskMappers } from 'tasks.v2.provider.service.task-service';
import type { ReminderModel } from 'tasks.v2.model.reminders';

import { mapDtoToModel, mapModelToDto } from './mappers';

export class RemindersService
{
	#cache: { [taskId: number]: boolean } = {};

	async list(taskId: number): Promise<void>
	{
		if (this.#cache[taskId] || !Number.isInteger(taskId))
		{
			return;
		}

		this.#cache[taskId] = true;

		try
		{
			const data = await apiClient.post(Endpoint.TaskReminderList, { taskId });

			await this.$store.dispatch(`${Model.Reminders}/upsertMany`, data.map((it) => mapDtoToModel(it)));
		}
		catch (error)
		{
			console.error('Reminder.list', error);
		}
	}

	async set(taskId: number, reminders: ReminderModel[]): Promise<void>
	{
		void taskService.updateStoreTask(taskId, { numberOfReminders: reminders.length });
		void this.$store.dispatch(`${Model.Reminders}/upsertMany`, reminders.map((reminder: ReminderModel) => ({
			...reminder,
			taskId,
		})));

		try
		{
			const task = TaskMappers.mapModelToDto({ id: taskId, reminders });

			await apiClient.post(Endpoint.TaskReminderSet, { task });

			await this.$store.dispatch(`${Model.Reminders}/deleteMany`, reminders.map(({ id }) => id));
		}
		catch (error)
		{
			console.error('Reminder.set', error);
		}
	}

	async add(reminder: ReminderModel): Promise<void>
	{
		const task = taskService.getStoreTask(reminder.taskId);
		void taskService.updateStoreTask(reminder.taskId, { numberOfReminders: task.numberOfReminders + 1 });
		void this.$store.dispatch(`${Model.Reminders}/upsert`, reminder);

		if (!idUtils.isReal(reminder.taskId))
		{
			return;
		}

		try
		{
			const data = await apiClient.post(Endpoint.TaskReminderAdd, { reminder: mapModelToDto(reminder) });

			void this.$store.dispatch(`${Model.Reminders}/update`, {
				id: reminder.id,
				fields: mapDtoToModel(data),
			});
		}
		catch (error)
		{
			console.error('Reminder.add', error);
		}
	}

	async update(reminder: ReminderModel): Promise<void>
	{
		const { id, ...fields } = reminder;

		const reminderBefore = this.$store.getters[`${Model.Reminders}/getById`](id);
		if (JSON.stringify(reminderBefore) === JSON.stringify(reminder))
		{
			return;
		}

		void this.$store.dispatch(`${Model.Reminders}/update`, { id, fields });

		if (!idUtils.isReal(id))
		{
			return;
		}

		try
		{
			await apiClient.post(Endpoint.TaskReminderUpdate, { reminder: mapModelToDto(reminder) });
		}
		catch (error)
		{
			console.error('Reminder.add', error);
		}
	}

	async delete(id: number): Promise<void>
	{
		const reminder = this.$store.getters[`${Model.Reminders}/getById`](id);
		const task = taskService.getStoreTask(reminder.taskId);
		void taskService.updateStoreTask(reminder.taskId, { numberOfReminders: task.numberOfReminders - 1 });
		void this.$store.dispatch(`${Model.Reminders}/delete`, id);

		if (!idUtils.isReal(reminder.taskId))
		{
			return;
		}

		try
		{
			await apiClient.post(Endpoint.TaskReminderDelete, { reminder: { id } });
		}
		catch (error)
		{
			console.error('Reminder.delete', error);
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
