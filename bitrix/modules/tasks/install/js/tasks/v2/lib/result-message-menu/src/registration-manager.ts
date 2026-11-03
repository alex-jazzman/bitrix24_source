import { Runtime, Text } from 'main.core';

import { executor } from './executor';
import { ResultMessageMenu } from './menu-factory';
import { stateController } from './state-controller';
import {
	type BaseMenuConstructor,
	type MenuFactoryDependencies,
	type MessageContext,
	type RegisterOptions,
	type Registration,
} from './types';

type MenuCheckFunction = (context: MessageContext) => boolean;
type MessageMenuManagerInstance = {
	registerMenuByCallback: (callback: MenuCheckFunction, menuClass: BaseMenuConstructor) => void,
	unregisterMenuByCallback: (callback: MenuCheckFunction) => void,
};
type MessageMenuManagerClass = {
	getInstance: () => MessageMenuManagerInstance,
};
type MenuExtension = {
	TaskCommentsMessageMenu: BaseMenuConstructor,
	MessageMenuManager: MessageMenuManagerClass,
};
type RegistryEntry = {
	owner: symbol,
	taskId: number,
	priority: number,
	managesSharedState: boolean,
	callback: MenuCheckFunction | null,
	menuClass: BaseMenuConstructor | null,
	messageMenuManager: MessageMenuManagerInstance | null,
	isRegistered: boolean,
	isRetained: boolean,
};

class RegistrationManager
{
	#registry: Map<number, RegistryEntry[]> = new Map();

	async register(options: RegisterOptions): Promise<Registration>
	{
		const taskId = Text.toInteger(options.taskId);
		const chatId = Text.toInteger(options.chatId);
		const priority = Text.toInteger(options.priority);
		const owner = Symbol('result-message-menu-registration');

		this.#removeSamePriorityEntry(chatId, priority);
		const entry: RegistryEntry = {
			owner,
			taskId,
			priority,
			managesSharedState: !options.stateController,
			callback: null,
			menuClass: null,
			messageMenuManager: null,
			isRegistered: false,
			isRetained: false,
		};
		this.#getEntries(chatId).push(entry);

		const registration: Registration = {
			teardown: (): void => {
				this.#teardownEntry(chatId, owner);
			},
		};

		try
		{
			const { TaskCommentsMessageMenu, MessageMenuManager } = (
				await Runtime.loadExtension('im.v2.lib.menu')
			) as unknown as MenuExtension;
			if (this.#findEntry(chatId, owner) !== entry)
			{
				return registration;
			}

			entry.callback = (context: MessageContext): boolean => {
				return Text.toInteger(context.chatId) === chatId;
			};
			const defaults: MenuFactoryDependencies = {
				getTaskId: () => taskId,
				getAnalytics: () => options.analytics ?? null,
				stateController: options.stateController ?? stateController,
				executor,
			};
			entry.menuClass = options.createMenuClass?.(TaskCommentsMessageMenu, defaults)
				?? ResultMessageMenu(TaskCommentsMessageMenu, defaults);
			entry.messageMenuManager = MessageMenuManager.getInstance();
			if (entry.managesSharedState)
			{
				entry.isRetained = true;
				stateController.retain();
			}
			this.#activateTopEntry(chatId);

			if (this.#findEntry(chatId, owner) !== entry)
			{
				this.#disposeEntry(entry);
				this.#restoreTopEntry(chatId);

				return registration;
			}

			if (entry.managesSharedState)
			{
				void stateController.hydrate(taskId);
			}

			return registration;
		}
		catch (error)
		{
			this.#teardownEntry(chatId, owner);

			throw error;
		}
	}

	#getEntries(chatId: number): RegistryEntry[]
	{
		let entries = this.#registry.get(chatId);
		if (!entries)
		{
			entries = [];
			this.#registry.set(chatId, entries);
		}

		return entries;
	}

	#findEntry(chatId: number, owner: symbol): RegistryEntry | null
	{
		return (this.#registry.get(chatId) ?? []).find((entry) => entry.owner === owner) ?? null;
	}

	#removeEntry(chatId: number, entry: RegistryEntry): void
	{
		const entries = this.#registry.get(chatId);
		if (!entries)
		{
			return;
		}

		const index = entries.indexOf(entry);
		if (index >= 0)
		{
			entries.splice(index, 1);
		}

		if (entries.length === 0)
		{
			this.#registry.delete(chatId);
		}
	}

	#removeSamePriorityEntry(chatId: number, priority: number): void
	{
		const entry = (this.#registry.get(chatId) ?? []).find((item) => item.priority === priority);
		if (!entry)
		{
			return;
		}

		this.#removeEntry(chatId, entry);
		this.#disposeEntry(entry);
		this.#restoreTopEntry(chatId);
	}

	#teardownEntry(chatId: number, owner: symbol): void
	{
		const entry = this.#findEntry(chatId, owner);
		if (!entry)
		{
			return;
		}

		this.#removeEntry(chatId, entry);
		this.#disposeEntry(entry);
		this.#restoreTopEntry(chatId);
	}

	#restoreTopEntry(chatId: number): void
	{
		const restored = this.#activateTopEntry(chatId);
		if (restored && restored.managesSharedState)
		{
			void stateController.hydrate(restored.taskId);
		}
	}

	#isTaskRetained(taskId: number): boolean
	{
		for (const entries of this.#registry.values())
		{
			if (entries.some((entry) => entry.isRetained && entry.taskId === taskId))
			{
				return true;
			}
		}

		return false;
	}

	#activateTopEntry(chatId: number): RegistryEntry | null
	{
		const entries = this.#registry.get(chatId) ?? [];
		const top = entries.reduce((best: RegistryEntry | null, entry: RegistryEntry) => {
			if (!this.#isLoaded(entry))
			{
				return best;
			}

			return (best && best.priority > entry.priority) ? best : entry;
		}, null);

		if (!top || top.isRegistered)
		{
			return null;
		}

		const { callback, menuClass, messageMenuManager } = top;
		if (!callback || !menuClass || !messageMenuManager)
		{
			return null;
		}

		entries.forEach((entry) => {
			if (entry !== top)
			{
				this.#deactivateEntry(entry);
			}
		});

		top.isRegistered = true;
		messageMenuManager.registerMenuByCallback(callback, menuClass);

		return top;
	}

	#isLoaded(entry: RegistryEntry): boolean
	{
		return Boolean(entry.callback && entry.menuClass && entry.messageMenuManager);
	}

	#deactivateEntry(entry: RegistryEntry): void
	{
		const registryEntry = entry;
		if (!registryEntry.isRegistered)
		{
			return;
		}

		registryEntry.isRegistered = false;
		if (registryEntry.callback && registryEntry.messageMenuManager)
		{
			registryEntry.messageMenuManager.unregisterMenuByCallback(registryEntry.callback);
		}
	}

	#disposeEntry(entry: RegistryEntry): void
	{
		const registryEntry = entry;

		try
		{
			this.#deactivateEntry(registryEntry);
		}
		finally
		{
			registryEntry.callback = null;
			registryEntry.menuClass = null;
			registryEntry.messageMenuManager = null;

			if (registryEntry.isRetained)
			{
				try
				{
					if (!this.#isTaskRetained(registryEntry.taskId))
					{
						stateController.evict(registryEntry.taskId);
					}
				}
				finally
				{
					registryEntry.isRetained = false;
					stateController.release();
				}
			}
		}
	}
}

export const resultMessageMenu = new RegistrationManager();
