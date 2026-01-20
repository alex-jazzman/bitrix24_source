import { ajax, Type } from 'main.core';
import { CreateParams } from './types';
import type { TaskLinkData } from './types';

export class Api
{
	static async getTaskLinkData(createParams: CreateParams): Promise<TaskLinkData>
	{
		try
		{
			const { data: taskLinkData } = await ajax.runAction('intranet.controlbutton.getTaskLink', {
				data: {
					entityType: createParams.entityType,
					entityId: createParams.entityId,
					postEntityType: createParams.postEntityType,
				},
			});

			return taskLinkData;
		}
		catch (error)
		{
			console.error('TaskCreator: getTaskLinkData error', error);

			return null;
		}
	}

	static async clearNewTaskFiles(signedFiles: string): Promise<void>
	{
		try
		{
			await ajax.runAction('intranet.controlbutton.clearNewTaskFiles', {
				data: { signedFiles },
			});
		}
		catch (error)
		{
			console.error('TaskCreator: Failed to clear files:', error);
		}
	}

	static async createEntityComment(taskId: number, createParams: CreateParams): Promise<void>
	{
		try
		{
			const postEntityType = createParams.postEntityType;

			await ajax.runAction('socialnetwork.api.livefeed.createEntityComment', {
				data: {
					params: {
						postEntityType: Type.isStringFilled(postEntityType) ? postEntityType : createParams.entityType,
						sourceEntityType: createParams.entityType,
						sourceEntityId: createParams.entityId,
						entityType: 'TASK',
						entityId: taskId,
						logId: createParams.logId,
					},
				},
			});
		}
		catch (error)
		{
			console.error('TaskCreator: createEntityComment error', error);
		}
	}
}
