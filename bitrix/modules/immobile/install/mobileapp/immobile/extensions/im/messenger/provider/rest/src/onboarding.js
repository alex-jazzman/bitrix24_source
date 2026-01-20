/**
 * @module im/messenger/provider/rest/src/onboarding
 */
jn.define('im/messenger/provider/rest/src/onboarding', (require, exports, module) => {
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class OnboardingRest
	 */
	class OnboardingRest
	{
		/**
		 * @param {number} chatId
		 * @returns {Promise<number|null>}
		 * @throws {Error}
		 */
		getMessagesAmountFromServer(chatId)
		{
			if (!chatId)
			{
				throw new Error('OnboardingRest: chatId is required.');
			}

			return runAction(RestMethod.mobileOnboardingGetMessagesAmountByChatId, {
				json: { chatId },
			});
		}

		/**
		 * @param {number} chatId
		 * @returns {Promise<number|null>}
		 * @throws {Error}
		 */
		getFilesQuantityByChatId(chatId)
		{
			if (!chatId)
			{
				throw new Error('OnboardingRest: chatId is required.');
			}

			return new Promise((resolve, reject) => {
				BX.rest.callMethod(
					RestMethod.imChatFileGet,
					{
						CHAT_ID: chatId,
						SUBTYPE: ['document', 'other'],
					},
				)
					.then((response) => {
						if (response.error() || response.status !== 200)
						{
							console.error('Onboarding:getFileList.error', response.error(), response.ex);

							reject(response.error(), response.ex);
						}
						const data = response.data();
						const { list = [] } = data;

						resolve(list.length);
					})
					.catch((error) => {
						console.error('Onboarding:loadPage', error);

						reject(error);
					})
				;
			});
		}
	}

	module.exports = {
		OnboardingRest,
	};
});
