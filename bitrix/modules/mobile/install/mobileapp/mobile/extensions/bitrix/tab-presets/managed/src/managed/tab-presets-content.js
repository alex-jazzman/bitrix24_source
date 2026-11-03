/**
 * @module tab-presets/managed/src/managed/tab-presets-content
 */
jn.define('tab-presets/managed/src/managed/tab-presets-content', (require, exports, module) => {
	const { getIcon } = require('tab-presets/managed/src/managed/utils');
	const { Icon: AssetsIcon } = require('assets/icons');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const { PresetItem } = require('tab-presets/managed/src/model/preset-item');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { ChipStatus, ChipStatusDesign, ChipStatusMode } = require('ui-system/blocks/chips/chip-status');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text3, Text6, Text7 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { Loc } = require('loc');
	const { PresetBanner } = require('tab-presets/managed/src/managed/banner');
	const { Avatar, AvatarEntityType } = require('ui-system/blocks/avatar');
	const {
		PRESET_ACTION_ID,
		getPresetActionDescriptors,
		getPresetActionTestId,
	} = require('tab-presets/managed/src/managed/preset-actions');
	const { sortPresetItems } = require('tab-presets/managed/src/managed/preset-list-state');

	const ITEM_KEY_MANUAL = 'manual';
	const ITEM_KEY_MENU = 'menu';
	const ITEM_TYPE_BANNER = 'banner';

	/**
	 * @extends {LayoutComponent<TabPresetsContentProps, void>}
	 */
	class TabPresetsContent extends LayoutComponent
	{
		/**
		 * @return {ReturnType<typeof Box>}
		 */
		render()
		{
			return Box(
				{
					testId: this.props.testId,
					style: {
						flex: 1,
					},
				},
				this.#renderContent(),
			);
		}

		/**
		 * @return {ReturnType<typeof View> | LayoutComponent<Record<string, unknown>, Record<string, unknown>>}
		 */
		#renderContent()
		{
			if (!this.props.presets)
			{
				if (!this.props.isLoading)
				{
					return this.#renderLoadError();
				}

				return new LoadingScreenComponent({
					showAirStyle: true,
					testId: `${this.props.testId}_loading_screen`,
				});
			}

			return AreaList(
				{
					style: {
						flex: 1,
					},
					withScroll: false,
					testId: `${this.props.testId}-area-list`,
				},
				this.#renderBanner(),
				this.#renderList(),
			);
		}

		/**
		 * @return {ReturnType<typeof Area>}
		 */
		#renderLoadError()
		{
			return Area(
				{
					testId: `${this.props.testId}_load_error`,
					isFirst: true,
				},
				Text7({
					text: Loc.getMessage('TAB_PRESETS_NEW_ERROR'),
					color: Color.base3,
					testId: `${this.props.testId}_load_error_text`,
				}),
			);
		}

		/**
		 * @return {ReturnType<typeof Area>}
		 */
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
					testId: this.props.testId,
					description: this.props.capabilities?.canCreateManagedPreset === true
						? Loc.getMessage('TAB_PRESETS_MANAGED_BANNER_DESCRIPTION')
						: Loc.getMessage('TAB_PRESETS_PRESET_BANNER_DESCRIPTION'),
				}),
			);
		}

		/**
		 * @return {ReturnType<typeof Area>}
		 */
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
				this.#renderManagerUnavailableNotice(),
				ListView({
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

		/**
		 * @return {ReturnType<typeof View> | null}
		 */
		#renderManagerUnavailableNotice()
		{
			if (this.props.capabilities?.hrAvailable !== false)
			{
				return null;
			}

			return View(
				{
					style: {
						marginHorizontal: Component.areaPaddingLr.toNumber(),
						marginBottom: Indent.M.toNumber(),
					},
					testId: `${this.props.testId}_manager_unavailable_notice`,
				},
				Text7({
					text: Loc.getMessage('TAB_PRESETS_MANAGED_HR_UNAVAILABLE'),
					color: Color.base3,
					testId: `${this.props.testId}_manager_unavailable_notice_text`,
				}),
			);
		}

		/**
		 * @return {TabPresetItem[]}
		 */
		getListViewItems()
		{
			const allPresetItems = PresetItem
				.createList(this.props.presets)
				.filter((item) => item.key !== ITEM_KEY_MANUAL)
			;
			const items = sortPresetItems(allPresetItems);
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

		/**
		 * @param {TabPresetItem} item
		 * @return {ReturnType<typeof View>}
		 */
		#renderListItem = (item) => {
			if (item.type === ITEM_TYPE_BANNER)
			{
				return this.#renderBanner();
			}

			return this.#renderItem(item);
		};

		/**
		 * @param {TabPresetItem} preset
		 * @return {ReturnType<typeof View>}
		 */
		#renderItem(preset)
		{
			const {
				title,
				key: presetId,
				tabsDescription,
				isFirst,
			} = preset;
			const isSelected = this.#isPresetSelected(presetId);

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
						testId: `${this.props.testId}-preset-${presetId}`,
						onClick: () => this.#handlePresetClick(preset),
					},
					this.#renderPresetHeader(presetId, preset),
					this.#renderPortalDefaultStatus(presetId, preset),
					this.#renderPresetTabs(presetId, preset),
				),
			);
		}

		/**
		 * @param {TabPresetItem} preset
		 * @return {void}
		 */
		#handlePresetClick(preset)
		{
			const { key: presetId, title, tabsDescription } = preset;
			if (this.#isPresetManual(presetId))
			{
				return;
			}

			if (preset.isManaged && preset.isEditable)
			{
				void this.props.onOpenManagedPresetEditor(preset);

				return;
			}

			if (this.#canOpenStockPresetEditor(preset))
			{
				void this.props.onOpenStockPresetEditor(preset);

				return;
			}

			void this.props.onOpenPresetInfo({
				presetId,
				title,
				tabsDescription,
				isSelected: this.#isPresetSelected(presetId),
			});
		}

		/**
		 * @param {string} presetId
		 * @param {TabPresetItem} preset
		 * @return {ReturnType<typeof View>}
		 */
		#renderPresetHeader(presetId, preset)
		{
			const shouldShowUserPresetIcon = this.#isPresetManual(presetId) || preset.isManaged;
			const presetTitle = !preset.title && this.#isPresetManual(presetId)
				? Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE')
				: preset.title;

			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						paddingHorizontal: Indent.XL2.toNumber(),
					},
					testId: `${this.props.testId}_preset_${presetId}_header`,
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 1,
						},
					},
					shouldShowUserPresetIcon && IconView({
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
							paddingBottom: Indent.XS2.toNumber(),
							borderBottomWidth: 1,
							borderBottomColor: Color.base5.toHex(),
							borderStyle: 'dash',
						},
						testId: `${this.props.testId}_preset_${presetId}_title`,
						accent: true,
						numberOfLines: 1,
						ellipsize: 'end',
						text: presetTitle,
					}),
				),
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							marginLeft: Indent.M.toNumber(),
						},
					},
					this.#isPresetSelected(presetId) && Text6({
						testId: `${this.props.testId}_preset_${presetId}_installed`,
						text: Loc.getMessage('TAB_PRESETS_MANAGED_STATUS_INSTALLED'),
						color: Color.accentMainSuccess,
					}),
					this.#renderPresetActionsButton(presetId, preset),
				),
			);
		}

		/**
		 * @param {string} presetId
		 * @param {TabPresetItem} preset
		 * @return {ReturnType<typeof IconView> | null}
		 */
		#renderPresetActionsButton(presetId, preset)
		{
			const item = PresetItem.create(presetId, preset, this.props.presets.current);
			if (getPresetActionDescriptors(item, this.props.capabilities ?? {}).length === 0)
			{
				return null;
			}

			return IconView({
				style: {
					marginLeft: Indent.M.toNumber(),
					width: 32,
					height: 32,
					alignItems: 'center',
					justifyContent: 'center',
				},
				testId: `${this.props.testId}_preset_${presetId}_actions`,
				forwardRef: (ref) => {
					this.presetActionsButtonRefs ??= {};
					this.presetActionsButtonRefs[presetId] = ref;
				},
				icon: Icon.MORE_SIZE_M,
				color: Color.base4,
				size: 20,
				onClick: () => this.#openPresetActionsMenu(item, this.presetActionsButtonRefs?.[presetId]),
			});
		}

		/**
		 * @param {string} presetId
		 * @param {TabPresetItem} preset
		 * @return {ReturnType<typeof View> | null}
		 */
		#renderPortalDefaultStatus(presetId, preset)
		{
			if (!preset.isPortalDefault)
			{
				return null;
			}

			return View(
				{
					style: {
						marginHorizontal: Indent.XL.toNumber(),
						marginTop: Indent.XS.toNumber(),
					},
					testId: `${this.props.testId}_preset_${presetId}_portal_default`,
				},
				ChipStatus({
					testId: `${this.props.testId}_preset_${presetId}_portal_default_status`,
					text: Loc.getMessage('TAB_PRESETS_MANAGED_PORTAL_DEFAULT'),
					compact: true,
					design: ChipStatusDesign.PRIMARY,
					mode: ChipStatusMode.OUTLINE,
				}),
			);
		}

		/**
		 * @param {string} presetId
		 * @param {TabPresetItem} preset
		 * @return {ReturnType<typeof View>}
		 */
		#renderPresetTabs(presetId, { tabs = {} })
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						marginTop: Indent.M.toNumber(),
						marginHorizontal: Indent.XL.toNumber(),
					},
					testId: `${this.props.testId}_preset_${presetId}_tabs`,
				},
				...Object.entries(tabs)
					.sort((a, b) => a[1] - b[1])
					.map(([tabName]) => this.#renderPresetTabsItem(tabName)),
			);
		}

		/**
		 * @param {string} tabName
		 * @return {ReturnType<typeof View> | null}
		 */
		#renderPresetTabsItem(tabName)
		{
			const tabItem = this.props.tabs?.list?.[tabName];
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
					testId: `${this.props.testId}_tab_${tabName}`,
				},
				!isAvatarTab && this.#renderPresetTabIcon({ tabName, tabItem }),
				isAvatarTab && this.#renderPresetTabAvatar({ tabName, tabItem }),
				Text7({
					style: {
						marginTop: Indent.XS2.toNumber(),
					},
					accent: true,
					testId: `${this.props.testId}_tab_${tabName}_title`,
					color: Color.base4,
					numberOfLines: 1,
					ellipsize: 'end',
					text: tabItem.shortTitle,
				}),
			);
		}

		/**
		 * @param {TabPresetTabRenderParams} params
		 * @return {ReturnType<typeof IconView>}
		 */
		#renderPresetTabIcon({ tabName, tabItem })
		{
			const icon = getIcon(tabItem.iconId) || getIcon(tabName);

			return IconView({
				icon,
				testId: `${this.props.testId}_tab_${tabName}_icon`,
				color: Color.base4,
				size: 28,
				solid: false,
			});
		}

		/**
		 * @param {TabPresetTabRenderParams} params
		 * @return {ReturnType<typeof Avatar>}
		 */
		#renderPresetTabAvatar({ tabName, tabItem })
		{
			const avatarType = env.isCollaber
				? AvatarEntityType.COLLAB
				: (env.extranet ? AvatarEntityType.EXTRANET : AvatarEntityType.USER);

			return Avatar({
				testId: `${this.props.testId}_tab_${tabName}_avatar`,
				id: env.userId,
				entityType: avatarType,
				uri: tabItem.imageUrl,
				name: tabItem.name,
				size: 28,
				withRedux: true,
			});
		}

		/**
		 * @param {TabPresetItem} preset
		 * @return {boolean}
		 */
		#canOpenStockPresetEditor(preset)
		{
			return (
				preset?.isBuiltin === true
				&& (
					preset.isAssignable === true
					|| preset.canSetMainTool === true
				)
			);
		}

		/**
		 * @param {TabPresetItem} preset
		 * @param {unknown} target
		 * @return {void}
		 */
		#openPresetActionsMenu(preset, target)
		{
			const actions = this.#getPresetActions(preset);
			if (actions.length === 0)
			{
				return;
			}

			this.presetActionsMenu = new PopupMenu({
				sections: [
					{ id: 'main' },
					{ id: 'management' },
				],
				items: actions,
			});
			this.presetActionsMenu.show({
				target,
				position: PopupMenuPosition.TOP_RIGHT,
			});
		}

		/**
		 * @param {TabPresetItem} preset
		 * @return {TabPresetPopupAction[]}
		 */
		#getPresetActions(preset)
		{
			const actions = [];

			getPresetActionDescriptors(preset, this.props.capabilities ?? {}).forEach((descriptor) => {
				actions.push({
					...this.#getPresetActionViewParams(descriptor.id),
					id: descriptor.id,
					testId: getPresetActionTestId(preset.key, descriptor.id),
					sectionCode: descriptor.sectionCode,
					destructive: descriptor.destructive,
					showTopSeparator: Boolean(
						descriptor.sectionCode
						&& actions.length > 0
						&& !actions.some((action) => action.sectionCode === descriptor.sectionCode),
					),
					onItemSelected: () => this.#handlePresetActionSelected(descriptor.id, preset),
				});
			});

			return actions;
		}

		/**
		 * @param {TabPresetActionId} actionId
		 * @return {TabPresetActionViewParams}
		 */
		#getPresetActionViewParams(actionId)
		{
			const viewParams = {
				[PRESET_ACTION_ID.INSTALL_SELF]: {
					title: Loc.getMessage('TAB_PRESETS_MANAGED_ACTION_INSTALL_SELF'),
					icon: AssetsIcon.DOWNLOAD,
				},
				[PRESET_ACTION_ID.SET_PORTAL_DEFAULT]: {
					title: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_MAIN_TOOL'),
					icon: AssetsIcon.CROWN,
				},
				[PRESET_ACTION_ID.EDIT]: {
					title: Loc.getMessage('TAB_PRESETS_MANAGED_ACTION_EDIT'),
					icon: AssetsIcon.EDIT,
				},
				[PRESET_ACTION_ID.DELETE]: {
					title: Loc.getMessage('TAB_PRESETS_MANAGED_ACTION_DELETE'),
					icon: AssetsIcon.TRASHCAN,
				},
			};

			return viewParams[actionId] ?? {};
		}

		/**
		 * @param {TabPresetActionId} actionId
		 * @param {TabPresetItem} preset
		 * @return {void | Promise<unknown> | null}
		 */
		#handlePresetActionSelected(actionId, preset)
		{
			switch (actionId)
			{
				case PRESET_ACTION_ID.INSTALL_SELF:
					return this.props.onInstallPreset(preset.key);

				case PRESET_ACTION_ID.SET_PORTAL_DEFAULT:
					return this.props.onSetPortalDefaultPreset(preset.key);

				case PRESET_ACTION_ID.EDIT:
					return this.props.onOpenManagedPresetEditor(preset);

				case PRESET_ACTION_ID.DELETE:
					return this.props.onDeleteManagedPreset(preset);

				default:
					return null;
			}
		}

		/**
		 * @param {string} presetId
		 * @return {boolean}
		 */
		#isPresetSelected(presetId)
		{
			return presetId === this.props.presets?.current;
		}

		/**
		 * @param {string} presetId
		 * @return {boolean}
		 */
		#isPresetManual(presetId)
		{
			return presetId === ITEM_KEY_MANUAL;
		}
	}

	module.exports = { TabPresetsContent };
});
