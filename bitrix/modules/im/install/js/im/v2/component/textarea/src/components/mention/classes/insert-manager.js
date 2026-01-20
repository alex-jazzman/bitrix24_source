import { Loc } from 'main.core';

import { EventType, SpecialMentionDialogId } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { Core } from 'im.v2.application.core';

import type { EventEmitter } from 'main.core.events';
import type { ApplicationContext } from 'im.v2.const';

type InsertParams = {
	id: string,
	dialogId: string,
	query: string,
};

export class MentionInsertManager
{
	#emitter: EventEmitter;
	#handlersById = {
		[SpecialMentionDialogId.allParticipants]: (params) => this.#emitAllParticipantsEvent(params),
		default: (params) => this.#emitBaseEvent(params),
	};

	constructor(context: ApplicationContext)
	{
		const { emitter } = context;
		this.#emitter = emitter;
	}

	emit(params: InsertParams)
	{
		const handler = this.#handlersById[params.id] || this.#handlersById.default;

		handler(params);
	}

	#emitBaseEvent(params: InsertParams)
	{
		const { id, dialogId, query } = params;

		const mentionText = Core.getStore().getters['chats/get'](id, true).name;
		const mentionReplacement = Utils.text.getMentionBbCode(id, mentionText);

		this.#emitter.emit(EventType.textarea.insertMention, {
			mentionText,
			mentionReplacement,
			textToReplace: query,
			dialogId,
		});
	}

	#emitAllParticipantsEvent(params: InsertParams)
	{
		const { dialogId, query } = params;

		const mentionText = Loc.getMessage('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_TEXT');
		const mentionReplacement = `[USER=${SpecialMentionDialogId.allParticipants}]${mentionText}[/USER]`;

		this.#emitter.emit(EventType.textarea.insertMention, {
			mentionText,
			mentionReplacement,
			textToReplace: query,
			dialogId,
		});
	}
}
