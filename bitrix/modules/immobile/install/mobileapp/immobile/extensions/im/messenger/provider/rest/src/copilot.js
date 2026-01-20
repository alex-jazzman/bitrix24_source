/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/provider/rest/copilot
 */
jn.define('im/messenger/provider/rest/copilot', (require, exports, module) => {
	const { Type } = require('type');
	const { runAction } = require('im/messenger/lib/rest');
	const { RestMethod } = require('im/messenger/const');

	/**
	 * @class CopilotRest
	 */
	class CopilotRest
	{
		/**
		 * @desc changeRole
		 * @param {object} options
		 * @param {string} options.dialogId
		 * @param {string} options.roleCode
		 */
		changeRole(options = {})
		{
			if (!options.dialogId)
			{
				throw new Error('CopilotRest: options.dialogId is required.');
			}

			if (Type.isUndefined(options.roleCode))
			{
				throw new TypeError('CopilotRest: options.roleCode must be filled string value or Null.');
			}

			const data = {
				dialogId: options.dialogId,
				role: options.roleCode,
			};

			return runAction(RestMethod.imV2ChatCopilotUpdateRole, { data });
		}

		/**
		 * @desc changeEngine
		 * @param {object} options
		 * @param {string} options.dialogId
		 * @param {string} options.engineCode
		 */
		changeEngine(options = {})
		{
			if (!options.dialogId)
			{
				throw new Error('CopilotRest: options.dialogId is required.');
			}

			if (Type.isUndefined(options.engineCode))
			{
				throw new TypeError('CopilotRest: options.engineCode must be filled string value or Null.');
			}

			const data = {
				dialogId: options.dialogId,
				engineCode: options.engineCode,
			};

			return runAction(RestMethod.imV2ChatCopilotUpdateEngine, { data });
		}
	}

	module.exports = {
		CopilotRest,
	};
});
