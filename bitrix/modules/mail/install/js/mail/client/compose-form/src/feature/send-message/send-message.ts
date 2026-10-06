import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';

import { Phrase } from '../../const';
import {
	ComposeFormEvent,
	type ComposeFormEventPayload,
	type ComposeFormSubmitPayload,
	SliderMessage,
} from '../../const/event';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { type LargeAttachmentSendGate } from '../../infrastructure/adapter/large-attachment/large-attachment';
import { Api, type SendMessageResponse } from '../../infrastructure/service/compose/compose';
import { type AjaxError } from '../../infrastructure/service/compose/types';
import { loc } from '../../lib/loc/loc';
import { notifyPortal } from '../../lib/notification/notification';
import { type ComposeError, type ComposeState } from '../../model/compose/types';
import { isSelectedSenderMigrationActive } from '../../model/compose/compose';
import { type AttachmentReminder } from '../attachment-reminder/attachment-reminder';
import { buildMessageBody } from '../build-message-body/build-message-body';
import { type CloseComposeForm } from '../close-form/close-form';
import { DraftBridgeEvent } from '../draft-integration/draft-compose-adapter';
import { validateMessage } from '../validate-message/validate-message';

/** Any other status in the response counts as a send error. */
const SuccessStatus = 'success';

export type SendMessageParams = {
	/** Identifier of the server-rendered form; carried by every event the form emits. */
	formId: string,
	state: ComposeState,
	editor: ComposeEditorAdapter,
	/** Writes the hidden fields and returns the form that is serialised, `null` when it left the DOM. */
	writeFields: (body: string) => HTMLFormElement | null,
	/** The one-shot skip lives in this instance, so the repeated send must get the same one. */
	reminder: AttachmentReminder,
	/** `null` when large attachments are disabled for the form. */
	largeAttachment: LargeAttachmentSendGate | null,
	closeForm: CloseComposeForm,
};

/** Kept as one function: the order of the steps is the send contract, and each step can stop the send. */
export async function sendMessage(params: SendMessageParams): Promise<void>
{
	const { state, editor, largeAttachment, writeFields, formId } = params;

	// A send already in flight is left alone: no second request and no error for the user.
	if (state.isSending)
	{
		return;
	}

	if (isSelectedSenderMigrationActive(state))
	{
		return;
	}

	if (!passesChecks(params))
	{
		return;
	}

	// Runs before the body is assembled: the large attachment core restores the links the user deleted,
	// so a body built earlier would go without them.
	if (largeAttachment && !largeAttachment.prepareSend())
	{
		return;
	}

	// A body that cannot be assembled is not sent as what is left of it: an answer whose quote was dropped
	// leaves the recipient without the message it answers, and the user without a word about it.
	const body = buildMessageBody(editor, state.body);
	if (body === null)
	{
		state.errors = [{ message: loc(Phrase.ErrorQuoteLost), code: null }];

		return;
	}

	state.isSending = true;
	try
	{
		const draftWait = getDraftWait(DraftBridgeEvent.BeforeSubmit, formId);
		if (draftWait)
		{
			try
			{
				await draftWait;
			}
			catch
			{
				state.errors = [{ message: loc(Phrase.ErrorSendFailed), code: null }];
				emitFormEvent(ComposeFormEvent.SendError, formId);

				return;
			}
		}

		// The draft flush can create a draft or advance its revision, so the hidden identity fields must be
		// written only after every draft listener has finished.
		const form = writeFields(body);
		if (!form)
		{
			state.errors = [{ message: loc(Phrase.ErrorSendFailed), code: null }];

			return;
		}

		// The assembled body travels with the event, so a listener snapshots the text the recipient gets.
		const submitted: ComposeFormSubmitPayload = { formId, body };
		EventEmitter.emit(ComposeFormEvent.Submit, submitted);

		await deliver(params, form);
	}
	finally
	{
		state.isSending = false;
	}
}

/**
 * Validation runs before the reminder: an empty recipient field must not raise the reminder dialog and the
 * validation error at once.
 */
function passesChecks(params: SendMessageParams): boolean
{
	const { state, editor, reminder } = params;

	state.errors = validateMessage({ state, files: editor.getFiles() });
	if (state.errors.length > 0)
	{
		return false;
	}

	// The dialog repeats the send it held back, and that second pass spends the one-shot skip.
	return !reminder.check();
}

async function deliver(params: SendMessageParams, form: HTMLFormElement): Promise<void>
{
	const { state, formId } = params;

	const errors = await send(form);

	if (errors === null)
	{
		EventEmitter.emit(DraftBridgeEvent.SubmitAjaxSuccess, { formId, data: {} });
		emitFormEvent(ComposeFormEvent.SendSuccess, formId);
		finishSuccessfulSend(params);

		return;
	}

	state.errors = errors;
	emitFormEvent(ComposeFormEvent.SendError, formId);
}

function getDraftWait(eventName: string, formId: string): Promise<void> | null
{
	const pending: Promise<void>[] = [];
	EventEmitter.emit(eventName, {
		formId,
		data: {
			waitUntil: (promise: Promise<void>): void => {
				pending.push(promise);
			},
		},
	});

	return pending.length > 0 ? Promise.all(pending).then((): void => {}) : null;
}

/**
 * The slider message is posted before the panel closes: closing takes the frame of the form down, and a
 * message posted from a dying frame reaches nobody.
 */
function finishSuccessfulSend(params: SendMessageParams): void
{
	SidePanel.Instance.postMessage(window, SliderMessage.MessageCreated, {});
	notifyPortal(loc(Phrase.SendSuccess));
	params.closeForm();
}

/** `null` means the message went out; a non-success status and a failed request are both errors. */
async function send(form: HTMLFormElement): Promise<ComposeError[] | null>
{
	try
	{
		const response: SendMessageResponse = await Api.sendMessage(form);

		return response.status === SuccessStatus ? null : toComposeErrors(response.errors);
	}
	catch
	{
		return toComposeErrors();
	}
}

/**
 * Only large attachment errors carry a code, so the rest keep `code: null` instead of an invented one. An
 * empty list falls back to the own phrase: a send that fails silently leaves the user without a reason.
 */
function toComposeErrors(errors?: AjaxError[]): ComposeError[]
{
	const known = (errors ?? []).map((error: AjaxError): ComposeError => {
		const code = String(error.code ?? '');

		return {
			message: error.message,
			code: code === '' ? null : code,
		};
	});

	return known.length > 0 ? known : [{ message: loc(Phrase.ErrorSendFailed), code: null }];
}

function emitFormEvent(eventName: string, formId: string): void
{
	const payload: ComposeFormEventPayload = { formId };
	EventEmitter.emit(eventName, payload);
}
