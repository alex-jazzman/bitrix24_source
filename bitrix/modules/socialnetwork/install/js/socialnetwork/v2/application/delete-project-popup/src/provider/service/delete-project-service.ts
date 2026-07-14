import { ajax, Type } from 'main.core';
import { DeleteProjectErrorCode } from '../../const';

export class DeleteProjectService
{
	static async deleteProject(projectId: number): Promise<[Error | undefined, number]>
	{
		try
		{
			await ajax.runAction('socialnetwork.V2.Project.delete', {
				json: { projectId },
			});

			return [undefined, projectId];
		}
		catch (error)
		{
			return this.#handleError(error, projectId);
		}
	}

	static async deleteScrum(scrumId: number): Promise<[Error | undefined, number]>
	{
		try
		{
			await ajax.runAction('socialnetwork.V2.Scrum.delete', {
				json: { scrumId },
			});

			return [undefined, scrumId];
		}
		catch (error)
		{
			return this.#handleError(error, scrumId);
		}
	}

	static #handleError(error: unknown, id: number): [Error, number]
	{
		if (error instanceof Error)
		{
			console.error('Delete project service error', error);

			return [error, id];
		}

		if (isAjaxBadResponse(error))
		{
			const errorCode = (error.errors[0]?.code || '')?.toUpperCase();

			if (Object.values(DeleteProjectErrorCode).includes(errorCode as DeleteProjectErrorCode))
			{
				const projectError = new Error(error.errors[0].message);
				projectError.name = errorCode;

				return [projectError, id];
			}

			console.error('Delete project service error response', error.errors[0]);

			return [new Error(error.errors[0]?.message), id];
		}

		console.error('Delete project service error', error);

		return [new Error('Delete project error'), id];
	}
}

export type AjaxError = {
	code: string | false;
	customData: unknown;
	message: string;
}

type AjaxBadResponse = {
	data: null;
	errors: AjaxError[];
	status: 'error';
}

function isAjaxBadResponse(value: unknown): value is AjaxBadResponse
{
	if (!Type.isPlainObject(value))
	{
		return false;
	}

	const candidate = value as Record<string, unknown>;

	return candidate.status === 'error'
		&& Type.isNull(candidate.data)
		&& Type.isArray(candidate.errors);
}
