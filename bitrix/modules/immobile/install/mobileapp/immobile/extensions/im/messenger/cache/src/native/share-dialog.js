/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/cache/share-dialog
 */
jn.define('im/messenger/cache/share-dialog', (require, exports, module) => {
	const { throttle } = require('utils/function');
	const { utils } = require('native/im');

	const { DateHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { ComponentCode } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title'); // TODO: refactor, after splitting into separate extensions im/messenger/lib/element and  im/messenger/provider/service
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar'); // TODO: refactor, after splitting into separate extensions im/messenger/lib/element and  im/messenger/provider/service

	class ShareDialogCache
	{
		constructor()
		{
			this.saveRecentItemList = throttle(this.saveRecentItemList, 10000, this);
			this.store = serviceLocator.get('core').getStore();
		}

		saveRecentItemList()
		{
			const recentFirstPage = this.store.getters['recentModel/getRecentPage'](1, 50);

			return new Promise((resolve, reject) => {
				const componentCode = MessengerParams.getComponentCode();
				if (componentCode === ComponentCode.imCopilotMessenger)
				{
					reject(new Error('Copilot recent cache not available for current app version'));

					return;
				}

				const formattedRecentList = recentFirstPage.map((item) => {
					let lastMessageTimestamp = 0;
					if (item.message && item.message.id !== 0 && item.message.date)
					{
						lastMessageTimestamp = Number(DateHelper.cast(item.message.date));
					}

					const chatAvatar = ChatAvatar.createFromDialogId(item.id);
					const chatTitle = ChatTitle.createFromDialogId(item.id);
					const color = chatAvatar.getRecentItemAvatarProps().placeholder.backgroundColor;

					return {
						id: item.id,
						title: chatTitle.getTitle(),
						subTitle: chatTitle.getDescription(),
						imageUrl: chatAvatar.getAvatarUrl(),
						color,
						lastMessageTimestamp,
					};
				});

				utils.setRecentUsers(formattedRecentList);
				resolve(formattedRecentList);
			});
		}
	}

	module.exports = {
		ShareDialogCache,
	};
});
