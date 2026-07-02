/**
 * @module im/messenger/application/lib/dialog-manager/src/nested-strategy/base
 */
jn.define('im/messenger/application/lib/dialog-manager/src/nested-strategy/base', (require, exports, module) => {
	/**
	 * @abstract
	 * @class BaseNestedStrategy
	 */
	class BaseNestedStrategy
	{
		/**
		 * @param {DialogHelper} dialogHelper
		 * @return {boolean}
		 */
		shouldApply(dialogHelper)
		{
			throw new Error('BaseNestedStrategy: shouldApply must be implemented');
		}

		/**
		 * @param {DialogHelper} dialogHelper
		 * @return {Promise<void>}
		 */
		async execute(dialogHelper)
		{
			throw new Error('BaseNestedStrategy: execute must be implemented');
		}
	}

	module.exports = { BaseNestedStrategy };
});
