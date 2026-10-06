import { Dom } from 'main.core';
import { defineComponent } from 'ui.vue3';

import {
	type AttachmentReminder,
	createAttachmentReminder,
} from '../../feature/attachment-reminder/attachment-reminder';
import { useCloseComposeForm } from '../../feature/close-form/close-form';
import { sendMessage } from '../../feature/send-message/send-message';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { useLargeAttachmentGate } from '../../infrastructure/adapter/large-attachment/large-attachment';
import { getReplySendFields, type RecipientFieldKind, useComposeState } from '../../model/compose/compose';
import { type ComposeState, type RecipientItemDto } from '../../model/compose/types';

const FieldsTestId = 'mail-compose-send-fields';

/** Hidden field names the send action reads: plain form-names, the request is a serialised `<form>`. */
const Field = Object.freeze({
	From: 'data[from]',
	Subject: 'data[subject]',
	Message: 'data[message]',
	InReplyTo: 'data[IN_REPLY_TO]',
	MailboxId: 'data[MAILBOX_ID]',
	DraftId: 'data[draftId]',
	DraftRevision: 'data[draftRevision]',
});

/** One hidden field per recipient, in row order. */
const RecipientFields: Array<{ kind: RecipientFieldKind, name: string }> = [
	{ kind: 'to', name: 'data[to][]' },
	{ kind: 'cc', name: 'data[cc][]' },
	{ kind: 'bcc', name: 'data[bcc][]' },
];

type MessageField = {
	name: string,
	value: string,
};

/** The value is set as a property, never as markup: recipients, subject and body are user text. */
function renderField(field: MessageField): HTMLElement
{
	return Dom.create('input', { props: { type: 'hidden', name: field.name, value: field.value } });
}

/**
 * `customData` goes out as JSON unchanged: the send action reads its keys itself and forwards the object
 * to CRM. An item without `customData` serialises as an empty object.
 */
function getRecipientFields(state: ComposeState): MessageField[]
{
	const fields: MessageField[] = [];

	RecipientFields.forEach((field: { kind: RecipientFieldKind, name: string }): void => {
		state.recipients[field.kind].forEach((item: RecipientItemDto): void => {
			fields.push({ name: field.name, value: JSON.stringify(item.customData ?? {}) });
		});
	});

	return fields;
}

function getReplyFields(state: ComposeState): MessageField[]
{
	const reply = getReplySendFields(state);
	if (!reply)
	{
		return [];
	}

	return [
		{ name: Field.InReplyTo, value: reply.inReplyTo },
		{ name: Field.MailboxId, value: String(reply.mailboxId) },
	];
}

/**
 * The sender is the RFC address of the selected mailbox, exactly as the sender list carries it. Subject and
 * body are sent even when empty: the server answers for an empty message. The importance flag is not sent,
 * matching the previous screen.
 */
function getMessageFields(state: ComposeState, body: string): MessageField[]
{
	const fields = [
		{ name: Field.From, value: state.selectedSender ?? '' },
		...getRecipientFields(state),
		{ name: Field.Subject, value: state.subject },
		{ name: Field.Message, value: body },
		...getReplyFields(state),
	];
	if (state.draft.id > 0 && state.draft.revision > 0)
	{
		fields.push(
			{ name: Field.DraftId, value: String(state.draft.id) },
			{ name: Field.DraftRevision, value: String(state.draft.revision) },
		);
	}

	return fields;
}

/**
 * The message is sent by serialising the server `<form>` of the screen, so its fields are nodes of that
 * form. Only the fields written here are owned: `data[__diskfiles][]` belongs to the Disk uploader control,
 * `data[__largeAttachments][...]` to its adapter and `sessid` to the template markup.
 */
// @vue/component
export const SendForm = defineComponent({
	name: 'MailComposeSendForm',

	props: {
		/** Identifier of the server form; the emitted send events carry it. */
		formId: {
			type: String,
			required: true,
		},
	},

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			resolveLargeAttachmentGate: useLargeAttachmentGate(),
			// A sent message closes the panel, and only the form itself can take itself down.
			closeForm: useCloseComposeForm(),
			// Deliberately not reactive: created on the first send and kept as it is.
			reminder: null as AttachmentReminder | null,
			fieldsTestId: FieldsTestId,
		};
	},

	methods: {
		submit(): void
		{
			void sendMessage({
				formId: this.formId,
				state: this.state,
				editor: this.editor,
				writeFields: this.writeFields,
				reminder: this.getReminder(),
				largeAttachment: this.resolveLargeAttachmentGate(),
				closeForm: this.closeForm,
			});
		},

		/**
		 * One instance per form: the one-shot skip lives inside the reminder, so a second instance would ask
		 * again about a message the user has already answered for.
		 */
		getReminder(): AttachmentReminder
		{
			const reminder = this.reminder ?? createAttachmentReminder({
				editor: this.editor,
				state: this.state,
				// Re-enters this same submit(), which passes the reminder again and spends the skip
				// the dialog has just set.
				sendAnyway: this.submit,
			});
			this.reminder = reminder;

			return reminder;
		},

		/**
		 * Rewrites the whole set of hidden fields in its own host node, leaving the uploader, large attachment
		 * and session fields of the surrounding form untouched. Returns the form to serialise, or null when
		 * the host is not on the page.
		 */
		writeFields(body: string): HTMLFormElement | null
		{
			const host = this.$refs.fields as HTMLElement | undefined;
			const form = host?.closest('form');
			if (!host || !form)
			{
				return null;
			}

			Dom.clean(host);
			getMessageFields(this.state, body).forEach((field: MessageField): void => {
				Dom.append(renderField(field), host);
			});

			return form;
		},
	},

	template: `
		<div ref="fields" hidden :data-testid="fieldsTestId"></div>
	`,
});
