import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { type BodyState } from '../../model/compose/types';

/** Stands in for a quote with no text. */
const EmptyLine = '<br>';

/**
 * The identifier must sit on this node and not on a wrapper around it, otherwise the signature, which is
 * inserted before the quote, lands inside the wrapper. It belongs to the instance of the form and comes from
 * the adapter of the editor. The quote goes in as markup: it keeps the formatting of the original message and
 * the `bxacid:<id>` marks of its inline images, which the form never rewrites.
 */
function renderQuoteNode(editor: ComposeEditorAdapter, body: BodyState): string
{
	return `<div id="${editor.bodyNodes.quote}">${body.quote === '' ? EmptyLine : body.quote}</div>`;
}

/** A folded quote goes in when the user unfolds it, and otherwise at the moment of sending. */
export function buildInitialBody(editor: ComposeEditorAdapter, body: BodyState): string
{
	if (body.quoteFolded || body.quote === '')
	{
		return '';
	}

	return renderQuoteNode(editor, body);
}

/** The quote goes after the signature, so the order of the parts matches a folded send. */
export function buildUnfoldedBody(editor: ComposeEditorAdapter, body: BodyState): string
{
	return editor.getBody() + renderQuoteNode(editor, body);
}

/**
 * A folded quote is sent all the same, serialised by the parser of the editor. `null` means the parser
 * did not answer: the editor is gone from the page, so the body of the message cannot be assembled and the
 * send has nothing to carry.
 */
export function buildMessageBody(editor: ComposeEditorAdapter, body: BodyState): string | null
{
	const content = editor.getBody();
	if (!body.quoteFolded)
	{
		return content;
	}

	const quote = editor.parseQuote(renderQuoteNode(editor, body));

	return quote === null ? null : content + quote;
}
