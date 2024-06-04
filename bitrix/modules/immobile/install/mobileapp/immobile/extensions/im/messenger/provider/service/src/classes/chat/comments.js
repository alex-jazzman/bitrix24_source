/**
 * @module im/messenger/provider/service/classes/chat/comments
 */
jn.define('im/messenger/provider/service/classes/chat/comments', (require, exports, module) => {
	const { RestMethod} = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class CommentsService
	 */
	class CommentsService
	{
		/**
		 *
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(dialogLocator)
		{
			this.store = serviceLocator.get('core').getStore();
			this.dialogLocator = dialogLocator;
		}

		subscribe(dialogId)
		{
			this.store.dispatch('dialoguesModel/unmute', { dialogId });

			return runAction(RestMethod.imV2ChatCommentSubscribe, {
				data: { dialogId },
			}).catch((error) => {
				// eslint-disable-next-line no-console
				console.error('CommentsService: subscribe error', error);
			});
		}

		unsubscribe(dialogId)
		{
			this.store.dispatch('dialoguesModel/mute', { dialogId });

			return runAction(RestMethod.imV2ChatCommentUnsubscribe, {
				data: { dialogId },
			}).catch((error) => {
				// eslint-disable-next-line no-console
				console.error('CommentsService: unsubscribe error', error);
			});
		}
	}

	module.exports = { CommentsService };
});
