/**
 * @module tab-presets/src/legacy/tab-presets-component
 */
jn.define('tab-presets/src/legacy/tab-presets-component', (require, exports, module) => {
	const TabPresetsNewUtils = require('tab-presets/src/utils');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { PresetInfo } = require('tab-presets/src/preset-info');
	const { PresetManualMenu } = require('tab-presets/src/preset-manual/manual-menu');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text3, Text7 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { Alert } = require('alert');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { clone } = require('utils/object');
	const { PresetBanner } = require('tab-presets/src/banners');
	const { Tourist } = require('tourist');
	const { ToolUsage } = require('tool-usage');
	const { Avatar, AvatarEntityType } = require('ui-system/blocks/avatar');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsRole,
	} = require('tab-presets/src/analytics');

	const ITEM_KEY_MANUAL = 'manual';
	const ITEM_KEY_MENU = 'menu';
	const ITEM_TYPE_BANNER = 'banner';

	/**
	 * @extends {LayoutComponent<LegacyTabPresetsComponentProps, LegacyTabPresetsComponentState>}
	 */
	class TabPresetsComponent extends LayoutComponent
	{
		/**
		 * @param {LegacyTabPresetsComponentProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				shouldShowBanner: Tourist.firstTime('show_tab_presets_banner'),
			};

			TabPresetsNewUtils.getPresetGetDataRequestExecutor()
				.setCacheHandler((result) => {
					if (result)
					{
						this.updateState(result.data, true);
					}
				})
				.call(true)
				.then((result) => this.updateState(result.data, true))
				.catch(() => Notify.alert(Loc.getMessage('TAB_PRESETS_NEW_ERROR'), '', 'OK'))
			;
		}

		/** @return {void} */
		componentDidMount()
		{
			this.setUserVisitedTabPresets();
			PresetBottomMenuAnalytics.send({
				event: PresetBottomMenuAnalyticsEvent.OPEN_SECTION,
				role: PresetBottomMenuAnalyticsRole.EMPLOYEE,
			});
		}

		/** @return {void} */
		setUserVisitedTabPresets()
		{
			if (Tourist.firstTime('visited_tab_presets'))
			{
				Tourist.remember('visited_tab_presets')
					.then(() => {
						BX.postComponentEvent('onSetUserCounters', [
							{
								[String(env.siteId)]: { menu_tab_presets: 0 },
							},
						]);
					})
					.catch(console.error)
				;
			}
		}

		/**
		 * @param {LegacyTabPresetsData} newState
		 * @param {boolean} init
		 * @return {void}
		 */
		updateState(newState, init = false)
		{
			const presets = newState.presets;

			if (init)
			{
				presets.list = TabPresetsNewUtils.getSortedPresets(presets.list, presets.current);
			}

			this.setState({
				presets,
				tabs: newState.tabs,
			});
		}

		/** @return {LayoutComponent} */
		render()
		{
			return Box(
				{
					testId: this.testId,
					style: {
						flex: 1,
					},
				},
				this.renderContent(),
			);
		}

		/** @return {LayoutComponent} */
		renderContent()
		{
			if (!this.state.presets)
			{
				return new LoadingScreenComponent({
					showAirStyle: true,
					testId: `${this.testId}_loading_screen`,
				});
			}

			return AreaList(
				{
					style: {
						flex: 1,
					},
					withScroll: false,
					testId: `${this.testId}-area-list`,
				},
				this.#renderBanner(),
				this.#renderList(),
			);
		}

		/** @return {LayoutComponent} */
		#renderBanner()
		{
			return Area(
				{
					isFirst: true,
					excludePaddingSide: {
						bottom: true,
					},
				},
				PresetBanner({
					testId: this.testId,
				}),
			);
		}

		/** @return {LayoutComponent} */
		#renderList()
		{
			return Area(
				{
					excludePaddingSide: {
						horizontal: true,
						bottom: true,
					},
					style: {
						flex: 1,
					},
				},
				ListView({
					ref: (ref) => {
						this.listRef = ref;
					},
					style: {
						flex: 1,
					},
					isRefreshing: false,
					dragInteractionEnabled: false,
					data: [
						{ items: this.getListViewItems() },
					],
					renderItem: this.#renderListItem,
				}),
			);
		}

		/** @return {Array<TabPresetListItem>} */
		getListViewItems()
		{
			const allPresetItems = this.#getPresetItems();
			const selectedPreset = allPresetItems.find((item) => item.isSelected);
			const otherPresets = allPresetItems
				.filter((item) => !item.isSelected)
				.sort((a, b) => (a?.sort ?? 1000) - (b?.sort ?? 1000));

			const items = [
				selectedPreset,
				...otherPresets,
			].filter(Boolean);

			const firstPresetIndex = items.findIndex((item) => item.type !== ITEM_TYPE_BANNER);

			return items.map((item, index) => {
				if (item.type === ITEM_TYPE_BANNER)
				{
					return item;
				}

				return {
					...item,
					isFirst: index === firstPresetIndex,
				};
			});
		}

		/** @return {Array<TabPresetListItem>} */
		#getPresetItems()
		{
			const { presets } = this.state;

			return Object.keys(presets.list).map((key, index) => ({
				...presets.list[key],
				key,
				type: key,
				isFirst: index === 0,
				isSelected: this.isPresetSelected(key),
			}));
		}

		/**
		 * @param {TabPresetListItem} preset
		 * @return {LayoutComponent}
		 */
		#renderListItem = (preset) => {
			const { type } = preset;

			if (type === ITEM_TYPE_BANNER)
			{
				return this.#renderBanner();
			}

			return this.#renderItem(preset);
		};

		/**
		 * @param {TabPresetListItem} preset
		 * @return {LayoutComponent}
		 */
		#renderItem(preset)
		{
			const {
				title,
				key: presetId,
				tabsDescription,
				isFirst,
			} = preset;

			const isSelected = this.isPresetSelected(presetId);
			const isManual = this.isPresetManual(presetId);

			return View(
				{
					style: {
						paddingTop: (isFirst ? Component.cardListPaddingTb.toNumber() : 0),
						paddingBottom: Component.cardListGap.toNumber(),
						paddingHorizontal: Component.areaPaddingLr.toNumber(),
					},
				},
				Card(
					{
						excludePaddingSide: {
							horizontal: true,
						},
						design: CardDesign.PRIMARY,
						hideCross: true,
						border: true,
						accent: isSelected,
						testId: `${this.testId}-preset-${presetId}`,
						onClick: async () => {
							if (isManual)
							{
								void this.openPresetManualMenu(preset.tabs);
							}
							else
							{
								await TabPresetsNewUtils.preloadPresetInfoImage(presetId).catch(console.error);
								PresetInfo.show({
									tabsDescription,
									presetTitle: title,
									presetImagePath: TabPresetsNewUtils.getPresetInfoImagePath(presetId),
									isPresetSelected: isSelected,
									tabsIcons: Object.fromEntries(
										Object.keys(tabsDescription).map((tabName) => {
											return [tabName, this.getTabItemData(tabName).iconId];
										}),
									),
									parentWidget: this.props.parentWidget,
									testId: `${this.testId}_preset_${presetId}_info`,
									onPresetSelected: () => this.setPreset(presetId),
								});
							}
						},
					},
					this.renderPresetHeader(presetId, preset),
					this.renderPresetTabs(presetId, preset),
				),
			);
		}

		/**
		 * @param {TabPresetId} presetId
		 * @param {{ title?: string, tabs?: TabPresetConfig }} preset
		 * @return {LayoutComponent}
		 */
		renderPresetHeader(presetId, { title, tabs })
		{
			const presetTitle = !title && this.isPresetManual(presetId)
				? Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE')
				: title;

			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						paddingHorizontal: Indent.XL2.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
					},
					testId: `${this.testId}_preset_${presetId}_header`,
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					this.isPresetManual(presetId) && IconView({
						style: {
							marginRight: Indent.XS2.toNumber(),
						},
						icon: Icon.PERSON,
						color: Color.accentMainPrimary,
						size: 20,
					}),
					Text3({
						style: {
							flexShrink: 1,
							borderBottomWidth: 1,
							borderBottomColor: Color.base5.toHex(),
							borderStyle: 'dash',
						},
						testId: `${this.testId}_preset_${presetId}_title`,
						accent: true,
						numberOfLines: 1,
						ellipsize: 'end',
						text: presetTitle,
					}),
					!this.isPresetManual(presetId) && IconView({
						style: {
							marginLeft: Indent.XS2.toNumber(),
						},
						testId: `${this.testId}_preset_${presetId}_hint`,
						icon: Icon.QUESTION,
						color: Color.base4,
						size: 20,
					}),
				),
				this.renderPresetButton(presetId, tabs),
			);
		}

		/**
		 * @param {TabPresetId} presetId
		 * @param {TabPresetConfig} [presetConfig]
		 * @return {LayoutComponent}
		 */
		renderPresetButton(presetId, presetConfig)
		{
			const isSelected = this.isPresetSelected(presetId);
			const isManual = this.isPresetManual(presetId);

			return ChipButton({
				style: {
					marginLeft: Indent.XL.toNumber(),
				},
				testId: `${this.testId}_preset_${presetId}_button`,
				compact: true,
				design: (isSelected ? ChipButtonDesign.PRIMARY : ChipButtonDesign.BLACK),
				mode: (isSelected ? ChipButtonMode.SOLID : ChipButtonMode.OUTLINE),
				text: (
					isSelected
						? Loc.getMessage(isManual ? 'TAB_PRESETS_NEW_EDIT' : 'TAB_PRESETS_NEW_SELECTED')
						: Loc.getMessage('TAB_PRESETS_NEW_SELECT')
				),
				onClick: () => this.onPresetSelected(presetId, presetConfig),
			});
		}

		/**
		 * @param {TabPresetId} presetId
		 * @param {{ tabs: TabPresetConfig }} preset
		 * @return {LayoutComponent}
		 */
		renderPresetTabs(presetId, { tabs })
		{
			const tabKeys = this.isPresetManual(presetId)
				? PresetManualMenu.getActiveItemKeys(this.state.tabs, tabs)
				: Object.entries(tabs).sort((a, b) => a[1] - b[1]).map(([key]) => key);

			return View(
				{
					style: {
						flexDirection: 'row',
						marginTop: Indent.XL3.toNumber(),
						marginHorizontal: Indent.XL.toNumber(),
					},
					testId: `${this.testId}_preset_${presetId}_tabs`,
				},
				...tabKeys.map((key, index) => (
					this.renderPresetTabsItem(key, this.isPresetSelected(presetId), index === 0)
				)),
			);
		}

		/**
		 * @param {string} tabName
		 * @param {boolean} isSelected
		 * @param {boolean} isFirst
		 * @return {LayoutComponent|null}
		 */
		renderPresetTabsItem(tabName, isSelected = false, isFirst = false)
		{
			const tabItem = this.getTabItemData(tabName);
			if (!tabItem)
			{
				return null;
			}

			const isAvatarTab = tabName === ITEM_KEY_MENU && tabItem.isAvatarEnabled;

			return View(
				{
					style: {
						flex: 2,
						alignItems: 'center',
					},
					testId: `${this.testId}_tab_${tabName}`,
				},
				!isAvatarTab && this.#renderPresetTabIcon({ isFirst, tabName, tabItem }),
				isAvatarTab && this.#renderPresetTabAvatar({ tabName, tabItem }),
				Text7({
					style: {
						marginTop: Indent.XS2.toNumber(),
					},
					accent: true,
					testId: `${this.testId}_tab_${tabName}_title`,
					color: (isFirst ? Color.base1 : Color.base4),
					numberOfLines: 1,
					ellipsize: 'end',
					text: tabItem.shortTitle,
				}),
			);
		}

		/**
		 * @param {LegacyTabPresetTabRenderParams} params
		 * @return {LayoutComponent}
		 */
		#renderPresetTabIcon({ isFirst, tabName, tabItem })
		{
			const icon = TabPresetsNewUtils.getIcon(tabItem.iconId) || TabPresetsNewUtils.getIcon(tabName);

			return IconView({
				icon,
				testId: `${this.testId}_tab_${tabName}_icon`,
				color: (isFirst ? Color.accentMainPrimaryalt : Color.base4),
				size: 32,
				solid: isFirst,
			});
		}

		/**
		 * @param {Omit<LegacyTabPresetTabRenderParams, 'isFirst'>} params
		 * @return {LayoutComponent}
		 */
		#renderPresetTabAvatar({ tabName, tabItem })
		{
			const avatarType = env.isCollaber
				? AvatarEntityType.COLLAB
				: (env.extranet ? AvatarEntityType.EXTRANET : AvatarEntityType.USER);

			return Avatar({
				testId: `${this.testId}_tab_${tabName}_avatar`,
				id: env.userId,
				entityType: avatarType,
				uri: tabItem.imageUrl,
				name: tabItem.name,
				size: 32,
				withRedux: true,
			});
		}

		/**
		 * @param {TabPresetId} presetId
		 * @param {TabPresetConfig} [presetConfig]
		 * @return {void}
		 */
		onPresetSelected(presetId, presetConfig)
		{
			if (this.isPresetManual(presetId))
			{
				void this.openPresetManualMenu(presetConfig);

				return;
			}

			if (this.isPresetSelected(presetId))
			{
				Haptics.notifyWarning();

				return;
			}

			Haptics.impactLight();
			Alert.confirm(
				Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_TITLE'),
				Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_DESCRIPTION'),
				[
					{
						text: Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_CLOSE'),
						onPress: () => {
						},
					},
					{
						text: Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_ACCEPT'),
						onPress: () => this.setPreset(presetId),
					},
				],
			);
		}

		/**
		 * @param {TabPresetConfig} [presetConfig]
		 * @return {Promise<void>}
		 */
		async openPresetManualMenu(presetConfig = this.state.presets?.list?.manual?.tabs)
		{
			const { parentWidget } = this.props;
			const { tabs } = this.state;
			const configSnapshot = clone(presetConfig);

			const layoutWidget = await parentWidget
				.openWidget('layout', {
					titleParams: {
						text: Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE'),
					},
					backdrop: {
						mediumPositionPercent: 100,
					},
				}).catch(console.error);

			if (!layoutWidget)
			{
				return;
			}

			PresetBottomMenuAnalytics.send({
				event: PresetBottomMenuAnalyticsEvent.EDIT_PRESET,
				type: PresetBottomMenuAnalytics.getPresetType(ITEM_KEY_MANUAL),
				role: PresetBottomMenuAnalyticsRole.EMPLOYEE,
			});

			layoutWidget.showComponent(new PresetManualMenu({
				tabs,
				presetConfig: configSnapshot,
				parentWidget: layoutWidget,
			}));

			layoutWidget.setLeftButtons([
				{
					type: Icon.ARROW_TO_THE_LEFT_SIZE_M.getIconName(),
					callback: () => {
						layoutWidget.close();
					},
				},
			]);

			setTimeout(() => {
				layoutWidget.expandBottomSheet();
			}, 50);

			layoutWidget.on('opened', () => {
				layoutWidget.expandBottomSheet();
			});
		}

		/**
		 * @param {TabPresetId} presetId
		 * @return {void}
		 */
		setPreset(presetId)
		{
			Haptics.impactLight();
			void Notify.showIndicatorLoading();

			TabPresetsNewUtils.setCurrentPreset(presetId)
				.then(() => {
					TabPresetsNewUtils.changeCurrentPreset(presetId);

					this.updateState({
						...this.state,
						presets: {
							...this.state.presets,
							current: presetId,
						},
					});

					PresetBottomMenuAnalytics.send({
						event: PresetBottomMenuAnalyticsEvent.CHANGE_PRESET,
						type: PresetBottomMenuAnalytics.getPresetType(
							presetId,
							this.state.presets?.list?.[presetId],
						),
						role: PresetBottomMenuAnalyticsRole.EMPLOYEE,
					});
					ToolUsage.onChangePreset();

					Haptics.notifySuccess();
					void Notify.showIndicatorSuccess({ hideAfter: 1000 });

					setTimeout(() => Application.relogin(), 1500);
				})
				.catch(() => {
					Haptics.notifyFailure();
					void Notify.showIndicatorError({
						hideAfter: 2000,
						text: Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR'),
					});
				})
			;
		}

		/**
		 * @param {TabPresetId} presetId
		 * @return {boolean}
		 */
		isPresetSelected(presetId)
		{
			return presetId === this.state.presets.current;
		}

		/**
		 * @param {TabPresetId} presetId
		 * @return {boolean}
		 */
		isPresetManual(presetId)
		{
			return presetId === ITEM_KEY_MANUAL;
		}

		/**
		 * @param {string} tabName
		 * @return {TabPresetTabItem|undefined}
		 */
		getTabItemData(tabName)
		{
			return this.state.tabs.list[tabName];
		}

		/** @return {string} */
		get testId()
		{
			return 'tab_presets';
		}
	}

	module.exports = { TabPresetsComponent, TabPresetsNewUtils };
});
