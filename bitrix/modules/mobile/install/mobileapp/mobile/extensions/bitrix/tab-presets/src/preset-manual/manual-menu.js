/**
 * @module tab-presets/src/preset-manual/manual-menu
 */
jn.define('tab-presets/src/preset-manual/manual-menu', (require, exports, module) => {
	const TabPresetsNewUtils = require('tab-presets/src/utils');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Card } = require('ui-system/layout/card');
	const { Ellipsize } = require('utils/enums/style');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { ButtonSize, Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { ChipButton, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text1 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { Loc } = require('loc');
	const { clone, mergeImmutable } = require('utils/object');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { BottomSheet } = require('bottom-sheet');
	const { ManualBanner } = require('tab-presets/src/banners');
	const { Tourist } = require('tourist');
	const { AnalyticsEvent } = require('analytics');
	const { showErrorToast } = require('toast');
	const { ListViewQueueWorker } = require('layout/list-view-queue-worker');
	const { ManualBottomMenu } = require('tab-presets/src/preset-manual/manual-bottom-list');
	const {
		getDraggableMenuItems,
		moveDraggableMenuItem,
	} = require('tab-presets/src/preset-menu-state');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsType,
	} = require('tab-presets/src/analytics');
	const { ToolUsage } = require('tool-usage');

	const ITEM_TYPE_ADD_BUTTON = 'add_button';
	const ITEM_TYPE_ACTIVE = 'active';
	const ITEM_TYPE_INACTIVE = 'inactive';
	const ITEM_TYPE_STATIC = 'static';
	const ITEM_TYPE_CHAT = 'chat';
	const MAX_DRAG_ITEMS = 4;

	/**
	 * @extends {LayoutComponent<PresetManualMenuProps, PresetManualMenuState>}
	 */
	class PresetManualMenu extends LayoutComponent
	{
		/** @type {Array<TabPresetMenuItem>} */
		#inactiveItems = [];
		/** @type {Array<TabPresetMenuItem>} */
		#activeItems = [];
		#isSaving = false;

		/**
		 * @param {PresetManualMenuShowParams} params
		 * @return {void}
		 */
		static show({ parentWidget, tabs, presetConfig })
		{
			const configSnapshot = clone(presetConfig);
			const bottomSheet = new BottomSheet({
				titleParams: {
					text: Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE'),
					type: 'dialog',
				},
				component: (layoutWidget) => new PresetManualMenu({
					tabs,
					presetConfig: configSnapshot,
					parentWidget: layoutWidget,
				}),
			});

			void bottomSheet.setParentWidget(parentWidget)
				.alwaysOnTop()
				.open();
		}

		/**
		 * @param {PresetManualMenuProps} props
		 */
		constructor(props)
		{
			super(props);

			this.refsMap = new Map();
			/** @type {ListViewQueueWorker} */
			this.listRef = new ListViewQueueWorker();
			this.state = {
				shouldShowBanner: Tourist.firstTime('show_preset_manual_settings_banner'),
			};

			this.parseTabs(props.tabs, props.presetConfig);
		}

		/**
		 * @param {TabPresetTabs} tabs
		 * @param {TabPresetConfig} [presetConfig]
		 * @return {Array<string>}
		 */
		static getActiveItemKeys(tabs, presetConfig)
		{
			const availableKeys = PresetManualMenu.getAvailableItemKeys(tabs.list);
			if (presetConfig === undefined)
			{
				return Object.keys(tabs.current).filter((key) => availableKeys.includes(key));
			}

			if (!BX.type.isPlainObject(presetConfig))
			{
				return [];
			}

			return Object.entries(presetConfig)
				.map(([key, sort], index) => ({ key, sort, index }))
				.filter(({ key, sort }) => Number.isFinite(sort) && availableKeys.includes(key))
				.sort((a, b) => a.sort - b.sort || a.index - b.index)
				.map(({ key }) => key)
			;
		}

		/**
		 * @param {Record<string, TabPresetTabItem>} list
		 * @return {Array<string>}
		 */
		static getAvailableItemKeys(list)
		{
			return Object.keys(list).filter((key) => BX.type.isPlainObject(list[key]));
		}

		/**
		 * @param {TabPresetTabs} tabs
		 * @param {TabPresetConfig} [presetConfig]
		 * @return {void}
		 */
		parseTabs(tabs, presetConfig)
		{
			const { current, list } = tabs;
			const activeItemKeys = PresetManualMenu.getActiveItemKeys(tabs, presetConfig);
			const inactiveItemKeys = PresetManualMenu.getAvailableItemKeys(list)
				.filter((key) => !activeItemKeys.includes(key));
			const createItem = (key, active) => {
				const canChangeSort = key !== 'menu'
					&& (list[key].canChangeSort ?? current[key]?.canChangeSort ?? true);
				const canBeRemoved = key !== ITEM_TYPE_CHAT && key !== 'menu'
					&& (list[key].canBeRemoved ?? current[key]?.canBeRemoved ?? true);

				return {
					...clone(list[key]),
					key,
					canChangeSort,
					canBeRemoved,
					type: active ? (canChangeSort ? ITEM_TYPE_ACTIVE : ITEM_TYPE_STATIC) : ITEM_TYPE_INACTIVE,
					showBorderBottom: canChangeSort,
				};
			};

			this.#activeItems = activeItemKeys.map((key) => createItem(key, true));
			this.#inactiveItems = inactiveItemKeys.map((key) => createItem(key, false));
		}

		/** @return {LayoutComponent} */
		render()
		{
			return Box(
				{
					testId: this.testId,
					safeArea: {
						bottom: true,
					},
					footer: this.#renderBoxFooter(),
					backgroundColor: Color.bgContentPrimary,
				},
				AreaList(
					{
						style: {
							flex: 1,
						},
						withScroll: false,
						testId: `${this.testId}-area-list`,
					},
					this.#renderBanner(),
					this.#renderListItems(),
				),
			);
		}

		/** @return {LayoutComponent} */
		#renderBoxFooter()
		{
			return BoxFooter(
				{
					testId: `${this.testId}-box-footer`,
					style: {
						width: '100%',
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
						},
					},
					Button({
						testId: `${this.testId}-button-save-menu`,
						size: ButtonSize.L,
						text: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_SAVE'),
						onClick: this.save,
						stretched: true,
						style: {
							marginRight: 10,
						},
					}),
					Button({
						testId: `${this.testId}-button-close-menu`,
						size: ButtonSize.L,
						text: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_CLOSE')
							?? Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_\u0421LOSE'),
						stretched: true,
						design: ButtonDesign.OUTLINE,
						onClick: this.#close,
					}),
				),
			);
		}

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {void}
		 */
		#replaceItem(item)
		{
			if (!item.canBeRemoved)
			{
				return;
			}

			ManualBottomMenu.show({
				items: [item, ...this.#inactiveItems],
				parentWidget: this.parentWidget,
				onClick: this.#onSelectedItem,
				replaceItem: item,
			});
		}

		/** @return {void} */
		#addNewItem = () => {
			if (this.#createAddButtonItem().disabled)
			{
				return;
			}

			ManualBottomMenu.show({
				items: this.#inactiveItems,
				parentWidget: this.parentWidget,
				onClick: this.#onSelectedItem,
			});
		};

		/** @return {Promise<void>} */
		save = async () => {
			if (this.#isSaving)
			{
				return;
			}

			this.#isSaving = true;
			const config = Object.fromEntries(this.#activeItems.map((item, index) => [item.key, index]));
			void Notify.showIndicatorLoading();

			try
			{
				const result = await TabPresetsNewUtils.setUserConfig(config);
				if (result?.status !== 'success' || (Array.isArray(result.errors) && result.errors.length > 0))
				{
					throw new Error('Failed to apply manual preset');
				}
			}
			catch
			{
				this.#isSaving = false;
				void Notify.showIndicatorError({
					hideAfter: 1000,
					text: Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR'),
				});
				Haptics.notifyFailure();

				return;
			}

			ToolUsage.onChangePreset();
			TabPresetsNewUtils.changeCurrentPreset('manual', {
				tabs: config,
				title: Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE'),
			});
			PresetBottomMenuAnalytics.send({
				event: PresetBottomMenuAnalyticsEvent.SAVE_PRESET,
				type: PresetBottomMenuAnalyticsType.CUSTOM_EMPLOYEE,
				role: PresetBottomMenuAnalyticsRole.EMPLOYEE,
			});

			void Notify.showIndicatorSuccess({ hideAfter: 1000 });
			Haptics.notifySuccess();
			setTimeout(() => Application.relogin(), 1000);
		};

		/** @return {LayoutComponent} */
		#renderListItems()
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
					style: {
						flex: 1,
						marginVertical: Component.cardListPaddingTb.toNumber(),
					},
					isRefreshing: false,
					dragInteractionEnabled: true,
					data: [
						{
							items: this.#getDragMenuItems(),
							dragInteractionEnabled: true,
						},
						{
							items: this.#getStaticMenuItems(),
							dragInteractionEnabled: false,
						},
					],
					ref: (ref) => {
						this.listRef.setListViewRef(ref);
					},
					onItemDrop: this.#handleMove,
					renderItem: this.#renderItem,
				}),
			);
		}

		/**
		 * @param {TabPresetManualListItem} item
		 * @return {LayoutComponent}
		 */
		#renderItem = (item) => {
			let itemContent = null;
			switch (item.type)
			{
				case ITEM_TYPE_ADD_BUTTON:
					itemContent = this.#renderAddButton(item);
					break;
				case ITEM_TYPE_STATIC:
					itemContent = this.#renderStaticMenuItem(item);
					break;
				default:
					itemContent = this.#renderBottomMenuItem(item);
					break;
			}

			return this.#renderItemMenuWrapper(itemContent);
		};

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {LayoutComponent}
		 */
		#renderStaticMenuItem = (item) => this.#renderItemCardWrapper(
			{
				testId: `${this.testId}-item-${item.key}-card`,
				style: {
					flexShrink: 1,
					flexDirection: 'row',
					alignItems: 'center',
				},
				withPressed: false,
			},
			this.#renderDragContainer(),
			this.#renderItemIconContainer(
				item.isAvatarEnabled
					? Avatar({
						id: env.userId,
						size: 24,
						withRedux: true,
						uri: item.imageUrl,
						name: item.title,
						testId: `${this.testId}-item-${item.key}-avatar`,
					})
					: this.#renderItemIcon(item),
			),
			Text1({
				testId: `${this.testId}-item-${item.key}-text`,
				text: item.title,
				color: Color.base1,
				numberOfLines: 1,
				ellipsize: Ellipsize.END.getValue(),
				style: {
					flexShrink: 1,
				},
			}),
		);

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {LayoutComponent}
		 */
		#renderBottomMenuItem = (item) => this.#renderItemCardWrapper(
			{
				testId: `${this.testId}-item-${item.key}-card`,
				style: {
					alignItems: 'center',
					justifyContent: 'space-between',
				},
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
				this.#renderDragContainer(
					IconView({
						testId: `${this.testId}-item-${item.key}-drag`,
						icon: Icon.DRAG_SIZE_S,
						size: 24,
						color: Color.base3,
					}),
				),
				this.#renderItemIconContainer(this.#renderItemIcon(item)),
				Text1({
					testId: `${this.testId}-item-${item.key}-text`,
					text: item.title,
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: Ellipsize.END.getValue(),
					style: {
						flex: 1,
						flexShrink: 1,
					},
				}),
			),
			this.#renderRightActions(item),
		);

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {LayoutComponent|null}
		 */
		#renderRightActions(item)
		{
			if (!item.canBeRemoved)
			{
				return null;
			}

			return View(
				{
					style: {
						alignItems: 'center',
						flexDirection: 'row',
					},
				},
				ChipButton({
					testId: `${this.testId}-button-replace-item-${item.key}`,
					text: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_REPLACE'),
					rounded: true,
					compact: true,
					mode: ChipButtonMode.OUTLINE,
					onClick: () => this.#replaceItem(item),
					style: {
						marginRight: Indent.XL2.toNumber(),
					},
				}),
				IconView({
					size: 20,
					icon: Icon.CROSS,
					color: Color.accentMainPrimary,
					style: {
						opacity: 0.5,
					},
					onClick: () => {
						void this.#hideActiveItem(item);
					},
				}),
			);
		}

		/**
		 * @param {TabPresetAddButtonItem} item
		 * @return {LayoutComponent}
		 */
		#renderAddButton = (item) => Button({
			testId: `${this.testId}-add-button`,
			text: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_ADD'),
			leftIcon: Icon.PLUS,
			stretched: true,
			design: ButtonDesign.TINTED,
			disabled: item.disabled,
			onClick: this.#addNewItem,
			onDisabledClick: () => {
				if (item.disabled)
				{
					showErrorToast({
						message: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_ADD_DISABLED_TOAST'),
						layoutWidget: this.parentWidget,
					});
				}
			},
		});

		/**
		 * @param {Record<string, unknown>} params
		 * @param {...unknown} children
		 * @return {LayoutComponent}
		 */
		#renderItemCardWrapper = (params, ...children) => Card(
			mergeImmutable(
				{
					style: {
						flexDirection: 'row',
						paddingLeft: Indent.S.toNumber(),
					},
					withPressed: true,
					excludePaddingSide: {
						left: true,
					},
					border: true,
					testId: `${this.testId}-item`,
				},
				params,
			),
			...children,
		);

		/**
		 * @param {...unknown} children
		 * @return {LayoutComponent}
		 */
		#renderItemMenuWrapper = (...children) => View(
			{
				style: {
					paddingHorizontal: Component.areaPaddingLr.toNumber(),
					paddingBottom: Component.cardListGap.toNumber(),
				},
			},
			...children,
		);

		/**
		 * @param {unknown} children
		 * @return {LayoutComponent}
		 */
		#renderDragContainer = (children = null) => View(
			{
				style: {
					width: 24,
				},
			},
			children,
		);

		/**
		 * @param {unknown} children
		 * @return {LayoutComponent}
		 */
		#renderItemIconContainer = (children = null) => View(
			{
				style: {
					height: 32,
					width: 32,
					alignItems: 'center',
					justifyContent: 'center',
					marginRight: Indent.XS.toNumber(),
				},
			},
			children,
		);

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {LayoutComponent}
		 */
		#renderItemIcon = (item) => IconView({
			testId: `${this.testId}-item-${item.key}-icon`,
			size: 32,
			color: Color.accentMainPrimaryalt,
			solid: true,
			icon: TabPresetsNewUtils.getIcon(item.iconId) || TabPresetsNewUtils.getIcon(item.key),
		});

		/** @return {LayoutComponent} */
		#renderBanner()
		{
			return Area(
				{
					excludePaddingSide: {
						bottom: true,
					},
				},
				ManualBanner({
					testId: this.testId,
				}),
			);
		}

		/** @return {Array<TabPresetMenuItem>} */
		#getDragMenuItems = () => {
			return getDraggableMenuItems(this.#activeItems, MAX_DRAG_ITEMS);
		};

		/** @return {number} */
		#getDragMenuItemsCount = () => {
			return this.#getDragMenuItems().length;
		};

		/** @return {Array<TabPresetManualListItem>} */
		#getStaticMenuItems = () => {
			const staticItems = this.#activeItems.filter((item) => item.type === ITEM_TYPE_STATIC);

			return [this.#createAddButtonItem(), ...staticItems];
		};

		/** @return {TabPresetAddButtonItem} */
		#createAddButtonItem = () => ({
			key: ITEM_TYPE_ADD_BUTTON,
			type: ITEM_TYPE_ADD_BUTTON,
			disabled: this.#getDragMenuItemsCount() >= MAX_DRAG_ITEMS
				|| this.#activeItems.length >= MAX_DRAG_ITEMS + 1,
		});

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {Promise<void>}
		 */
		async #hideActiveItem(item)
		{
			if (!item.canBeRemoved)
			{
				return;
			}

			new AnalyticsEvent({
				tool: 'intranet',
				category: 'main_menu',
				event: 'hide_item',
				c_section: 'ava_menu',
				type: item.key,
			}).send();

			const newItem = {
				...item,
				type: ITEM_TYPE_INACTIVE,
			};

			this.#removeFromActiveItems(item);
			this.#addToInactiveItems(newItem);
			void this.listRef?.deleteRowsByKeys([item.key], 'fade');
			void this.#toggleAddButton();
		}

		/**
		 * @param {TabPresetMenuItem} item
		 * @param {TabPresetMenuItem|undefined} replaceItem
		 * @return {Promise<void>}
		 */
		async #showActiveItem(item, replaceItem)
		{
			const inactiveItem = this.#inactiveItems.find((entry) => entry.key === item.key);
			if (
				!inactiveItem
				|| (replaceItem && !replaceItem.canBeRemoved)
				|| (!replaceItem && this.#createAddButtonItem().disabled)
			)
			{
				return;
			}

			new AnalyticsEvent({
				tool: 'intranet',
				category: 'main_menu',
				event: 'show_item',
				c_section: 'ava_menu',
				type: item.key,
			}).send();

			const newItem = {
				...inactiveItem,
				type: inactiveItem.canChangeSort ? ITEM_TYPE_ACTIVE : ITEM_TYPE_STATIC,
			};

			const index = this.#findItemIndexByKey(this.#activeItems, replaceItem?.key);
			const hasIndex = index >= 0;
			const newIndex = hasIndex ? index : this.#getDragMenuItemsCount();

			if (hasIndex)
			{
				this.#removeFromActiveItems(replaceItem);
				this.#addToInactiveItems({ ...replaceItem, type: ITEM_TYPE_INACTIVE });
			}

			this.#addToActiveItems(newItem, newIndex);
			this.#removeFromInactiveItems(item);

			if (hasIndex && newItem.type === replaceItem.type)
			{
				void this.listRef?.updateRowByKey(replaceItem.key, newItem);
			}
			else
			{
				if (hasIndex)
				{
					void this.listRef?.deleteRowsByKeys([replaceItem.key], 'fade');
				}

				const isStatic = newItem.type === ITEM_TYPE_STATIC;
				const sectionItems = isStatic ? this.#getStaticMenuItems() : this.#getDragMenuItems();
				const rowIndex = this.#findItemIndexByKey(sectionItems, newItem.key);
				void this.listRef?.insertRows([newItem], isStatic ? 1 : 0, rowIndex, 'fade');
			}

			void this.#toggleAddButton();
		}

		/** @return {Promise<void>} */
		async #toggleAddButton()
		{
			void this.listRef?.updateRowByKey(ITEM_TYPE_ADD_BUTTON, this.#createAddButtonItem());
		}

		/**
		 * @param {TabPresetItemDropParams} params
		 * @return {void}
		 */
		#handleMove = ({ from, to }) => {
			const indexFrom = from.index;
			const indexTo = to.index;

			if (indexFrom === indexTo)
			{
				return;
			}

			this.#activeItems = moveDraggableMenuItem(this.#activeItems, indexFrom, indexTo);

			Haptics.impactMedium();
		};

		/**
		 * @param {TabPresetMenuItem} item
		 * @param {TabPresetMenuItem|undefined} index
		 * @return {void}
		 */
		#onSelectedItem = (item, index) => {
			void this.#showActiveItem(item, index);
		};

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {void}
		 */
		#removeFromInactiveItems(item)
		{
			this.#inactiveItems = this.#removeItemFromList(this.#inactiveItems, item);
		}

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {void}
		 */
		#removeFromActiveItems(item)
		{
			this.#activeItems = this.#removeItemFromList(this.#activeItems, item);
		}

		/**
		 * @param {TabPresetMenuItem} item
		 * @param {number} index
		 * @return {void}
		 */
		#addToActiveItems(item, index)
		{
			this.#activeItems.splice(index, 0, item);
		}

		/**
		 * @param {TabPresetMenuItem} item
		 * @return {void}
		 */
		#addToInactiveItems(item)
		{
			this.#inactiveItems = [item, ...this.#inactiveItems];
		}

		/**
		 * @param {Array<TabPresetMenuItem>} list
		 * @param {TabPresetMenuItem} item
		 * @return {Array<TabPresetMenuItem>}
		 */
		#removeItemFromList(list, item)
		{
			return list.filter((listItem) => listItem.key !== item.key);
		}

		/**
		 * @param {Array<TabPresetMenuItem>} list
		 * @param {string|undefined} key
		 * @return {number}
		 */
		#findItemIndexByKey(list, key)
		{
			return list.findIndex((item) => item.key === key);
		}

		/** @return {void} */
		#close = () => {
			this.parentWidget.close();
		};

		/** @return {TabPresetLayoutWidget} */
		get parentWidget()
		{
			const { parentWidget } = this.props;

			return parentWidget;
		}

		/** @return {string} */
		get testId()
		{
			return 'preset_manual_settings';
		}
	}

	module.exports = { PresetManualMenu };
});
