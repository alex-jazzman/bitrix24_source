import { Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';

import { Phrase, ScheduleErrorPhrase } from '../../const';
import { SliderMessage } from '../../const/event';
import { type AttachmentReminder } from '../attachment-reminder/attachment-reminder';
import { type CloseComposeForm } from '../close-form/close-form';
import { DraftBridgeEvent, getDraftWait } from '../draft-integration/draft-compose-adapter';
import { invalidateSubjectGeneration } from '../generate-subject/generate-subject';
import { buildScheduledBody } from './scheduled-body';
import { validateMessage } from '../validate-message/validate-message';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { type LargeAttachmentSendGate } from '../../infrastructure/adapter/large-attachment/large-attachment';
import { loc } from '../../lib/loc/loc';
import { notifyPortal } from '../../lib/notification/notification';
import { getSelectedSender } from '../../model/compose/compose';
import {
	type ComposeError,
	type ComposeState,
	type RecipientItemDto,
	type SenderDto,
} from '../../model/compose/types';

export type ScheduleMessageParams = {
	/** Identifier of the server-rendered form; the draft listeners of this form answer to it alone. */
	formId: string,
	state: ComposeState,
	editor: ComposeEditorAdapter,
	reminder: AttachmentReminder,
	largeAttachment: LargeAttachmentSendGate | null,
	closeForm: CloseComposeForm,
	scheduledAt: string,
	timezoneId: string,
	api?: ScheduledMessageApi,
};

type ScheduledMessageApi = {
	schedule(request: Record<string, unknown>): Promise<unknown>,
	update(request: Record<string, unknown>): Promise<unknown>,
};

type ScheduledMessageApiError = Error & { code?: string };
type ScheduledMessageSender = Record<string, unknown>;
type ScheduledMessageRecipient = Record<string, unknown>;
type ScheduledMessageAttachmentInput = {
	objectId: number,
	fileName: string,
	isInline: boolean,
};
type ScheduledMessageSnapshot = Record<string, unknown>;
/** Binding of a letter that is already scheduled, as the state of the form carries it. */
type ScheduledMessageAttachment = ComposeState['scheduledMessage']['attachments'][number];
/** Identity of the draft the letter was written in, in the field names of the request. */
type ScheduledMessageDraftFields = {
	draftId: number,
	draftRevision: number,
};

export async function scheduleMessage(params: ScheduleMessageParams): Promise<void>
{
	const { state, formId } = params;
	if (state.isSending)
	{
		return;
	}

	const snapshot = prepareSnapshot(params);
	if (snapshot === null || state.mailbox.id === null)
	{
		return;
	}

	state.isSending = true;
	// The snapshot above already carries the subject, so an answer arriving later would show a subject
	// the scheduled letter does not have.
	invalidateSubjectGeneration(state);
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
				state.errors = [{ message: loc(Phrase.ScheduleErrorUnknown), code: null }];

				return;
			}
		}

		const api = params.api ?? await loadScheduledMessageApi();
		if (state.scheduledMessage.id > 0)
		{
			await api.update({
				id: state.scheduledMessage.id,
				revision: state.scheduledMessage.revision,
				...snapshot,
			});
		}
		else
		{
			await api.schedule({
				mailboxId: state.mailbox.id,
				...snapshot,
				...getDraftFields(state),
				...getSaveAsTemplateField(state),
			});
		}

		finishSuccessfulSchedule(params);
	}
	catch (error)
	{
		state.errors = [toComposeError(error)];
	}
	finally
	{
		state.isSending = false;
	}
}

/**
 * The message left the form, so the draft listeners are told of a finished submit before the form is taken
 * down: a draft that learns of the closing alone announces itself as saved, and the user of a scheduled
 * message would read that instead of the schedule of their own letter. The pages under the form are told as
 * well — the section of the scheduled letters one of them may be showing was drawn before this letter existed.
 * Every one of them, not the nearest alone: a letter already on the schedule is changed from its own card, so
 * the section stands two panels down. Both messages go out before the panel closes: one posted from a dying
 * frame reaches nobody.
 */
function finishSuccessfulSchedule(params: ScheduleMessageParams): void
{
	EventEmitter.emit(DraftBridgeEvent.SubmitAjaxSuccess, { formId: params.formId, data: {} });
	SidePanel.Instance.postMessageAll(window, SliderMessage.ScheduledMessageSaved, {});
	notifyPortal(loc(Phrase.ScheduleSuccess));
	params.closeForm();
}

/**
 * The ask to keep the letter as a template, and only when it is made: an untouched box changes no payload.
 * The letter of the schedule leaves later, from the background dispatcher, so the portal keeps the template
 * at the moment the letter goes on the schedule: the template of the author does not depend on the delivery.
 */
function getSaveAsTemplateField(state: ComposeState): { saveAsTemplate?: boolean }
{
	return state.features.saveTemplate && state.saveAsTemplate ? { saveAsTemplate: true } : {};
}

/**
 * The draft the letter was written in, named the way the send names it: both fields or neither. The revision
 * travels with the identifier so the portal closes the draft the author is looking at and no other.
 */
function getDraftFields(state: ComposeState): ScheduledMessageDraftFields | Record<string, never>
{
	if (state.draft.id > 0 && state.draft.revision > 0)
	{
		return { draftId: state.draft.id, draftRevision: state.draft.revision };
	}

	return {};
}

async function loadScheduledMessageApi(): Promise<ScheduledMessageApi>
{
	const extension = await Runtime.loadExtension('mail.client.scheduled-message') as unknown as {
		scheduledMessageApi: ScheduledMessageApi,
	};

	return extension.scheduledMessageApi;
}

function prepareSnapshot(params: ScheduleMessageParams): ScheduledMessageSnapshot | null
{
	const { state, editor, reminder, largeAttachment, scheduledAt, timezoneId } = params;
	state.errors = validateMessage({ state, files: editor.getFiles() });
	if (state.errors.length > 0 || reminder.check())
	{
		return null;
	}

	if (largeAttachment && !largeAttachment.prepareSend())
	{
		return null;
	}

	const body = buildScheduledBody(editor, state);
	const sender = getSelectedSender(state);
	if (body === null || sender === null)
	{
		state.errors = [{ message: loc(Phrase.ErrorSendFailed), code: null }];

		return null;
	}

	const files = editor.getFiles();
	const retainedAttachments = getRetainedAttachments(state);
	const existingObjectIds = new Set(retainedAttachments
		.map(({ objectId }) => objectId)
		.filter((objectId): objectId is number => objectId !== null));
	const snapshot: ScheduledMessageSnapshot = {
		inReplyTo: state.send.inReplyTo,
		sender: toScheduledSender(sender),
		recipients: {
			to: state.recipients.to.map((item) => toScheduledRecipient(item)),
			cc: state.recipients.cc.map((item) => toScheduledRecipient(item)),
			bcc: state.recipients.bcc.map((item) => toScheduledRecipient(item)),
		},
		subject: state.subject,
		body,
		attachments: files
			.filter((file): boolean => file.id !== null && !existingObjectIds.has(file.id))
			.map((file): ScheduledMessageAttachmentInput => ({
				objectId: file.id as number,
				fileName: file.name,
				isInline: false,
			})),
		scheduledAt,
		timezoneId,
	};
	if (state.scheduledMessage.id > 0)
	{
		snapshot.existingAttachmentIds = retainedAttachments.map(({ id }) => id);
	}

	return snapshot;
}

/**
 * Attachments of the letter the form still holds: the request names them, and the server keeps those alone.
 * Membership is decided by the scheduled attachment identifiers: a source object that is gone from Disk still
 * keeps the copy the schedule owns, unless the user has explicitly removed that attachment from the form.
 */
function getRetainedAttachments(state: ComposeState): ScheduledMessageAttachment[]
{
	const removedIds = new Set(state.scheduledMessage.removedAttachmentIds);

	return state.scheduledMessage.attachments
		.filter(({ id }) => !removedIds.has(id));
}

export function markScheduledAttachmentRemoved(state: ComposeState, fileId: string): void
{
	if (state.scheduledMessage.id <= 0 || !Type.isStringFilled(fileId))
	{
		return;
	}

	const attachment = state.scheduledMessage.attachments.find((item) => (
		item.fileId === fileId
		|| (item.objectId !== null && `n${item.objectId}` === fileId)
	));
	if (!attachment || state.scheduledMessage.removedAttachmentIds.includes(attachment.id))
	{
		return;
	}

	state.scheduledMessage.removedAttachmentIds.push(attachment.id);
}

function toScheduledSender(sender: SenderDto): ScheduledMessageSender
{
	return {
		email: sender.email,
		name: sender.name,
		...(sender.avatar ? { avatar: sender.avatar } : {}),
	};
}

function toScheduledRecipient(item: RecipientItemDto): ScheduledMessageRecipient
{
	const customData = item.customData as Record<string, unknown> | undefined;

	return {
		email: String(customData?.email ?? item.id),
		name: String(customData?.name ?? ''),
		...(Type.isStringFilled(item.avatar) ? { avatar: item.avatar } : {}),
	};
}

/**
 * The message of the service is an English diagnostic and never reaches the form: the phrase is picked by the
 * code, and a code the form does not know is answered with the phrase of an unnamed refusal. The diagnostic is
 * left in the console, where the developer of the portal looks for it.
 */
function toComposeError(error: unknown): ComposeError
{
	const apiError = error as ScheduledMessageApiError;
	const code = apiError.code || null;
	if (apiError.message)
	{
		console.error('Mail compose form: the schedule was refused.', code, apiError.message);
	}

	return {
		message: loc(ScheduleErrorPhrase[code ?? ''] ?? Phrase.ScheduleErrorUnknown),
		code,
	};
}
