/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/context
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/context', (require, exports, module) => {
	const {
		escapeRegex,
		buildOpenTag,
		buildCloseTag,
	} = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/utils');

	/**
	 * @class BBCodeContext
	 */
	class BBCodeContext
	{
		/**
		 * @param {string} fullText
		 * @param {string} bbCode
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {string|null} param
		 */
		constructor(fullText, bbCode, startIndex, endIndex, param = null)
		{
			if (startIndex < 0)
			{
				throw new Error(`Invalid startIndex: ${startIndex}. Must be >= 0`);
			}

			if (endIndex < startIndex)
			{
				throw new Error(`Invalid endIndex: ${endIndex}. Must be >= startIndex (${startIndex})`);
			}

			if (endIndex > fullText.length)
			{
				throw new Error(`Invalid endIndex: ${endIndex}. Must be <= text length (${fullText.length})`);
			}

			this.fullText = fullText;
			this.bbCode = bbCode;
			this.startIndex = startIndex;
			this.endIndex = endIndex;
			this.param = param;
			this.selectedText = fullText.slice(startIndex, endIndex);
			this.escapedBBCode = escapeRegex(bbCode);
		}

		/**
		 * @returns {string}
		 */
		getTextBefore()
		{
			return this.fullText.slice(0, this.startIndex);
		}

		/**
		 * @returns {string}
		 */
		getTextAfter()
		{
			return this.fullText.slice(this.endIndex);
		}

		/**
		 * @param {string} newSelection
		 * @returns {string}
		 */
		replaceSelection(newSelection)
		{
			return this.fullText.slice(0, this.startIndex) + newSelection + this.fullText.slice(this.endIndex);
		}

		/**
		 * @param {string} newText
		 * @param {number} newStart
		 * @param {number} newEnd
		 * @returns {{newText: string, newStart: number, newEnd: number}}
		 */
		createResult(newText, newStart, newEnd)
		{
			return { newText, newStart, newEnd };
		}

		/**
		 * @returns {{newText: string, newStart: number, newEnd: number}}
		 */
		noChange()
		{
			return this.createResult(this.fullText, this.startIndex, this.endIndex);
		}

		/**
		 * Gets the opening BB-code tag for this context
		 * @returns {string}
		 */
		getOpenTag()
		{
			return buildOpenTag(this.bbCode, this.param);
		}

		/**
		 * Gets the closing BB-code tag for this context
		 * @returns {string}
		 */
		getCloseTag()
		{
			return buildCloseTag(this.bbCode);
		}
	}

	module.exports = { BBCodeContext };
});
