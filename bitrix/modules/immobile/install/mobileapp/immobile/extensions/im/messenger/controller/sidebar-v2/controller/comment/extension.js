/**
 * @module im/messenger/controller/sidebar-v2/controller/comment
 */
jn.define('im/messenger/controller/sidebar-v2/controller/comment', (require, exports, module) => {
	const { SidebarBaseController } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { CommentSidebarView } = require('im/messenger/controller/sidebar-v2/controller/comment/src/view');
	const { SidebarLinksTab } = require('im/messenger/controller/sidebar-v2/tabs/links');
	const { SidebarFilesTab } = require('im/messenger/controller/sidebar-v2/tabs/files');
	const { SidebarAudioTab } = require('im/messenger/controller/sidebar-v2/tabs/audio');
	const { SidebarMediaTab } = require('im/messenger/controller/sidebar-v2/tabs/media');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { createSearchButton } = require('im/messenger/controller/sidebar-v2/ui/primary-button/factory');
	const { SIDEBAR_DEFAULT_TOAST_OFFSET } = require('im/messenger/controller/sidebar-v2/const');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { Icon } = require('assets/icons');
	const { isOnline } = require('device/connection');

	class CommentSidebarController extends SidebarBaseController
	{
		createView(defaultProps)
		{
			return new CommentSidebarView(defaultProps);
		}

		getWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_CHAT_TITLE');
		}

		// region context menu

		getHeaderContextMenuItems()
		{
			return [];
		}

		// endregion

		// region primary actions

		/**
		 * @return {SidebarPrimaryActionButton[]}
		 */
		getPrimaryActionButtons()
		{
			const isUserSubscribed = this.#isUserSubscribed();

			return [
				createSearchButton({
					onClick: () => this.handleSearchAction(),
				}),
				{
					id: 'mute',
					testIdSuffix: isUserSubscribed ? 'unmuted' : 'muted',
					icon: Icon.OBSERVER,
					selected: isUserSubscribed,
					title: isUserSubscribed
						? Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_WATCH_ENABLED')
						: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_WATCH_DISABLED'),
					onClick: () => this.handleToggleCommentsSubscriptionAction(),
				},
			];
		}

		handleToggleCommentsSubscriptionAction()
		{
			if (!isOnline())
			{
				Notification.showOfflineToast({ offset: SIDEBAR_DEFAULT_TOAST_OFFSET });

				return;
			}

			if (this.#isUserSubscribed())
			{
				this.chatService.unsubscribeFromComments(this.dialogId);
			}
			else
			{
				this.chatService.subscribeToComments(this.dialogId);
			}
		}

		// endregion

		// region tabs

		createTabs()
		{
			const props = this.getTabsProps();

			return [
				new SidebarMediaTab(props),
				new SidebarFilesTab(props),
				new SidebarLinksTab(props),
				new SidebarAudioTab(props),
			];
		}

		// endregion

		#isUserSubscribed()
		{
			const commentInfo = this.store.getters['commentModel/getByDialogId'](this.dialogId);

			return Boolean(commentInfo?.isUserSubscribed);
		}
	}

	module.exports = {
		CommentSidebarController,
		ControllerClass: CommentSidebarController,
	};
});
