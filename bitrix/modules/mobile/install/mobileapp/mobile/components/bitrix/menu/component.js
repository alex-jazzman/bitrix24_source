(() => {
	const require = (ext) => jn.require(ext);
	const { MoreMenu } = require('more-menu');
	const {
		getMenuCounters,
		updateMenuBadgeCounter,
	} = require('more-menu/utils');
	const { MenuNavigator } = require('more-menu/navigator');
	const { Type } = require('type');
	const { showAhaMoment } = require('more-menu/aha-moment');
	const ACTIVE_INIT_STORAGE_KEY = 'moreMenu.activeInitToken';
	const { qrauth } = require('qrauth/utils');

	const MORE_MENU_TEST_ID = 'more-menu';

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
		}

		bindEvents()
		{
			BX.addCustomEvent('BackgroundUIManager::openComponentInAnotherContext', this.showAhaMoment);
			BX.addCustomEvent('onUpdateUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('onSetUserCounters', this.handleUserCountersUpdate);
		}

		showAhaMoment = (componentName) => {
			if (componentName === MORE_MENU_TEST_ID && this.menu)
			{
				showAhaMoment(this.menu?.ahaMoment, this.menuNavigator);
			}
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
						if (data?.ahaMoment)
						{
							this.tryToShowAhaMoment();
						}
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

		tryToShowAhaMoment()
		{
			BX.postComponentEvent(
				'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
				[
					{
						componentName: MORE_MENU_TEST_ID,
						priority: 500,
					},
				],
			);
		}
	}

	const menuService = new MenuService();
	menuService
		.init()
		.catch((error) => {
			console.error('MenuService init error:', error);
		});

	qrauth.listenUniversalLink();

	BX.onViewLoaded(() => {
		layout.showComponent(new MoreMenu({
			layout,
			menuNavigator: menuService.menuNavigator,
		}));

		BX.removeCustomEvent('onUpdateUserCounters', menuService.handleUserCountersUpdate);
		BX.removeCustomEvent('onSetUserCounters', menuService.handleUserCountersUpdate);
	});
})();
