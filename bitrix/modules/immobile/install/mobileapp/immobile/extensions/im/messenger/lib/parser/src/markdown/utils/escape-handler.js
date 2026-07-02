/**
 * @module im/messenger/lib/parser/markdown/utils/escape-handler
 */
jn.define('im/messenger/lib/parser/markdown/utils/escape-handler', (require, exports, module) => {
	const { MARKDOWN_ESCAPE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');
	const ESCAPE_PATTERN = /\\([!#()*+.>[\\\]_`{|}~\-])/g;

	class EscapeHandler
	{
		#escapes = [];

		protect(text)
		{
			this.#escapes = [];

			return text.replaceAll(ESCAPE_PATTERN, (match, char) => {
				const index = this.#escapes.length;
				this.#escapes.push(char);

				return `${MARKDOWN_ESCAPE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			});
		}

		restore(text)
		{
			if (this.#escapes.length === 0)
			{
				return text;
			}

			const escapes = this.#escapes;
			const result = text.replaceAll(
				/####MD_ESC_(\d+)####/g,
				(match, index) => escapes[Number(index)],
			);

			this.#escapes = [];

			return result;
		}
	}

	module.exports = {
		EscapeHandler,
	};
});
