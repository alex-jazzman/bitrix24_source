import { ESCAPABLE_CHARS, MAX_URL_SCAN_LENGTH } from '../const.js';

// Finds where the destination of a Markdown link / image ends, starting right after the "]("
// prefix. Replaces the destination group of the old LINK_PATTERN/IMAGE_PATTERN regexes, which
// only knew one level of balanced parens and kept the <...> wrapper in the href.
//
// The grammar is normative, not a local implementation choice: the mobile copy of the parser still
// runs the old regex and is to be ported to this one verbatim (separate task), so a divergence is a
// parity defect. It is written down in
// im/.ai/knowledge-base/notes/features/markdown-link-boundary-grammar.md and pinned by the
// "link boundary" / "server [URL] wrapper" describe blocks of test/functions/markdown.test.js -
// those two are checked, this comment is not, so they win on any disagreement.
//
// Anything the grammar rejects means "this is not a link": the caller falls back to plain text.
// `resume` is how far the scan got; the caller re-enters the region behind it only within its
// re-read budget (see replaceLinkLike), or a run of "](" turns the pass quadratic.
type LinkDestinationScan = {
	href?: string,
	titleDropped?: boolean,
	end?: number,
	fail?: boolean,
	resume?: number,
};

// The tags of the server wrapper as the source spells them, empty until each is met (an empty
// openTag means the destination is not wrapped at all).
type ServerWrapper = {
	openTag: string,
	closeTag: string,
};

type WrapperStep = {
	next: number,
	wrapper: ServerWrapper,
};

// A step of the destination loop also yields what the href takes from it - one literal character
// for an escape pair, nothing for the zero-width tags of the wrapper.
type DestinationStep = {
	char: string,
	next: number,
	wrapper: ServerWrapper,
};

// The stop class of the plain form is the \s of the old regex (space, tab, NBSP, Unicode
// spaces) - property escapes are avoided on purpose, the Android runtime of the port has none.
const WHITESPACE_PATTERN = /\s/;

// The server rewrites a bare url standing inside "(...)" into a BB anchor, cutting it at the
// FIRST ')' and pulling an optional title along: "[t](url "hint")" comes back from Im\Text::parse
// as "[t]([URL]url "hint"[/URL])", and "[t](a/(b))" as "[t]([URL]a/(b[/URL]))" - the wrapper covers
// a prefix of the destination and its tail stands outside. Both tags are therefore read as
// zero-width tokens: the scan steps over them and grades the characters around the cut as one
// stream, which is what makes parens, escaping and titles survive the echo. An opener with no
// closer before the ')' is as broken as an unclosed title - the fragment stays plain text.
const URL_TAG_OPEN = '[url]';
const URL_TAG_CLOSE = '[/url]';

// What a title may stand behind: an address the renderer really turns into an anchor. ParserUrl
// hands the destination to getUtils().text.checkUrl, which takes a leading '/' or one of the
// schemes below - compared with startsWith, so the case matters there as it does here - and
// nothing else, "www." included. Converting a fragment the renderer will not link ("[t](literally
// "a quote")") drops its tail from the message instead of linking it. The list is copied and not
// called on purpose: the scan keeps no runtime dependency of its own, so the port can take it as
// it stands.
const URL_LIKE_PATTERN = /^(?:\/|https?:|ftp:|file:|tel:|callto:|mailto:|skype:|viber:)/;

/**
 * @param {string} text
 * @param {number} openPos - first character after "]("
 * @return {LinkDestinationScan}
 */
export function scanLinkDestination(text: string, openPos: number): LinkDestinationScan
{
	if (text[openPos] === '<')
	{
		return scanAngle(text, openPos + 1, openPos);
	}

	return scanPlain(text, openPos);
}

/**
 * The plain form: parens of any depth, closed by the ')' that brings the depth back to zero or
 * handed over to the title scan by the first whitespace. The tags of the server wrapper are
 * stepped over wherever they stand (see URL_TAG_OPEN).
 *
 * @param {string} text
 * @param {number} openPos
 * @return {LinkDestinationScan}
 */
function scanPlain(text: string, openPos: number): LinkDestinationScan
{
	let wrapper = openWrapper(text, openPos);
	let i = openPos + wrapper.openTag.length;
	let depth = 0;
	let href = '';

	while (i < text.length)
	{
		if (exceedsScanLimit(i, openPos))
		{
			return fail(i);
		}

		const step = readTransparentStep(text, i, wrapper);
		if (step !== null)
		{
			href += step.char;
			i = step.next;
			wrapper = step.wrapper;
			continue;
		}

		const char = text[i];

		if (char === '\n')
		{
			return fail(i);
		}

		if (WHITESPACE_PATTERN.test(char))
		{
			// An open '(' can no longer balance once the destination has ended - not a link,
			// like the newline above (the old regex required balanced parens here too).
			if (depth > 0)
			{
				return fail(i);
			}

			return endDestinationAtSpace(text, i, href, openPos, wrapper);
		}

		if (char === ')' && depth === 0)
		{
			return closeDestination(href, i, wrapper);
		}

		depth = nextParenDepth(char, depth);
		href += char;
		i += 1;
	}

	return fail(i);
}

/**
 * @param {string} text
 * @param {number} spacePos
 * @param {string} href
 * @param {number} openPos
 * @param {ServerWrapper} wrapper
 * @return {LinkDestinationScan}
 */
function endDestinationAtSpace(
	text: string,
	spacePos: number,
	href: string,
	openPos: number,
	wrapper: ServerWrapper,
): LinkDestinationScan
{
	// A title with no destination in front of it ("[t]( \"x\")") is not a link.
	if (href === '')
	{
		return fail(spacePos);
	}

	return scanTitleThenClose(text, spacePos, href, openPos, wrapper);
}

/**
 * The ')' that brings the paren depth back to zero ends the plain form - unless the wrapper the
 * server opened has not been closed before it: an opener with no closer is as broken as an
 * unclosed title, and the fragment carrying it stays plain text.
 *
 * @param {string} href
 * @param {number} closePos
 * @param {ServerWrapper} wrapper
 * @return {LinkDestinationScan}
 */
function closeDestination(href: string, closePos: number, wrapper: ServerWrapper): LinkDestinationScan
{
	if (isWrapperPending(wrapper))
	{
		return fail(closePos);
	}

	return { href: restoreWrapper(wrapper, href), titleDropped: false, end: closePos };
}

/**
 * @return {number} the paren depth after `char`; the ')' that closes the destination is taken by
 *   the caller and never reaches here
 */
function nextParenDepth(char: string, depth: number): number
{
	if (char === '(')
	{
		return depth + 1;
	}

	return char === ')' ? depth - 1 : depth;
}

/**
 * The <...> form: an explicit wrapper that lets a destination carry spaces.
 *
 * @param {string} text
 * @param {number} start - first character after '<'
 * @param {number} openPos
 * @return {LinkDestinationScan}
 */
function scanAngle(text: string, start: number, openPos: number): LinkDestinationScan
{
	// Im\Text::parse leaves the <...> form alone, so a "[url]" written inside it is the sender's
	// own text and takes no part in the scan: nothing is ever stepped over here, and the wrapper
	// comes back from readEscapePair the way it went in. The form survives because parse runs with
	// allow['HTML'] = 'Y' - '<' is never escaped to "&lt;", so the "&lt;"..."&gt;" boundary pair
	// (textparser.php:450) never fires, and the general autolink pattern (textparser.php:466) takes
	// only a wordSeparator character (textparser.php:102) before the scheme.
	const wrapper = noWrapper();
	let i = start;
	let href = '';

	while (i < text.length)
	{
		if (exceedsScanLimit(i, openPos))
		{
			return fail(i);
		}

		const escape = readEscapePair(text, i, wrapper);
		if (escape !== null)
		{
			href += escape.char;
			i = escape.next;
			continue;
		}

		const char = text[i];

		if (char === '\n' || char === '<')
		{
			return fail(i);
		}

		if (char === '>')
		{
			// An empty wrapper ("[t](<>)") is an empty href, like the empty plain form.
			return scanTitleThenClose(text, i + 1, href, openPos, wrapper);
		}

		href += char;
		i += 1;
	}

	return fail(i);
}

/**
 * Tail of both forms: optional title in quotes, then the closing ')'. The title is only skipped -
 * it is never carried into the tag - and the server wrapper is stepped over here as well, since
 * the cut may fall anywhere between the destination and the ')'.
 *
 * @param {string} text
 * @param {number} start
 * @param {string} href
 * @param {number} openPos
 * @param {ServerWrapper} wrapper
 * @return {LinkDestinationScan}
 */
function scanTitleThenClose(
	text: string,
	start: number,
	href: string,
	openPos: number,
	wrapper: ServerWrapper,
): LinkDestinationScan
{
	let tail = skipTail(text, start, openPos, wrapper);
	if (exceedsScanLimit(tail.next, openPos))
	{
		return fail(tail.next);
	}

	// A title, unlike a destination, is ordinary text: when the fragment turns out not to be a
	// link the caller has to re-read it from the opening quote, or a valid link standing inside
	// an unclosed title is lost with it. Resuming there keeps the pass linear - every retry
	// starts after the previous one, and a title scan ends at the next quote of the same kind.
	let resume = tail.next;

	if (text[tail.next] === '"' || text[tail.next] === "'")
	{
		resume = tail.next + 1;

		const title = skipQuotedTitle(text, tail.next, openPos, tail.wrapper);
		if (title === null)
		{
			return fail(resume);
		}

		if (!URL_LIKE_PATTERN.test(href))
		{
			return fail(resume);
		}

		tail = skipTail(text, title.next, openPos, title.wrapper);
		if (exceedsScanLimit(tail.next, openPos))
		{
			return fail(resume);
		}
	}

	// text[tail.next] is undefined at the end of the text - no ')', so not a link; neither is a
	// wrapper the server opened and never closed.
	if (text[tail.next] === ')' && !isWrapperPending(tail.wrapper))
	{
		return { href: restoreWrapper(tail.wrapper, href), titleDropped: true, end: tail.next };
	}

	return fail(resume);
}

/**
 * @param {string} text
 * @param {number} quotePos - index of the opening quote
 * @param {number} openPos
 * @param {ServerWrapper} wrapper
 * @return {?WrapperStep} `next` - first index after the closing quote; null when the title does
 *   not close on this line or the scan ceiling is reached
 */
function skipQuotedTitle(text: string, quotePos: number, openPos: number, wrapper: ServerWrapper): ?WrapperStep
{
	const quote = text[quotePos];
	let i = quotePos + 1;
	let current = wrapper;

	while (!exceedsScanLimit(i, openPos) && i < text.length && text[i] !== '\n')
	{
		const tag = readWrapperClose(text, i, current);
		if (tag !== null)
		{
			i = tag.next;
			current = tag.wrapper;
			continue;
		}

		const escape = readTitleEscapePair(text, i, quote, current);
		if (escape !== null)
		{
			i = escape.next;
			current = escape.wrapper;
			continue;
		}

		if (text[i] === quote)
		{
			return { next: i + 1, wrapper: current };
		}

		i += 1;
	}

	return null;
}

/**
 * An escaped quote of the same kind (and an escaped backslash) does not close the title. The pair
 * is read through the closing tag of the server wrapper the way readEscapePair reads it inside a
 * destination, or a cut falling between the backslash and the quote would close the title on a
 * quote the sender escaped.
 *
 * @return {?WrapperStep} `next` - first index after the pair
 */
function readTitleEscapePair(text: string, i: number, quote: string, wrapper: ServerWrapper): ?WrapperStep
{
	if (text[i] !== '\\')
	{
		return null;
	}

	const afterBackslash = readWrapperClose(text, i + 1, wrapper) ?? { next: i + 1, wrapper };
	const charPos = afterBackslash.next;

	if (text[charPos] !== quote && text[charPos] !== '\\')
	{
		return null;
	}

	return { next: charPos + 1, wrapper: afterBackslash.wrapper };
}

/**
 * Skips what may stand between the parts of the tail: spaces, tabs and the closing tag of the
 * server wrapper, in whatever order the cut left them.
 *
 * The space class here is NARROWER than the destination stop class: only space and tab, so an
 * NBSP between the destination and the title keeps the fragment plain text.
 *
 * @return {WrapperStep} `next` - first index of anything else; stops at the scan ceiling, which
 *   the caller re-checks
 */
function skipTail(text: string, start: number, openPos: number, wrapper: ServerWrapper): WrapperStep
{
	let i = start;
	let current = wrapper;

	while (!exceedsScanLimit(i, openPos))
	{
		if (text[i] === ' ' || text[i] === '\t')
		{
			i += 1;
			continue;
		}

		const tag = readWrapperClose(text, i, current);
		if (tag === null)
		{
			break;
		}

		i = tag.next;
		current = tag.wrapper;
	}

	return { next: i, wrapper: current };
}

function noWrapper(): ServerWrapper
{
	return { openTag: '', closeTag: '' };
}

/**
 * The server wrapper only ever opens the destination (Im\Text::parse rewrites the url standing
 * right after the "]("), so a "[url]" written anywhere else is the sender's own text and stays in
 * the href as such. The tag is kept as the source spells it, case included: what comes back has to
 * read as one wrapper to stripUrlBBWrapper and to the image renderer.
 *
 * @param {string} text
 * @param {number} openPos
 * @return {ServerWrapper}
 */
function openWrapper(text: string, openPos: number): ServerWrapper
{
	if (!matchesTag(text, openPos, URL_TAG_OPEN))
	{
		return noWrapper();
	}

	return { openTag: text.slice(openPos, openPos + URL_TAG_OPEN.length), closeTag: '' };
}

function isWrapperPending(wrapper: ServerWrapper): boolean
{
	return wrapper.openTag !== '' && wrapper.closeTag === '';
}

/**
 * Reads the closing tag of the server wrapper standing at `i`, keeping it as the source spells it.
 * The step is offered, not applied: the escape readers take it only once a real pair turns out to
 * stand behind the tag (readEscapePair, readTitleEscapePair).
 *
 * @return {?WrapperStep} null when no tag stands at `i` - the case every character of the
 *   destination goes through, so it costs no object of its own
 */
function readWrapperClose(text: string, i: number, wrapper: ServerWrapper): ?WrapperStep
{
	if (!isWrapperPending(wrapper) || !matchesTag(text, i, URL_TAG_CLOSE))
	{
		return null;
	}

	return {
		next: i + URL_TAG_CLOSE.length,
		wrapper: { openTag: wrapper.openTag, closeTag: text.slice(i, i + URL_TAG_CLOSE.length) },
	};
}

/**
 * The destination as the sender wrote it, with the wrapper put back around it whole. The rules
 * downstream keep the policy they have for a wrapper the server did not cut: applyLink unwraps it
 * (stripUrlBBWrapper), an image keeps it in the src (ParserImage.decodeImageBbCode takes it off).
 */
function restoreWrapper(wrapper: ServerWrapper, href: string): string
{
	return `${wrapper.openTag}${href}${wrapper.closeTag}`;
}

/**
 * The two things the destination loop reads without grading them: the closing tag of the server
 * wrapper, which is zero-width, and an escape pair, which stands for a single literal character.
 *
 * @return {?DestinationStep} null when the character at `i` is for the loop itself to grade
 */
function readTransparentStep(text: string, i: number, wrapper: ServerWrapper): ?DestinationStep
{
	const tag = readWrapperClose(text, i, wrapper);
	if (tag !== null)
	{
		return { char: '', next: tag.next, wrapper: tag.wrapper };
	}

	return readEscapePair(text, i, wrapper);
}

/**
 * The escape pair starting at `i`, or null when this backslash escapes nothing. The server may cut
 * the pair in two ("foo\[/URL])bar" for "foo\)bar"), so the closing tag standing between the
 * backslash and the character it escapes is looked past - and the step over it is taken only when
 * a real pair turns out to be there, which is why the tag travels back in the return value.
 *
 * @return {?DestinationStep} `next` - first index after the pair
 */
function readEscapePair(text: string, i: number, wrapper: ServerWrapper): ?DestinationStep
{
	if (text[i] !== '\\')
	{
		return null;
	}

	const afterBackslash = readWrapperClose(text, i + 1, wrapper) ?? { next: i + 1, wrapper };
	const charPos = afterBackslash.next;

	if (!ESCAPABLE_CHARS.includes(text[charPos]))
	{
		return null;
	}

	return { char: text[charPos], next: charPos + 1, wrapper: afterBackslash.wrapper };
}

/**
 * @param {string} text
 * @param {number} pos
 * @param {string} tag - lower-case tag to compare against; the source keeps its own case
 * @return {boolean}
 */
function matchesTag(text: string, pos: number, tag: string): boolean
{
	// The first character is compared before slicing: this runs on every step of the destination
	// loop, where a slice per character would be pure waste.
	return text[pos] === tag[0] && text.slice(pos, pos + tag.length).toLowerCase() === tag;
}

function exceedsScanLimit(i: number, openPos: number): boolean
{
	return (i - openPos) > MAX_URL_SCAN_LENGTH;
}

function fail(resume: number): LinkDestinationScan
{
	return { fail: true, resume };
}
