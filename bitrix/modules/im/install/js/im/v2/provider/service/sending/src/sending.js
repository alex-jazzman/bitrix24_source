import { Type, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PageContext } from 'ui.page-context';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import {
	EventType,
	RestMethod,
	DialogScrollThreshold,
	ChatType,
	DialogIdChatPrefix,
	CopilotMcpSelectionStatus,
} from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';
import { MessageService } from 'im.v2.provider.service.message';
import {
	type ForwardDeliveryResponse,
	type ForwardUuidMap,
} from 'im.v2.provider.service.sending.forward';

import { emitQuestionPin } from './scroll-emit';
import { LazyForwardOperation } from './forward/lazy-forward-operation';
import {
	type PlainMessageParams,
	type CopilotPromptMessageParams,
	type CopilotModeParams,
	type FileMessageParams,
	type ForwardBlock,
	type ForwardSource,
	type PreparedMessage,
	type StickerMessageParams,
} from './types/sending';

export type { PanelContext, PanelContextWithMultipleIds } from './types/sending';

// upper bound for the copilot MCP selection to reach the ready status before a send leaves for the
// server: the only thing waited for here is a write of the selection still in flight, which takes
// hundreds of milliseconds, since the chat data is always in before a send is possible at all. The
// one case that runs to the timeout is a server reporting no selection whatsoever, so the shorter
// the bound, the sooner such a message goes out
const MCP_SELECTION_READY_TIMEOUT = 2000;

export class SendingService
{
	#store: Store;

	static instance: SendingService = null;

	static getInstance(): SendingService
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	constructor()
	{
		this.#store = Core.getStore();
	}

	async sendMessage(params: PlainMessageParams): void
	{
		const { text = '' } = params;
		if (!Type.isStringFilled(text))
		{
			return;
		}

		Logger.warn('SendingService: sendMessage', params);
		const message = this.#prepareMessage(params);

		void this.#processMessageSending(message);
	}

	async sendMessageWithFiles(params: FileMessageParams): Promise
	{
		const { text = '', fileIds = [] } = params;
		if (!Type.isStringFilled(text) && !Type.isArrayFilled(fileIds))
		{
			return Promise.resolve();
		}

		Logger.warn('SendingService: sendMessage with files', params);
		const message: PreparedMessage = this.#prepareMessageWithFiles(params);

		await this.#handlePagination(message.dialogId);
		await this.#addLoadingMessage(message);
		await this.#addMessageToRecent(message);
		await this.#clearLastMessageViews(message.dialogId);

		this.#emitSendScroll(message.dialogId, message.temporaryId);

		return Promise.resolve();
	}

	async sendMessageWithSticker(params: StickerMessageParams): void
	{
		const { stickerParams } = params;

		if (!Type.isPlainObject(stickerParams))
		{
			return;
		}

		Logger.warn('SendingService: sendMessage with sticker', params);
		const message: PreparedMessage = this.#prepareMessageWithSticker(params);

		void this.#processMessageSending(message);
	}

	async forwardMessages(params: PlainMessageParams): Promise
	{
		const { forwardIds, dialogId, text } = params;
		if (!Type.isArrayFilled(forwardIds))
		{
			return Promise.resolve();
		}
		Logger.warn('SendingService: forwardMessages', params);

		await this.#handlePagination(dialogId);

		let commentMessage = null;
		if (Type.isStringFilled(text))
		{
			commentMessage = this.#prepareMessage(params);
			await this.#addMessageToModels(commentMessage);
		}

		const sortForwardIds = [...forwardIds].sort((firstId, secondId) => firstId - secondId);
		const forwardUuidMap = this.#getForwardUuidMap(sortForwardIds);
		const forwardedMessages = this.#prepareForwardMessages(params, forwardUuidMap);

		await this.#addForwardsToModels(forwardedMessages);

		this.#sendScrollEvent({ force: true, dialogId });

		return this.#sendForwardRequest({ forwardUuidMap, commentMessage, dialogId });
	}

	createForwardOperation(params: { forwardIds: number[], recipientDialogIds: string[] }): LazyForwardOperation
	{
		return new LazyForwardOperation({
			operationId: Utils.text.getUuidV4(),
			messageIds: params.forwardIds,
			recipientDialogIds: params.recipientDialogIds,
			uuidFactory: () => Utils.text.getUuidV4(),
			deliver: (dialogId, forwardUuidMap) => {
				return this.#sendForwardDelivery(dialogId, forwardUuidMap);
			},
			getRecipientTitle: (dialogId) => this.#getDialog(dialogId)?.name ?? dialogId,
		});
	}

	async retrySendMessage(params: { tempMessageId: string, dialogId: string }): Promise
	{
		const { tempMessageId, dialogId } = params;
		const unsentMessage: ImModelMessage = this.#store.getters['messages/getById'](tempMessageId);
		if (!unsentMessage)
		{
			return Promise.resolve();
		}

		this.#removeMessageError(tempMessageId);
		const message = this.#prepareMessage({
			text: unsentMessage.text,
			dialogId,
			tempMessageId: unsentMessage.id,
			replyId: unsentMessage.replyId,
		});

		if (Type.isStringFilled(unsentMessage.forward.id))
		{
			const [, forwardId] = unsentMessage.forward.id.split('/');
			const forwardUuidMap = { [unsentMessage.id]: forwardId };

			return this.#sendForwardRequest({ forwardUuidMap, dialogId });
		}

		// AC-018: retrying a question re-pins it (applicable chats only); other
		// chats keep the prior behaviour of not emitting a scroll event on retry.
		emitQuestionPin({ dialogId, messageId: message.temporaryId });

		return this.#sendAndProcessMessage(message);
	}

	async sendCopilotPrompt(copilotPromptMessageParams: CopilotPromptMessageParams): Promise
	{
		const { text = '' } = copilotPromptMessageParams;
		if (!Type.isStringFilled(text))
		{
			return Promise.resolve();
		}

		Logger.warn('SendingService: sendCopilotPrompt', copilotPromptMessageParams);
		const message = this.#prepareCopilotPromptMessage(copilotPromptMessageParams);

		return this.#processMessageSending(message);
	}

	async #addLoadingMessage(message: PreparedMessage): Promise<void>
	{
		return this.#store.dispatch('messages/addLoadingMessage', { message });
	}

	async #processMessageSending(message: PreparedMessage): Promise
	{
		await this.#handleAddingMessageToModels(message);

		return this.#sendAndProcessMessage(message);
	}

	async #handleAddingMessageToModels(message)
	{
		await this.#handlePagination(message.dialogId);
		await this.#addMessageToModels(message);

		this.#emitSendScroll(message.dialogId, message.temporaryId);
	}

	async #sendAndProcessMessage(message: PreparedMessage): Promise
	{
		const mcpAuthId = await this.#resolveConfirmedMcpAuthId(message.dialogId);
		const sendResult = await this.#sendMessageToServer(message, mcpAuthId)
			.catch((errors) => {
				this.#updateMessageError(message.temporaryId);
				this.#logSendErrors(errors, 'sendAndProcessMessage');
			});

		Logger.warn('SendingService: sendAndProcessMessage result -', sendResult);
		const { id } = sendResult;
		if (!id)
		{
			return Promise.resolve();
		}

		this.#updateModels({
			oldId: message.temporaryId,
			newId: id,
			dialogId: message.dialogId,
		});

		return Promise.resolve();
	}

	#prepareCustomFields(dialogId: string, temporaryId: string): JsonObject
	{
		const customsFieldsSources = EventEmitter.emit(EventType.sending.onBeforeAddMessageToModel, {
			temporaryId,
			dialogId,
		});

		let customFields = {};
		for (const source of customsFieldsSources)
		{
			if (Type.isPlainObject(source))
			{
				customFields = { ...customFields, ...source };
			}
		}

		return customFields;
	}

	#prepareMessage(params: PlainMessageParams): PreparedMessage
	{
		const { text, tempMessageId, dialogId, replyId, forwardIds } = params;

		const defaultFields = {
			authorId: Core.getUserId(),
			unread: false,
			sending: true,
		};

		const copilotParams = this.#prepareCopilotMessageParams(dialogId);
		const aiAssistantParams = this.#prepareAiAssistantMessageParams(dialogId);
		const customFields = this.#prepareCustomFields(dialogId, tempMessageId);

		return {
			text,
			dialogId,
			chatId: this.#getDialog(dialogId).chatId,
			temporaryId: tempMessageId ?? Utils.text.getUuidV4(),
			replyId,
			forwardIds,
			viewedByOthers: this.#needToSetAsViewed(dialogId),
			...copilotParams,
			...aiAssistantParams,
			...defaultFields,
			...customFields,
		};
	}

	#prepareMessageWithFiles(params: FileMessageParams): PreparedMessage
	{
		const { fileIds } = params;
		if (!Type.isArrayFilled(fileIds))
		{
			throw new Error('SendingService: sendMessageWithFile: no fileId provided');
		}

		return {
			...this.#prepareMessage(params),
			params: { FILE_ID: fileIds },
		};
	}

	#prepareMessageWithSticker(params: StickerMessageParams): PreparedMessage
	{
		const { stickerParams } = params;
		if (!Type.isPlainObject(stickerParams))
		{
			throw new TypeError('SendingService: sendMessageWithSticker: no stickerParams provided');
		}

		return {
			...this.#prepareMessage(params),
			stickerParams,
		};
	}

	#prepareCopilotPromptMessage(promptMessageParams: CopilotPromptMessageParams): PreparedMessage
	{
		const promptCode = promptMessageParams.copilot?.promptCode;
		if (!promptCode)
		{
			throw new Error('SendingService: preparePrompt: no code provided');
		}

		const preparedMessage = this.#prepareMessage(promptMessageParams);

		return {
			...preparedMessage,
			copilot: { ...preparedMessage.copilot, promptCode },
		};
	}

	async #handlePagination(dialogId: string): Promise
	{
		if (!this.#getDialog(dialogId).hasNextPage)
		{
			return Promise.resolve();
		}

		Logger.warn('SendingService: sendMessage: there are unread pages, move to chat end');
		const messageService = new MessageService({ chatId: this.#getDialog(dialogId).chatId });

		await messageService.loadContext(this.#getDialog(dialogId).lastMessageId);
		this.#sendScrollEvent({ dialogId });

		return Promise.resolve();
	}

	#addMessageToModels(message: PreparedMessage): Promise
	{
		this.#addMessageToRecent(message);
		const hasMessageSticker: boolean = Type.isPlainObject(message.stickerParams);
		if (hasMessageSticker)
		{
			void this.#store.dispatch('stickers/recent/update', message.stickerParams);
			void this.#store.dispatch('stickers/messages/set', [{
				messageId: message.temporaryId,
				...message.stickerParams,
			}]);
		}

		void this.#clearLastMessageViews(message.dialogId);

		return this.#store.dispatch('messages/add', message);
	}

	#addMessageToRecent(message: PreparedMessage)
	{
		const hasMessageText: boolean = Type.isStringFilled(message.text);
		const hasMessageFile: boolean = Type.isArrayFilled(message.params?.FILE_ID);
		const hasMessageSticker: boolean = Type.isPlainObject(message.stickerParams);

		if (hasMessageText || hasMessageFile || hasMessageSticker)
		{
			void this.#store.dispatch('recent/update', {
				dialogId: message.dialogId,
				fields: { messageId: message.temporaryId },
			});
		}
	}

	#sendMessageToServer(message: PreparedMessage, mcpAuthId: ?number = null): Promise
	{
		const fields = {};

		if (message.replyId)
		{
			fields.replyId = message.replyId;
		}

		if (message.forwardIds)
		{
			fields.forwardIds = message.forwardIds;
		}

		if (message.text)
		{
			fields.message = message.text;
			fields.templateId = message.temporaryId;
		}

		if (message.copilot)
		{
			fields.copilot = mcpAuthId ? { ...message.copilot, mcpAuthId } : message.copilot;
		}

		if (message.aiAssistant)
		{
			fields.aiAssistant = message.aiAssistant;
		}

		if (message.stickerParams)
		{
			// todo: this is temp fix. We need to figure it out, why templateId is set only for text messages (see above)
			fields.templateId = message.temporaryId;
			fields.stickerParams = message.stickerParams;
		}

		const queryData = {
			dialogId: message.dialogId.toString(),
			fields,
		};

		return runAction(RestMethod.imV2ChatMessageSend, { data: queryData });
	}

	#updateModels(params: { oldId: string, newId: number, dialogId: string })
	{
		const { oldId, newId, dialogId } = params;
		void this.#store.dispatch('messages/updateWithId', {
			id: oldId,
			fields: { id: newId },
		});
		void this.#store.dispatch('messages/builder/updateWithId', { oldId, newId });
		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: {
				lastId: newId,
				lastMessageId: newId,
			},
		});
		void this.#store.dispatch('recent/update', {
			dialogId,
			fields: { messageId: newId },
		});

		const isSticker: boolean = this.#store.getters['stickers/messages/isSticker'](oldId);
		if (isSticker)
		{
			void this.#store.dispatch('stickers/messages/updateWithId', { oldId, newId });
		}
	}

	#updateMessageError(messageId: string)
	{
		void this.#store.dispatch('messages/update', {
			id: messageId,
			fields: { error: true },
		});
	}

	#removeMessageError(messageId: string)
	{
		void this.#store.dispatch('messages/update', {
			id: messageId,
			fields: {
				sending: true,
				error: false,
			},
		});
	}

	#sendScrollEvent(params: {force: boolean, dialogId: string} = {})
	{
		const { force = false, dialogId } = params;
		EventEmitter.emit(EventType.dialog.scrollToBottom, {
			chatId: this.#getDialog(dialogId).chatId,
			threshold: force ? DialogScrollThreshold.none : DialogScrollThreshold.halfScreenUp,
		});
	}

	// Pin the just-sent question for applicable chats, otherwise fall back to the
	// legacy force scroll-to-bottom. The question keeps its own scroll behaviour.
	#emitSendScroll(dialogId: string, messageId: number | string)
	{
		if (emitQuestionPin({ dialogId, messageId }))
		{
			return;
		}

		this.#sendScrollEvent({ force: true, dialogId });
	}

	#getDialog(dialogId: string): ImModelChat
	{
		return this.#store.getters['chats/get'](dialogId, true);
	}

	#getDialogByChatId(chatId: number): ImModelChat
	{
		return this.#store.getters['chats/getByChatId'](chatId, true);
	}

	#needToSetAsViewed(dialogId: string): boolean
	{
		return this.#store.getters['users/bots/isNetwork'](dialogId);
	}

	#handleForwardMessageResponse(params: {
		response: Object,
		dialogId: string,
		commentMessage: ?PreparedMessage,
	}): boolean
	{
		const { response, dialogId, commentMessage } = params;
		const { id, uuidMap = {}, failureMap = {} } = response;

		if (id)
		{
			this.#updateModels({
				oldId: commentMessage.temporaryId,
				newId: id,
				dialogId,
			});
		}
		Object.entries(uuidMap).forEach(([uuid: string, messageId: number]) => {
			this.#updateModels({
				oldId: uuid,
				newId: messageId,
				dialogId,
			});
		});
		Object.keys(failureMap).forEach((uuid: string) => {
			this.#updateMessageError(uuid);
		});

		return Object.keys(failureMap).length === 0;
	}

	#handleForwardMessageError({ commentMessage, forwardUuidMap })
	{
		if (commentMessage)
		{
			void this.#store.dispatch('messages/update', {
				id: commentMessage.temporaryId,
				fields: { error: true },
			});
		}

		Object.keys(forwardUuidMap).forEach((uuid: string) => {
			void this.#store.dispatch('messages/update', {
				id: uuid,
				fields: { error: true },
			});
		});
	}

	#sendForwardDelivery(
		dialogId: string,
		forwardUuidMap: ForwardUuidMap,
	): Promise<ForwardDeliveryResponse>
	{
		const requestParams = this.#prepareSendForwardRequest({ forwardUuidMap, commentMessage: null, dialogId });

		return this.#sendMessageToServer(requestParams);
	}

	#prepareForwardMessages(params: PlainMessageParams, forwardUuidMap: {[string]: number}): PreparedMessage[]
	{
		const { forwardIds, dialogId } = params;
		if (forwardIds.length === 0)
		{
			return [];
		}

		const preparedMessages = [];
		Object.entries(forwardUuidMap).forEach(([uuid: string, messageId: number]) => {
			const message: ImModelMessage = this.#store.getters['messages/getById'](messageId);
			if (!message)
			{
				return;
			}

			const prepared = {
				...this.#prepareMessage({ dialogId, text: message.text, tempMessageId: uuid, replyId: message.replyId }),
				forward: this.#prepareForwardParams(messageId),
				attach: message.attach,
				isDeleted: message.isDeleted,
				files: message.files,
			};

			const isSticker = this.#store.getters['stickers/messages/isSticker'](messageId);
			if (isSticker)
			{
				prepared.stickerParams = this.#store.getters['stickers/messages/getStickerByMessageId'](messageId);
			}

			this.#copyBuilderBlocks(messageId, uuid);

			preparedMessages.push(prepared);
		});

		return preparedMessages;
	}

	#copyBuilderBlocks(sourceMessageId: number | string, targetMessageId: string)
	{
		const originalBlocks = this.#store.getters['messages/builder/getBlocks'](sourceMessageId);
		if (!Type.isArrayFilled(originalBlocks))
		{
			return;
		}

		const originalParams = this.#store.getters['messages/builder/getParams'](sourceMessageId);
		void this.#store.dispatch('messages/builder/set', {
			id: targetMessageId,
			block: { config: originalParams, elements: originalBlocks },
		});
	}

	#prepareForwardParams(messageId: number): ForwardBlock
	{
		const message: ImModelMessage = this.#store.getters['messages/getById'](messageId);
		const isForward = this.#store.getters['messages/isForward'](messageId);
		// a fragment forwarded on keeps the context of its first source, so it is carried over
		const source: ForwardSource = isForward
			? message.forward
			: this.#describeForwardSource(this.#getDialogByChatId(message.chatId));

		return {
			id: this.#buildForwardContextId(message.chatId, messageId),
			userId: isForward ? message.forward.userId : message.authorId,
			chatType: source.chatType,
			chatTitle: source.chatType === ChatType.channel ? null : (source.chatTitle ?? null),
			parentChatId: source.parentChatId ?? 0,
			parentMessageId: source.parentMessageId ?? 0,
			parentChatType: source.parentChatType ?? null,
		};
	}

	/**
	 * A discussion is named by its parent chat rather than by itself, and the server resolves that
	 * name only when the feed is read. Taking the whole context from the store leaves the caption of
	 * the optimistic message the one the answer brings, instead of letting it change twice.
	 */
	#describeForwardSource(chat: ImModelChat): ForwardSource
	{
		if (chat.type !== ChatType.comment)
		{
			return {
				chatType: chat.type,
				chatTitle: chat.name,
				parentChatId: 0,
				parentMessageId: 0,
				parentChatType: null,
			};
		}

		// No confirmed state is asked of the parent, unlike the reader path in im.v2.provider.pull: the
		// block is optimistic, it is built for the author, whose access the forward itself has proved,
		// and never reaches the server. Requiring inited here would only make the caption change twice.
		const parentChat: ?ImModelChat = this.#store.getters['chats/getByChatId'](chat.parentChatId);

		return {
			chatType: chat.type,
			chatTitle: Type.isStringFilled(parentChat?.name) ? parentChat.name : null,
			parentChatId: chat.parentChatId,
			parentMessageId: this.#store.getters['messages/comments/getMessageIdByChatId'](chat.chatId) ?? 0,
			parentChatType: parentChat?.type ?? null,
		};
	}

	#prepareSendForwardRequest(params: {
		forwardUuidMap: { [string]: number },
		commentMessage: ?PreparedMessage,
		dialogId: string
	}): { dialogId: string, forwardIds: { [string]: number }, text?: string, temporaryId?: string }
	{
		const { dialogId, forwardUuidMap, commentMessage } = params;

		const requestPrams = {
			dialogId,
			forwardIds: forwardUuidMap,
		};

		if (commentMessage)
		{
			requestPrams.text = commentMessage.text;
			requestPrams.temporaryId = commentMessage.temporaryId;
		}

		return requestPrams;
	}

	#addForwardsToModels(forwardedMessages: PreparedMessage[]): Promise
	{
		const addPromises = [];
		forwardedMessages.forEach((message) => {
			addPromises.push(this.#addMessageToModels(message));
		});

		return Promise.all(addPromises);
	}

	#getForwardUuidMap(forwardIds: number[]): { [string]: number }
	{
		const uuidMap = {};
		forwardIds.forEach((id) => {
			uuidMap[Utils.text.getUuidV4()] = id;
		});

		return uuidMap;
	}

	#buildForwardContextId(chatId: number, messageId: number): string
	{
		const dialogId = this.#getDialogByChatId(chatId).dialogId;

		if (dialogId.startsWith(DialogIdChatPrefix))
		{
			return `${dialogId}/${messageId}`;
		}

		const currentUser = Core.getUserId();

		return `${dialogId}:${currentUser}/${messageId}`;
	}

	#logSendErrors(errors: RunActionError[], methodName: string)
	{
		errors.forEach((error) => {
			console.error(`SendingService: ${methodName} error: code: ${error.code} message: ${error.message}`);
		});
	}

	#clearLastMessageViews(dialogId: string): Promise<any>
	{
		return this.#store.dispatch('chats/clearLastMessageViews', {
			dialogId,
		});
	}

	async #sendForwardRequest({ forwardUuidMap, commentMessage, dialogId }): Promise<boolean>
	{
		try
		{
			const requestParams = this.#prepareSendForwardRequest({ forwardUuidMap, commentMessage, dialogId });
			const response = await this.#sendMessageToServer(requestParams);
			Logger.warn('SendingService: forwardMessage result -', response);

			return this.#handleForwardMessageResponse({ response, dialogId, commentMessage });
		}
		catch (errors)
		{
			this.#handleForwardMessageError({ commentMessage, forwardUuidMap });
			this.#logSendErrors(errors, 'forwardMessage');

			return false;
		}
	}

	#prepareCopilotMessageParams(dialogId: string): { copilot?: CopilotModeParams }
	{
		const isAiAssistantChat = this.#getDialog(dialogId).type === ChatType.copilot;
		if (!isAiAssistantChat)
		{
			return {};
		}

		const store = Core.getStore();
		const isReasoningEnabled = store.getters['copilot/chats/isReasoningEnabled'](dialogId);
		const isForceSearchEnabled = store.getters['copilot/chats/isForceSearchEnabled'](dialogId);
		const isAgentModeEnabled = store.getters['copilot/chats/isAgentModeEnabled'](dialogId);

		const copilot = {};
		if (isReasoningEnabled)
		{
			copilot.reasoning = 'Y';
		}

		if (isForceSearchEnabled)
		{
			copilot.forceSearch = 'Y';
		}

		if (isAgentModeEnabled)
		{
			copilot.agentMode = 'Y';
		}

		copilot.pageContext = PageContext.getAll();

		return { copilot };
	}

	#getConfirmedMcpAuthId(dialogId: string): ?number
	{
		const mcpAuth = this.#store.getters['copilot/chats/getMcpAuth'](dialogId);
		if (!mcpAuth?.id)
		{
			return null;
		}

		if (!FeatureManager.isFeatureAvailable(Feature.isAiAssistantMcpSelectionRestoreAvailable))
		{
			return mcpAuth.id;
		}

		return this.#isMcpAuthConfirmedByServer(dialogId) ? mcpAuth.id : null;
	}

	#isMcpAuthConfirmedByServer(dialogId: string): boolean
	{
		return Boolean(this.#store.getters['copilot/chats/isMcpAuthConfirmed'](dialogId));
	}

	// ALG-01: the confirmed selection is an asynchronous value - in a copilot chat under the restore
	// flag it arrives once the selection has settled and comes back empty if it never does. The
	// message is therefore prepared and shown without it, and only the request waits for it
	async #resolveConfirmedMcpAuthId(dialogId: string): Promise<?number>
	{
		if (this.#isMcpSelectionGateActive(dialogId))
		{
			await this.#waitForMcpSelectionReady(dialogId);
		}

		return this.#getConfirmedMcpAuthId(dialogId);
	}

	#isMcpSelectionGateActive(dialogId: string): boolean
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isAiAssistantMcpSelectionRestoreAvailable))
		{
			return false;
		}

		return this.#getDialog(dialogId).type === ChatType.copilot;
	}

	// the wait never blocks the send: on timeout the selection goes to the error status and the
	// message leaves without MCP, which the chip reports
	#waitForMcpSelectionReady(dialogId: string): Promise<void>
	{
		const readStatus = () => this.#store.getters['copilot/chats/getMcpSelectionStatus'](dialogId);
		// only a selection being written is worth waiting for: a settled one (ready, error or
		// unavailable) is the answer already, so a failed selection does not delay the next send
		if (readStatus() !== CopilotMcpSelectionStatus.restoring)
		{
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			let unwatch = null;
			let timeoutId = null;
			const settle = () => {
				clearTimeout(timeoutId);
				unwatch?.();
				resolve();
			};

			unwatch = this.#store.watch(readStatus, (status: string) => {
				if (status !== CopilotMcpSelectionStatus.restoring)
				{
					settle();
				}
			});

			// the selection never settled: the message leaves without MCP. The chip reports a failure
			// only once the chat data is in: a chat still waiting for its data has nothing that failed
			// yet, so its chip keeps loading until the data arrives
			timeoutId = setTimeout(() => {
				if (this.#store.getters['copilot/chats/isMcpSelectionLoaded'](dialogId))
				{
					void this.#store.dispatch('copilot/chats/setMcpSelectionStatus', {
						dialogId,
						status: CopilotMcpSelectionStatus.error,
					});
				}

				settle();
			}, MCP_SELECTION_READY_TIMEOUT);
		});
	}

	#prepareAiAssistantMessageParams(dialogId: string): { aiAssistant?: { mcpAuthId: number } }
	{
		const isAiAssistant = Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
		if (!isAiAssistant)
		{
			return {};
		}

		const mcpAuthId = Core.getStore().getters['aiAssistant/getMcpAuthId'];
		if (!mcpAuthId)
		{
			return {};
		}

		return { aiAssistant: { mcpAuthId } };
	}
}
