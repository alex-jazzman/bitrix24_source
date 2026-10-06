import { Dom, Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { Phrase } from '../../const';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { loc } from '../../lib/loc/loc';
import { markMessageBox } from '../../lib/test-id/test-id';
import { type ComposeState } from '../../model/compose/types';

const TestId = Object.freeze({
	dialog: 'mail-compose-attachment-reminder',
	attach: 'mail-compose-attachment-reminder-attach',
	send: 'mail-compose-attachment-reminder-send',
});

/** Cap on the analysed text: the reminder is a best-effort nudge, and a huge paste must not stall the scans. */
const MaxAnalyzedLength = 100_000;

/** Characters a delivery verb and a file object are read as one mention within. */
const Proximity = 50;

/** "attached to ..." speaks of an attitude and not of a file, so a marker with this tail is skipped. */
const RelationalTail = /^\s+to(\s|$)/;
const RelationalTailLength = 5;

/**
 * Both shapes of the mark are matched: the editor serialises an uploaded image as `bxacid:<id>`, while an
 * image that came with the message from the server keeps `...&__bxacid=<id>`.
 */
const InlineImageSelector = 'img[src*="bxacid:"], img[src*="__bxacid="]';

/** Roots come from phrases, so each one is escaped: a translated character must not break the pattern. */
const RegExpMetaCharacter = /[$()*+.?[\\\]^{|}]/g;

type Span = {
	start: number,
	end: number,
};

type NewMessage = {
	text: string,
	hasInlineImage: boolean,
};

export type AttachmentReminderParams = {
	editor: ComposeEditorAdapter,
	state: ComposeState,
	/** Repeats the send the reminder held back, once the user chooses to send with no files. */
	sendAnyway: () => void,
};

export type AttachmentReminder = {
	/** `true` means the dialog is shown and the caller must stop the send. */
	check(): boolean,
};

/**
 * Dictionaries are read from phrases on every call: a phrase missing from the page drops its level of the
 * search instead of breaking the check.
 */
export function hasAttachmentMention(text: string): boolean
{
	if (!Type.isStringFilled(text))
	{
		return false;
	}

	const normalized = normalize(text);

	return hasStrongMarker(normalized) || hasVerbNearObject(normalized);
}

/**
 * The reminder is called by the send rather than subscribed to it, so the validation errors come first. The
 * one-shot skip lives here and not in the form state: it is spent by the very next check.
 */
export function createAttachmentReminder(params: AttachmentReminderParams): AttachmentReminder
{
	let isSkipped = false;

	return {
		check(): boolean
		{
			// The skip was set by the dialog of the previous check and is spent by this one.
			if (isSkipped)
			{
				isSkipped = false;

				return false;
			}

			// The flag mirrors the `mail_form_attachment_reminder` option of `main`, which defaults to on.
			if (!params.state.attachmentReminder.enabled)
			{
				return false;
			}

			const message = readNewMessage(params.editor);
			if (hasAttachment(params.editor, message) || !hasAttachmentMention(message.text))
			{
				return false;
			}

			showReminder((): void => {
				isSkipped = true;
				params.sendAnyway();
			});

			return true;
		},
	};
}

/**
 * The signature and the quote are dropped: words of a quoted message would warn about a file the user never
 * promised. The body is parsed into a document of its own, which loads no pictures and runs no markup.
 */
function readNewMessage(editor: ComposeEditorAdapter): NewMessage
{
	const bodyDocument = new DOMParser().parseFromString(editor.getBody(), 'text/html');

	Object.values(editor.bodyNodes).forEach((nodeId: string): void => {
		const node = bodyDocument.getElementById(nodeId);
		if (node)
		{
			Dom.remove(node);
		}
	});

	return {
		text: bodyDocument.body.textContent ?? '',
		hasInlineImage: bodyDocument.body.querySelector(InlineImageSelector) !== null,
	};
}

/** The uploader control owns the whole attachment set; besides it only an inline Disk image counts. */
function hasAttachment(editor: ComposeEditorAdapter, message: NewMessage): boolean
{
	return editor.getFiles().length > 0 || message.hasInlineImage;
}

/**
 * "Attach" is the OK button and leaves the form open; the cancel one repeats the held-back send. Escape
 * closes the dialog the way its close icon does — the send stays held back, because the way out of a dialog
 * must not be the way to send a message with no file.
 */
function showReminder(sendAnyway: () => void): void
{
	const box = MessageBox.create({
		title: loc(Phrase.AttachmentReminderTitle),
		message: loc(Phrase.AttachmentReminderText),
		buttons: MessageBoxButtons.OK_CANCEL,
		okCaption: loc(Phrase.AttachmentReminderAttach),
		cancelCaption: loc(Phrase.AttachmentReminderSend),
		popupOptions: { closeByEsc: true },
		onOk: (): boolean => true,
		onCancel: (): boolean => {
			sendAnyway();

			return true;
		},
	});

	markMessageBox(box, { dialog: TestId.dialog, ok: TestId.attach, cancel: TestId.send });
	box.show();
}

/** The text is brought to the shape the dictionaries are written in, so the roots match it as they are. */
function normalize(text: string): string
{
	return text.slice(0, MaxAnalyzedLength)
		.toLowerCase()
		.replaceAll('ё', 'е')
		.replaceAll(/-\s*[\n\r]+\s*/g, '')
		.replaceAll(/\s+/g, ' ');
}

/** Dictionary phrase format: roots separated by "|". `null` when the phrase brings no root. */
function toRegExp(phraseCode: string): RegExp | null
{
	const roots = loc(phraseCode)
		.split('|')
		.map((root: string): string => root.trim())
		.filter((root: string): boolean => root !== '')
		.map((root: string): string => root.replaceAll(RegExpMetaCharacter, '\\$&'));

	return roots.length === 0 ? null : new RegExp(roots.join('|'), 'gi');
}

function findSpans(text: string, regExp: RegExp | null): Span[]
{
	if (!regExp)
	{
		return [];
	}

	return [...text.matchAll(regExp)].map((match: RegExpMatchArray): Span => {
		const start = match.index ?? 0;

		return { start, end: start + match[0].length };
	});
}

/** Level 1: a strong marker warns on its own, unless a relational tail follows it. */
function hasStrongMarker(text: string): boolean
{
	const markers = toRegExp(Phrase.AttachmentMentionPatterns);
	if (!markers)
	{
		return false;
	}

	return [...text.matchAll(markers)].some((match: RegExpMatchArray): boolean => {
		const end = (match.index ?? 0) + match[0].length;

		return !RelationalTail.test(text.slice(end, end + RelationalTailLength));
	});
}

/** Level 2: a delivery verb warns only with a file object within `Proximity`, in either order. */
function hasVerbNearObject(text: string): boolean
{
	const verbs = findSpans(text, toRegExp(Phrase.AttachmentMentionVerbs));
	if (verbs.length === 0)
	{
		return false;
	}

	const objects = findSpans(text, toRegExp(Phrase.AttachmentMentionObjects));
	if (objects.length === 0)
	{
		return false;
	}

	// Both sets are sorted by start, so a two-pointer sweep answers in O(V + O) instead of every pair.
	let verbIndex = 0;
	let objectIndex = 0;
	while (verbIndex < verbs.length && objectIndex < objects.length)
	{
		const verb = verbs[verbIndex];
		const object = objects[objectIndex];
		const isVerbFirst = verb.start < object.start;
		const gap = isVerbFirst ? object.start - verb.end : verb.start - object.end;

		if (gap <= Proximity)
		{
			return true;
		}

		if (isVerbFirst)
		{
			verbIndex += 1;
		}
		else
		{
			objectIndex += 1;
		}
	}

	return false;
}
