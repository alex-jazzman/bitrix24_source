import { Core } from 'im.v2.application.core';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

import { SidebarConfig } from './classes/config';
import { isChat, chatConfig } from './configs/chat';
import { isUser, userConfig } from './configs/user';
import { isBot, botConfig } from './configs/bot';
import { isNotes, notesConfig } from './configs/notes';
import { isLines, linesConfig } from './configs/lines';
import { isCollab, collabConfig } from './configs/collab';
import { isSupport, supportConfig } from './configs/support';
import { isAiAssistant, aiAssistantConfig } from './configs/aiassistant';
import { isComment, commentConfig } from './configs/comment';
import { isChannel, channelConfig } from './configs/channel';
import { isCopilot, copilotConfig } from './configs/copilot';

import type { ImModelChat } from 'im.v2.model';

export { SidebarConfig } from './classes/config';

export type ContextCheckFunction = (context: ImModelChat) => boolean

export class SidebarManager
{
	static #instance = null;

	#defaultConfigMap: Map<ContextCheckFunction, SidebarConfig> = new Map();
	#customConfigMap: Map<ContextCheckFunction, SidebarConfig> = new Map();

	static getInstance(): SidebarManager
	{
		if (!this.#instance)
		{
			this.#instance = new SidebarManager();
		}

		return this.#instance;
	}

	constructor()
	{
		this.#checkMigrationStatus();
		this.#registerDefaultConfigs();
	}

	registerConfig(callback: ContextCheckFunction, sidebarConfig: SidebarConfig): void
	{
		this.#customConfigMap.set(callback, sidebarConfig);
	}

	getConfig(dialogId: string): SidebarConfig
	{
		const chat = Core.getStore().getters['chats/get'](dialogId, true);

		const allConfigEntries = [...this.#customConfigMap.entries(), ...this.#defaultConfigMap.entries()];
		for (const [callback, config] of allConfigEntries)
		{
			if (callback(chat))
			{
				return config;
			}
		}

		return (new SidebarConfig());
	}

	#checkMigrationStatus()
	{
		const filesMigrated = FeatureManager.isFeatureAvailable(Feature.sidebarFiles);
		const linksMigrated = FeatureManager.isFeatureAvailable(Feature.sidebarLinks);
		void Core.getStore().dispatch('sidebar/setFilesMigrated', filesMigrated);
		void Core.getStore().dispatch('sidebar/setLinksMigrated', linksMigrated);
	}

	#registerDefaultConfigs()
	{
		// most specific configs first
		this.#defaultConfigMap.set(isCopilot, copilotConfig);
		this.#defaultConfigMap.set(isChannel, channelConfig);
		this.#defaultConfigMap.set(isComment, commentConfig);
		this.#defaultConfigMap.set(isSupport, supportConfig);
		this.#defaultConfigMap.set(isAiAssistant, aiAssistantConfig);
		this.#defaultConfigMap.set(isBot, botConfig);
		this.#defaultConfigMap.set(isNotes, notesConfig);
		this.#defaultConfigMap.set(isLines, linesConfig);
		this.#defaultConfigMap.set(isCollab, collabConfig);
		this.#defaultConfigMap.set(isUser, userConfig);
		this.#defaultConfigMap.set(isChat, chatConfig);
	}
}
