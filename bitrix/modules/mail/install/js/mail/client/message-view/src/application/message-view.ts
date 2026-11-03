import {
	MessageViewScreenApplication,
	type MessageViewOptions,
	type MessageViewStateLifecycle,
} from './app';
import { messageViewFacade, Screen } from './screen';
import { normalizeSenderAvatarInteger, resetSenderAvatarForMessage } from '../model/state';
import { type MessageViewState } from '../model/types';

export function createSenderAvatarScreenLifecycle(messageId: number | string): MessageViewStateLifecycle
{
	const senderAvatarMessageId = normalizeSenderAvatarInteger(messageId) ?? 0;
	let state: MessageViewState | null = null;
	const failedImageUrls = new Set<string>();
	let disposed = false;

	return {
		bind(candidate: MessageViewState): boolean
		{
			if (
				disposed
				|| candidate.currentMessage.id !== messageId
				|| candidate.senderAvatar.messageId !== senderAvatarMessageId
			)
			{
				return false;
			}

			state = candidate;

			return true;
		},
		handleImageFailure(url: string): boolean
		{
			if (!state || failedImageUrls.has(url))
			{
				return false;
			}

			const confirmed = state.senderAvatar.confirmed;
			if (state.currentMessage.sender.avatar.image !== url && confirmed?.url !== url)
			{
				return false;
			}

			failedImageUrls.add(url);
			state.currentMessage.sender.avatar.image = null;
			if (confirmed?.url === url)
			{
				state.senderAvatar.confirmed = { ...confirmed, url: null };
			}

			return true;
		},
		dispose(): void
		{
			if (disposed)
			{
				return;
			}

			disposed = true;
			const currentState = state;
			state = null;
			if (!currentState)
			{
				return;
			}

			const previewUrl = currentState.senderAvatar.selection?.previewUrl ?? '';
			resetSenderAvatarForMessage(
				currentState.senderAvatar,
				senderAvatarMessageId,
				currentState.senderAvatar.confirmed,
			);
			if (previewUrl.startsWith('blob:'))
			{
				URL.revokeObjectURL(previewUrl);
			}
		},
	};
}

export class MessageView
{
	#options: MessageViewOptions;
	#screen: Screen | null = null;

	constructor(options: MessageViewOptions)
	{
		this.#options = options;
	}

	static getScreen(messageId?: number | string): Screen | undefined
	{
		return messageViewFacade.getView(messageId);
	}

	start(): void
	{
		if (this.#screen?.isAlive())
		{
			return;
		}

		messageViewFacade.current()?.destroy();
		const senderAvatarLifecycle = createSenderAvatarScreenLifecycle(
			this.#options.bootstrap.currentMessage.id,
		);
		const application = new MessageViewScreenApplication(this.#options, senderAvatarLifecycle);
		const screen = new Screen({
			messageId: this.#options.bootstrap.currentMessage.id,
			mailboxId: this.#options.bootstrap.currentMessage.mailboxId,
			application,
		});
		application.bindScreen(screen);
		this.#screen = screen;
		screen.registerCleanup(() => {
			if (this.#screen === screen)
			{
				this.#screen = null;
			}
		});
		screen.start();
	}

	destroy(): void
	{
		const screen = this.#screen;
		this.#screen = null;
		screen?.destroy();
	}
}
