import { Extension, Type } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { CallTokenManager } from 'call.lib.call-token-manager';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { RestMethod, Layout, ErrorCode } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';
import { MessageService } from 'im.v2.provider.service.message';

import { type ChatLoadRestResult, type CommentInfoRestResult } from '../types/chat';
import { ChatDataExtractor } from './chat-data-extractor';

const { callInstalled } = Extension.getSettings('im.v2.lib.call');

type UpdateModelsResult = {
	dialogId: string,
	chatId: number,
};

type ChatActionResult = RunActionError | ChatLoadRestResult;

export class LoadService
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	loadChat(dialogId: string): Promise
	{
		const params = { dialogId };

		return this.#requestChat(RestMethod.imV2ChatShallowLoad, params);
	}

	loadChatByChatId(chatId: number): Promise
	{
		const params = {
			chatId,
			messageLimit: MessageService.getMessageRequestLimit(),
		};

		return this.#requestChat(RestMethod.imV2ChatLoad, params);
	}

	loadChatWithMessages(dialogId: string): Promise
	{
		const params = {
			dialogId,
			messageLimit: MessageService.getMessageRequestLimit(),
		};
		const method = this.getLoadRestMethodName();

		return this.#requestChat(method, params);
	}

	loadChatWithContext(dialogId: string, messageId: number): Promise
	{
		const params = {
			dialogId,
			messageId,
			messageLimit: MessageService.getMessageRequestLimit(),
		};

		return this.#requestChat(RestMethod.imV2ChatLoadInContext, params);
	}

	prepareDialogId(dialogId: string): Promise<string>
	{
		if (!Utils.dialog.isExternalId(dialogId))
		{
			return Promise.resolve(dialogId);
		}

		return runAction(RestMethod.imV2ChatGetDialogId, {
			data: { externalId: dialogId },
		})
			.then((result: {dialogId: string}) => {
				return result.dialogId;
			})
			.catch((error) => {
				console.error('ChatService: Load: error preparing external id', error);
			});
	}

	async loadComments(postId: number): Promise
	{
		const params = {
			postId,
			messageLimit: MessageService.getMessageRequestLimit(),
			autoJoin: true,
			createIfNotExists: true,
		};
		const { chatId } = await this.#requestChat(RestMethod.imV2ChatLoad, params);

		return this.#store.dispatch('messages/comments/set', {
			messageId: postId,
			chatId,
		});
	}

	async loadCommentInfo(channelDialogId: string): Promise
	{
		const dialog: ImModelChat = this.#store.getters['chats/get'](channelDialogId, true);
		const messages = this.#store.getters['messages/getByChatId'](dialog.chatId);
		const messageIds = messages.map((message: ImModelMessage) => message.id);
		const { commentInfo, usersShort }: CommentInfoRestResult = await runAction(
			RestMethod.imV2ChatMessageCommentInfoList,
			{ data: { messageIds } },
		)
			.catch((error) => {
				console.error('ChatService: Load: error loading comment info', error);
			});

		const userManager = new UserManager();

		void this.#store.dispatch('messages/comments/set', commentInfo);
		void userManager.addUsersToModel(usersShort);
	}

	clearChat(dialogId: string): Promise
	{
		const dialog: ImModelChat = this.#store.getters['chats/get'](dialogId, true);
		this.#store.dispatch('messages/clearChatCollection', { chatId: dialog.chatId });
		this.#store.dispatch('chats/update', {
			dialogId,
			fields: { inited: false },
		});
	}

	getLoadRestMethodName(): string
	{
		return RestMethod.imV2ChatLoad;
	}

	updateChatCustomModels(restResult: ChatLoadRestResult): Promise<void>[]
	{
		return [];
	}

	async #requestChat(actionName: string, params: Object<string, any>): Promise<{ dialogId: string, chatId: number }>
	{
		const { dialogId, messageId } = params;
		if (this.#affectsDialogLoadingState(actionName))
		{
			this.#markDialogAsLoading(dialogId);
		}

		const actionResult = await runAction(actionName, { data: params })
			.catch(([error]: RunActionError[]) => {
				console.error('ChatService: Load: error loading chat', error);
				if (this.#isTariffError(error))
				{
					return error;
				}

				this.#markDialogAsNotLoaded(dialogId);
				Notifier.chat.handleLoadError(error);
				throw error;
			});

		if (this.#checkFeatureDisabled(actionResult))
		{
			await this.#markDialogAsNotLoaded(dialogId);
			await Messenger.openChat();

			return this.#openFeatureSlider(actionResult);
		}

		if (this.#needLayoutRedirect(actionResult))
		{
			return this.#redirectToLayout(actionResult, messageId);
		}

		const {
			dialogId: loadedDialogId,
			chatId,
		} = await this.#updateModels(actionResult);

		const { callInfo } = actionResult;

		if (callInstalled)
		{
			CallTokenManager.setToken(callInfo.chatId, callInfo.token);
		}

		if (this.#affectsDialogLoadingState(actionName))
		{
			await this.#markDialogAsLoaded(loadedDialogId);
		}

		return { dialogId: loadedDialogId, chatId };
	}

	#markDialogAsLoading(dialogId: string)
	{
		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { loading: true },
		});
	}

	#markDialogAsLoaded(dialogId: string): Promise
	{
		return this.#store.dispatch('chats/update', {
			dialogId,
			fields: {
				inited: true,
				loading: false,
			},
		});
	}

	#markDialogAsNotLoaded(dialogId: string): Promise
	{
		return this.#store.dispatch('chats/update', {
			dialogId,
			fields: { loading: false },
		});
	}

	#affectsDialogLoadingState(actionName: string): boolean
	{
		return actionName !== RestMethod.imV2ChatShallowLoad;
	}

	async #updateModels(restResult: ChatLoadRestResult): Promise<UpdateModelsResult>
	{
		const extractor = new ChatDataExtractor(restResult);

		const chatsPromise = this.#store.dispatch('chats/set', extractor.getChats());
		const filesPromise = this.#store.dispatch('files/set', extractor.getFiles());
		const autoDeletePromise = this.#store.dispatch('chats/autoDelete/set', extractor.getAutoDeleteConfig());

		const userManager = new UserManager();
		const usersPromise = Promise.all([
			this.#store.dispatch('users/set', extractor.getUsers()),
			userManager.addUsersToModel(extractor.getAdditionalUsers()),
		]);
		const messagesPromise = Promise.all([
			this.#store.dispatch('messages/setChatCollection', {
				messages: extractor.getMessages(),
				clearCollection: true,
			}),
			this.#store.dispatch('messages/store', extractor.getMessagesToStore()),
			this.#store.dispatch('messages/pin/setPinned', {
				chatId: extractor.getChatId(),
				pinnedMessages: extractor.getPinnedMessageIds(),
			}),
			this.#store.dispatch('messages/reactions/set', extractor.getReactions()),
			this.#store.dispatch('messages/comments/set', extractor.getCommentInfo()),
		]);

		const copilotManager = new CopilotManager();
		const copilotPromise = copilotManager.handleChatLoadResponse(extractor.getCopilot());

		const collabPromise = this.#store.dispatch('chats/collabs/set', {
			chatId: extractor.getChatId(),
			collabInfo: extractor.getCollabInfo(),
		});

		const stickersPromise = Promise.all([
			this.#store.dispatch('stickers/messages/set', extractor.getStickerMessages()),
			this.#store.dispatch('stickers/set', extractor.getStickers()),
		]);

		const builderPromise = this.#store.dispatch('messages/builder/set', extractor.getMessages());
		const customPromises = this.updateChatCustomModels(restResult);

		await Promise.all([
			chatsPromise,
			filesPromise,
			usersPromise,
			messagesPromise,
			copilotPromise,
			collabPromise,
			autoDeletePromise,
			stickersPromise,
			builderPromise,
			...customPromises,
		]);

		return { dialogId: extractor.getDialogId(), chatId: extractor.getChatId() };
	}

	#needLayoutRedirect(actionResult: ChatLoadRestResult): boolean
	{
		return this.#needRedirectToOpenLinesLayout(actionResult);
	}

	#redirectToLayout(actionResult: ChatLoadRestResult): Promise
	{
		const extractor = new ChatDataExtractor(actionResult);
		LayoutManager.getInstance().setLastOpenedElement(Layout.chat, '');

		if (this.#needRedirectToOpenLinesLayout(actionResult))
		{
			return Messenger.openLines(extractor.getDialogId());
		}

		return Promise.resolve();
	}

	#needRedirectToOpenLinesLayout(actionResult: ChatLoadRestResult): boolean
	{
		const optionOpenLinesV2Activated = FeatureManager.isFeatureAvailable(Feature.openLinesV2);

		if (optionOpenLinesV2Activated)
		{
			return false;
		}

		const extractor = new ChatDataExtractor(actionResult);

		return extractor.isOpenlinesChat() && Type.isStringFilled(extractor.getDialogId());
	}

	#isTariffError(actionResult: ChatActionResult): boolean
	{
		const errors = new Set([ErrorCode.collabV2.tariffRestricted]);

		return errors.has(actionResult.code);
	}

	#checkCollabFeatureDisabled(actionResult: ChatActionResult): boolean
	{
		const extractor = new ChatDataExtractor(actionResult);

		return extractor.isCollabChat() && !TariffManager.collab.isAvailable();
	}

	#checkFeatureDisabled(actionResult: ChatActionResult): boolean
	{
		return this.#isTariffError(actionResult) || this.#checkCollabFeatureDisabled(actionResult);
	}

	#openFeatureSlider(actionResult: ChatActionResult)
	{
		if (actionResult.code === ErrorCode.collabV2.tariffRestricted)
		{
			TariffManager.collabV2.openFeatureSlider();

			return;
		}

		TariffManager.collab.openFeatureSlider();
	}
}
