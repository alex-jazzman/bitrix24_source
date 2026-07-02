/**
 * @module im/messenger/controller/dialog-creator/navigation-selector
 */
jn.define('im/messenger/controller/dialog-creator/navigation-selector', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { AnalyticsEvent } = require('analytics');

	const { Theme } = require('im/lib/theme');
	const { debounce } = require('utils/function');

	const {
		EventType,
		Analytics,
		DialogType,
		CopilotRoleType,
		ROOT_PARENT_CHAT_ID,
	} = require('im/messenger/const');
	const {
		MenuVisibility,
		getVisibleMenuItemsCount,
	} = require('im/messenger/controller/dialog-creator/menu-visibility');
	const { NavigationSelectorView } = require('im/messenger/controller/dialog-creator/navigation-selector/view');
	const { CreateChannel, CreateGroupChat } = require('im/messenger/controller/chat-composer');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { isModuleInstalled } = require('module');
	const { FolderCreate } = require('im/messenger/controller/folder/create');

	const CREATE_COPILOT_DEBOUNCE_DELAY = 1000;
	const COMPACT_MODE_MENU_THRESHOLD = 4;
	const COMPACT_BACKDROP_PERCENT = 65;
	const DEFAULT_BACKDROP_PERCENT = 85;

	class NavigationSelector
	{
		/**
		 *
		 * @param {Array} userList
		 * @param parentLayout
		 */
		static open({ userList, parentLayout = null })
		{
			const widget = new NavigationSelector({ userList, parentLayout });
			widget.show();
		}

		static isCompactMode()
		{
			// the first folder may contain no chats with users, and the recent list will be empty
			if (MenuVisibility.canCreateFolder())
			{
				return true;
			}

			// there is no room to scroll the recent list when there are a lot of items
			return getVisibleMenuItemsCount() > COMPACT_MODE_MENU_THRESHOLD;
		}

		constructor({ userList, parentLayout })
		{
			this.userList = userList || [];
			this.layout = parentLayout || null;
			this.compactMode = NavigationSelector.isCompactMode();

			this.view = new NavigationSelectorView({
				userList,
				hideRecentBlock: this.compactMode,
				onClose: () => {
					this.layout.close();
				},
				onItemSelected: (itemData) => {
					MessengerEmitter.emit(EventType.messenger.openDialog, itemData, 'im.messenger');
					this.layout.close();
				},
				onCreateChannel: () => {
					this.sendAnalyticsStartCreate(Analytics.Category.channel, Analytics.Type.channel);

					this.expandLayoutForSubScreen();

					const createChannel = new CreateChannel();
					createChannel.open({}, this.layout);
				},
				onCreatePrivateChat: () => {
					this.sendAnalyticsStartCreate(Analytics.Category.chat, Analytics.Type.chat);

					this.expandLayoutForSubScreen();

					const createGroupChat = new CreateGroupChat(ROOT_PARENT_CHAT_ID);
					createGroupChat.open({ showLeftButtons: true }, this.layout).catch((error) => {
						console.error(error);
					});
				},
				onCreateCollab: async () => {
					try
					{
						this.expandLayoutForSubScreen();

						const { openCollabCreate } = await requireLazy('collab/create');

						this.sendAnalyticsStartCreate(Analytics.Category.collab, Analytics.Type.collab);
						await openCollabCreate({
							// todo provide some analytics here
						}, this.layout);
					}
					catch (error)
					{
						console.error(error);
					}
				},
				onCreateFolder: () => {
					new FolderCreate().open(this.layout);
				},
				onCreateCopilot: debounce(() => {
					this.sendAnalyticsStartCreate(
						Analytics.Category.copilot,
						Analytics.Type.copilot,
						Analytics.Section.chatTab,
					);

					const fields = {
						type: DialogType.copilot.toUpperCase(),
						copilotMainRole: CopilotRoleType.copilotUniversalRole,
					};

					void serviceLocator.get('dialog-manager').openOptimisticDialog({
						chatType: DialogType.copilot,
						dataLoader: () => {
							const chatService = new ChatService();

							return chatService.createCopilot(fields);
						},
					});
				}, CREATE_COPILOT_DEBOUNCE_DELAY, this, true),
				onClickInviteButton: async () => {
					if (isModuleInstalled('intranet'))
					{
						const { openIntranetInviteWidget } = require('intranet/invite-opener-new');
						openIntranetInviteWidget?.({
							analytics: new AnalyticsEvent().setSection('chat'),
							parentLayout: this.layout,
						});
					}
				},
			});
		}

		show()
		{
			const config = {
				title: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_CHAT_CREATE_TITLE'),
				useLargeTitleMode: true,
				modal: true,
				backgroundColor: Theme.colors.bgContentPrimary,
				backdrop: {
					mediumPositionPercent: this.compactMode ? COMPACT_BACKDROP_PERCENT : DEFAULT_BACKDROP_PERCENT,
					horizontalSwipeAllowed: false,
					// onlyMediumPosition: true,
				},
				onReady: (layoutWidget) => {
					this.layout = layoutWidget;
					layoutWidget.showComponent(this.view);
					AnalyticsService.getInstance().sendOpenDialogCreator();
				},
			};

			if (this.layout !== null)
			{
				this.layout.openWidget(
					'layout',
					config,
				).then((layoutWidget) => {
					this.configureWidget(layoutWidget);
				});

				return;
			}

			PageManager.openWidget(
				'layout',
				config,
			).then((layoutWidget) => {
				this.configureWidget(layoutWidget);
			});
		}

		configureWidget(layoutWidget)
		{
			layoutWidget.setTitle({
				text: Loc.getMessage('IMMOBILE_DIALOG_CREATOR_CHAT_CREATE_TITLE'),
				useLargeTitleMode: true,
			}, true);
			layoutWidget.enableNavigationBarBorder(false);
		}

		sendAnalyticsStartCreate(category, type, section)
		{
			AnalyticsService.getInstance()
				.sendStartCreation({ category, type, section })
			;
		}

		expandLayoutForSubScreen()
		{
			if (!this.compactMode)
			{
				return;
			}

			const expandedHeight = Math.round(device.screen.height * (DEFAULT_BACKDROP_PERCENT / 100));

			this.layout?.setBottomSheetParams?.({ mediumPositionHeight: expandedHeight });
			this.layout?.setBottomSheetHeight?.(expandedHeight);
		}
	}

	module.exports = { NavigationSelector };
});
