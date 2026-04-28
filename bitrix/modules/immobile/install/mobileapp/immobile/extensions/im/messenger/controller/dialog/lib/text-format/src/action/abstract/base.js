/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/abstract/base
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/abstract/base', (require, exports, module) => {
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	/**
	 * @abstract
	 * @class BaseAction
	 * Abstract base class for text formatting actions
	 */
	class BaseAction
	{
		/**
		 * @param {string} id
		 * @param {string} title
		 */
		constructor(id, title)
		{
			if (this.constructor === BaseAction)
			{
				throw new Error('BaseAction is abstract and cannot be instantiated');
			}

			this.id = id;
			this.title = title;
			this.logger = getLoggerWithContext('dialog--text-format', this);
		}

		/**
		 * @returns {{id: string, title: string}}
		 */
		getConfig()
		{
			return {
				id: this.id,
				title: this.title,
			};
		}

		/**
		 * @abstract
		 * @returns {string}
		 */
		getBBCode()
		{
			throw new Error('getBBCode() must be implemented');
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
			throw new Error('execute() must be implemented');
		}

		/**
		 * @protected
		 * @param {DialogId} dialogId
		 */
		sendAnalytics(dialogId)
		{
			if (!dialogId)
			{
				this.logger.warn('sendAnalytics: dialogId is not provided');

				return;
			}

			AnalyticsService.getInstance().sendUseTextFormatting(dialogId, this.id);
		}
	}

	module.exports = { BaseAction };
});
