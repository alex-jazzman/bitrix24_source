import { Loc, Runtime, Text, Type } from 'main.core';

import { Model, ResultStatus } from 'tasks.v2.const';

import { type MessageContext, type ResultPayload } from '../types';

type ResultService = {
	addResultFromMessage: (taskId: number, messageId: number, result: ResultPayload) => Promise<boolean>,
	delete: (resultId: number, taskId: number) => Promise<void>,
};

type ResultServiceExtension = {
	resultService: ResultService,
};

type StoreUser = {
	id: number,
	name: string,
	image: string,
	type: string,
};

type StoreLike = {
	getters: {
		[getterName: string]: (id: number) => StoreUser | null,
	},
};

type CoreExtension = {
	Core: {
		getStore: () => StoreLike | null,
	},
};

export class StoreTransport
{
	async add(taskId: number, messageContext: MessageContext): Promise<boolean>
	{
		const [payload, service] = await Promise.all([
			this.#createPayload(taskId, messageContext),
			this.#getService(),
		]);

		return service.addResultFromMessage(taskId, messageContext.id, payload);
	}

	async remove(taskId: number, messageId: number, resultId: number): Promise<void>
	{
		const service = await this.#getService();
		await service.delete(resultId, taskId);
	}

	async #getService(): Promise<ResultService>
	{
		const extension = (
			await Runtime.loadExtension('tasks.v2.provider.service.result-service')
		) as unknown as ResultServiceExtension;

		return extension.resultService;
	}

	async #createPayload(taskId: number, messageContext: MessageContext): Promise<ResultPayload>
	{
		const timestamp = Date.now() / 1000;

		return {
			text: Type.isStringFilled(messageContext.text)
				? messageContext.text
				: Loc.getMessage('TASKS_V2_RESULT_DEFAULT_TITLE_FROM_MESSAGE') ?? '',
			author: await this.#createAuthor(messageContext.authorId),
			id: Text.getRandom(),
			taskId,
			createdAtTs: timestamp,
			updatedAtTs: timestamp,
			rights: {
				edit: true,
				remove: true,
			},
			fileIds: [],
			previewId: null,
			files: [],
			status: ResultStatus.Open,
		};
	}

	async #createAuthor(authorId: number): Promise<ResultPayload['author']>
	{
		const author = {
			id: Text.toInteger(authorId),
			name: '',
			image: { src: '' },
			type: '',
			gender: '',
			role: '',
		};

		const user = await this.#getStoreUser(author.id);
		if (!user)
		{
			return author;
		}

		return {
			...author,
			name: Type.isStringFilled(user.name) ? user.name : '',
			image: { src: Type.isStringFilled(user.image) ? user.image : '' },
			type: Type.isStringFilled(user.type) ? user.type : '',
		};
	}

	async #getStoreUser(userId: number): Promise<StoreUser | null>
	{
		try
		{
			const extension = (
				await Runtime.loadExtension('tasks.v2.core')
			) as unknown as CoreExtension;
			const store = extension?.Core?.getStore?.();

			return store?.getters[`${Model.Users}/getById`]?.(userId) ?? null;
		}
		catch
		{
			return null;
		}
	}
}
