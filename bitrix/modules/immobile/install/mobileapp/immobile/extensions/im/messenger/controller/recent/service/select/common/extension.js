/**
 * @module im/messenger/controller/recent/service/select/common
 */
jn.define('im/messenger/controller/recent/service/select/common', (require, exports, module) => {
	const { throttle } = require('utils/function');
	const { EventType, DialogType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { openDialog } = require('im/messenger/controller/recent/service/select/lib/opener');
	const { CallManager } = require('im/messenger/lib/integration/callmobile/call-manager');
	const { Feature } = require('im/messenger/lib/feature');

	/**
	 * @implements {ISelectService}
	 * @extends {BaseUiRecentService<CommonSelectServiceProps>}
	 */
	class CommonSelectService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.onItemSelectedThrottled = throttle(this.onItemSelected, 300, this);
		}

		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			this.ui = ui;
			this.subscribeEvents(ui);
		}

		/**
		 * @param {ItemSelectedEventData} itemData
		 */
		onItemSelected = async (itemData) => {
			if (itemData.params.disableTap)
			{
				return;
			}

			if (itemData.params.type === 'call')
			{
				this.#processCallItem(itemData);

				return;
			}

			const store = serviceLocator.get('core').getStore();
			const dialog = store.getters['dialoguesModel/getById'](itemData.id);

			if (dialog?.type === DialogType.collab && Feature.isNestedChatAvailable)
			{
				const parentChatId = this.recentLocator.get('parentChatId');
				if (parentChatId && dialog.chatId === parentChatId)
				{
					this.#openDialog(itemData.id);

					return;
				}

				await this.#openNestedNavigation(dialog.chatId);

				return;
			}

			this.#openDialog(itemData.id);
		};

		/**
		 * @param {CallItem} itemData
		 */
		#processCallItem(itemData)
		{
			const { call, canJoin } = itemData.params;
			if (canJoin)
			{
				CallManager.getInstance().joinCall(
					call.id,
					call.uuid,
					call.associatedEntity,
				);

				return;
			}

			this.#openDialog(call.associatedEntity.id);
		}

		async #openNestedNavigation(chatId)
		{
			try
			{
				await serviceLocator.get('navigation-manager').openNestedNavigation(chatId);
			}
			catch (error)
			{
				this.logger.error('openNestedNavigation error', error);
			}
		}

		async #openDialog(dialogId)
		{
			try
			{
				await openDialog(dialogId, this.props.openDialogOptions);
			}
			catch (error)
			{
				this.logger.error('openDialog error', error);
			}
		}

		subscribeEvents(ui)
		{
			ui?.on(EventType.recent.itemSelected, this.onItemSelectedThrottled);
		}

		unsubscribeEvents()
		{
			this.recentLocator.get('ui')
				.then((ui) => {
					ui?.off(EventType.recent.itemSelected, this.onItemSelectedThrottled);
				})
				.catch((error) => {
					this.logger.error('unsubscribeEvents error', error);
				})
			;
		}
	}

	module.exports = CommonSelectService;
});
