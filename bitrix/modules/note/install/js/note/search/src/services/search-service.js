import { ajax, Type } from 'main.core';

const ACTION_SEARCH = 'note.infrastructure.SearchController.search';

export class SearchService
{
	async search(query: string, { page = 1, pageSize = 30 }: { page?: number, pageSize?: number } = {}): Promise<{ items: Array, hasMore: boolean }>
	{
		try
		{
			const response = await ajax.runAction(ACTION_SEARCH, {
				data: { query },
				navigation: { page, size: pageSize },
			});
			const data = response?.data ?? {};

			return {
				items: Array.isArray(data.items) ? data.items : [],
				hasMore: Boolean(data.hasMore),
			};
		}
		catch (error)
		{
			throw new Error(this.#extractErrorMessage(error));
		}
	}

	#extractErrorMessage(error: mixed): string
	{
		if (Type.isPlainObject(error))
		{
			const firstError = error?.errors?.[0]?.message;
			if (Type.isStringFilled(firstError))
			{
				return firstError;
			}
			if (Type.isStringFilled(error.message))
			{
				return error.message;
			}
		}

		return 'Search request failed';
	}
}
