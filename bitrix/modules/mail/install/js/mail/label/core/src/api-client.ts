import { ajax } from 'main.core';

import { type LabelDto } from './types';

class ApiClient
{
	#controller: string = 'mail.label';

	async list(mailboxId: number | null = null): Promise<LabelDto[]>
	{
		const config: { method: string, getParameters?: { mailboxId: number } } = { method: 'GET' };
		if (mailboxId !== null)
		{
			config.getParameters = { mailboxId };
		}

		const response = await ajax.runAction(`${this.#controller}.list`, config);

		return response.data.labels;
	}

	async messageLabels(id: string): Promise<number[]>
	{
		const response = await ajax.runAction(`${this.#controller}.messageLabels`, {
			method: 'GET',
			getParameters: { id },
		});

		return response.data.labelIds;
	}

	// POST, unlike messageLabels(): the id list of a group action does not fit a query string.
	async commonMessageLabels(ids: string[]): Promise<number[]>
	{
		const response = await ajax.runAction(`${this.#controller}.commonMessageLabels`, {
			data: { ids },
		});

		return response.data.labelIds;
	}

	async add(name: string, mailboxId: number = 0): Promise<LabelDto>
	{
		const response = await ajax.runAction(`${this.#controller}.add`, {
			data: { name, mailboxId },
		});

		return response.data.label;
	}

	async update(id: number, name: string): Promise<LabelDto>
	{
		const response = await ajax.runAction(`${this.#controller}.update`, {
			data: { id, name },
		});

		return response.data.label;
	}

	async delete(id: number): Promise<void>
	{
		await ajax.runAction(`${this.#controller}.delete`, {
			data: { id },
		});
	}

	async assign(labelIds: number[], ids: string[]): Promise<string[]>
	{
		const response = await ajax.runAction(`${this.#controller}.assign`, {
			data: { labelIds, ids },
		});

		return response.data.processedIds;
	}

	async unassign(labelIds: number[], ids: string[]): Promise<string[]>
	{
		const response = await ajax.runAction(`${this.#controller}.unassign`, {
			data: { labelIds, ids },
		});

		return response.data.processedIds;
	}
}

export const apiClient = new ApiClient();
