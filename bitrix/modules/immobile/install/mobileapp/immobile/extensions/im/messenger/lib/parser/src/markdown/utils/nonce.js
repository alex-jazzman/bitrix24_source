/**
 * @module im/messenger/lib/parser/markdown/utils/nonce
 */
jn.define('im/messenger/lib/parser/markdown/utils/nonce', (require, exports, module) => {
	const { Random } = require('utils/random');

	const NONCE_LENGTH = 10;

	/**
	 * A per-render, unpredictable token mixed into a Markdown placeholder marker so a sender
	 * cannot type a literal copy of the marker and have a stored block replicated into it on
	 * restore - a client-side amplification DoS that re-triggers on every render. With a random
	 * nonce the sender cannot predict the marker, so restore only expands markers the producer
	 * actually created. Mirrors the web parser's createMarkdownNonce and MentionProtector.
	 *
	 * Not a secret - a pseudo-random string is enough to be unguessable by a remote sender.
	 * Random.getString yields a fixed-length base-36 string ([a-z0-9]), so the marker is always
	 * well-formed and carries no regex metacharacter for the consumers that embed it in a pattern.
	 *
	 * @returns {string}
	 */
	function createMarkdownNonce()
	{
		return Random.getString(NONCE_LENGTH);
	}

	module.exports = {
		createMarkdownNonce,
	};
});
