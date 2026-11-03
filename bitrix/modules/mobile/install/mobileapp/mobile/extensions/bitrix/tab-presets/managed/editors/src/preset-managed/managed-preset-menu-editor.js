/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-menu-editor
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-menu-editor', (require, exports, module) => {
	const { getIcon } = require('tab-presets/managed');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { ButtonSize, Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { ChipButton, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text1 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { Loc } = require('loc');
	const { mergeImmutable } = require('utils/object');
	const { Ellipsize } = require('utils/enums/style');
	const { Haptics } = require('haptics');
	const { showErrorToast } = require('toast');
	const { ListViewQueueWorker } = require('layout/list-view-queue-worker');
	const {
		ManualBottomMenu,
		getDraggableMenuItems,
		moveDraggableMenuItem,
	} = require('tab-presets');
	const {
		ManagedPresetMenuItemType,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-menu-item-type');
	const {
		ManagedPresetConfigError,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-config-error');

	const ITEM_TYPE_ADD_BUTTON = 'add_button';
	const ITEM_TYPE_CHAT = 'chat';
	const MAX_DRAG_ITEMS = 4;

	/**
	 * @extends {LayoutComponent<ManagedPresetMenuEditorProps, void>}
	 */
	class ManagedPresetMenuEditor extends LayoutComponent
	{
		/** @type {ManagedPresetMenuItem[]} */
		#inactiveItems;
		/** @type {ManagedPresetMenuItem[]} */
		#activeItems;

		/**
		 * @param {ManagedPresetMenuEditorProps} props
		 */
		constructor(props)
		{
			super(props);

			/** @type {ListViewQueueWorker} */
			this.listRef = new ListViewQueueWorker();
			this.#activeItems = [...props.activeItems];
			this.#inactiveItems = [...props.inactiveItems];
		}

		render()
		{
			return Box(
				{
					testId: `${this.props.testId}-configure`,
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
						testId: `${this.props.testId}-configure-area-list`,
					},
					this.#renderListItems(),
				),
			);
		}

		#renderBoxFooter()
		{
			return BoxFooter(
				{
					testId: `${this.props.testId}-configure-footer`,
					style: {
						width: '100%',
					},
				},
				Button({
					testId: `${this.props.testId}-button-configure-done`,
					size: ButtonSize.L,
					text: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_DONE'),
					onClick: this.props.onDone,
					stretched: true,
				}),
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
				ManagedPresetConfigError({ testId: this.props.testId, error: this.props.configError }),
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
		 * @param {ManagedPresetMenuEditorItem} item
		 */
		#renderItem = (item) => {
			/** @type {unknown | null} */
			let itemContent = null;
			switch (item.type)
			{
				case ITEM_TYPE_ADD_BUTTON:
					itemContent = this.#renderAddButton(item);
					break;
				case ManagedPresetMenuItemType.STATIC:
					itemContent = this.#renderStaticMenuItem(item);
					break;
				default:
					itemContent = this.#renderBottomMenuItem(item);
					break;
			}

			return this.#renderItemMenuWrapper(itemContent);
		};

		/**
		 * @param {ManagedPresetMenuItem} item
		 */
		#renderStaticMenuItem = (item) => this.#renderItemCardWrapper(
			{
				testId: `${this.props.testId}-item-${item.key}-card`,
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
						testId: `${this.props.testId}-item-${item.key}-avatar`,
					})
					: this.#renderItemIcon(item),
			),
			Text1({
				testId: `${this.props.testId}-item-${item.key}-text`,
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
		 * @param {ManagedPresetMenuItem} item
		 */
		#renderBottomMenuItem = (item) => this.#renderItemCardWrapper(
			{
				testId: `${this.props.testId}-item-${item.key}-card`,
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
						testId: `${this.props.testId}-item-${item.key}-drag`,
						icon: Icon.DRAG_SIZE_S,
						size: 24,
						color: Color.base3,
					}),
				),
				this.#renderItemIconContainer(this.#renderItemIcon(item)),
				Text1({
					testId: `${this.props.testId}-item-${item.key}-text`,
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
		 * @param {ManagedPresetMenuItem} item
		 */
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
					testId: `${this.props.testId}-button-replace-item-${item.key}`,
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
		 * @param {ManagedPresetAddButtonItem} item
		 */
		#renderAddButton = (item) => Button({
			testId: `${this.props.testId}-add-button`,
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
						layoutWidget: this.props.parentWidget,
					});
				}
			},
		});

		/**
		 * @param {ManagedPresetMenuEditorCardParams} params
		 * @param {...unknown} children
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
					accent: true,
					design: CardDesign.PRIMARY,
					testId: `${this.props.testId}-item`,
				},
				params,
			),
			...children,
		);

		/**
		 * @param {...unknown} children
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
		 * @param {unknown | null} children
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
		 * @param {unknown | null} children
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
		 * @param {ManagedPresetMenuItem} item
		 */
		#renderItemIcon = (item) => IconView({
			testId: `${this.props.testId}-item-${item.key}-icon`,
			size: 32,
			color: Color.accentMainPrimaryalt,
			solid: true,
			icon: getIcon(item.iconId) || getIcon(item.key),
		});

		/**
		 * @param {ManagedPresetMenuItem} item
		 */
		#replaceItem(item)
		{
			ManualBottomMenu.show({
				items: [item, ...this.#inactiveItems],
				parentWidget: this.props.parentWidget,
				onClick: this.#onSelectedItem,
				replaceItem: item,
			});
		}

		#addNewItem = () => {
			ManualBottomMenu.show({
				items: this.#inactiveItems,
				parentWidget: this.props.parentWidget,
				onClick: this.#onSelectedItem,
			});
		};

		/** @return {ManagedPresetMenuItem[]} */
		#getDragMenuItems = () => getDraggableMenuItems(this.#activeItems, MAX_DRAG_ITEMS);

		/** @return {number} */
		#getDragMenuItemsCount = () => this.#getDragMenuItems().length;

		/** @return {ManagedPresetMenuEditorItem[]} */
		#getStaticMenuItems = () => {
			const staticItems = this.#activeItems.filter((item) => item.type === ManagedPresetMenuItemType.STATIC);

			return [this.#createAddButtonItem(), ...staticItems];
		};

		/** @return {ManagedPresetAddButtonItem} */
		#createAddButtonItem = () => ({
			key: ITEM_TYPE_ADD_BUTTON,
			type: ITEM_TYPE_ADD_BUTTON,
			disabled: this.#getDragMenuItemsCount() >= MAX_DRAG_ITEMS,
		});

		/**
		 * @param {ManagedPresetMenuItem} item
		 * @return {Promise<void>}
		 */
		async #hideActiveItem(item)
		{
			const newItem = {
				...item,
				type: ManagedPresetMenuItemType.INACTIVE,
			};

			this.#removeFromActiveItems(item);
			this.#addToInactiveItems(newItem);
			this.#notifyChange();
			void this.listRef?.deleteRowsByKeys([item.key], 'fade');
			void this.#toggleAddButton();
		}

		/**
		 * @param {ManagedPresetMenuItem} item
		 * @param {ManagedPresetMenuItem | undefined} replaceItem
		 * @return {Promise<void>}
		 */
		async #showActiveItem(item, replaceItem)
		{
			if (replaceItem && item.key === replaceItem.key)
			{
				return;
			}

			const newItem = {
				...item,
				type: ManagedPresetMenuItemType.ACTIVE,
			};

			const index = this.#findItemIndexByKey(this.#activeItems, replaceItem?.key);
			const hasIndex = index >= 0;
			const newIndex = hasIndex ? index : this.#getDragMenuItemsCount();

			if (hasIndex)
			{
				this.#removeFromActiveItems(replaceItem);
				this.#addToInactiveItems({ ...replaceItem, type: ManagedPresetMenuItemType.INACTIVE });
			}

			this.#addToActiveItems(newItem, newIndex);
			this.#removeFromInactiveItems(item);
			this.#notifyChange();

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

		/**
		 * @param {ManagedPresetMenuEditorDropParams} params
		 */
		#handleMove = ({ from, to }) => {
			const indexFrom = from.index;
			const indexTo = to.index;

			if (indexFrom === indexTo)
			{
				return;
			}

			this.#activeItems = moveDraggableMenuItem(this.#activeItems, indexFrom, indexTo);
			this.#notifyChange();

			Haptics.impactMedium();
		};

		/**
		 * @param {ManagedPresetMenuItem} item
		 * @param {ManagedPresetMenuItem | undefined} replaceItem
		 */
		#onSelectedItem = (item, replaceItem) => {
			void this.#showActiveItem(item, replaceItem);
		};

		#notifyChange()
		{
			this.props.onChange({
				activeItems: [...this.#activeItems],
				inactiveItems: [...this.#inactiveItems],
			});
		}

		/**
		 * @param {ManagedPresetMenuItem} item
		 */
		#removeFromInactiveItems(item)
		{
			this.#inactiveItems = this.#removeItemFromList(this.#inactiveItems, item);
		}

		/**
		 * @param {ManagedPresetMenuItem} item
		 */
		#removeFromActiveItems(item)
		{
			this.#activeItems = this.#removeItemFromList(this.#activeItems, item);
		}

		/**
		 * @param {ManagedPresetMenuItem} item
		 * @param {number} index
		 */
		#addToActiveItems(item, index)
		{
			this.#activeItems.splice(index, 0, item);
		}

		/**
		 * @param {ManagedPresetMenuItem} item
		 */
		#addToInactiveItems(item)
		{
			this.#inactiveItems = [item, ...this.#inactiveItems];
		}

		/**
		 * @param {ManagedPresetMenuItem[]} list
		 * @param {ManagedPresetMenuItem} item
		 * @return {ManagedPresetMenuItem[]}
		 */
		#removeItemFromList(list, item)
		{
			return list.filter((listItem) => listItem.key !== item.key);
		}

		/**
		 * @param {ManagedPresetMenuItem[]} list
		 * @param {string | undefined} key
		 * @return {number}
		 */
		#findItemIndexByKey(list, key)
		{
			return list.findIndex((item) => item.key === key);
		}
	}

	module.exports = { ManagedPresetMenuEditor };
});
