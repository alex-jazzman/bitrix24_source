const CLASS_HEADING = 'bx-im-message-heading';
const CLASS_RULE = 'bx-im-message-hr';

// Canonical block markers emitted by the Markdown block rules (markdown/rules/block-rules):
// H1/H2 headings ([h1]/[h2], ATX and setext) and horizontal rules ([hr]). decodeBlocks runs
// late in the decode chain — after Text.encode and the font/url/etc. decoders — so a heading's
// inline content (bold, links, …) is already HTML here; we only wrap it in a block element
// that CSS styles (parser.css). A heading and a rule are block elements with their own vertical
// margins, so every adjacent <br> is swallowed — the spacing comes from the margins, not breaks.
const HEADING_PATTERN = /(?:<br \/>)*\[(h[12])]([\s\S]*?)\[\/\1](?:<br \/>)*/gi;
const RULE_PATTERN = /(?:<br \/>)*\[hr](?:<br \/>)*/gi;

// Preview/notification/quote surfaces reach purify with the bare block markers ([h1]…[/h1],
// [hr]) — no surrounding <br> (those surfaces keep '\n', they don't run the <br> decoder).
const HEADING_PURIFY_PATTERN = /\[(h[12])]([\s\S]*?)\[\/\1]/gi;
const RULE_PURIFY_PATTERN = /\[hr]/gi;

export const ParserHeading = {

	/**
	 * Render canonical [h1]/[h2] block headings and [hr] horizontal rules (produced by the
	 * Markdown converter) into styled block elements. Single-line markers, so they survive
	 * Text.encode and the line/newline decoders untouched.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	decodeHeading(text: string): string
	{
		if (!/\[(?:h[12]|hr)]/i.test(text))
		{
			return text;
		}

		let result = text.replace(HEADING_PATTERN, (whole, tag, content, offset, full) => {
			const level = tag.toLowerCase();

			// Only the very first content of a message gets no top margin. A CSS :first-child
			// would be wrong here: a leading text node is not an element sibling, so a heading
			// that follows plain text would still match :first-child and lose its top margin.
			const isFirst = full.slice(0, offset).trim() === '';
			const firstClass = isFirst ? ` ${CLASS_HEADING}--first` : '';

			return `<div class="${CLASS_HEADING} ${CLASS_HEADING}--${level}${firstClass}">${content.trim()}</div>`;
		});

		result = result.replace(RULE_PATTERN, () => `<hr class="${CLASS_RULE}">`);

		return result;
	},

	/**
	 * Strip the block markers to plain text for preview/notification/quote surfaces (mirrors
	 * ParserFont.purify). Nothing else in the purify chain removes [h1]/[h2]/[hr], so without
	 * this they leak as raw BB-code. The [h1]/[h2] wrapper is unwrapped to its inner text (any
	 * inner inline BB like [b] is stripped afterwards by ParserFont.purify, so call this
	 * BEFORE it); [hr] becomes a single space so adjacent words don't glue together.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	purify(text: string): string
	{
		if (!/\[(?:h[12]|hr)]/i.test(text))
		{
			return text;
		}

		let result = text.replace(HEADING_PURIFY_PATTERN, (whole, tag, content) => content.trim());
		result = result.replace(RULE_PURIFY_PATTERN, ' ');

		return result;
	},
};
