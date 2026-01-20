/**
 * @module im/messenger/provider/services/chat/input-action-notify
 */
jn.define('im/messenger/provider/services/chat/input-action-notify', (require, exports, module) => {
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { RestMethod, UserInputAction } = require('im/messenger/const');
	const { Logger } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class InputActionNotifyService
	 */
	class InputActionNotifyService
	{
		/**
		 * @param {string} dialogId
		 * @param {string} type
		 * @return {Promise}
		 */
		async notify(dialogId, type = UserInputAction.writing)
		{
			if (!this.#isValidDialogId(dialogId))
			{
				return Promise.reject();
			}
			const data = {
				dialogId,
				type,
			};

			return runAction(RestMethod.imV2ChatInputActionNotify, { data })
				.then((result) => {
					Logger.log(`${this.constructor.name}.notify`, result);

					return result;
				})
				.catch((err) => Logger.error(`${this.constructor.name}.notify`, err));
		}

		#isValidDialogId(dialogId)
		{
			if (!dialogId)
			{
				Logger.error(`${this.constructor.name}: options.dialogId is required.`);

				return false;
			}

			if (!DialogHelper.isDialogId(dialogId) && !DialogHelper.isChatId(dialogId))
			{
				Logger.error(`${this.constructor.name}: options.dialogId is invalid.`);

				return false;
			}

			return true;
		}
	}

	module.exports = { InputActionNotifyService };
});
