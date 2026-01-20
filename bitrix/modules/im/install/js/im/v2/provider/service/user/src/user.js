import { runAction } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';

import type { ImModelUser } from 'im.v2.model';

type BaseLoadUsersResult = {
	hasNextPage: boolean,
	users: ImModelUser[],
};

export class BaseUserService <T: {} = {}>
{
	#itemsPerPage: number = 50;
	#isLoading: boolean = false;
	#hasMoreItemsToLoad: boolean = true;
	#lastId: number;

	loadFirstPage(messageId: number): Promise
	{
		this.#isLoading = true;

		return this.#requestItems({
			messageId,
			firstPage: true,
		});
	}

	loadNextPage(messageId: number): Promise
	{
		if (this.#isLoading || !this.#hasMoreItemsToLoad)
		{
			return Promise.resolve();
		}

		this.#isLoading = true;

		return this.#requestItems({ messageId });
	}

	hasMoreItemsToLoad(): boolean
	{
		return this.#hasMoreItemsToLoad;
	}

	getItemsPerPage(): number
	{
		return this.#itemsPerPage;
	}

	getRequestFilter(firstPage: boolean = false): Record
	{
		return {
			lastId: firstPage ? null : this.#lastId,
		};
	}

	getRestMethodName(): string
	{
		throw new Error('BaseUserService: you should implement "getRestMethodName" for child class');
	}

	getLastId(result: BaseLoadUsersResult & T): number
	{
		throw new Error('BaseUserService: you should implement "getLastId" for child class');
	}

	async #requestItems({ messageId, firstPage = false }: { messageId: number, firstPage: boolean }): Promise<number[]>
	{
		const result: BaseLoadUsersResult & T = await runAction(this.getRestMethodName(), this.#getQueryParams({
			messageId,
			firstPage,
		}))
			.catch(([error]) => {
				console.error('BaseRecentList: page request error', error);
			});

		const { users, hasNextPage } = result;
		this.#lastId = this.getLastId(result);
		this.#hasMoreItemsToLoad = hasNextPage;

		this.#isLoading = false;
		const userManager = new UserManager();
		await userManager.setUsersToModel(Object.values(users));

		return users.map((user) => user.id);
	}

	#getQueryParams({ messageId, firstPage = false }: { messageId: number, firstPage: boolean }): Record
	{
		return {
			data: {
				messageId,
				limit: this.getItemsPerPage(),
				filter: this.getRequestFilter(firstPage),
			},
		};
	}
}
