import { Type } from 'main.core';
// Loaded for BX.PULL, the page's shared pull client.
import 'pull.client';

// Fields of the im `messageChat` pull event read here (Bitrix\Im\V2\Message\PushFormat::format).
export type ChatMessageParams = {
	chatId?: unknown,
	message?: {
		senderId?: unknown,
		system?: unknown,
		params?: {
			// Inner keys are camelCased on the wire (Bitrix\Im\V2\Message\Param\ComponentParams::toPullFormat).
			COMPONENT_PARAMS?: { copilotProcess?: unknown },
		},
	},
};

export type SubscribeToChatMessages = (callback: (params: ChatMessageParams) => void) => () => void;

type PullSubscriber = {
	subscribe: (options: { moduleId: string, command: string, callback: (params: ChatMessageParams) => void }) => unknown,
};

export const subscribeToChatMessages: SubscribeToChatMessages = (callback) => {
	// Without the pull client no answer arrives: busy is released by the reply timeout.
	const pullClient = (globalThis as { BX?: { PULL?: PullSubscriber } }).BX?.PULL;
	const unsubscribe = pullClient?.subscribe({
		moduleId: 'im',
		command: 'messageChat',
		callback: (params: ChatMessageParams) => callback(params),
	});

	return Type.isFunction(unsubscribe) ? unsubscribe as () => void : () => {};
};

/**
 * Waits for the first answer of the bot in a chat; both are known only after the launch request:
 * messages coming before that are remembered by chat and sender.
 */
export class ReplyWatcher
{
	#unsubscribe: (() => void) | null;
	#onReply: () => void;
	#chatId: number | null = null;
	#botId: number = 0;
	#earlySenders: Set<string> = new Set();

	constructor(subscribe: SubscribeToChatMessages, onReply: () => void)
	{
		this.#onReply = onReply;
		this.#unsubscribe = subscribe((params) => this.#onMessage(params));
	}

	expect(chatId: number, botId: number): void
	{
		this.#chatId = chatId;
		this.#botId = botId;
		if (this.#earlySenders.has(this.#senderKey(chatId, botId)))
		{
			this.#reply();
		}
	}

	stop(): void
	{
		const unsubscribe = this.#unsubscribe;
		this.#unsubscribe = null;
		this.#earlySenders.clear();
		unsubscribe?.();
	}

	#onMessage(params: ChatMessageParams): void
	{
		if (this.#unsubscribe === null)
		{
			return;
		}

		const chatId = Number(params?.chatId) || 0;
		const senderId = Number(params?.message?.senderId) || 0;
		// The copilot welcome banner (sent by the bot with SYSTEM=Y) and the transient "thinking" placeholder
		// (COPILOT_PROCESS, replaced by the answer later) are not answers.
		if (
			chatId <= 0
			|| senderId <= 0
			|| params?.message?.system === 'Y'
			|| Boolean(params?.message?.params?.COMPONENT_PARAMS?.copilotProcess)
		)
		{
			return;
		}

		if (this.#chatId === null)
		{
			this.#earlySenders.add(this.#senderKey(chatId, senderId));
		}
		// Messages of the user and of colleagues are not answers: only the bot of the launch answers.
		else if (chatId === this.#chatId && senderId === this.#botId)
		{
			this.#reply();
		}
	}

	#senderKey(chatId: number, senderId: number): string
	{
		return `${chatId}:${senderId}`;
	}

	#reply(): void
	{
		this.stop();
		this.#onReply();
	}
}
