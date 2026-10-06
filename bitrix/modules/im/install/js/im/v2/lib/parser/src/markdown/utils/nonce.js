/**
 * A per-render, unpredictable token mixed into every Markdown protector placeholder
 * (####MD_CODE_<nonce>_N####, ####MD_INLINE_<nonce>_N####, ####MD_TABLEGUARD_<nonce>_N####).
 *
 * Without it the placeholder format is guessable, so a sender could paste many literal
 * copies of a placeholder plus one real [code] / `inline` / [table] and have the single
 * stored block replicated into every copy on restore — a client-side memory/DOM
 * amplification DoS that re-triggers on every render for every recipient. With a random
 * nonce the sender cannot predict the recipient's placeholder, so restore only ever expands
 * the placeholders the protector actually created. Mirrors NestedTagHandler.getNonce().
 *
 * Not a secret — Math.random is enough to be unguessable by a remote sender. The base-36
 * alphabet is [a-z0-9] (matched generically by MARKDOWN_CODE_PATTERN); the 'n' fallback
 * keeps the placeholder well-formed on the astronomically rare empty slice.
 *
 * @returns {string}
 */
export function createMarkdownNonce(): string
{
	return Math.random().toString(36).slice(2, 12) || 'n';
}
