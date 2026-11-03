/**
 * @module more-menu
 */
jn.define('more-menu', (require, exports, module) => {
	const { animate } = require('animation');
	const { Feature } = require('feature');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Color, Indent } = require('tokens');
	const { Haptics } = require('haptics');
	const AppTheme = require('apptheme');

	const { MoreMenuHeader } = require('more-menu/block/header');
	const { ToolsList } = require('more-menu/block/tools-list');
	const { SettingsList, SETTINGS_SECTIONS } = require('more-menu/block/settings-list');
	const { MoreMenuCompany } = require('more-menu/block/company');
	const { storeAppFontScale } = require('more-menu/block/company/app-font-scale');

	const { showAhaMoment } = require('more-menu/aha-moment');
	const { SearchList } = require('more-menu/search-list');
	const { MenuNavigator } = require('more-menu/navigator');
	const { MoreMenuPanel } = require('more-menu/ui/panel');
	const {
		getMenuCounters,
		getWhatsNewCounter,
		updateMenuBadgeCounter,
	} = require('more-menu/utils');

	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const {
		resolveAppearanceTextColorMode,
		applyAppearanceTextColorMode,
		subscribeToAppearanceTextColorModeChange,
	} = require('user/theme');

	const { RunActionExecutor } = require('rest/run-action-executor');
	const { requireLazy } = require('require-lazy');

	const { usersUpserted } = require('statemanager/redux/slices/users');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const dispatchManualCheckIns = (checkIns) => {
		if (!Type.isArrayFilled(checkIns))
		{
			return;
		}

		try
		{
			const { upsertCheckIns } = require('stafftrack/statemanager/redux/slices/check-in');
			dispatch(upsertCheckIns(checkIns));
		}
		catch (error)
		{
			console.warn('stafftrack check-in slice unavailable', error);
		}
	};

	const { PropTypes } = require('utils/validation');

	const { createTestIdGenerator } = require('utils/test');
	const { isEmpty, isEqual } = require('utils/object');
	const { debounce } = require('utils/function');
	const { RefRegistry } = require('more-menu/ref-registry');

	const MENU_LIST_ACTION_NAME = 'mobile.Menu.getMenu';
	const SECONDS_IN_DAY = 86400;
	const MORE_MENU_TEST_ID = 'more-menu';
	const MORE_MENU_REFRESH_VIEW_REF_KEY = 'more_menu_refresh_view';
	// how long the promo waits for the read of the scale of the app font, see whenAppFontScaleStored
	const APP_FONT_SCALE_GIVE_UP_DELAY = 1000;

	/**
	 * The record lives in the storage the whole app shares, and that storage is split neither by portal
	 * nor by user: both belong in the key, or the menu of one portal - its company name, its tariff, its
	 * promo - would be read on another as its own under the same identifier of the user.
	 *
	 * @return {string}
	 */
	const getMenuCacheId = () => `mobile-more-menu_${currentDomain}_${env.userId}`;

	/**
	 * @class MoreMenu
	 */
	class MoreMenu extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {object} props.layout
		 * @param {MenuNavigator} props.menuNavigator
		 */
		constructor(props)
		{
			super(props);

			this.menuNavigator = props.menuNavigator;
			this.isComponentMounted = false;
			this.unsubscribeFromAppearanceTextColorModeChange = null;
			this.ahaMomentCompletionCallback = null;

			// kept out of state: the stub follows the floating layer by ref, without re-rendering the menu
			this.floatingStubRef = null;
			// the stub takes the other number of the banner once the promo has started to collapse
			this.floatingPromoCollapsed = false;
			// the guard of the import is an instance field: setState is applied asynchronously, so two
			// renders in a row would both start it
			this.floatingPromoRequested = false;
			// and a promo whose import failed waits here until the menu asks for its data again
			this.floatingPromoFailed = false;
			// the read of the scale of the app font the mount starts: the promo waits for it, since its
			// extension states the height of its card the moment it loads
			this.appFontScaleStored = null;

			this.state = {
				menuList: [],
				loading: true,
				counters: {},
				whatsNewCounter: getWhatsNewCounter(),
				appearanceTextColorMode: null,
				// the extension of the floating promo lands here once it is loaded
				floatingPromoModule: null,
			};

			this.getTestId = createTestIdGenerator({
				prefix: MORE_MENU_TEST_ID,
			});

			this.handleUserCountersUpdate = this.handleUserCountersUpdate.bind(this);
			this.handleWhatsNewCounterUpdate = this.handleWhatsNewCounterUpdate.bind(this);
			this.handleFloatingBannerCollapseStarted = this.handleFloatingBannerCollapseStarted.bind(this);
			this.processUsersDebaunced = debounce(this.processUsers.bind(this), 500);
		}

		/**
		 * @public
		 * @return {array}
		 */
		static getDefaultMenuList()
		{
			return [];
		}

		/**
		 * @param {array} defaultList
		 * @param {array} serverList
		 * @return {array}
		 */
		static prepareMenuList(defaultList, serverList)
		{
			if (!Type.isArrayFilled(serverList))
			{
				return defaultList;
			}

			const mergedSections = defaultList.map((defaultSection) => {
				const serverSection = serverList.find((section) => section.id === defaultSection.id);

				return this.mergeSection(defaultSection, serverSection);
			});

			const additionalServerSections = serverList
				.filter((serverSection) => !defaultList.some(
					(defaultSection) => defaultSection.id === serverSection.id,
				));

			const allSections = [...mergedSections, ...additionalServerSections];

			return allSections.sort((a, b) => (a?.sort || 0) - (b?.sort || 0));
		}

		/**
		 * @param {object} defaultSection
		 * @param {object|null} serverSection
		 * @return {object}
		 */
		static mergeSection(defaultSection, serverSection)
		{
			const defaultItems = Array.isArray(defaultSection.items) ? defaultSection.items : [];
			const serverItems = Array.isArray(serverSection?.items) ? serverSection?.items : [];

			const combinedItems = [...defaultItems, ...serverItems];
			const uniqueItems = this.removeDuplicateItems(combinedItems);

			return {
				...defaultSection,
				...serverSection,
				hidden: uniqueItems.length === 0,
				items: uniqueItems.sort((a, b) => (a?.sort || 0) - (b?.sort || 0)),
			};
		}

		/**
		 * @param {array} items
		 * @return {array}
		 */
		static removeDuplicateItems(items)
		{
			const seenIds = new Set();

			return items.reduce((acc, item) => {
				if (item.id && !seenIds.has(item.id))
				{
					seenIds.add(item.id);
					acc.push(item);
				}

				return acc;
			}, []);
		}

		get currentTheme()
		{
			return applyAppearanceTextColorMode(this.state.currentTheme, this.state.appearanceTextColorMode);
		}

		loadAppearanceTextColorMode()
		{
			void resolveAppearanceTextColorMode().then((appearanceTextColorMode) => {
				this.applyAppearanceTextColorMode(appearanceTextColorMode);
			});
		}

		applyAppearanceTextColorMode(appearanceTextColorMode)
		{
			if (this.isComponentMounted)
			{
				this.setState({ appearanceTextColorMode });
			}
		}

		componentDidMount()
		{
			this.isComponentMounted = true;

			// The scale of the app font is stored as the menu opens, and not on the path of the promo that
			// reads it: the other consumer, the section of the company, states the height of its card in a
			// context of its own, and the menu is the only way into it. A failed read leaves what is stored.
			this.appFontScaleStored = storeAppFontScale().catch(console.error);

			this.loadMenuList(false, true)
				.then(() => {
					SearchList.setListeners({
						getMenuList: () => [...this.state.menuList, ...SETTINGS_SECTIONS],
						layout: this.layout,
						testId: this.getTestId('search-list'),
						rightButtons: [this.buildMoreButton()],
					});

					if (this.isComponentMounted && this.state.ahaMoment)
					{
						this.tryToOpenAhaMoment();
					}
					else if (this.state.shouldShowPresetBanner)
					{
						this.showToolUsageBanner();
					}
				})
				.catch((error) => console.error(error));

			BX.addCustomEvent('onUpdateUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('onSetUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('MoreMenu::Reload', this.reloadMenu);

			this.loadAppearanceTextColorMode();

			this.unsubscribeFromAppearanceTextColorModeChange = subscribeToAppearanceTextColorModeChange(
				() => this.state.appearanceTextColorMode,
				(appearanceTextColorMode) => this.applyAppearanceTextColorMode(appearanceTextColorMode),
			);
		}

		componentWillUnmount()
		{
			this.isComponentMounted = false;
			// the instance outlives its unmount, and the promo of the next mount is built expanded anew:
			// the stub goes back with it, or it would hold the collapsed room under an expanded card
			this.floatingPromoCollapsed = false;
			this.ahaMomentCompletionCallback?.();
			this.ahaMomentCompletionCallback = null;
			this.props.onUnmount?.(this);

			BX.removeCustomEvent('onUpdateUserCounters', this.handleUserCountersUpdate);
			BX.removeCustomEvent('onSetUserCounters', this.handleUserCountersUpdate);
			BX.removeCustomEvent('MoreMenu::Reload', this.reloadMenu);

			this.unsubscribeFromAppearanceTextColorModeChange?.();
			this.unsubscribeFromAppearanceTextColorModeChange = null;
		}

		showAhaMoment = (componentName, ahaMoment = this.state.ahaMoment) => {
			if (componentName !== MORE_MENU_TEST_ID)
			{
				return false;
			}

			let isCompleted = false;
			const onComplete = () => {
				if (isCompleted)
				{
					return;
				}

				isCompleted = true;
				if (this.ahaMomentCompletionCallback === onComplete)
				{
					this.ahaMomentCompletionCallback = null;
				}

				BX.postComponentEvent('BackgroundUIManager::onCloseActiveComponent', []);
			};
			const canShow = () => !isCompleted;
			this.ahaMomentCompletionCallback = onComplete;

			if (!PageManager.getNavigator().isVisible())
			{
				onComplete();

				return false;
			}

			showAhaMoment(ahaMoment, this.menuNavigator, onComplete, canShow, this.layout);

			return true;
		};

		tryToOpenAhaMoment = () => {
			this.props.requestAhaMoment?.(this.state.ahaMoment);
		};

		handleUserCountersUpdate(newCounters)
		{
			const { counters = {} } = this.state;

			if (newCounters[env.siteId])
			{
				const mergedCounters = { ...counters, ...newCounters[env.siteId] };

				if (!isEqual(counters, mergedCounters))
				{
					this.setState({ counters: mergedCounters }, () => {
						this.updateMoreBadge();
					});
				}
			}
		}

		handleWhatsNewCounterUpdate(whatsNewCounter)
		{
			const nextCounter = Type.isNumber(whatsNewCounter) && whatsNewCounter > 0 ? whatsNewCounter : 0;

			if (nextCounter === this.state.whatsNewCounter)
			{
				this.updateMoreBadge(nextCounter);

				return;
			}

			this.setState({ whatsNewCounter: nextCounter }, () => this.updateMoreBadge(nextCounter));
		}

		updateMoreBadge(whatsNewCounter = null)
		{
			const { menuList, counters } = this.state;

			updateMenuBadgeCounter(menuList, counters, whatsNewCounter);
		}

		buildMoreButton()
		{
			return {
				id: 'menu_more',
				type: 'more',
				callback: () => {
					const items = [
						{
							id: 'switch_account',
							iconName: 'log_out',
							title: Loc.getMessage('MENU_BITRIX24_SECTION_CHANGE_PORTAL'),
							sectionCode: '0',
						},
					];

					this.popup = dialogs.createPopupMenu();
					this.popup.setData(items, [{ id: '0' }]);
					this.popup.on('itemSelected', (item) => {
						if (item?.id === 'switch_account')
						{
							Application.exit();
						}
					});
					this.popup.show();
				},
			};
		}

		get layout()
		{
			return this.props.layout;
		}

		render()
		{
			const {
				loading,
				menuList,
				currentShift,
				user,
				restrictions,
				isNewCheckInEnabled,
			} = this.state;
			const { currentTheme } = this;

			if (loading && menuList.length === 0)
			{
				this.giveFloatingPromoRoomBack();

				return View(
					{
						style: {
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
						},
						testId: `AppTheme:${AppTheme.id}`,
					},
					new LoadingScreenComponent({
						backgroundColor: Color.bgContentPrimary.toHex(Feature.canUseWidgetBackground() ? 0 : 1),
					}),
				);
			}

			const floatingBanner = this.renderFloatingBanner();

			return View(
				{
					style: {
						backgroundColor: Color.bgContentSecondary.toHex(Feature.canUseWidgetBackground() ? 0 : 1),
					},
					testId: `AppTheme:${AppTheme.id}`,
				},
				this.renderSubstrateTop(),
				this.renderSubstrateBottom(),
				RefreshView(
					{
						refreshing: loading,
						onRefresh: this.onRefresh,
						style: {
							flex: 1,
						},
						ref: (ref) => {
							if (ref)
							{
								RefRegistry.register(MORE_MENU_REFRESH_VIEW_REF_KEY, ref);
							}
						},
					},
					View(
						{
							// under the floating layer the column pays no bottom padding of its own: the stub
							// inside it already holds the room the layer takes
							style: {
								backgroundColor: Color.bgContentPrimaryInvert.toHex(Feature.canUseWidgetBackground() ? 0 : 1),
								paddingBottom: floatingBanner ? 0 : Indent.XL3.toNumber(),
							},
						},
						new MoreMenuHeader({
							testId: this.getTestId('header'),
							canOpenProfile: restrictions?.canOpenProfile ?? true,
							canEditProfile: restrictions?.canEditProfile,
							canUseTimeMan: restrictions?.canUseTimeMan,
							canUseCheckIn: restrictions?.canUseCheckIn,
							isNewCheckInEnabled,
							currentShift,
							userId: user?.id,
							currentTheme,
						}),
						this.renderCompanyPanel(),
						this.renderToolsPanel(),
						this.renderSettingsPanel(),
						floatingBanner ? this.renderFloatingStub() : null,
					),
				),
				floatingBanner,
			);
		}

		/**
		 * The floating layer is the last child of the root view: the order in the tree already gives the overlap.
		 * @returns {?object}
		 */
		renderFloatingBanner()
		{
			const { floatingPromo, restrictions, floatingPromoModule } = this.state;

			// no section - no promo at all; with one, the invite promo still answers to its own rollout flag
			// and to the right to invite
			if (!restrictions?.canUseMyCompany || !floatingPromo?.usersBannerEnabled || !restrictions?.canInvite)
			{
				this.giveFloatingPromoRoomBack();

				return null;
			}

			if (!floatingPromoModule)
			{
				this.loadFloatingBanner();

				return null;
			}

			return floatingPromoModule.UsersFloatingBanner({
				testId: this.getTestId('floating-promo-users'),
				layout: this.layout,
				onCollapseStarted: this.handleFloatingBannerCollapseStarted,
			});
		}

		/**
		 * The promo is a rare guest of the menu - it needs the section, the rollout flag and the right to
		 * invite - so its extension is loaded on demand instead of weighing on every opening of the menu. It
		 * mounts once the import is over, the way the stub follows it once its height is known.
		 */
		loadFloatingBanner()
		{
			if (this.floatingPromoRequested || this.floatingPromoFailed)
			{
				return;
			}

			this.floatingPromoRequested = true;

			// The extension of the promo states the height of its card off the scale of the app font the
			// moment it loads, and that scale is read from the native side as the menu opens: an import
			// that overtook the read would hold the height of the normal scale until this context is built
			// anew. No loading indicator either way: the promo is not what the screen is opened for.
			void this.whenAppFontScaleStored()
				.then(() => requireLazy('more-menu/block/company/users-floating-banner', false))
				.then((promoModule) => {
					if (!promoModule)
					{
						// A failed import is held rather than retried on the spot: the re-renders of the menu
						// are driven by its counters and would spend an import on every one of them. The next
						// load of the menu data asks for it again, see retryFailedFloatingBanners.
						this.floatingPromoRequested = false;
						this.floatingPromoFailed = true;

						return;
					}

					if (!this.isComponentMounted)
					{
						// The import outlived the screen, and the instance survives its unmount, so it can
						// be mounted again: the request is taken back, otherwise the guard above would keep
						// the promo away from the very same instance for good.
						this.floatingPromoRequested = false;

						return;
					}

					this.setState({ floatingPromoModule: promoModule });
				})
			;
		}

		/**
		 * The read of the scale of the app font the mount has started, waited for no longer than the
		 * give-up delay: a native read that never answers must not cost the promo altogether. Before the
		 * mount there is no read to wait for, and the scale of the launch before is what is stored.
		 * @returns {Promise<void>}
		 */
		whenAppFontScaleStored()
		{
			if (!this.appFontScaleStored)
			{
				return Promise.resolve();
			}

			return Promise.race([
				this.appFontScaleStored,
				new Promise((resolve) => {
					setTimeout(resolve, APP_FONT_SCALE_GIVE_UP_DELAY);
				}),
			]);
		}

		/**
		 * A promo left out by a lost connection comes back with the next load of the menu data - the screen
		 * is asking for its own data anyway - instead of waiting for the screen to be built anew: the
		 * instance outlives its unmount, so the loss would otherwise last as long as the app does.
		 */
		retryFailedFloatingBanners()
		{
			this.floatingPromoFailed = false;
		}

		/**
		 * The room the stub holds belongs to the promo that is really on the screen. Whichever way the
		 * banner leaves it - a load of the data that takes the right to invite away, a screen fallen back
		 * to its loader - the collapsed room goes back with it: the promo built after that is expanded
		 * anew, and the stub would otherwise hold the collapsed room under an expanded card.
		 */
		giveFloatingPromoRoomBack()
		{
			this.floatingPromoCollapsed = false;
		}

		/**
		 * Keeps the tail of the menu clear of the floating layer. The room is the one the banner states of
		 * itself, so the stub holds it from the very frame the banner appears in and never starts at zero.
		 * @returns {object}
		 */
		renderFloatingStub()
		{
			const { UsersFloatingBannerReserve: reserve } = this.state.floatingPromoModule;

			return View({
				ref: (ref) => {
					this.floatingStubRef = ref;
				},
				style: {
					width: '100%',
					height: this.floatingPromoCollapsed ? reserve.collapsed : reserve.expanded,
				},
			});
		}

		/**
		 * The stub goes to the other number of the banner the moment the transition starts, and over the
		 * duration of that very transition: a time of its own would have the stub and the promo move apart.
		 * Which of the two numbers is the taller one is none of the menu's business.
		 *
		 * @param {{ duration: number }} params
		 */
		handleFloatingBannerCollapseStarted({ duration })
		{
			const { UsersFloatingBannerReserve: reserve } = this.state.floatingPromoModule;

			this.floatingPromoCollapsed = true;

			void animate(this.floatingStubRef, { duration, height: reserve.collapsed });
		}

		renderCompanyPanel()
		{
			const {
				employees,
				companyName,
				supportBotId,
				supportBanners,
				tariffPlate,

				restrictions,
				helpdeskUrl,
				counters,
			} = this.state;

			return new MoreMenuCompany({
				testId: this.getTestId('company'),
				employees,
				companyName,
				supportBotId,
				supportBanners,
				tariffPlate,
				layout: this.layout,
				canUseSupport: restrictions?.canUseSupport,
				canInvite: restrictions?.canInvite,
				canUseTelephony: restrictions?.canUseTelephony,
				shouldShowWhatsNew: restrictions?.shouldShowWhatsNew,
				canUseMyCompany: restrictions?.canUseMyCompany,
				helpdeskUrl,
				counters,
				onWhatsNewCounterChange: this.handleWhatsNewCounterUpdate,
			});
		}

		renderToolsPanel()
		{
			const { menuList, counters } = this.state;

			if (!this.shouldShowToolsPanel(menuList))
			{
				return null;
			}

			return MoreMenuPanel(
				{
					testId: this.getTestId('tools-panel'),
					title: Loc.getMessage('MENU_TOOLS_PANEL_TITLE'),
					children: [
						new ToolsList({
							testId: this.getTestId('tools-list'),
							menuList,
							counters,
						}),
					],
				},
			);
		}

		shouldShowToolsPanel(menuList)
		{
			return menuList.some((section) => section?.items.length > 0);
		}

		renderSettingsPanel()
		{
			const { counters, restrictions = {} } = this.state;
			const {
				canUseSecuritySettings,
				canUseTabPresetSettings,
				canUseNotificationSettings,
				canGoToWeb,
				canLoginOnOtherDevice,
			} = restrictions;

			return MoreMenuPanel(
				{
					testId: this.getTestId('settings-panel'),
					title: Loc.getMessage('MENU_SETTINGS_PANEL_TITLE'),
					children: [
						new SettingsList({
							testId: this.getTestId('settings-list'),
							canUseSecuritySettings,
							canUseTabPresetSettings,
							canUseNotificationSettings,
							canGoToWeb,
							canLoginOnOtherDevice,
							counters,
						}),
					],
				},
			);
		}

		renderSubstrateTop()
		{
			return View(
				{
					style: {
						position: 'absolute',
						width: '100%',
						height: '50%',
						top: 0,
						backgroundColor: Color.bgContentPrimary.toHex(Feature.canUseWidgetBackground() ? 0 : 1),
					},
				},
			);
		}

		renderSubstrateBottom()
		{
			return View(
				{
					style: {
						position: 'absolute',
						width: '100%',
						height: '50%',
						bottom: 0,
						backgroundColor: Color.bgContentPrimaryInvert.toHex(Feature.canUseWidgetBackground() ? 0 : 1),
					},
				},
			);
		}

		onRefresh = () => {
			Haptics.impactLight();

			return this.loadMenuList(true, false)
				.catch((error) => console.error(error));
		};

		reloadMenu = () => this.loadMenuList(true, false);

		loadMenuList = (forceRefresh = false, useCache = true) => {
			this.retryFailedFloatingBanners();

			return new Promise((resolve, reject) => {
				this.setState(
					{ loading: true },
					() => {
						const request = new RunActionExecutor(
							MENU_LIST_ACTION_NAME,
							{
								forceRefresh: forceRefresh ? 1 : 0,
								userId: env.userId,
								siteId: env.siteId,
							},
						)
							.setCacheId(getMenuCacheId())
							.setCacheTtl(SECONDS_IN_DAY)
							.setCacheHandler((cachedData) => {
								const { preparedMenuList, state } = MoreMenu.mapResponseData(cachedData.data || {});
								this.menuNavigator.update(preparedMenuList, state.restrictions);
								const {
									currentShift,
									workTime,
									shouldShowPresetBanner,
									...cachedState
								} = state;

								this.processUsersDebaunced(cachedData?.data);
								dispatchManualCheckIns(cachedData?.data?.manualCheckIns);
								this.setState({ ...cachedState, counters: {} });
							})
							.setHandler((response) => {
								if (response?.status !== 'success')
								{
									const preparedMenuList = this.state.menuList.length > 0
										? this.state.menuList
										: MoreMenu.getDefaultMenuList();

									this.setState({
										menuList: preparedMenuList,
										loading: false,
									});

									reject(new Error('Invalid response status'));

									return;
								}

								const { preparedMenuList, state } = MoreMenu.mapResponseData(response.data || {});
								this.menuNavigator.update(preparedMenuList, state.restrictions);

								const canInvite = state.restrictions?.canInvite;

								const counters = getMenuCounters(canInvite);

								this.processUsersDebaunced(response?.data);
								dispatchManualCheckIns(response?.data?.manualCheckIns);

								this.setState({ ...state, counters }, () => {
									this.updateMoreBadge();
									resolve();
								});
							});

						request.call(useCache).catch(console.error);
					},
				);
			});
		};

		processUsers(data)
		{
			const users = [];

			const user = data?.user;
			if (!isEmpty(user))
			{
				users.push(user);
			}

			const companyUsers = data?.company?.employees?.users || [];
			if (!isEmpty(companyUsers))
			{
				users.push(...companyUsers);
			}

			if (users.length > 0)
			{
				dispatch(usersUpserted(users));
			}
		}

		static mapResponseData(data)
		{
			const defaultList = MoreMenu.getDefaultMenuList();
			const menuListRaw = data.menuList || [];
			const preparedMenuList = MoreMenu.prepareMenuList(defaultList, menuListRaw);

			const state = {
				loading: false,

				user: data.user || null,
				menuList: preparedMenuList,
				currentShift: data.currentShift || null,
				isNewCheckInEnabled: data.isNewCheckInEnabled || false,
				// the company block of the answer: what the menu draws of it depends on the section being
				// on, so the block comes as one field and the menu picks what it needs out of it
				employees: data.company?.employees || null,
				// the entry plate of the "My company" section is the only reader of the portal line of the
				// answer, and it shows the name alone; while the section is off the name comes empty
				companyName: data.portal?.name || '',
				helpdeskUrl: data.helpdeskUrl || null,
				supportBotId: data.supportBotId || 0,
				supportBanners: data.supportBanners || null,
				tariffPlate: data.company?.tariffPlate || null,
				floatingPromo: data.company?.floatingPromo || null,
				restrictions: data.restrictions || {},
				ahaMoment: data.ahaMoment || null,
				currentTheme: data.currentTheme || null,
				shouldShowPresetBanner: data.shouldShowPresetBanner || false,
			};

			return {
				preparedMenuList,
				state,
			};
		}

		async showToolUsageBanner()
		{
			const { ToolUsageBanner } = await requireLazy('layout/ui/tool-usage-banner', false).catch((error) => {
				console.log('requireLazy tool-usage-banner', error);
			});

			if (ToolUsageBanner)
			{
				ToolUsageBanner.open(this.layout, true);
			}
		}
	}

	MoreMenu.propTypes = {
		layout: PropTypes.object.isRequired,
		menuNavigator: PropTypes.instanceOf(MenuNavigator),
		counters: PropTypes.object,
		requestAhaMoment: PropTypes.func,
		onUnmount: PropTypes.func,
	};

	module.exports = { MoreMenu };
});
