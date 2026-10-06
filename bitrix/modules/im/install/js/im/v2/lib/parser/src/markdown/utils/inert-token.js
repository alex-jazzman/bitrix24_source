/**
 * Encode a value into a token whose alphabet is restricted to the
 * Markdown-/Text.encode-inert set `[A-Za-z0-9.%-]`.
 *
 * `encodeURIComponent` already removes `< > & " '` and newlines, but leaves a few
 * Markdown-significant characters raw (`! ' ( ) * _ ~`); those are percent-escaped
 * too, so the token cannot be re-parsed by the inline/block rules that run after
 * it, nor broken by Text.encode or the `[img …]` delimiters.
 * `decodeURIComponent` restores the original value on render.
 *
 * Single source of truth for the inert-token alphabet, used by the image alt
 * token (inline-rules.js).
 *
 * @param {string} value
 * @returns {string}
 */
export function toMarkdownInertToken(value: string): string
{
	return encodeURIComponent(value).replaceAll(
		/[!'()*_~]/g,
		(char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}
