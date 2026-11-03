/**
 * @module im/messenger/lib/parser/markdown/utils/url-safety
 */
jn.define('im/messenger/lib/parser/markdown/utils/url-safety', (require, exports, module) => {
	// Schemes a Markdown link/image may carry into a [url]/[img] BB-code. Everything else
	// (javascript:, data:, file:, vbscript:, ...) is denied by default: neither the converter
	// nor the native tap handlers on iOS/Android validate the scheme, so an unsafe URL would
	// reach the native urlTap handler and execute (contract rev.3.1 sec. 5/7). The producer is
	// the only line of defense.
	const SAFE_URL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

	// Characters an address parser skips are removed before the scheme check, so an obfuscated
	// scheme such as "java\tscript:" or a leading zero-width space cannot slip past as a
	// schemeless (and therefore "safe") URL. trim() alone is not enough: it drops spaces, NBSP
	// and U+FEFF at the edges but leaves every other invisible character in place. Covered:
	// C0 controls and DEL, C1 controls, soft hyphen, Arabic letter mark, Mongolian vowel
	// separator, zero-width and bidi marks, line/paragraph separators, word joiner and the
	// invisible operators, bidi isolates and deprecated format characters, ZWNBSP.
	const IGNORED_CHARS_PATTERN = new RegExp(
		'[\\u0000-\\u001F\\u007F-\\u009F\\u00AD\\u061C\\u180E\\u200B-\\u200F'
		+ '\\u2028-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF]',
		'g',
	);
	const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

	// A numeric HTML reference is decoded by the html pass, which runs AFTER the URL rules, so a scheme
	// spelled with one is invisible to the check below: `javascript&#58;alert(1)` and
	// `&#106;avascript:alert(1)` both end up in the tag as a working javascript: URL, and `java&#9;script:`
	// grows the very tab the normalization above exists to remove. Only the numeric form is decoded here -
	// no named reference maps to a letter, a digit or ':' (html-rules NAMED_ENTITIES), so none can forge a
	// scheme. Both hex spellings are accepted, a touch wider than the html pass takes today, so the guard
	// does not hang on which one it happens to decode.
	const NUMERIC_REFERENCE_PATTERN = /&#([xX]?)([\dA-Fa-f]+);/g;
	// A backslash is not one of the characters the escape handler consumes, so `javascript\:alert(1)` keeps
	// it and the scheme pattern stops on it. Nothing downstream validates the scheme - the native BB-code
	// builders hand the value straight to the tap handler (iOS BBCodeBuilder, Android
	// UrlBBTagToSpanConverter) - so the obfuscation has to be undone here, before the allowlist is applied.
	const BACKSLASH_PATTERN = /\\/g;

	/**
	 * @param {string} value
	 * @returns {string}
	 */
	function decodeNumericReferences(value)
	{
		if (!value.includes('&#'))
		{
			return value;
		}

		return value.replace(NUMERIC_REFERENCE_PATTERN, (match, hexMarker, digits) => {
			const codePoint = parseInt(digits, hexMarker ? 16 : 10);
			// A reference the html pass leaves as text (NUL, out of range) stays text here too.
			if (!codePoint)
			{
				return match;
			}

			try
			{
				return String.fromCodePoint(codePoint);
			}
			catch
			{
				return match;
			}
		});
	}

	/**
	 * The address as the passes that run after the URL rules will spell it, for deciding the scheme and
	 * nothing else. The emitted value stays exactly the one the rules built - percent-encoding included -
	 * so normalization can only change WHETHER the tag is written, never what it carries.
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	function toSchemeProbe(url)
	{
		return decodeNumericReferences(url)
			.replace(BACKSLASH_PATTERN, '')
			.replace(IGNORED_CHARS_PATTERN, '')
			.trim();
	}

	/**
	 * Whether a URL is safe to emit into a [url=...]/[img] BB-code. Render-mode independent:
	 * an unsafe scheme is illegitimate in both canonical and fallback output.
	 * A schemeless URL (relative link / anchor) is treated as safe.
	 *
	 * @param {string} url
	 * @returns {boolean}
	 */
	function isSafeUrl(url)
	{
		const cleaned = String(url).replace(IGNORED_CHARS_PATTERN, '').trim();
		if (cleaned === '')
		{
			return false;
		}

		const probe = toSchemeProbe(cleaned);

		if (!SCHEME_PATTERN.test(probe))
		{
			return true;
		}

		const scheme = probe.slice(0, probe.indexOf(':')).toLowerCase();

		return SAFE_URL_SCHEMES.has(scheme);
	}

	module.exports = {
		isSafeUrl,
	};
});
