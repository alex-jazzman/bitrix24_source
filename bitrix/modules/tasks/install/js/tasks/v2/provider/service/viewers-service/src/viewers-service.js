import { Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { taskService } from 'tasks.v2.provider.service.task-service';

export class ViewersService
{
	setIsLoadingCount({ taskId, isLoadingCount }): Promise<number>
	{
		// get fresh task for cases with parallel count and list refresh
		const task = taskService.getStoreTask(taskId);

		taskService.updateStoreTask(taskId, {
			viewers: {
				...task.viewers,
				isLoadingCount,
			},
		});
	}

	setIsLoadingList({ taskId, isLoadingList }): Promise<number>
	{
		// get fresh task for cases with parallel count and list refresh
		const task = taskService.getStoreTask(taskId);

		taskService.updateStoreTask(taskId, {
			viewers: {
				...task.viewers,
				isLoadingList,
			},
		});
	}

	setCount({ taskId, count }): Promise<number>
	{
		// get fresh task for cases with parallel count and list refresh
		const task = taskService.getStoreTask(taskId);

		taskService.updateStoreTask(taskId, {
			viewers: {
				...task.viewers,
				count: (count || 0),
			},
		});
	}

	async count(taskId: number): Promise<number>
	{
		let countNew = 0;
		const task = taskService.getStoreTask(taskId);

		if (!task)
		{
			return;
		}

		this.setIsLoadingCount({ taskId, isLoadingCount: true });

		try
		{
			const response = await apiClient.post(Endpoint.TaskViewUserCount, { task: { id: taskId } });
			countNew = response?.viewsCount;
		}
		catch (error)
		{
			console.error(Endpoint.TaskViewUserCount, error);
		}

		this.setCount({ taskId, count: countNew });

		this.setIsLoadingCount({ taskId, isLoadingCount: false });

		return taskService.getStoreTask(taskId).viewers.count;
	}

	async list(params: Object): Promise<Array>
	{
		const {
			id,
			page,
			size,
		} = params;
		const task = taskService.getStoreTask(id);

		if (!task)
		{
			return;
		}

		this.setIsLoadingList({ taskId: id, isLoadingList: true });

		try
		{
			const response = await apiClient.post(
				Endpoint.TaskViewUserTail,
				{
					task: { id },
					withCount: true,
					navigation: {
						page,
						size,
					},
				},

			);

			if (!response || !response?.users || (response?.users.length <= 0))
			{
				throw new Error('Viewers list request failure or zero length list.');
			}

			// get fresh task for cases with parallel count and list refresh
			const taskFresh = taskService.getStoreTask(id);
			const viewers = taskFresh.viewers;
			const viewersOld = viewers?.list || [];
			const viewersResponse = response?.users || [];

			// TODO: maybe change API on backend for some of the next restructures?
			const viewersResponseFormatted = viewersResponse.map(taskViewer => {
				const taskViewerName = taskViewer.name || '';
				const taskViewerNames = taskViewerName.split(' ');

				return {
					...taskViewer,
					image: taskViewer.image?.src || '',
					name: taskViewerNames,
					ts: taskViewer.viewedTs,
				};
			});

			const viewersResponseFormattedSorted = viewersResponseFormatted
				.sort((a, b) => b.ts - a.ts);

			const viewersNew = [...viewersOld, ...viewersResponseFormattedSorted];


			taskService.updateStoreTask(id, {
				viewers: {
					...viewers,
					list: viewersNew,
				},
			});
		}
		catch (error)
		{
			taskService.updateStoreTask(id, {
				viewers: {
					...taskFresh.viewers,
					count: 0,
				},
			});
			console.error(Endpoint.TaskViewUserTail, error);
		}

		this.setIsLoadingList({ taskId: id, isLoadingList: false });

		return taskService.getStoreTask(id).viewers.list;
	}
}
