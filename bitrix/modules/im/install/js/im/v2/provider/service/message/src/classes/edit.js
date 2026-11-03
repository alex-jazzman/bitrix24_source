import { Text } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ErrorCode, RestMethod } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { runAction, type RunActionError } from 'im.v2.lib.rest';

import type { ImModelMessage } from 'im.v2.model';
import { type EditMessageResult } from '../types/message';

type EditAttempt = {
	messageId: number,
	attemptNumber: number,
	attemptId: string,
};

type EditSnapshot = {
	textBeforeEdit: string,
	isEditedBeforeEdit: boolean,
};

type EditChain = {
	snapshot: EditSnapshot,
	attemptsInFlight: number,
};

export type EditMessageFilesParams = {
	fileIds: Array<number | string>,
	text: string,
};

export type EditMessageFilesResult = {
	saved: boolean,
	// the composition is on the message: the save went through, or the refusal came back on a saved one
	isApplied: boolean,
	isEditTargetGone: boolean,
};

type MessageComposition = {
	files: Array<number | string>,
	text: string,
};

// the edit has no target any more: the message is deleted, the chat is gone or the author is out of it
const EDIT_TARGET_GONE_CODES: Set<string> = new Set([
	ErrorCode.message.notFound,
	ErrorCode.message.accessDenied,
	ErrorCode.chat.notFound,
	ErrorCode.chat.accessDenied,
]);

// a refusal on a saved message: rolling the model back would take away a published composition
const APPLIED_DESPITE_ERROR_CODES: Set<string> = new Set([ErrorCode.message.filesMismatch]);

// mirrors FilesUpdater::EMPTY_COMPOSITION of the server, which owns this form of the field
const EMPTY_COMPOSITION = '[]';

export class EditService
{
	#attemptCountByMessageId: Map<number, number> = new Map();
	#chainByMessageId: Map<number, EditChain> = new Map();

	async editMessageText(messageId: number, newText: string): Promise<EditMessageResult>
	{
		const attempt = this.#registerAttempt(messageId);
		Logger.warn('MessageService: editMessageText', attempt.attemptId, newText);

		const message = this.#getMessage(messageId);
		if (!message)
		{
			return this.#buildResult(attempt, { success: false, textBeforeEdit: '', isEditedBeforeEdit: false });
		}

		this.#startAttempt(messageId, message);
		const isEditedAfterUpdate = this.#updateMessageModel(messageId, newText);

		const payload = {
			data: {
				id: messageId,
				fields: { message: newText },
			},
		};

		try
		{
			await runAction(RestMethod.imV2ChatMessageUpdate, payload);
		}
		catch (errors)
		{
			// the snapshot is read when the answer comes, not when the attempt starts: an attempt
			// of the same chain may have been accepted meanwhile and moved the base forward
			const snapshot = this.#getSnapshot(messageId);
			this.#finishAttempt(messageId);

			return this.#buildResult(attempt, { success: false, ...snapshot, reason: errors?.[0] });
		}

		const snapshot = this.#getSnapshot(messageId);
		// the server accepted this text, so it is what the attempts still in flight roll back to
		this.#finishAttempt(messageId, { textBeforeEdit: newText, isEditedBeforeEdit: isEditedAfterUpdate });

		return this.#buildResult(attempt, { success: true, ...snapshot });
	}

	/**
	 * Saves the composition of an already sent message along with its text - one save for both. The server
	 * takes the composition as a full replacement, and the answer tells the caller what became of the edit.
	 *
	 * The save of a composition keeps a snapshot of its own and does not join the chain of text attempts:
	 * the chain rolls a refused text back, while a refused composition rolls back both halves at once.
	 */
	async editMessageFiles(messageId: number, params: EditMessageFilesParams): Promise<EditMessageFilesResult>
	{
		const { fileIds, text } = params;
		Logger.warn('MessageService: editMessageFiles', messageId, fileIds, text);

		const message: ?ImModelMessage = this.#getMessage(messageId);
		if (!message)
		{
			// the message left the model while the batch was uploading: there is nothing to save into
			this.#showEditError();

			return { saved: false, isApplied: false, isEditTargetGone: true };
		}

		const snapshot: MessageComposition = { files: [...message.files], text: message.text };
		const nextComposition: MessageComposition = { files: fileIds, text };

		// an emptied composition of a message without text is a deletion: written to the model as it stands, it
		// would show a deleted message before the server has answered, so this one save leaves the model alone
		const isModelWritten = !this.#emptiesMessage(nextComposition);
		if (isModelWritten)
		{
			this.#applyComposition(messageId, nextComposition);
		}

		try
		{
			await runAction(RestMethod.imV2ChatMessageUpdate, {
				data: {
					id: messageId,
					fields: { fileId: this.#serializeComposition(fileIds), message: text },
				},
			});
		}
		catch (errors)
		{
			const [error] = errors;

			return this.#handleRefusedComposition({
				messageId,
				error,
				snapshot: isModelWritten ? snapshot : null,
			});
		}

		return { saved: true, isApplied: true, isEditTargetGone: false };
	}

	rollbackMessage(messageId: number, text: string, isEdited: boolean): void
	{
		Logger.warn('MessageService: rollbackMessage', messageId);

		Core.getStore().dispatch('messages/update', {
			id: messageId,
			fields: { text, isEdited },
		});
	}

	#handleRefusedComposition(params: {
		messageId: number,
		error: ?RunActionError,
		snapshot: ?MessageComposition,
	}): EditMessageFilesResult
	{
		const { messageId, error, snapshot } = params;
		const code = String(error?.code ?? '');
		const isApplied = APPLIED_DESPITE_ERROR_CODES.has(code);

		Logger.error('MessageService: editMessageFiles error:', error);

		// a refusal that came back on a saved message keeps its composition: the server has published it already
		if (snapshot && !isApplied)
		{
			this.#applyComposition(messageId, snapshot);
		}

		this.#showEditError(error);

		return { saved: false, isApplied, isEditTargetGone: EDIT_TARGET_GONE_CODES.has(code) };
	}

	#emptiesMessage(composition: MessageComposition): boolean
	{
		return composition.files.length === 0 && composition.text === '';
	}

	/**
	 * An emptied composition travels as a list spelled out, not as an empty array. A form carries no empty list:
	 * the request is built by walking the keys of a value, and an empty array has none, so the field itself
	 * would not reach the server - and a request without the field means "the composition was not touched".
	 * The empty string is not the form to use: the server refuses it on purpose, because that is what a broken
	 * client sends by accident, and read as an emptied composition it would delete a message left without text.
	 */
	#serializeComposition(fileIds: Array<number | string>): Array<number | string> | string
	{
		return fileIds.length > 0 ? fileIds : EMPTY_COMPOSITION;
	}

	#applyComposition(messageId: number, composition: MessageComposition): void
	{
		Core.getStore().dispatch('messages/update', {
			id: messageId,
			fields: composition,
		});
	}

	// the attempts of one message share a single snapshot: a later attempt starts on top of the
	// optimistic text of an earlier one, so its own view of "the text before the edit" is a value
	// the server never held. The shared snapshot lives while at least one attempt is in flight
	#startAttempt(messageId: number, message: ImModelMessage): EditSnapshot
	{
		const chain = this.#chainByMessageId.get(messageId);
		if (chain)
		{
			chain.attemptsInFlight += 1;

			return chain.snapshot;
		}

		const snapshot = { textBeforeEdit: message.text, isEditedBeforeEdit: message.isEdited };
		this.#chainByMessageId.set(messageId, { snapshot, attemptsInFlight: 1 });

		return snapshot;
	}

	#getSnapshot(messageId: number): EditSnapshot
	{
		return this.#chainByMessageId.get(messageId)?.snapshot
			?? { textBeforeEdit: '', isEditedBeforeEdit: false }
		;
	}

	#finishAttempt(messageId: number, confirmed: ?EditSnapshot = null): void
	{
		const chain = this.#chainByMessageId.get(messageId);
		if (!chain)
		{
			return;
		}

		chain.attemptsInFlight -= 1;
		if (chain.attemptsInFlight <= 0)
		{
			this.#chainByMessageId.delete(messageId);

			return;
		}

		if (confirmed)
		{
			chain.snapshot = confirmed;
		}
	}

	#registerAttempt(messageId: number): EditAttempt
	{
		const attemptNumber = (this.#attemptCountByMessageId.get(messageId) ?? 0) + 1;
		this.#attemptCountByMessageId.set(messageId, attemptNumber);

		return { messageId, attemptNumber, attemptId: `${messageId}:${attemptNumber}` };
	}

	#buildResult(
		attempt: EditAttempt,
		result: { success: boolean, textBeforeEdit: string, isEditedBeforeEdit: boolean, reason?: ?RunActionError },
	): EditMessageResult
	{
		const { messageId, attemptNumber } = attempt;

		return {
			success: result.success,
			textBeforeEdit: result.textBeforeEdit,
			isEditedBeforeEdit: result.isEditedBeforeEdit,
			reason: result.reason ?? null,
			isLatestAttempt: this.#attemptCountByMessageId.get(messageId) === attemptNumber,
		};
	}

	// every refusal carries its own phrase, and it names the file to remove. The content of a notification is
	// rendered as html, and nothing on the way promises the text from the server is free of markup
	#showEditError(error: ?RunActionError = null): void
	{
		if (error?.message)
		{
			Notifier.file.showValidationError(Text.encode(error.message));

			return;
		}

		Notifier.onDefaultError();
	}

	#updateMessageModel(messageId: number, text: string): boolean
	{
		const message = this.#getMessage(messageId);
		const isEdited = message.viewedByOthers;

		Core.getStore().dispatch('messages/update', {
			id: messageId,
			fields: {
				text,
				isEdited,
			},
		});

		return isEdited;
	}

	#getMessage(messageId: number): ImModelMessage | null
	{
		return Core.getStore().getters['messages/getById'](messageId);
	}
}
