/**
 * @module im/messenger/controller/messenger-header/src/title-params-provider/nested
 */
jn.define('im/messenger/controller/messenger-header/src/title-params-provider/nested', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');

	/**
	 * @class NestedTitleParamsProvider
	 */
	class NestedTitleParamsProvider
	{
		#dialogId;

		/**
		 * @param {string} dialogId
		 */
		constructor(dialogId)
		{
			this.#dialogId = dialogId;
		}

		/**
		 * @return {string}
		 */
		getDefaultTitle()
		{
			const dialog = serviceLocator.get('core').getStore()
				.getters['dialoguesModel/getById'](this.#dialogId);

			return dialog?.name ?? '';
		}

		/**
		 * @return {Partial<JNWidgetTitleParams>}
		 */
		getTitleParams()
		{
			const avatar = ChatAvatar.createFromDialogId(this.#dialogId);

			return {
				type: 'common',
				avatar: avatar.getNavigationHeaderAvatarProps(),
			};
		}
	}

	module.exports = { NestedTitleParamsProvider };
});
