import { Dom, Type } from 'main.core';

import { buildMessageBody } from '../build-message-body/build-message-body';
import { collectSignatures } from '../resolve-default-signature/resolve-default-signature';
import { BodyNodePrefix } from '../../const';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { getSelectedSender } from '../../model/compose/compose';
import { type ComposeState, type SignatureItem } from '../../model/compose/types';

/**
 * Names the blocks of the form inside the body of the snapshot. The identifiers cannot carry them: the
 * server keeps the body sanitized, and the sanitizer of the module drops the `id` of a `div` while it keeps
 * the classes. Everything under this prefix belongs to the form alone — the server takes it off the letter
 * before it leaves the snapshot (`ScheduledMessageBody::stripFormMarks`).
 */
const ScheduledBodyNodeClass = Object.freeze({
	Signature: 'mail-compose-scheduled-signature',
	Quote: 'mail-compose-scheduled-quote',
} as const);

/**
 * Which signature the letter was saved with: the mark travels inside the body, and a letter scheduled
 * before this mark existed is recognised by the text of its signature.
 */
const SignatureSelectionClassPrefix = 'mail-compose-scheduled-signature-selection-';

export type RestoreScheduledBodyParams = {
	editor: ComposeEditorAdapter,
	state: ComposeState,
};

/**
 * Body of the snapshot: the body every other scenario sends, with the blocks of the form and the chosen
 * signature marked. The marks go on the serialised copy and not on the editor itself, so a folded quote,
 * which the editor renders only at this moment, is named the same way as an unfolded one.
 */
export function buildScheduledBody(editor: ComposeEditorAdapter, state: ComposeState): string | null
{
	const body = buildMessageBody(editor, state.body);
	if (body === null)
	{
		return null;
	}

	const holder = document.createElement('template');
	holder.innerHTML = body;
	markBodyNode(holder.content, editor.bodyNodes.quote, ScheduledBodyNodeClass.Quote);

	const signature = markBodyNode(holder.content, editor.bodyNodes.signature, ScheduledBodyNodeClass.Signature);
	if (signature)
	{
		Dom.addClass(signature, `${SignatureSelectionClassPrefix}${state.selectedSignatureId ?? 'none'}`);
	}

	return holder.innerHTML;
}

function markBodyNode(body: DocumentFragment, nodeId: string, markerClass: string): Element | null
{
	const node = [...body.children].find((child: Element): boolean => child.id === nodeId);
	if (!node)
	{
		return null;
	}

	Dom.addClass(node, markerClass);

	return node;
}

/**
 * The saved body already carries the blocks of the form, but under the identifiers of the form instance that
 * wrote them: every instance suffixes them anew (`buildBodyNodeIds`). Left as they are, the signature block
 * of this form finds no signature in the body and writes a second one, and every edit adds one more. The
 * blocks are taken over here, before any part of the form has read the body, so the picker starts on the
 * signature the letter really carries rather than on the default one.
 */
export function restoreScheduledBody(params: RestoreScheduledBodyParams): void
{
	const { editor, state } = params;
	if (state.scheduledMessage.id <= 0)
	{
		return;
	}

	const body = document.createElement('template');
	body.innerHTML = state.body.content;

	const signature = adoptBodyNode(
		body.content,
		BodyNodePrefix.Signature,
		editor.bodyNodes.signature,
		ScheduledBodyNodeClass.Signature,
	);
	adoptBodyNode(body.content, BodyNodePrefix.Quote, editor.bodyNodes.quote, ScheduledBodyNodeClass.Quote);
	const signatureId = signature === null ? null : resolveSignatureId(signature, state);
	if (signature !== null && signatureId === null)
	{
		// Nothing names this block, so the form stops calling it a signature and leaves it as the text it
		// is: a picker that stands for a block it cannot name would offer to remove text it never wrote.
		signature.removeAttribute('id');
	}
	state.selectedSignatureId = signatureId;
	state.body.content = body.innerHTML;
}

/**
 * Only a block of the body itself is taken over: the quoted letter inside it carries identifiers of its own,
 * which the sanitizer of an incoming message keeps. A body saved by the form that wrote a second signature
 * holds the original first, so the copies behind it go. The identifier is still read for a letter scheduled
 * before the marks existed: its body was kept as the form wrote it.
 */
function adoptBodyNode(
	body: DocumentFragment,
	prefix: string,
	currentId: string,
	markerClass: string,
): Element | null
{
	const [node, ...duplicates] = [...body.children].filter((child: Element): boolean => (
		Dom.hasClass(child, markerClass) || child.id === prefix || child.id.startsWith(`${prefix}-`)
	));
	if (!node)
	{
		return null;
	}

	node.id = currentId;
	takeClass(node, markerClass);
	duplicates.forEach((duplicate: Element): void => duplicate.remove());

	return node;
}

function resolveSignatureId(node: Element, state: ComposeState): number | null
{
	const marked = takeSelectionMark(node);

	return Type.isUndefined(marked) ? matchSignatureByText(node, state) : marked;
}

/** `undefined` when the body carries no mark at all, which is what a letter scheduled earlier looks like. */
function takeSelectionMark(node: Element): number | null | undefined
{
	const selectionClass = [...node.classList]
		.find((className: string): boolean => className.startsWith(SignatureSelectionClassPrefix));
	if (!selectionClass)
	{
		return undefined;
	}

	takeClass(node, selectionClass);

	const signatureId = Number(selectionClass.slice(SignatureSelectionClassPrefix.length));

	return Number.isInteger(signatureId) && signatureId > 0 ? signatureId : null;
}

/** The marks of the form leave no trace behind them: an emptied attribute would travel on in the body. */
function takeClass(node: Element, className: string): void
{
	Dom.removeClass(node, className);
	if ((node.getAttribute('class') ?? '').trim() === '')
	{
		node.removeAttribute('class');
	}
}

/**
 * A letter scheduled before the mark existed leaves nothing but the signature itself to go by, so the picker
 * looks for the signature whose text the body shows.
 */
function matchSignatureByText(node: Element, state: ComposeState): number | null
{
	const sender = getSelectedSender(state);
	const text = normalizeSignatureText(node.textContent ?? '');
	if (!sender || text === '')
	{
		return null;
	}

	return collectSignatures(state.signatures.bySender, sender)
		.find((item: SignatureItem): boolean => (
			item.full !== '' && normalizeSignatureText(toPlainText(item.full)) === text
		))
		?.signatureId ?? null;
}

/** Parsed rather than stripped by pattern: the signature is rich HTML built by the module. */
function toPlainText(html: string): string
{
	const holder = document.createElement('template');
	holder.innerHTML = html;

	return holder.content.textContent ?? '';
}

/**
 * The two-dash line the block opens with belongs to the form and not to the signature, and the editor rewraps
 * the markup it serialises, so neither dashes nor spacing take part in the comparison.
 */
function normalizeSignatureText(value: string): string
{
	return value.replaceAll(/[\s-]+/g, '').toLowerCase();
}
