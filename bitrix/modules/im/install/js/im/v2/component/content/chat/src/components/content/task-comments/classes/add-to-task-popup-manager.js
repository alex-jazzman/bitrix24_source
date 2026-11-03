import { Type } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { canAddToChat } from 'im.v2.component.textarea';
import { ChatType, EventType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

type MentionData = {
	dialogId: string,
	mentionedUserId: string,
	isParticipant: boolean,
	suppressAddToChatPopup: boolean,
};

type TextChangePayload = {
	text: string,
	isAddingUser: boolean,
};

type ManagerParams = {
	dialogId: string,
	emitter: EventEmitter,
	onCandidateChange: (userId: ?string) => void,
};

export class AddToTaskPopupManager
{
	#dialogId: string;
	#emitter: EventEmitter;
	#onCandidateChange: (userId: ?string) => void;
	#insertMentionHandler: (event: BaseEvent) => void;

	#userId: ?string = null;
	#baselineText: ?string = null;

	constructor({ dialogId, emitter, onCandidateChange }: ManagerParams)
	{
		this.#dialogId = dialogId;
		this.#emitter = emitter;
		this.#onCandidateChange = onCandidateChange;

		this.#insertMentionHandler = (event: BaseEvent) => this.#onInsertMention(event);
		this.#emitter.subscribe(EventType.textarea.insertMention, this.#insertMentionHandler);
	}

	destroy(): void
	{
		this.#emitter.unsubscribe(EventType.textarea.insertMention, this.#insertMentionHandler);
	}

	setDialogId(dialogId: string): void
	{
		this.#dialogId = dialogId;
		this.reset();
	}

	handleTextChange({ text, isAddingUser }: TextChangePayload): void
	{
		if (!this.#userId || isAddingUser)
		{
			return;
		}

		if (this.#baselineText === null)
		{
			this.#baselineText = text;

			return;
		}

		if (text !== this.#baselineText)
		{
			this.reset();
		}
	}

	reset(): void
	{
		this.#setCandidate(null);
	}

	#onInsertMention(event: BaseEvent): void
	{
		const data: MentionData = event.getData();
		if (data.dialogId !== this.#dialogId)
		{
			return;
		}

		if (!this.#canOfferAddToTask(data))
		{
			return;
		}

		this.#setCandidate(data.mentionedUserId);
	}

	#canOfferAddToTask({ mentionedUserId, isParticipant, suppressAddToChatPopup }: MentionData): boolean
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isAddToChatPopupAvailable))
		{
			return false;
		}

		if (suppressAddToChatPopup || isParticipant || !Type.isStringFilled(mentionedUserId))
		{
			return false;
		}

		const mentionedChat: ImModelChat = Core.getStore().getters['chats/get'](mentionedUserId, true);
		if (mentionedChat.type !== ChatType.user)
		{
			return false;
		}

		return canAddToChat(this.#dialogId, mentionedUserId);
	}

	#setCandidate(userId: ?string): void
	{
		this.#userId = userId;
		this.#baselineText = null;

		this.#onCandidateChange(userId);
	}
}
