/**
 * @module layout/ui/detail-card/floating-button
 */
jn.define('layout/ui/detail-card/floating-button', (require, exports, module) => {
	const { AnalyticsLabel } = require('analytics-label');
	const { FloatingButtonMenu } = require('layout/ui/detail-card/floating-button/menu');
	const { FloatingActionButton } = require('ui-system/form/buttons/floating-action-button');

	const isIOS = Application.getPlatform() === 'ios';

	/**
	 * @class FloatingButton
	 */
	class FloatingButton extends LayoutComponent
	{
		/**
		 * @param props
		 * @param {DetailCardComponent} props.detailCard
		 * @param {function} props.provider
		 */
		constructor(props)
		{
			super(props);

			this.menu = null;
			this.tabId = null;

			this.floatingButton = null;

			this.handleOnClick = this.handleOnClick.bind(this);
			this.handleOnLongClick = this.handleOnLongClick.bind(this);
			this.handleRecentItemAction = this.handleRecentItemAction.bind(this);
			this.handleRecentAdd = this.handleRecentAdd.bind(this);
		}

		get detailCard()
		{
			return this.props.detailCard;
		}

		get eventEmitter()
		{
			return this.detailCard.customEventEmitter;
		}

		get provider()
		{
			return this.props.provider;
		}

		get analyticsLabel()
		{
			return this.detailCard.getEntityAnalyticsData();
		}

		getTestId()
		{
			return 'detail-card_ADD_BTN';
		}

		componentDidMount()
		{
			if (isIOS)
			{
				Keyboard.on(Keyboard.Event.WillShow, () => {
					if (this.floatingButton)
					{
						this.floatingButton.hide();
					}
				});
				Keyboard.on(Keyboard.Event.WillHide, () => {
					if (this.floatingButton)
					{
						this.floatingButton.show();
					}
				});
			}
		}

		componentWillUnmount()
		{
			this.removeRecentListeners();
		}

		initNativeButton()
		{
			this.initRecentListeners();

			this.floatingButton = new FloatingActionButton({
				layout: this.getLayout(),
				testId: this.getTestId(),
				onClick: this.handleOnClick,
				onLongClick: this.handleOnLongClick,
			});

			return this.floatingButton;
		}

		initRecentListeners()
		{
			this.eventEmitter.on('DetailCard.FloatingMenu.Item::onRecentAction', this.handleRecentItemAction);
			this.eventEmitter.on('DetailCard.FloatingMenu.Item::onSaveInRecent', this.handleRecentAdd);
		}

		removeRecentListeners()
		{
			this.eventEmitter.off('DetailCard.FloatingMenu.Item::onRecentAction', this.handleRecentItemAction);
			this.eventEmitter.off('DetailCard.FloatingMenu.Item::onSaveInRecent', this.handleRecentAdd);
		}

		/**
		 * @param {string} actionId
		 * @param {?string} tabId
		 * @return void
		 */
		handleRecentItemAction({ actionId, tabId = null })
		{
			const menu = this.getMenu();
			const menuItem = menu.getMenuItem(actionId, tabId);

			if (menuItem)
			{
				menu
					.closeContextMenu()
					.then(() => menuItem.execute())
					.then(() => AnalyticsLabel.send({
						...this.analyticsLabel,
						source: 'detail-card-recent-menu',
						entityTypeId: this.detailCard.getEntityTypeId(),
						tabId,
						actionId,
						position: menu.getRecentPosition(actionId, tabId),
					}))
					.catch(console.error);
			}
		}

		/**
		 * @param {string} actionId
		 * @param {?string} tabId
		 * @return void
		 */
		handleRecentAdd({ actionId, tabId = null })
		{
			this.getMenu().onAddToRecent(actionId, tabId);
		}

		getTabById(id)
		{
			return this.detailCard.tabRefMap.get(id);
		}

		actualize(tabId)
		{
			this.tabId = tabId;
			const tab = this.getTabById(tabId);

			if (!this.floatingButton)
			{
				return;
			}

			if (tab?.needShowFloatingButton && tab.needShowFloatingButton?.())
			{
				this.floatingButton.show();

				return;
			}

			if (this.isVisible())
			{
				this.floatingButton.show();
			}
			else
			{
				this.floatingButton.hide();
			}
		}

		render()
		{
			this.menu = null;
			this.floatingButton = new FloatingButton({
				testId: this.getTestId(),
				layout: this.getLayout(),
				onClick: this.handleOnClick,
				onLongClick: this.handleOnLongClick,
			});

			this.floatingButton.show();

			return null;
		}

		isVisible()
		{
			return this.detailCard.hasEntityModel() && this.hasItemsToShow();
		}

		getPosition()
		{
			if (this.isVisible())
			{
				return null;
			}

			return { bottom: -100 };
		}

		handleOnClick()
		{
			if (this.tabId)
			{
				const tab = this.getTabById(this.tabId);
				if (tab?.floatingButtonHandler)
				{
					tab?.floatingButtonHandler();

					return;
				}
			}

			const activeTabMenuItem = this.getMenu().getActiveTabMenuItem();
			if (activeTabMenuItem)
			{
				void activeTabMenuItem.execute();
			}
			else
			{
				void this.showMenu();
			}
		}

		handleOnLongClick()
		{
			void this.showMenu();
		}

		showMenu()
		{
			return this.getMenu().showContextMenu();
		}

		/**
		 * @return {FloatingButtonMenu}
		 */
		getMenu()
		{
			if (this.menu === null)
			{
				this.menu = new FloatingButtonMenu({
					detailCard: this.detailCard,
					items: this.getItems(),
					useRecent: true,
				});
			}

			return this.menu;
		}

		/**
		 * Returns array of menu items
		 *
		 * @public
		 * @return {FloatingMenuItem[]}
		 */
		getItems()
		{
			const items = [
				...this.getTabItems(),
				...this.getProviderItems(),
			];

			items.forEach((item) => item.setDetailCard(this.detailCard));

			return items;
		}

		/**
		 * Returns true if button has items to show in selected tab; false otherwise
		 *
		 * @public
		 * @returns {boolean}
		 */
		hasItemsToShow()
		{
			if (this.getItems().some((item) => item.getTabId() === this.detailCard.activeTab))
			{
				return this.isActiveTabHasNestedItems();
			}

			return this.getItems().some((item) => item.isAvailable());
		}

		/**
		 * @private
		 * @returns {boolean}
		 */
		isActiveTabHasNestedItems()
		{
			const activeTabItems = this.getItems().filter((item) => item.getTabId() === this.detailCard.activeTab);
			for (const activeTabItem of activeTabItems)
			{
				if (activeTabItem.getNestedItems().some((item) => item.isActive()))
				{
					return true;
				}
			}

			return false;
		}

		/**
		 * @private
		 * @return {FloatingMenuItem[]}
		 */
		getTabItems()
		{
			const items = [];

			this.detailCard.tabRefMap.forEach((tabRef) => {
				items.push(...tabRef.getFloatingMenuItems());
			});

			return items;
		}

		/**
		 * @private
		 * @return {FloatingMenuItem[]}
		 */
		getProviderItems()
		{
			if (this.provider)
			{
				return this.provider(this.detailCard);
			}

			return [];
		}

		showMenuInTab(activeTabHandler)
		{
			return (
				activeTabHandler()
					.then(({ closeCallback }) => closeCallback && closeCallback())
			);
		}

		getLayout()
		{
			return this.detailCard.layout;
		}
	}

	module.exports = { FloatingButton };
});
