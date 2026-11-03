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
	const { RecentRest } = require('im/messenger/provider/rest');
	const {
		collectCollabTransitionCandidates,
		selectCollabTransitionTarget,
	} = require('im/messenger/lib/collab-transition');

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
				this.#openCollabTransitionTarget(dialog.chatId);

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

		/**
		 * Opens the chat of the project tree the recent row shows - or, failing that, the one with the
		 * newest message - on top of the just opened nested navigation, which stays on its default tab.
		 * Runs without a single await in between: the navigation may be closed by the user at any
		 * suspension point.
		 * @param {number} parentChatId
		 */
		#openCollabTransitionTarget(parentChatId)
		{
			try
			{
				const navigationManager = serviceLocator.get('navigation-manager');
				// The only success sign of the navigation opening: openNestedNavigation resolves to
				// undefined, and on an open error it keeps the previous navigation on top.
				if (!navigationManager?.isTopNestedNavigationForChat(parentChatId))
				{
					this.logger.log('openCollabTransitionTarget: navigation-closed', parentChatId);

					return;
				}

				if (serviceLocator.get('sync-service')?.checkPullEventNeedsIntercept())
				{
					this.logger.log('openCollabTransitionTarget: sync-in-progress', parentChatId);

					return;
				}

				const target = selectCollabTransitionTarget(collectCollabTransitionCandidates(parentChatId));
				if (!target)
				{
					this.logger.log('openCollabTransitionTarget: no-candidates', parentChatId);

					return;
				}

				this.#openDialog(target.dialogId)
					.then((isOpened) => {
						// A chat that failed to open keeps its unread mark: dropping it would hide
						// the chat from the next selection while the user never saw it.
						if (isOpened)
						{
							this.#removeTargetUnreadMark(target);
						}
					})
					.catch((error) => {
						this.logger.error('openCollabTransitionTarget: removeTargetUnreadMark error', error);
					})
				;
			}
			catch (error)
			{
				this.logger.error('openCollabTransitionTarget error', error);
			}
		}

		/**
		 * The opener drops the server mark only for a target having a row in the recent list, and the
		 * target here is picked from the models: a chat of a tab never opened has no row of its own.
		 * The counter of such a chat is cleared by reading its messages, the unread mark is not, so
		 * without this the mark survives and the next tap on the project picks the very same chat.
		 * @param {CollabTransitionCandidate} target
		 */
		#removeTargetUnreadMark(target)
		{
			const store = serviceLocator.get('core').getStore();
			if (store.getters['recentModel/getById'](target.dialogId))
			{
				return;
			}

			const counterState = store.getters['counterModel/getByChatId'](target.chatId);
			if (!counterState?.isMarkedAsUnread)
			{
				return;
			}

			// The local state is what the next tap reads, so it is dropped optimistically and put
			// back on a failed request: the pull event confirming the change may be far away or,
			// without a network, never come at all.
			const previousCounterState = { ...counterState };
			const countersUpdateSystem = serviceLocator.get('counters-update-system');
			void countersUpdateSystem?.updateCounterState({
				...previousCounterState,
				isMarkedAsUnread: false,
			});

			RecentRest.read({ dialogId: target.dialogId }).catch((error) => {
				this.logger.error('removeTargetUnreadMark: recentRest.read error', error);

				void countersUpdateSystem?.updateCounterState(previousCounterState);
			});
		}

		/**
		 * @param {string} dialogId
		 * @return {Promise<boolean>} whether the dialog was actually opened
		 */
		async #openDialog(dialogId)
		{
			try
			{
				return await openDialog(dialogId, this.props.openDialogOptions);
			}
			catch (error)
			{
				this.logger.error('openDialog error', error);

				return false;
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
