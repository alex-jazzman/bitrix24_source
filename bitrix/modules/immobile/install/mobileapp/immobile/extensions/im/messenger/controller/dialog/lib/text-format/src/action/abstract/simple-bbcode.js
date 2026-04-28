/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/abstract/simple-bbcode', (require, exports, module) => {
	const { BaseAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/base');

	/**
	 * @class SimpleBBCodeAction
	 * Simple action that wraps text with BB-code
	 */
	class SimpleBBCodeAction extends BaseAction
	{
		/**
		 * @param {string} id
		 * @param {string} title
		 * @param {string} bbCode
		 */
		constructor(id, title, bbCode)
		{
			super(id, title);
			this.bbCode = bbCode;
		}

		/**
		 * @returns {string}
		 */
		getBBCode()
		{
			return this.bbCode;
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} text
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {Function} applyFormat
		 */
		execute(dialogId, text, startIndex, endIndex, applyFormat)
		{
			this.sendAnalytics(dialogId);
			applyFormat(text, this.bbCode, startIndex, endIndex);
		}
	}

	module.exports = { SimpleBBCodeAction };
});
