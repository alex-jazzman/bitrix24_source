import { Dom } from 'main.core';

const SOURCE_REGEX = /\[source=(?<sourceId>\d+)](?<sourceText>.*?)\[\/source]/gi;

const CONTAINER_CLASS = 'bx-im-message-source-item__container --ui-hoverable';
const ELLIPSIS_CLASS = '--ellipsis';

export const ParserInlineSourceLink = {

	/**
	 * Replace each [source=N]...[/source] token with an inline source badge
	 * carrying data-source-id. Input MUST be the output of Parser.decodeText /
	 * decodeInlineText (already Text.encode'd HTML), so the token body is inlined
	 * as-is: re-encoding here would double-escape it and break in-badge formatting.
	 * Links inside the token body are flattened to their content: the badge itself
	 * is the single click target (opens the source URL), so a nested <a> would
	 * trigger a second navigation on the same click.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	decode(text: string): string
	{
		return text.replace(SOURCE_REGEX, (whole, sourceId, sourceText) => {
			const inner = Dom.create({
				tag: 'span',
				attrs: { className: ELLIPSIS_CLASS },
				html: sourceText,
			});

			inner.querySelectorAll('a').forEach((anchor) => anchor.replaceWith(...anchor.childNodes));

			return Dom.create({
				tag: 'span',
				attrs: {
					className: CONTAINER_CLASS,
					'data-source-id': sourceId,
					'data-testid': 'im-message-source-item',
				},
				html: inner.outerHTML,
			}).outerHTML;
		});
	},
};
