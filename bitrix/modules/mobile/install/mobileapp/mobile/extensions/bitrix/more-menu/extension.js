/**
 * @module more-menu
 */
jn.define('more-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Color, Indent } = require('tokens');
	const { Haptics } = require('haptics');

	const { MoreMenuHeader } = require('more-menu/block/header');
	const { ToolsList } = require('more-menu/block/tools-list');
	const { SettingsList, SETTINGS_SECTIONS } = require('more-menu/block/settings-list');
	const { MoreMenuCompany } = require('more-menu/block/company');

	const { showAhaMoment } = require('more-menu/aha-moment');
	const { SearchList } = require('more-menu/search-list');
	const { MenuNavigator } = require('more-menu/navigator');
	const { MoreMenuPanel } = require('more-menu/ui/panel');
	const {
		getMenuCounters,
		updateMenuBadgeCounter,
	} = require('more-menu/utils');

	const { LoadingScreenComponent } = require('layout/ui/loading-screen');

	const { RunActionExecutor } = require('rest/run-action-executor');

	const { usersUpserted } = require('statemanager/redux/slices/users');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const { PropTypes } = require('utils/validation');

	const { createTestIdGenerator } = require('utils/test');
	const { isEmpty, isEqual } = require('utils/object');
	const { debounce } = require('utils/function');

	const MENU_LIST_ACTION_NAME = 'mobile.Menu.getMenu';
	const SECONDS_IN_DAY = 86400;
	const MORE_MENU_TEST_ID = 'more-menu';

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

			this.state = {
				menuList: [],
				loading: true,
				counters: {},
			};

			this.getTestId = createTestIdGenerator({
				prefix: MORE_MENU_TEST_ID,
			});

			this.handleUserCountersUpdate = this.handleUserCountersUpdate.bind(this);
			this.handleWhatsNewCounterUpdate = this.handleWhatsNewCounterUpdate.bind(this);
			this.processUsersDebaunced = debounce(this.processUsers.bind(this), 300);
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
		static prepareMenuList(defaultList, serverList) {
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
		static mergeSection(defaultSection, serverSection) {
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
		static removeDuplicateItems(items) {
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

		componentDidMount()
		{
			this.loadMenuList(false, true)
				.then(() => {
					SearchList.setListeners({
						getMenuList: () => [...this.state.menuList, ...SETTINGS_SECTIONS],
						layout: this.layout,
						testId: this.getTestId('search-list'),
						rightButtons: [this.buildMoreButton()],
					});

					if (this.state.ahaMoment)
					{
						this.tryToOpenAhaMoment();
					}
				})
				.catch((error) => console.error(error));

			BX.addCustomEvent('onUpdateUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('onSetUserCounters', this.handleUserCountersUpdate);
			BX.addCustomEvent('BackgroundUIManager::openComponentInAnotherContext', this.showAhaMoment);
		}

		componentWillUnmount()
		{
			BX.removeCustomEvent('onUpdateUserCounters', this.handleUserCountersUpdate);
			BX.removeCustomEvent('onSetUserCounters', this.handleUserCountersUpdate);
		}

		showAhaMoment = (componentName) => {
			if (componentName === MORE_MENU_TEST_ID && PageManager.getNavigator().isVisible())
			{
				showAhaMoment(this.state.ahaMoment, this.menuNavigator);
			}
		};

		tryToOpenAhaMoment = () => {
			BX.postComponentEvent(
				'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
				[
					{
						componentName: MORE_MENU_TEST_ID,
						priority: 500,
					},
				],
			);
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
			this.updateMoreBadge(whatsNewCounter);
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
				workTime,
				user,
				currentTheme,
				restrictions,
			} = this.state;

			if (loading && menuList.length === 0)
			{
				return View(
					{
						style: {
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					new LoadingScreenComponent({
						backgroundColor: Color.bgContentPrimary.toHex(),
					}),
				);
			}

			return View(
				{
					style: {
						backgroundColor: Color.bgContentSecondary.toHex(),
					},
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
					},
					View(
						{
							style: {
								backgroundColor: Color.bgContentPrimaryInvert.toHex(),
								paddingBottom: Indent.XL3.toNumber(),
							},
						},
						new MoreMenuHeader({
							testId: this.getTestId('header'),
							canEditProfile: restrictions?.canEditProfile,
							canUseTimeMan: restrictions?.canUseTimeMan,
							canUseCheckIn: restrictions?.canUseCheckIn,
							canManageWorkTimeOnMobile: restrictions?.canManageWorkTimeOnMobile,
							currentShift,
							workTime,
							userId: user?.id,
							currentTheme,
						}),
						this.renderCompanyPanel(),
						this.renderToolsPanel(),
						this.renderSettingsPanel(restrictions?.canUseSecuritySettings),
					),
				),
			);
		}

		renderCompanyPanel()
		{
			const {
				company,
				supportBotId,

				restrictions,
				helpdeskUrl,
				counters,
			} = this.state;

			return new MoreMenuCompany({
				testId: this.getTestId('company'),
				company,
				supportBotId,
				layout: this.layout,
				canUseSupport: restrictions?.canUseSupport,
				canInvite: restrictions?.canInvite,
				canUseTelephony: restrictions?.canUseTelephony,
				shouldShowWhatsNew: restrictions?.shouldShowWhatsNew,
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

		renderSettingsPanel(canUseSecuritySettings)
		{
			const { counters } = this.state;

			return MoreMenuPanel(
				{
					testId: this.getTestId('settings-panel'),
					title: Loc.getMessage('MENU_SETTINGS_PANEL_TITLE'),
					children: [
						new SettingsList({
							testId: this.getTestId('settings-list'),
							canUseSecuritySettings,
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
						backgroundColor: Color.bgContentPrimary.toHex(),
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
						backgroundColor: Color.bgContentPrimaryInvert.toHex(),
					},
				},
			);
		}

		onRefresh = () => {
			Haptics.impactLight();

			return this.loadMenuList(true, false)
				.catch((error) => console.error(error));
		};

		loadMenuList = (forceRefresh = false, useCache = true) => {
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
							.setCacheId(`mobile-more-menu${env.userId}`)
							.setCacheTtl(SECONDS_IN_DAY)
							.setCacheHandler((cachedData) => {
								const { preparedMenuList, state } = MoreMenu.mapResponseData(cachedData.data || {});
								this.menuNavigator.update(preparedMenuList, state.restrictions);
								const {
									currentShift,
									workTime,
									...cachedState
								} = state;

								this.processUsersDebaunced(cachedData?.data);
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

								this.setState({ ...state, counters }, () => {
									this.updateMoreBadge();
									resolve();
								});
							});

						request.call(useCache);
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

			const companyUsers = data?.company?.users || [];
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
				workTime: data.workTime || null,
				company: data.company || null,
				helpdeskUrl: data.helpdeskUrl || null,
				supportBotId: data.supportBotId || 0,
				restrictions: data.restrictions || {},
				ahaMoment: data.ahaMoment || null,
				currentTheme: data.currentTheme || null,
			};

			return {
				preparedMenuList,
				state,
			};
		}
	}

	MoreMenu.propTypes = {
		layout: PropTypes.object.isRequired,
		menuNavigator: PropTypes.instanceOf(MenuNavigator),
		counters: PropTypes.object,
	};

	module.exports = { MoreMenu };
});
