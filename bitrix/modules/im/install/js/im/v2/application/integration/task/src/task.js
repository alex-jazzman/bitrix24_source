import { Core } from 'im.v2.application.core';

import { TaskChatOpener } from './components/task-chat-opener';

type ApplicationConfig = {
	chatId: number,
};

const APPLICATION_NAME = 'TaskChatApplication';

export class TaskApplication
{
	#initPromise: Promise<TaskApplication>;
	#config: ApplicationConfig;

	constructor(config: ApplicationConfig = {})
	{
		this.#config = config;
		this.#initPromise = this.#init();
	}

	ready(): Promise
	{
		return this.#initPromise;
	}

	async render(node: string | HTMLElement): Promise
	{
		await this.ready();

		const outerConfig = this.#config;

		return Core.createVue(this, {
			name: APPLICATION_NAME,
			el: node,
			components: { TaskChatOpener },
			data(): { config: ApplicationConfig }
			{
				return {
					config: outerConfig,
				};
			},
			template: `<TaskChatOpener :chatId="${this.#config.chatId}" :config="config" />`,
		});
	}

	async #init(): Promise<TaskApplication>
	{
		await Core.ready();

		return this;
	}
}
