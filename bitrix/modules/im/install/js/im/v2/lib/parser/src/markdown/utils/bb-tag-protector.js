import {
	MARKDOWN_BB_TAG_PREFIX,
	MARKDOWN_CODE_SPAN_MASK_PREFIX,
	MARKDOWN_INLINE_CODE_SPAN_PATTERNS,
	MARKDOWN_PLACEHOLDER_SUFFIX,
} from '../const.js';

// BB-code tags that already carry a URL when the text reaches the converter: the server wraps
// every bare URL in [URL]...[/URL], and a reply quotes a message through MarkdownConverter.simplify,
// so the reply text arrives with ready [URL=...]...[/URL] / [img ...]...[/img] blocks. What must not
// be reparsed is the URL they carry: an emphasis run inside a destination (...*%2527*...) grows an
// [i] tag INSIDE the tag and tears it apart, which is what dropped the beginning of the URL in a
// quoted metrika link.
//
// Five places encode "the server wraps a URL in [URL]...[/URL]", each with a DIFFERENT rule, on
// purpose: this file rejects a ready block anywhere in the text; link-boundary-scanner.js reads the
// tags as zero-width tokens inside a destination; stripUrlBBWrapper (inline-rules.js) strips a pair
// only when it wraps the destination whole; on the render side ParserUrl (functions/url.js) makes an
// anchor and ParserImage (functions/image.js) takes the wrapper off a src. Changing one of them does
// not change the rest - walk the list before assuming otherwise.
//
// These two forms hold the URL as their CONTENT, so the whole block is stored as one unit. Either
// may wrap the other ([img size=small][url]src[/url][/img] and [URL][img]src[/img][/URL]), which is
// what #addTag has to expand for.
const BB_URL_CONTENT_PATTERNS = [
	/\[img(?:\s[^\][\n]*)?](?:(?!\[img)[\s\S])*?\[\/img]/gi,
	/\[URL](?:(?!\[URL)[\s\S])*?\[\/URL]/gi,
];

// [URL=...]text[/URL] holds the URL in its ATTRIBUTE, and `text` is the visible link text: ordinary
// Markdown that the inline rules must still convert ([URL=x]**bold**[/URL] stays bold). Only the
// opening and closing tags are stored, the text between them is left in place. An opener with no
// closer is not a tag pair and goes to the ordinary rules, as before.
//
// `[\s\S]` and not `.`: the text of such a tag may span lines (validateLabel does not stop at a
// newline, so simplify can build one), and the attribute of a two-line tag needs the same
// protection as a one-line one. Linearity does not rest on that stop: the `(?!\[opener)` guard of
// every pattern bounds its lazy scan at the next same-tag opener.
//
// The attribute admits a bracketed query parameter ("?a[0]=x", the form ParserUrl reassembles
// on render) as one balanced [...] group per '[': a group is bounded by its own ']' and may not
// open a tag, so an unclosed '[' still fails the opener where it stands and a run of malformed
// openers stays O(n) instead of rescanning the tail from every one of them.
const BB_URL_ATTRIBUTE_PATTERN = /(\[URL=(?:[^\][\n]|\[(?!\/?URL)[^\][\n]*])*])((?:(?!\[URL)[\s\S])*?)(\[\/URL])/gi;

// A tag that opens a Markdown destination is left alone: applyLink unwraps such a
// [URL]...[/URL] (stripUrlBBWrapper) and hands the bare destination to UrlProtector, so
// protecting it here would nail the wrapper into the href instead.
const DESTINATION_PREFIX = '](';

function opensDestination(source: string, offset: number): boolean
{
	return source.startsWith(DESTINATION_PREFIX, offset - DESTINATION_PREFIX.length);
}

export class BbTagProtector
{
	#tags = [];
	#spans = [];
	#nonce = '';
	#pattern: RegExp;
	#probePattern: RegExp;
	#maskPattern: RegExp;

	// Placeholder: ####MD_BBTAG_<nonce>_<index>####. Why it carries a nonce - utils/nonce.js.
	constructor(nonce: string = '')
	{
		this.#nonce = nonce;
		const placeholder = `${MARKDOWN_BB_TAG_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		this.#pattern = new RegExp(placeholder, 'g');
		// Non-global twin for containsPlaceholder: .test() on the global pattern would carry
		// lastIndex from call to call and start skipping matches.
		this.#probePattern = new RegExp(placeholder);
		this.#maskPattern = new RegExp(
			`${MARKDOWN_CODE_SPAN_MASK_PREFIX}${nonce}-(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`,
			'g',
		);
	}

	// A tag typed inside an inline code span is code, not a tag: the span is stored later, by
	// protectInlineCode, which would find the pair already replaced and put it back live inside
	// the [icode]. The spans are masked for the length of the scan (the offsets opensDestination
	// reads are taken on the same masked text) and lifted from the result and the stored tags.
	// Accepted boundary: spans are read on the raw text of the whole message, while protectInlineCode
	// reads a cell or item after EscapeHandler, so unpaired backticks around a wrapped address
	// (neighbouring cells, an escaped backtick before the tag) can close a span here and not there.
	protect(text: string): string
	{
		this.#tags = [];

		let masked = this.#maskCodeSpans(text);

		for (const pattern of BB_URL_CONTENT_PATTERNS)
		{
			masked = masked.replaceAll(pattern, (match, offset, source) => {
				if (opensDestination(source, offset))
				{
					return match;
				}

				return this.#addTag(match);
			});
		}

		masked = masked.replaceAll(
			BB_URL_ATTRIBUTE_PATTERN,
			(match, opener, linkText, closer, offset, source) => {
				if (opensDestination(source, offset))
				{
					return match;
				}

				return `${this.#addTag(opener)}${linkText}${this.#addTag(closer)}`;
			},
		);

		return this.#unmaskCodeSpans(masked);
	}

	restore(text: string): string
	{
		const result = this.#expand(text);

		this.#tags = [];

		return result;
	}

	// Whether a fragment carries a tag this instance is holding. The full placeholder format
	// with the per-render nonce is compared, never a bare "MD_BBTAG" substring, so a literal
	// marker the sender typed is not taken for a protected tag (same rule as #expand).
	// The link/image rules use it to reject a label built around a hidden tag.
	containsPlaceholder(text: string): boolean
	{
		return this.#tags.length > 0 && this.#probePattern.test(text);
	}

	// The value is expanded before it is stored: a tag matched later may hold the placeholder of
	// one matched earlier (nesting of the two content forms), and a stored value that still
	// carried a placeholder would never be expanded by the single-pass restore.
	#addTag(tag: string): string
	{
		const index = this.#tags.length;
		this.#tags.push(this.#expand(tag));

		return `${MARKDOWN_BB_TAG_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
	}

	#expand(text: string): string
	{
		if (this.#tags.length === 0)
		{
			return text;
		}

		const tags = this.#tags;

		return text.replaceAll(
			this.#pattern,
			(match, index) => {
				const tag = tags[Number(index)];

				// Unknown index = a marker the sender typed, not one we stored (utils/nonce.js).
				return tag === undefined ? match : tag;
			},
		);
	}

	// Mask: ####MDSPAN<nonce>-<index>#### (const.js). The masked span is stored expanded, as
	// #addTag does with a tag: the patterns run longest fence first, so a shorter fence handled
	// later can wrap the mask of a longer one (``a ```b``` c``), and a single pass lifts only the
	// outer mask.
	#maskCodeSpans(text: string): string
	{
		this.#spans = [];

		if (!text.includes('`'))
		{
			return text;
		}

		let masked = text;
		for (const pattern of MARKDOWN_INLINE_CODE_SPAN_PATTERNS)
		{
			masked = masked.replaceAll(pattern, (span) => {
				const index = this.#spans.length;
				this.#spans.push(this.#unmask(span));

				return `${MARKDOWN_CODE_SPAN_MASK_PREFIX}${this.#nonce}-${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			});
		}

		return masked;
	}

	// The content patterns store a block whole, a span inside it included, so the stored tags
	// are unmasked along with the text.
	#unmaskCodeSpans(text: string): string
	{
		if (this.#spans.length === 0)
		{
			return text;
		}

		this.#tags = this.#tags.map((tag) => this.#unmask(tag));
		const result = this.#unmask(text);
		this.#spans = [];

		return result;
	}

	#unmask(text: string): string
	{
		if (this.#spans.length === 0)
		{
			return text;
		}

		const spans = this.#spans;

		return text.replaceAll(this.#maskPattern, (match, index) => spans[Number(index)] ?? match);
	}
}
