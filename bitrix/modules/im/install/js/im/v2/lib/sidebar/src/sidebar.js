import { Core } from 'im.v2.application.core';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

import { SidebarConfig } from './classes/config';
import { SidebarPreset } from './classes/preset';
import { isAiAssistantBot, aiAssistantBotPreset } from './configs/ai-assistant-bot';
import { isBot, botPreset } from './configs/bot';
import { isChannel, channelPreset } from './configs/channel';
import { isChat, chatPreset } from './configs/chat';
import { isCollab, collabPreset } from './configs/collab';
import { isComment, commentPreset } from './configs/comment';
import { isCopilot, copilotPreset } from './configs/copilot';
import { isLines, linesPreset } from './configs/lines';
import { isSelfChat, selfChatPreset } from './configs/self-chat';
import { isSupport, supportPreset } from './configs/support';
import { isTaskComments, taskCommentsPreset } from './configs/task-comments';
import { isUser, userPreset } from './configs/user';
import { isGuest, guestPreset } from './configs/guest';

export { SidebarConfig } from './classes/config';
export { SidebarPreset } from './classes/preset';

export type ContextCheckFunction = (context: ImModelChat) => boolean

export class SidebarManager
{
	static #instance = null;

	#defaultConfigMap: Map<ContextCheckFunction, SidebarPreset> = new Map();
	#customConfigMap: Map<ContextCheckFunction, SidebarPreset> = new Map();

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

	registerConfig(callback: ContextCheckFunction, sidebarPreset: SidebarPreset): void
	{
		this.#customConfigMap.set(callback, sidebarPreset);
	}

	getConfig(dialogId: string): SidebarConfig
	{
		const chat = Core.getStore().getters['chats/get'](dialogId, true);

		const allConfigEntries = [...this.#customConfigMap.entries(), ...this.#defaultConfigMap.entries()];
		for (const [callback, preset] of allConfigEntries)
		{
			if (callback(chat))
			{
				return new SidebarConfig(dialogId, preset);
			}
		}

		return (new SidebarConfig(dialogId));
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
		this.#defaultConfigMap.set(isTaskComments, taskCommentsPreset);
		this.#defaultConfigMap.set(isCopilot, copilotPreset);
		this.#defaultConfigMap.set(isChannel, channelPreset);
		this.#defaultConfigMap.set(isComment, commentPreset);
		this.#defaultConfigMap.set(isSupport, supportPreset);
		this.#defaultConfigMap.set(isAiAssistantBot, aiAssistantBotPreset);
		this.#defaultConfigMap.set(isBot, botPreset);
		this.#defaultConfigMap.set(isSelfChat, selfChatPreset);
		this.#defaultConfigMap.set(isLines, linesPreset);
		this.#defaultConfigMap.set(isCollab, collabPreset);
		this.#defaultConfigMap.set(isGuest, guestPreset);
		this.#defaultConfigMap.set(isUser, userPreset);
		this.#defaultConfigMap.set(isChat, chatPreset);
	}
}
