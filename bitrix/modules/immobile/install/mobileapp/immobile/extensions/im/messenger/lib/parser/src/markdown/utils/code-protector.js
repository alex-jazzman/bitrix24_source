/**
 * @module im/messenger/lib/parser/markdown/utils/code-protector
 */
jn.define('im/messenger/lib/parser/markdown/utils/code-protector', (require, exports, module) => {
	const { MARKDOWN_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');

	const CODE_PLACEHOLDER_PATTERN = new RegExp(`${MARKDOWN_CODE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');

	class CodeProtector
	{
		#blocks = [];

		protect(text)
		{
			this.#blocks = [];

			// BBCode code blocks: [code]...[/code] — must be protected before markdown processing
			text = text.replaceAll(/\[code]([\s\S]*?)\[\/code]/gi, (match, code) => {
				return this.#addBlock(code);
			});

			// Fenced code blocks: ```lang\n...\n``` or ~~~lang\n...\n~~~
			text = text.replaceAll(/^(`{3,})([^\n]*)\n([\S\s]*?)^\1/gm, (match, fence, lang, code) => {
				return this.#addBlock(code);
			});

			text = text.replaceAll(/^(~{3,})([^\n]*)\n([\S\s]*?)^\1/gm, (match, fence, lang, code) => {
				return this.#addBlock(code);
			});

			// Indented code blocks: line starting with 4 spaces or tab, preceded by empty line
			text = text.replaceAll(/(^|\n)\n((?:(?: {4}|\t).+(?:\n|$))+)/g, (match, prefix, block) => {
				const code = block.replaceAll(/^(?: {4}|\t)/gm, '');

				return `${prefix}\n${this.#addBlock(code)}`;
			});

			return text;
		}

		restore(text)
		{
			if (this.#blocks.length === 0)
			{
				return text;
			}

			const blocks = this.#blocks;
			const result = text.replaceAll(
				CODE_PLACEHOLDER_PATTERN,
				(match, index) => `[code]${blocks[Number(index)]}[/code]`,
			);

			this.#blocks = [];

			return result;
		}

		#addBlock(code)
		{
			const index = this.#blocks.length;
			// Remove trailing newline from code content
			this.#blocks.push(code.replace(/\n$/, ''));

			return `${MARKDOWN_CODE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
	}

	module.exports = {
		CodeProtector,
	};
});
