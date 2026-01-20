import { Dom } from 'main.core';

import { Messenger } from 'im.public';

import { getConst, getUtils, getCore } from '../utils/core-proxy';

import type { ApplicationContext } from 'im.v2.const';

const { EventType, MessageMentionType, SidebarDetailBlock, SpecialMentionDialogId, ChatType } = getConst();

const MENTION_CSS_CLASS = 'bx-im-mention';

export class MentionHandler
{
	#handlersByMentionType = {
		[MessageMentionType.user]: (dataset) => this.#handleChat(dataset),
		[MessageMentionType.chat]: (dataset) => this.#handleChat(dataset),
		[MessageMentionType.lines]: (dataset) => this.#handleLines(dataset),
		[MessageMentionType.context]: (dataset) => this.#handleContext(dataset),
		[MessageMentionType.call]: (dataset) => this.#handleCall(dataset),
	};

	#handlersByDialogId = {
		[this.#getCopilotBotDialogId()]: () => this.#handleCopilot(),
		[SpecialMentionDialogId.allParticipants]: () => this.#handleAllParticipants(),
	};

	constructor(context: ApplicationContext)
	{
		const { emitter } = context;
		this.emitter = emitter;
	}

	handleClick(event: PointerEvent): void
	{
		if (!Dom.hasClass(event.target, MENTION_CSS_CLASS))
		{
			return;
		}

		const dataset = event.target.dataset;

		const handlerByDialogId = this.#handlersByDialogId[dataset.value];
		if (handlerByDialogId)
		{
			handlerByDialogId();

			return;
		}

		const handlerByMentionType = this.#handlersByMentionType[dataset.type];
		if (!handlerByMentionType)
		{
			return;
		}

		handlerByMentionType(dataset);
	}

	#getCopilotBotDialogId(): ?string
	{
		return getCore().getStore().getters['users/bots/getCopilotBotDialogId'];
	}

	#handleCopilot(): void
	{
		void Messenger.openCopilot();
	}

	#handleChat(dataset: { value: string }): void
	{
		void Messenger.openChat(dataset.value);
	}

	#handleLines(dataset: { value: string }): void
	{
		const dialogId = dataset.value;

		if (getUtils().dialog.isLinesHistoryId(dialogId))
		{
			void Messenger.openLinesHistory(dialogId);
		}
		else if (getUtils().dialog.isLinesExternalId(dialogId))
		{
			void Messenger.openLines(dialogId);
		}
	}

	#handleContext(dataset: { messageId: string, dialogId: string }): void
	{
		const messageId = Number.parseInt(dataset.messageId, 10);

		this.emitter.emit(EventType.dialog.goToMessageContext, {
			messageId,
			dialogId: dataset.dialogId,
		});
	}

	#handleCall(dataset: { destination: string }): void
	{
		const destination = dataset.destination;
		if (getUtils().call.isNumber(destination))
		{
			void Messenger.startPhoneCall(destination);
		}
	}

	#handleAllParticipants()
	{
		const { entityId } = getCore().getStore().getters['application/getLayout'];
		const { type } = getCore().getStore().getters['chats/get'](entityId, true);

		if (!entityId)
		{
			return;
		}

		if (type === ChatType.user)
		{
			return;
		}

		this.emitter.emit(EventType.sidebar.open, {
			panel: SidebarDetailBlock.members,
			dialogId: entityId,
		});
	}
}
