/**
 * @module im/messenger/provider/services/message/mark
 */
jn.define('im/messenger/provider/services/message/mark', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { Logger } = require('im/messenger/lib/logger');

	/**
	 * @class MarkService
	 */
	class MarkService
	{
		constructor({ chatId, dialogId })
		{
			this.chatId = chatId;
			this.dialogId = dialogId;
			this.store = serviceLocator.get('core').getStore();
		}

		clearMark()
		{
			const dialog = this.store.getters['dialoguesModel/getByChatId'](this.chatId);
			if (!dialog || dialog.markedId === 0)
			{
				return;
			}

			this.store.dispatch('dialoguesModel/update', {
				dialogId: this.dialogId,
				fields: { markedId: 0 },
			});

			runAction(RestMethod.imV2ChatRead, {
				data: {
					dialogId: this.dialogId,
					onlyRecent: 'Y',
				},
			}).catch((error) => {
				Logger.error('MarkService.clearMark server error:', error);
			});
		}

		async markMessage(messageId)
		{
			const dialog = this.store.getters['dialoguesModel/getByChatId'](this.chatId);
			if (!dialog)
			{
				return;
			}

			const previousMarkedId = dialog.markedId;
			await this.store.dispatch('dialoguesModel/update', {
				dialogId: this.dialogId,
				fields: {
					markedId: messageId,
				},
			});

			await this.store.dispatch('recentModel/update', [
				{
					id: this.dialogId,
					unread: true,
				},
			]);

			runAction(RestMethod.imV2ChatMessageMark, {
				data: { id: messageId },
			}).catch((error) => {
				Logger.error('MarkService.markMessage server error:', error);

				this.store.dispatch('dialoguesModel/update', {
					dialogId: this.dialogId,
					fields: {
						markedId: previousMarkedId,
					},
				});

				this.store.dispatch('recentModel/update', [
					{
						id: this.dialogId,
						unread: previousMarkedId > 0,
					},
				]);
			});
		}
	}

	module.exports = { MarkService };
});
