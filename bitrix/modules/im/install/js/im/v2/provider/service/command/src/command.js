import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { runAction } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';

import type { JsonObject } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { ImModelCommand } from 'im.v2.model';

type LoadCommandsOptions = {
	silent?: boolean,
};

type CommandListResponse = {
	commands: ImModelCommand[],
	users?: { [botId: string]: JsonObject },
};

// shared across all service instances so parallel consumers coalesce into one request per dialogId
const requestsInFlight: Map<string, Promise<void>> = new Map();

export class CommandService
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	loadCommands(dialogId: string, options: LoadCommandsOptions = {}): Promise<void>
	{
		const requestInFlight = requestsInFlight.get(dialogId);
		if (requestInFlight)
		{
			return requestInFlight;
		}

		const { silent = false } = options;
		if (!silent)
		{
			void this.#store.dispatch('commands/startLoading', { dialogId });
		}

		const request = this.#requestCommands(dialogId).finally(() => {
			requestsInFlight.delete(dialogId);
		});
		requestsInFlight.set(dialogId, request);

		return request;
	}

	async #requestCommands(dialogId: string): Promise<void>
	{
		try
		{
			const response: CommandListResponse = await runAction(RestMethod.imV2ChatCommandList, {
				data: { dialogId },
			});

			this.#hydrateBots(response.users);
			void this.#store.dispatch('commands/set', { dialogId, items: response.commands });
		}
		catch (error)
		{
			console.error('CommandService: load commands error', error);
			void this.#store.dispatch('commands/setError', { dialogId });
		}
	}

	#hydrateBots(users?: { [botId: string]: JsonObject }): void
	{
		if (!users)
		{
			return;
		}

		void new UserManager().setUsersToModel(Object.values(users));
	}
}
