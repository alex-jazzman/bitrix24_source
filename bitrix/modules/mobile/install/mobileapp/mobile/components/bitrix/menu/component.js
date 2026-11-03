(() => {
	const require = (ext) => jn.require(ext);
	const { MoreMenu } = require('more-menu');
	const {
		getMenuCounters,
		updateMenuBadgeCounter,
	} = require('more-menu/utils');
	const { MenuNavigator } = require('more-menu/navigator');
	const { Type } = require('type');
	const ACTIVE_INIT_STORAGE_KEY = 'moreMenu.activeInitToken';
	const { qrauth } = require('qrauth/utils');
	const { MoreMenuAnalytics } = require('more-menu/analytics');

	const MORE_MENU_TEST_ID = 'more-menu';
	const AHA_MOMENT_VISIBILITY_RETRY_DELAY = 100;
	const AHA_MOMENT_VISIBILITY_RETRY_LIMIT = 20;

	/**
	 * @class MenuService
	 */
	class MenuService
	{
		constructor()
		{
			this.menuNavigator = new MenuNavigator({});
			this.activeInitToken = null;
			this.sharedStorage = Application.sharedStorage();
			this.bindEvents();
			this.menuCounters = {};
			this.menuList = [];
			this.moreMenu = null;
			this.pendingAhaMoment = null;
			this.isAhaMomentRequestPending = false;
			this.isAhaMomentFinalized = false;
			this.shouldRetryAhaMoment = false;
			this.isMenuTabSelected = false;
			this.ahaMomentVisibilityRetryTimer = null;
		}

		bindEvents()
		{
			BX.addCustomEvent('BackgroundUIManager::openComponentInAnotherContext', this.showAhaMoment);
			BX.addCustomEvent('onUpdateUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('onSetUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('onTabsSelected', this.handleChangeTab);
		}

		showAhaMoment = (componentName) => {
			if (componentName !== MORE_MENU_TEST_ID || !this.isCurrentSessionActive())
			{
				return;
			}

			this.isAhaMomentRequestPending = false;

			if (!this.pendingAhaMoment || this.isAhaMomentFinalized)
			{
				this.releaseBackgroundUiManager();

				return;
			}

			if (!this.moreMenu || !PageManager.getNavigator().isVisible())
			{
				this.shouldRetryAhaMoment = true;
				this.releaseBackgroundUiManager();
				this.scheduleAhaMomentRetry();

				return;
			}

			const wasAttempted = this.moreMenu.showAhaMoment(componentName, this.pendingAhaMoment);
			if (wasAttempted)
			{
				this.clearAhaMomentRetryTimer();
				this.isAhaMomentFinalized = true;
				this.shouldRetryAhaMoment = false;
				this.pendingAhaMoment = null;

				return;
			}

			this.shouldRetryAhaMoment = true;
			this.scheduleAhaMomentRetry();
		};

		handleUserCountersUpdate = (newCounters) => {
			const siteCounters = newCounters?.[env.siteId];
			if (!siteCounters)
			{
				return;
			}

			this.menuCounters = { ...this.menuCounters, ...siteCounters };
			updateMenuBadgeCounter(this.menuList, this.menuCounters);
		};

		handleChangeTab = (tabId) => {
			this.isMenuTabSelected = tabId === 'menu';
			if (this.isMenuTabSelected)
			{
				MoreMenuAnalytics.sendMenuOpenEvent();
				if (this.pendingAhaMoment && !this.isAhaMomentFinalized)
				{
					this.shouldRetryAhaMoment = true;
					this.isAhaMomentRequestPending = false;
				}
				this.scheduleAhaMomentRetry();

				return;
			}

			this.clearAhaMomentRetryTimer();
		};

		setMoreMenu(moreMenu)
		{
			this.moreMenu = moreMenu;
			this.scheduleAhaMomentRetry();
		}

		clearMoreMenu(moreMenu)
		{
			if (this.moreMenu === moreMenu)
			{
				this.moreMenu = null;
			}
		}

		requestAhaMoment = (ahaMoment) => {
			if (!ahaMoment || this.isAhaMomentFinalized || !this.isCurrentSessionActive())
			{
				return;
			}

			this.pendingAhaMoment = ahaMoment;
			if (this.isAhaMomentRequestPending)
			{
				return;
			}

			this.isAhaMomentRequestPending = true;
			BX.postComponentEvent(
				'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
				[
					{
						componentName: MORE_MENU_TEST_ID,
						priority: 500,
						debounceMs: 0,
					},
				],
			);
		};

		scheduleAhaMomentRetry(attempt = 0)
		{
			this.clearAhaMomentRetryTimer();

			if (
				!this.shouldRetryAhaMoment
				|| !this.isMenuTabSelected
				|| !this.pendingAhaMoment
				|| this.isAhaMomentFinalized
				|| this.isAhaMomentRequestPending
			)
			{
				return;
			}

			this.ahaMomentVisibilityRetryTimer = setTimeout(() => {
				this.ahaMomentVisibilityRetryTimer = null;

				if (!this.isMenuTabSelected || this.isAhaMomentFinalized)
				{
					return;
				}

				if (this.moreMenu && PageManager.getNavigator().isVisible())
				{
					this.requestAhaMoment(this.pendingAhaMoment);

					return;
				}

				if (attempt + 1 < AHA_MOMENT_VISIBILITY_RETRY_LIMIT)
				{
					this.scheduleAhaMomentRetry(attempt + 1);
				}
			}, AHA_MOMENT_VISIBILITY_RETRY_DELAY);
		}

		clearAhaMomentRetryTimer()
		{
			if (this.ahaMomentVisibilityRetryTimer)
			{
				clearTimeout(this.ahaMomentVisibilityRetryTimer);
				this.ahaMomentVisibilityRetryTimer = null;
			}
		}

		/**
		 * BackgroundUIManager closes whatever component is active without matching its name, so the
		 * release is only safe while nothing but the more menu can reach it: both callers sit behind
		 * the componentName guard of showAhaMoment, which drops the event of every other component.
		 */
		releaseBackgroundUiManager()
		{
			BX.postComponentEvent('BackgroundUIManager::onCloseActiveComponent', []);
		}

		startInitSession()
		{
			const token = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
			this.activeInitToken = token;
			try
			{
				this.sharedStorage.set(ACTIVE_INIT_STORAGE_KEY, token);
			}
			catch (e)
			{
				console.error('MenuService: failed to set active init token', e);
			}

			return token;
		}

		isCurrentSessionActive()
		{
			try
			{
				return this.sharedStorage.get(ACTIVE_INIT_STORAGE_KEY) === this.activeInitToken;
			}
			catch
			{
				return true;
			}
		}

		init()
		{
			const defaultMenuList = MoreMenu.getDefaultMenuList();
			this.menuNavigator.subscribeToEvents();

			this.startInitSession();

			return new Promise((resolve, reject) => {
				BX.ajax.runAction('mobile.Menu.getInitialMenuData', {})
					.then(({ data }) => {
						if (!this.isCurrentSessionActive())
						{
							console.warn('MenuService init: stale session result ignored');
							resolve();

							return;
						}

						this.updateMenuData(defaultMenuList, data);
						this.menu = data;
						this.requestAhaMoment(data?.ahaMoment);
						resolve();
					})
					.catch((error) => {
						if (!this.isCurrentSessionActive())
						{
							console.warn('MenuService init error ignored due to newer session', error);
							resolve();

							return;
						}

						reject(error);
					});
			});
		}

		updateMenuData(defaultMenuList, menu)
		{
			const menuList = menu?.menuList;

			const list = Type.isArrayFilled(menuList)
				? MoreMenu.prepareMenuList(defaultMenuList, menuList)
				: defaultMenuList;

			const restrictions = menu?.restrictions;

			this.menuNavigator.update(list, restrictions);

			const canInvite = menu?.restrictions?.canInvite;

			this.menuCounters = getMenuCounters(canInvite, this.menuCounters);

			this.menuList = list;

			updateMenuBadgeCounter(list, this.menuCounters);
		}
	}

	const menuService = new MenuService();
	menuService
		.init()
		.catch((error) => {
			console.error('MenuService init error:', error);
		});

	BX.onViewLoaded(() => {
		const moreMenu = new MoreMenu({
			layout,
			menuNavigator: menuService.menuNavigator,
			requestAhaMoment: menuService.requestAhaMoment,
			onUnmount: menuService.clearMoreMenu.bind(menuService),
		});
		menuService.setMoreMenu(moreMenu);
		layout.showComponent(moreMenu);

		BX.removeCustomEvent('onUpdateUserCounters', menuService.handleUserCountersUpdate);
		BX.removeCustomEvent('onSetUserCounters', menuService.handleUserCountersUpdate);
	});
})();
