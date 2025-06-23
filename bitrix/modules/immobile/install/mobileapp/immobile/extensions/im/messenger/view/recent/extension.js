/**
 * @module im/messenger/view/recent
 */
jn.define('im/messenger/view/recent', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const AppTheme = require('apptheme');
	const { Runtime } = require('runtime');
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { getTopMenuNotificationsButton } = require('im/messenger/api/notifications-opener');

	const { openIntranetInviteWidget } = require('intranet/invite-opener-new');

	const {
		EventType,
		ComponentCode,
		ActionByUserType,
	} = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { UserPermission } = require('im/messenger/lib/permission-manager');
	const { QuickRecentLoader } = require('im/messenger/lib/quick-recent-load');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('recent--view');

	const { View } = require('im/messenger/view/base');

	class RecentView extends View
	{
		constructor(options = {})
		{
			super(options);

			this.setCustomEvents([
				EventType.recent.createChat,
				EventType.recent.readAll,
				EventType.recent.loadNextPage,
			]);

			this.isWelcomeScreenVisible = false;
			this.loaderShown = false;
			this.loadNextPageItemId = 'loadNextPage';
			this.itemCollection = {};
			this.style = {
				chatCreateButtonColor: AppTheme.colors.accentBrandBlue,
				icon: 'plus',
				showLoader: false,
				...options.style,
			};

			this.bindMethods();
			this.subscribeEvents();
			this.initTopMenu();
			this.initSections();
			this.renderChatCreateButton();
			this.initQuickRecentLoader();
		}

		bindMethods()
		{
			this.itemWillDisplayHandler = this.itemWillDisplayHandler.bind(this);
			this.showSearchBarButtonTapHandler = this.showSearchBarButtonTapHandler.bind(this);
			this.createChatButtonTapHandler = this.createChatButtonTapHandler.bind(this);
		}

		get isLoaderShown()
		{
			return this.loaderShown;
		}

		subscribeEvents()
		{
			this.ui.on(EventType.recent.scroll, Runtime.throttle(this.onScroll, 50, this));

			this.ui.on(EventType.recent.itemWillDisplay, this.itemWillDisplayHandler);
		}

		initTopMenu()
		{
			const topMenuPopup = dialogs.createPopupMenu();
			const topMenuButtons = [];

			if (this.isMessengerComponent())
			{
				topMenuButtons.push(
					{
						id: 'readAll',
						title: Loc.getMessage('IMMOBILE_RECENT_VIEW_READ_ALL'),
						sectionCode: 'general',
						iconName: Icon.CHATS_WITH_CHECK.getIconName(),
					},
				);
			}

			if (Feature.isDevModeEnabled)
			{
				topMenuButtons.push(
					{
						id: 'developer-console',
						title: 'Developer console',
						sectionCode: 'general',
						iconName: 'edit',
					},
				);
			}

			if (Feature.isDevelopmentEnvironment)
			{
				topMenuButtons.push(
					{
						id: 'developer-menu',
						title: 'Developer menu',
						sectionCode: 'general',
						iconName: 'start',
					},
					{
						id: 'developer-reload',
						title: 'reload();',
						sectionCode: 'general',
					},
				);
			}

			const topMenuButtonHandler = async (event, item) => {
				if (event === 'onItemSelected' && item.id === 'readAll')
				{
					this.emitCustomEvent(EventType.recent.readAll);

					return;
				}

				if (Feature.isDevelopmentEnvironment && event === 'onItemSelected')
				{
					if (item.id === 'developer-menu')
					{
						window.showMessengerDeveloperMenu();
					}

					if (item.id === 'developer-reload')
					{
						// eslint-disable-next-line no-undef
						reload();
					}
				}

				if (Feature.isDevModeEnabled && event === 'onItemSelected')
				{
					if (item.id === 'developer-console')
					{
						const { Console } = await requireLazy('im:messenger/lib/dev/tools');
						Console.open();
					}
				}
			};

			const buttons = [
				getTopMenuNotificationsButton(),
			];

			if (topMenuButtons.length > 0)
			{
				topMenuPopup.setData(topMenuButtons, [{ id: 'general' }], topMenuButtonHandler);
				buttons.push(
					{
						type: 'more',
						callback: () => topMenuPopup.show(),
					},
				);
			}

			if (this.isMessengerComponent())
			{
				buttons.unshift({
					type: 'search',
					callback: this.showSearchBarButtonTapHandler,
				});
			}

			this.setRightButtons(buttons);
		}

		/**
		 * @return {Array<JNListWidgetSectionItem>}
		 */
		getSections()
		{
			return [
				{
					title: '',
					id: 'call',
					backgroundColor: '#ffffff',
					sortItemParams: { order: 'desc' },
				},
				{
					title: '',
					id: 'pinned',
					backgroundColor: '#ffffff',
					sortItemParams: { order: 'desc' },
				},
				{
					title: '',
					id: 'general',
					backgroundColor: '#ffffff',
					sortItemParams: { order: 'desc' },
				},
			];
		}

		initSections()
		{
			this.setSections(this.getSections());
		}

		renderChatCreateButton()
		{
			if (!this.checkShouldRenderChatCreateButton())
			{
				return;
			}

			this.setFloatingButton(this.getChatCreateButtonOption());
		}

		initQuickRecentLoader()
		{
			this.quickRecentLoader = new QuickRecentLoader();
		}

		renderChatCreateButtonForWelcomeScreen()
		{
			if (!this.checkShouldRenderChatCreateButton())
			{
				return;
			}

			this.setFloatingButton(this.getChatCreateButtonForWelcomeScreenOption());
		}

		checkShouldRenderChatCreateButton()
		{
			if (
				this.isCollabComponent()
				&& (
					!Feature.isCollabCreationAvailable
					|| !UserPermission.canPerformActionByUserType(ActionByUserType.createCollab)
				)
			)
			{
				return false;
			}

			if (
				this.isChannelComponent()
				&& !UserPermission.canPerformActionByUserType(ActionByUserType.createChannel)
			)
			{
				return false;
			}

			const userCanNotCreateChats = (
				!UserPermission.canPerformActionByUserType(ActionByUserType.createChat)
				&& !UserPermission.canPerformActionByUserType(ActionByUserType.createChannel)
				&& !UserPermission.canPerformActionByUserType(ActionByUserType.createCollab)
			);

			return !(this.isMessengerComponent() && userCanNotCreateChats);
		}

		isCopilotComponent()
		{
			const componentCode = MessengerParams.getComponentCode();

			return componentCode === ComponentCode.imCopilotMessenger;
		}

		isChannelComponent()
		{
			const componentCode = MessengerParams.getComponentCode();

			return componentCode === ComponentCode.imChannelMessenger;
		}

		isCollabComponent()
		{
			const componentCode = MessengerParams.getComponentCode();

			return componentCode === ComponentCode.imCollabMessenger;
		}

		isMessengerComponent()
		{
			const componentCode = MessengerParams.getComponentCode();

			return componentCode === ComponentCode.imMessenger;
		}

		getChatCreateButtonOption()
		{
			return {
				type: 'plus',
				callback: this.createChatButtonTapHandler,
				icon: this.style.icon,
				animation: 'hide_on_scroll',
				color: this.style.chatCreateButtonColor,
				showLoader: false,
				accentByDefault: false,
			};
		}

		getChatCreateButtonForWelcomeScreenOption()
		{
			const button = this.getChatCreateButtonOption();
			button.accentByDefault = true;

			return button;
		}

		itemWillDisplayHandler(item)
		{
			if (item.id === this.loadNextPageItemId)
			{
				this.emitCustomEvent(EventType.recent.loadNextPage);
			}
		}

		onScroll(event)
		{
			if (event.offset.y >= event.contentSize.height * 0.8)
			{
				this.emitCustomEvent(EventType.recent.loadNextPage);
			}
		}

		setFloatingButton(floatingButton)
		{
			this.ui.setFloatingButton(floatingButton);
		}

		setRightButtons(buttonList)
		{
			this.ui.setRightButtons(buttonList);
		}

		/**
		 * @param {Array<JNListWidgetSectionItem>} sectionList
		 */
		setSections(sectionList)
		{
			this.ui.setSections(sectionList);
		}

		showSearchBarButtonTapHandler()
		{
			this.ui.showSearchBar();
		}

		/**
		 * @param {Array<NativeRecentItem>} items
		 */
		setItems(items)
		{
			logger.log(`${this.constructor.name}.setItems`, items);

			this.ui.setItems(items);
			items.forEach((item) => {
				this.itemCollection[item.id] = item;
			});

			this.updateSharedStorageRecentCache();
		}

		/**
		 * @param {Array<NativeRecentItem>} items
		 * @param {boolean} [isAnimated=false]
		 */
		addItems(items, isAnimated = false)
		{
			logger.log(`${this.constructor.name}.addItems`, items);

			this.ui.addItems(items, isAnimated);
			items.forEach((item) => {
				this.itemCollection[item.id] = item;
			});

			this.updateSharedStorageRecentCache();
		}

		updateItems(items)
		{
			logger.log(`${this.constructor.name}.updateItems`, items);

			this.ui.updateItems(items);
			items.forEach((item) => {
				if (!this.itemCollection[item.element.id])
				{
					logger.error(`${this.constructor.name}.updateItems: updating item not found`, item.element.id);

					return;
				}
				this.itemCollection[item.element.id] = item.element;
			});

			this.updateSharedStorageRecentCache();
		}

		updateItem(filter, fields)
		{
			logger.log(`${this.constructor.name}.updateItem`, filter, fields);

			this.ui.updateItem(filter, fields);
			if (!this.itemCollection[fields.id])
			{
				logger.error(`${this.constructor.name}.updateItem: updating item not found`, fields.id);

				return;
			}
			this.itemCollection[fields.id] = fields;

			this.updateSharedStorageRecentCache();
		}

		removeItem(itemFilter)
		{
			logger.log(`${this.constructor.name}.removeItem`, itemFilter);
			this.ui.removeItem(itemFilter);
			if (itemFilter.id)
			{
				delete this.itemCollection[itemFilter.id];

				this.updateSharedStorageRecentCache();
			}
		}

		removeCallItem(itemFilter)
		{
			logger.log(`${this.constructor.name}.removeCallItem`, itemFilter);
			const entityId = itemFilter?.associatedEntity?.id;
			if (!entityId)
			{
				return;
			}

			const id = `call${entityId}`;
			const item = this.itemCollection[id];

			if (item?.params.call.uuid === itemFilter.uuid)
			{
				this.ui.removeItem({ id });
				delete this.itemCollection[id];
			}
		}

		findItem(filter, callback)
		{
			this.ui.findItem(filter, callback);
		}

		getItem(id)
		{
			return this.itemCollection[id];
		}

		getItems()
		{
			return this.itemCollection;
		}

		getItemList()
		{
			return Object.values(this.itemCollection);
		}

		updateSharedStorageRecentCache()
		{
			void this.quickRecentLoader.saveCache(this.getSections(), this.getItemList());
		}

		stopRefreshing()
		{
			this.ui.stopRefreshing();
		}

		showLoader()
		{
			const loader = {
				id: this.loadNextPageItemId,
				title: Loc.getMessage('IMMOBILE_RECENT_VIEW_ITEMS_LOADING'),
				type: 'loading',
				unselectable: true,
				params: {
					disableTap: true,
				},
				sectionCode: 'general',
			};

			this.addItems([loader]);
			this.loaderShown = true;
		}

		hideLoader()
		{
			if (this.loaderShown)
			{
				this.removeItem({ id: this.loadNextPageItemId });
				this.loaderShown = false;
			}
		}

		showWelcomeScreen()
		{
			if (this.isWelcomeScreenVisible)
			{
				return;
			}

			let options = {};

			if (Feature.isIntranetInvitationAvailable)
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_TEXT_1'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_TEXT_INVITE'),
					iconName: 'ws_employees',
					listener: () => openIntranetInviteWidget({
						analytics: new AnalyticsEvent().setSection('chat'),
					}),
				};
			}
			else
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_TEXT_1'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_TEXT_CREATE'),
					iconName: 'ws_employees',
					listener: this.createChatButtonTapHandler,
				};
			}

			options.startChatButton = {
				text: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_EMPTY_BUTTON'),
				iconName: 'ws_plus',
			};

			if (this.isCopilotComponent())
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_COPILOT_UPPER_TEXT'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_COPILOT_LOWER_TEXT'),
					iconName: 'ws_copilot',
				};
			}

			if (this.isChannelComponent())
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_CHANNEL_UPPER_TEXT'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_CHANNEL_LOWER_TEXT'),
					iconName: 'ws_channels',
				};
			}

			if (this.isCollabComponent())
			{
				options = {
					upperText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_COLLAB_UPPER_TEXT'),
					lowerText: Loc.getMessage('IMMOBILE_RECENT_VIEW_EMPTY_COLLAB_LOWER_TEXT'),
					iconName: 'ws_collabs',
				};
			}

			this.ui.welcomeScreen.show(options);
			this.renderChatCreateButtonForWelcomeScreen();
			this.isWelcomeScreenVisible = true;
		}

		hideWelcomeScreen()
		{
			if (this.isWelcomeScreenVisible)
			{
				this.ui.welcomeScreen.hide();
				this.renderChatCreateButton();
				this.isWelcomeScreenVisible = false;
			}
		}

		createChatButtonTapHandler()
		{
			this.emitCustomEvent(EventType.recent.createChat);
		}
	}

	window.showMessengerDeveloperMenu = () => {
		jn.import('im:messenger/lib/dev/menu')
			.then(() => {
				const { showDeveloperMenu } = require('im/messenger/lib/dev/menu');
				showDeveloperMenu();
			})
			.catch((error) => {
				// eslint-disable-next-line no-console
				console.error(error);
			})
		;
	};

	module.exports = {
		RecentView,
	};
});
