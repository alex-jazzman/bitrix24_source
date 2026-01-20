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
	const { mergeImmutable } = require('utils/object');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { BottomSheet } = require('bottom-sheet');
	const { ManualBanner } = require('tab-presets/src/banners');
	const { Tourist } = require('tourist');
	const { AnalyticsEvent } = require('analytics');
	const { showErrorToast } = require('toast');
	const { ListViewQueueWorker } = require('layout/list-view-queue-worker');
	const { ManualBottomMenu } = require('tab-presets/src/preset-manual/manual-bottom-list');

	const ITEM_TYPE_ADD_BUTTON = 'add_button';
	const ITEM_TYPE_ACTIVE = 'active';
	const ITEM_TYPE_INACTIVE = 'inactive';
	const ITEM_TYPE_STATIC = 'static';
	const ITEM_TYPE_CHAT = 'chat';
	const MAX_DRAG_ITEMS = 4;

	class PresetManualMenu extends LayoutComponent
	{
		#inactiveItems = [];
		#activeItems = [];

		static show({ parentWidget, tabs })
		{
			const bottomSheet = new BottomSheet({
				titleParams: {
					text: Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE'),
					type: 'dialog',
				},
				component: (layoutWidget) => new PresetManualMenu({
					tabs,
					parentWidget: layoutWidget,
				}),
			});

			void bottomSheet.setParentWidget(parentWidget)
				.alwaysOnTop()
				.open();
		}

		constructor(props)
		{
			super(props);

			this.refsMap = new Map();
			/** @type {ListViewQueueWorker} */
			this.listRef = new ListViewQueueWorker();
			this.state = {
				shouldShowBanner: Tourist.firstTime('show_preset_manual_settings_banner'),
			};

			this.parseTabs(props.tabs);
		}

		parseTabs({ current, list })
		{
			const activeItemKeys = Object.keys(current);
			const inactiveItemKeys = Object.keys(list).filter((key) => !activeItemKeys.includes(key));

			this.initialActiveItems = activeItemKeys;
			this.#activeItems = activeItemKeys.map((key) => ({
				...current[key],
				...list[key],
				key,
				type: current[key].canChangeSort ? ITEM_TYPE_ACTIVE : ITEM_TYPE_STATIC,
				showBorderBottom: current[key].canChangeSort,
			}));
			this.#inactiveItems = inactiveItemKeys.map((key) => ({
				...list[key],
				key,
				type: ITEM_TYPE_INACTIVE,
				canBeRemoved: true,
				showBorderBottom: true,
			}));
		}

		render()
		{
			return Box(
				{
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

		#renderBoxFooter()
		{
			return BoxFooter(
				{
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
						text: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_СLOSE'),
						stretched: true,
						design: ButtonDesign.OUTLINE,
						onClick: this.#close,
					}),
				),
			);
		}

		#replaceItem(item)
		{
			ManualBottomMenu.show({
				items: [item, ...this.#inactiveItems],
				parentWidget: this.parentWidget,
				onClick: this.#onSelectedItem,
				replaceItem: item,
			});
		}

		#addNewItem = () => {
			ManualBottomMenu.show({
				items: this.#inactiveItems,
				parentWidget: this.parentWidget,
				onClick: this.#onSelectedItem,
			});
		};

		save = () => {
			const config = Object.fromEntries(this.#activeItems.map((item, index) => [item.key, index]));

			if (!this.isConfigChanged(config))
			{
				Haptics.impactLight();
				this.#close();

				return;
			}

			void Notify.showIndicatorLoading();

			const menuItemKeyWithMinimalSort = Object.keys(config)
				.reduce((minKey, key) => (config[key] < config[minKey] ? key : minKey), Object.keys(config)[0]);

			const analyticsEvent = new AnalyticsEvent({
				tool: 'intranet',
				category: 'main_menu',
				event: 'menu_set',
				c_section: 'ava_menu',
				type: menuItemKeyWithMinimalSort,
			});

			TabPresetsNewUtils.setUserConfig(config)
				.then((result) => {
					if (result)
					{
						TabPresetsNewUtils.changeCurrentPreset('manual', {
							tabs: config,
							title: Loc.getMessage('PRESET_MANUAL_SETTINGS_TITLE'),
						});
						analyticsEvent.setStatus('success');

						void Notify.showIndicatorSuccess({ hideAfter: 1000 });
						Haptics.notifySuccess();
						setTimeout(() => Application.relogin(), 1000);
					}
				})
				.catch(() => {
					analyticsEvent.setStatus('error');
					void Notify.showIndicatorError({
						hideAfter: 1000,
						text: Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR'),
					});
					Haptics.notifyFailure();
				})
				.finally(() => {
					analyticsEvent.send();
				})
			;
		};

		isConfigChanged(config)
		{
			const currentActiveItems = Object.keys(config);

			return (
				currentActiveItems.length !== this.initialActiveItems.length
				|| !currentActiveItems.every((tab, index) => tab === this.initialActiveItems[index])
			);
		}

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

		#renderRightActions(item)
		{
			if (item.key === ITEM_TYPE_CHAT)
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

		#renderItemMenuWrapper = (...children) => View(
			{
				style: {
					paddingHorizontal: Component.areaPaddingLr.toNumber(),
					paddingBottom: Component.cardListGap.toNumber(),
				},
			},
			...children,
		);

		#renderDragContainer = (children = null) => View(
			{
				style: {
					width: 24,
				},
			},
			children,
		);

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

		#renderItemIcon = (item) => IconView({
			testId: `${this.testId}-item-${item.key}-icon`,
			size: 32,
			color: Color.accentMainPrimaryalt,
			solid: true,
			icon: TabPresetsNewUtils.getIcon(item.iconId) || TabPresetsNewUtils.getIcon(item.key),
		});

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

		#getDragMenuItems = () => {
			return this.#activeItems.filter((item) => item.type !== ITEM_TYPE_STATIC).slice(0, MAX_DRAG_ITEMS);
		};

		#getDragMenuItemsCount = () => {
			return this.#getDragMenuItems().length;
		};

		#getStaticMenuItems = () => {
			const staticItems = this.#activeItems.filter((item) => item.type === ITEM_TYPE_STATIC);

			return [this.#createAddButtonItem(), ...staticItems];
		};

		#createAddButtonItem = () => ({
			key: ITEM_TYPE_ADD_BUTTON,
			type: ITEM_TYPE_ADD_BUTTON,
			disabled: this.#getDragMenuItemsCount() >= MAX_DRAG_ITEMS,
		});

		async #hideActiveItem(item)
		{
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

		async #showActiveItem(item, replaceItem)
		{
			if (replaceItem && item.key === replaceItem.key)
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
				...item,
				type: ITEM_TYPE_ACTIVE,
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

			if (hasIndex)
			{
				void this.listRef?.updateRowByKey(replaceItem.key, newItem);
			}
			else
			{
				void this.listRef?.insertRows([newItem], 0, newIndex, 'fade');
			}

			void this.#toggleAddButton();
		}

		async #toggleAddButton()
		{
			void this.listRef?.updateRowByKey(ITEM_TYPE_ADD_BUTTON, this.#createAddButtonItem());
		}

		#handleMove = ({ from, to }) => {
			const indexFrom = from.index;
			const indexTo = to.index;

			if (indexFrom === indexTo)
			{
				return;
			}

			const item = this.#activeItems[indexFrom];

			this.#activeItems.splice(indexFrom, 1);
			this.#activeItems.splice(indexTo, 0, item);

			Haptics.impactMedium();
		};

		#onSelectedItem = (item, index) => {
			void this.#showActiveItem(item, index);
		};

		#removeFromInactiveItems(item)
		{
			this.#inactiveItems = this.#removeItemFromList(this.#inactiveItems, item);
		}

		#removeFromActiveItems(item)
		{
			this.#activeItems = this.#removeItemFromList(this.#activeItems, item);
		}

		#addToActiveItems(item, index)
		{
			this.#activeItems.splice(index, 0, item);
		}

		#addToInactiveItems(item)
		{
			this.#inactiveItems = [item, ...this.#inactiveItems];
		}

		#removeItemFromList(list, item)
		{
			return list.filter((listItem) => listItem.key !== item.key);
		}

		#findItemIndexByKey(list, key)
		{
			return list.findIndex((item) => item.key === key);
		}

		#close = () => {
			this.parentWidget.close();
		};

		get parentWidget()
		{
			const { parentWidget } = this.props;

			return parentWidget;
		}

		get testId()
		{
			return 'preset_manual_settings';
		}
	}

	module.exports = { PresetManualMenu };
});
