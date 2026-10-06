/** @module tasks/layout/checklist/list */
jn.define('tasks/layout/checklist/list', (require, exports, module) => {
	const { Color } = require('tokens');
	const { unique } = require('utils/array');
	const { throttle, debounce } = require('utils/function');
	const { UserField } = require('layout/ui/fields/user');
	const { UserListManager } = require('layout/ui/user-list');
	const { ListViewQueueWorker } = require('layout/list-view-queue-worker');
	const { MainChecklistItem } = require('tasks/layout/checklist/list/src/item/main-item');
	const { RootChecklistItem } = require('tasks/layout/checklist/list/src/item/root-item');
	const { toastMovedItem, toastEmptyPersonalList, toastNoRights } = require('tasks/layout/checklist/list/src/toasts');
	const { ChecklistActionsMenu } = require('tasks/layout/checklist/list/src/menu/actions-menu');
	const { ChecklistsMenu } = require('tasks/layout/checklist/list/src/menu/checklists-menu');
	const { MEMBER_TYPE, MEMBER_TYPE_RESTRICTION_FEATURE_META } = require('tasks/layout/checklist/list/src/constants');
	const { ButtonAdd, buttonAddItemType } = require('tasks/layout/checklist/list/src/buttons/button-add-item');
	const { ChecklistItemView } = require('tasks/layout/checklist/list/src/layout/item-view');
	const { OptimizedListView } = require('layout/ui/optimized-list-view');
	const { makeAccomplicesFieldConfig, makeAuditorsFieldConfig } = require('tasks/layout/task/form-utils');

	const IS_IOS = Application.getPlatform() === 'ios';
	const STUB_MENU = {
		key: 'stubMenu',
		type: 'stubMenu',
	};

	/** @class Checklist */
	class Checklist extends LayoutComponent
	{
		/** @param {ChecklistProps} props */
		constructor(props)
		{
			super(props);

			this.handleOnFocus = throttle(this.handleOnFocus, 300, this);
			this.handleOnSave = debounce(this.handleOnSave, 300, this);

			this.itemRefMap = new Map();
			this.focusedItemId = props.focusedItemId || null;
			this.parentWidget = props.parentWidget || null;

			this.setFocused(this.focusedItemId || props.checklist.getFocusedItemId());

			/** @type {ListViewQueueWorker} */
			this.checklistQueue = new ListViewQueueWorker();
			/** @type {ChecklistActionsMenu | null} */
			this.menuRef = null;

			this.#initState(props);

			this.delayedScroll = null;
			this.isShowKeyboard = false;
			this.setSaveFocus(false);
			this.toastEmptyPersonalList = null;

			this.initialKeyboardHandlers();
		}

		/** @param {ChecklistProps} props */
		componentWillReceiveProps(props)
		{
			this.#initState(props);
		}

		/**
		 * @private
		 * @param {ChecklistProps} props
		 */
		#initState(props)
		{
			this.state = {
				onlyMine: props.onlyMine,
				hideCompleted: props.hideCompleted,
			};
		}

		initialKeyboardHandlers()
		{
			Keyboard.on(Keyboard.Event.WillHide, () => {
				if (!this.isShowKeyboard)
				{
					return;
				}

				this.isShowKeyboard = false;
				this.handleHideMenu();
			});

			Keyboard.on(Keyboard.Event.WillShow, () => {
				this.isShowKeyboard = true;

				void this.handleShowMenu(this.getFocusedItem());

				if (typeof this.delayedScroll === 'function')
				{
					this.delayedScroll()
						.then(() => {
							this.delayedScroll = null;
						})
						.catch(console.error);
				}
			});
		}

		/** @return {CheckListFlatTree} */
		get checklist()
		{
			const { checklist } = this.props;

			return checklist;
		}

		/** @param {ChecklistReloadParams} [params] */
		reload(params = {})
		{
			this.checklist.setConditions(params, true);

			this.setState(
				params,
				() => {
					this.showEmptyToast();
				},
			);
		}

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} item
		 */
		reloadItem(item)
		{
			if (!item)
			{
				return;
			}

			const checklistItem = this.getItemRef(item.getId());
			checklistItem.reload();
		}

		/** @param {Object} parentWidget */
		setParentWidget(parentWidget)
		{
			this.parentWidget = parentWidget;
		}

		/** @return {Object | null} */
		getParentWidget()
		{
			return this.parentWidget;
		}

		updateChecklistCounter()
		{
			this.reloadItem(this.checklist.getRootItem());
		}

		/**
		 * @param {CheckListFlatTreeItem} item
		 * @param {boolean} [shouldRender]
		 * @return {Promise<void>}
		 */
		updateRowByKey = (item, shouldRender = true) => {
			const key = item.getKey();
			item.updateListViewType();
			const updateItem = item.getItem();

			return this.checklistQueue.updateRowByKey(key, updateItem, false, shouldRender);
		};

		/** @param {ChecklistUpdateRowsParams} params */
		updateRows = ({ itemIds, animation, saveFocus, shouldRender }) => {
			if (typeof saveFocus === 'boolean')
			{
				this.setSaveFocus(saveFocus);
			}

			const items = [];
			this.prepareArray(itemIds).forEach((id) => {
				const treeItem = this.checklist.getItemById(id);
				if (treeItem)
				{
					treeItem.updateListViewType();
					items.push(treeItem.getItem());
				}
			});

			if (this.shouldButtonAdd(buttonAddItemType.key))
			{
				items.push(buttonAddItemType.key);
			}

			const updater = () => this.checklistQueue
				.updateRows(items, animation, shouldRender)
				.catch(console.error);

			const focusedItem = this.getFocusedItem();

			if (saveFocus && focusedItem)
			{
				return updater().then(() => {
					this.handleOnFocusItem();
				}).catch(console.error);
			}

			return updater();
		};

		/**
		 * @private
		 * @param {string[]} keys
		 * @param {string} [animation]
		 * @return {Promise<void>}
		 */
		deleteRows(keys, animation = 'fade')
		{
			return this.checklistQueue.deleteRowsByKeys(keys, animation);
		}

		/**
		 * @param {Object} item
		 * @param {number} position
		 * @return {Promise<void>}
		 */
		insertRows(item, position)
		{
			return this.checklistQueue.insertRows(item, 0, position, 'none');
		}

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} item
		 * @return Promise<void>
		 */
		async scrollToItem(item)
		{
			if (!item)
			{
				return Promise.reject();
			}

			const itemKey = item.getKey();
			const position = this.checklistQueue.getElementPosition(itemKey);
			const isVisible = await this.#isVisibleItem(position?.index, itemKey);

			if (isVisible || !position)
			{
				return Promise.resolve();
			}

			const { section, index } = position;

			return this.checklistQueue.scrollTo(section, index, true);
		}

		/**
		 * @private
		 * @param {number | undefined} index
		 * @param {string} itemKey
		 * @return {Promise<boolean>}
		 */
		async #isVisibleItem(index, itemKey)
		{
			const listViewRef = this.checklistQueue.getListViewRef();
			const isVisible = await listViewRef?.isItemVisible(itemKey);

			if (!isVisible)
			{
				return false;
			}

			const visibleItems = await listViewRef.getVisibleItems();
			if (!Array.isArray(visibleItems))
			{
				return false;
			}

			const lastIndex = visibleItems.length - 1;
			const position = visibleItems.findIndex(({ index: positionIndex }) => index === positionIndex);

			return lastIndex !== position && lastIndex - 1 !== position;
		}

		/** @return {boolean} */
		isFilterEnabled()
		{
			const { onlyMine, hideCompleted } = this.state;

			return onlyMine || hideCompleted;
		}

		showEmptyToast()
		{
			if (!this.isFilterEnabled() || !this.shouldEmptyToast())
			{
				this.toastEmptyPersonalList?.close();

				return;
			}

			this.toastEmptyPersonalList = toastEmptyPersonalList({ layoutWidget: this.getParentWidget(), ...this.state });
		}

		/**
		 * @param {CheckListFlatTreeItem[]} [checklistItems]
		 * @return {boolean}
		 */
		shouldEmptyToast(checklistItems)
		{
			const isEmptyList = (items) => items.filter((item) => !item.isRoot()).length === 0;

			if (checklistItems)
			{
				return isEmptyList(checklistItems);
			}

			return isEmptyList(this.checklist.getFilteredItems(this.state));
		}

		/** @return {Object[]} */
		getItems()
		{
			const checklistItems = this.isFilterEnabled()
				? this.checklist.getFilteredItems(this.state)
				: this.checklist.getChecklistItems();

			const primitiveItems = checklistItems.map((item) => item.getItem());
			primitiveItems.push(buttonAddItemType);

			return primitiveItems;
		}

		/** @return {Object} */
		render()
		{
			const NativeListView = this.#nativeListView();

			return View(
				{
					onClick: () => {
						this.handleOnBlurFocusedItem();
					},
					style: {
						flex: 1,
						paddingBottom: IS_IOS ? 0 : 12,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
					resizableByKeyboard: true,
				},
				NativeListView({
					ref: (ref) => {
						this.checklistQueue.setListViewRef(ref);
					},
					style: {
						flex: 1,
					},
					data: [
						{
							items: this.getItems(),
						},
					],
					isRefreshing: false,
					renderItem: (item) => this.renderChecklistItem(item),
				}),
				this.renderMenu(),
			);
		}

		/**
		 * @private
		 * @param {Object} item
		 * @return {Object | null}
		 */
		renderChecklistItem(item)
		{
			if (this.shouldButtonAdd(item.key))
			{
				return ButtonAdd({ onClick: this.handleOnButtonAppendItem });
			}

			if (item.key === STUB_MENU.key)
			{
				return ChecklistItemView({
					style: {
						height: 50,
						width: '100%',
					},
				});
			}

			const checklistItem = this.checklist.getItemById(item.id);
			if (!checklistItem)
			{
				return null;
			}

			const itemProps = this.getItemProps(checklistItem);

			return checklistItem.isRoot()
				? new RootChecklistItem(itemProps)
				: new MainChecklistItem(itemProps);
		}

		/**
		 * @param {CheckListFlatTreeItem} checklistItem
		 * @return {Object}
		 */
		getItemProps(checklistItem)
		{
			const { diskConfig } = this.props;
			const isFocused = this.focusedItemId === checklistItem.getId();

			return {
				ref: ((itemRef) => {
					this.itemRefMap.set(checklistItem.getId(), itemRef);
				}),
				isFocused,
				diskConfig,
				showToastNoRights: this.showToastNoRights,
				selectedOptions: this.state,
				parentWidget: this.getParentWidget(),
				item: checklistItem,
				onSubmit: this.handleOnSubmit,
				onRemove: this.handleOnRemoveItem,
				onFocus: this.handleOnFocus,
				onBlur: this.#handleOnBlur,
				onChange: this.handleOnChange,
				updateRowByKey: this.updateRowByKey,
				updateMenu: this.updateActionMenu,
				onChangeAttachments: this.#handleOnChangeAttachments,
				onSelectionStylesChange: this.handleOnSelectionStylesChange,
				onToggleComplete: this.handleOnToggleComplete,
				openUserSelectionManager: this.openUserSelectionManager,
				openTariffRestrictionWidget: this.openTariffRestrictionWidget,
			};
		}

		/**
		 * @private
		 * @return {ChecklistActionsMenu}
		 */
		renderMenu()
		{
			const item = this.checklist.getItemById(this.focusedItemId);

			return new ChecklistActionsMenu({
				ref: (menuRef) => {
					this.menuRef = menuRef;
				},
				item,
				parentWidget: this.getParentWidget(),
				onTabMove: this.#handleOnTabMove,
				onTextFormat: this.handleOnTextFormat,
				onToggleImportant: this.handleOnToggleImportant,
				onMoveToCheckList: this.handleOnShowChecklistsMenu,
				openUserSelectionManager: this.openUserSelectionManager,
				openTariffRestrictionWidget: this.openTariffRestrictionWidget,
				onAddFile: this.handleOnAddFile,
				onBlur: this.handleOnBlurFocusedItem,
			});
		}

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} focusedItem
		 */
		handleOnFocus(focusedItem)
		{
			this.setFocused(focusedItem.getId());

			const scrollToFocusedItem = () => this.scrollToItem(focusedItem);
			if (this.isShowKeyboard)
			{
				scrollToFocusedItem();
			}
			else
			{
				this.delayedScroll = scrollToFocusedItem;
			}

			this.setSaveFocus(false);
		}

		/**
		 * @private
		 * @param {ChecklistOnBlurParams} params
		 * @return {Promise<void>}
		 */
		#handleOnBlur = ({ item, forceDelete = false }) => {
			if (!item)
			{
				return Promise.resolve();
			}

			this.syncItemText(item.getId());

			if (forceDelete)
			{
				return this.handleOnRemoveItem({ item });
			}

			const blurItemRef = this.getItemRef(item.getId());
			const shouldBeDeletedOnBlur = !this.saveFocus && !blurItemRef?.getTextValue() && item.shouldRemove();

			if ((shouldBeDeletedOnBlur && !item.isRoot()))
			{
				return this.handleOnRemoveItem({ item });
			}

			if (!this.saveFocus && item.getId() === this.focusedItemId)
			{
				this.setFocused(null);
			}

			this.setSaveFocus(false);
			this.handleOnSelectionStylesChange([]);

			return Promise.resolve();
		};

		handleOnToggleImportant = () => {
			const focusedItem = this.getFocusedItem();
			this.getFocusedItemRef()?.toggleImportant();

			if (focusedItem?.hasItemTitle())
			{
				this.handleOnChange();
			}
		};

		handleOnAddFile = () => {
			this.setSaveFocus(true);
			this.getFocusedItemRef()?.addFile();
		};

		/**
		 * @param {'bold' | 'italic' | 'underline' | 'strikethrough'} type
		 * @param {CheckListFlatTreeItem | null} [item]
		 */
		handleOnTextFormat = (type, item = this.getFocusedItem()) => {
			this.setSaveFocus(true);

			const itemId = item?.getId?.() ?? this.focusedItemId;
			const itemRef = this.getItemRef(itemId);

			itemRef?.applyTextFormat(type);
		};

		/** @param {string[]} styles */
		handleOnSelectionStylesChange = (styles) => {
			this.menuRef?.highlightTextStyles(styles);
		};

		/** @param {boolean} [shouldSave] */
		handleOnChange = (shouldSave = true) => {
			const { onChange } = this.props;

			this.handleOnSave(shouldSave);

			if (onChange)
			{
				onChange();
			}
		};

		/** @param {boolean} shouldSave */
		handleOnSave(shouldSave)
		{
			const { onSave } = this.props;

			if (onSave && shouldSave)
			{
				onSave();
			}
		}

		handleOnButtonAppendItem = async () => {
			const rootItem = this.checklist.getRootItem();

			const focusedItem = this.getFocusedItem();

			if (!focusedItem)
			{
				return this.insertNewItem(rootItem);
			}

			if (focusedItem.isRoot() && !focusedItem?.hasItemTitle())
			{
				return this.insertNewItem(rootItem);
			}

			if (!focusedItem.hasItemTitle())
			{
				return null;
			}

			return this.insertNewItem(rootItem);
		};

		/**
		 * @param {CheckListFlatTreeItem} [submitItem]
		 * @return {Promise<void>}
		 */
		handleOnSubmit = async (submitItem) => {
			const focusedItem = this.getFocusedItem();
			const item = submitItem || focusedItem;

			if (item.isRoot())
			{
				return this.insertNewItem(item);
			}

			if (!item?.hasItemTitle())
			{
				return null;
			}

			return this.insertNewItem(item);
		};

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} item
		 * @return {number}
		 */
		#getInsertPosition(item)
		{
			this.checklist.setConditions(this.state);
			const position = this.checklist.getInsertPosition(item);
			this.checklist.setConditions({});

			return position;
		}

		/**
		 * @param {CheckListFlatTreeItem} item
		 * @return {Promise<void>}
		 */
		async insertNewItem(item)
		{
			if (!this.checklist.canAdd())
			{
				return;
			}

			const insertPosition = this.#getInsertPosition(item);
			const shouldInsert = this.preInsertValidationFocus(insertPosition);

			if (!shouldInsert)
			{
				return;
			}

			const newItem = this.checklist.addNewItem(item);

			const { onlyMine } = this.state;

			if (onlyMine)
			{
				newItem.setAlwaysShow(true);
			}

			if (!newItem)
			{
				return;
			}

			// this.handleOnBlurFocusedItem();
			this.setFocused(newItem.getId());
			await this.insertRows(newItem.getItem(), insertPosition).catch(console.error);
			await this.afterInsert(newItem);
		}

		/**
		 * @param {number} insertPosition
		 * @return {boolean}
		 */
		preInsertValidationFocus(insertPosition)
		{
			const positionedItem = this.checklist.getItemByIndex(insertPosition);

			if (!positionedItem || positionedItem.hasItemTitle())
			{
				return true;
			}

			this.handleOnFocus(positionedItem);
			this.handleOnFocusItem();

			return false;
		}

		/**
		 * @param {CheckListFlatTreeItem} item
		 * @return {Promise<void>}
		 */
		async afterInsert(item)
		{
			this.updateChecklistCounter();
			await this.scrollToItem(item).catch(console.error);
		}

		/**
		 * @param {ChecklistRemoveItemParams} params
		 * @return {Promise<void>}
		 */
		handleOnRemoveItem = async ({ item }) => {
			const removeKeys = this.checklist.removeItem(item);
			if (removeKeys.length === 0)
			{
				return;
			}

			await this.deleteRows(removeKeys);
			this.showEmptyToast();
			this.handleOnChange();
			this.updateChecklistCounter();
		};

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} item
		 */
		handleOnToggleComplete = (item) => {
			const { hideCompleted } = this.state;

			if (hideCompleted)
			{
				this.removeElementFilterIsEnabled(item);
			}

			const shouldSave = this.checklist.isAutoCompleteItem();
			void this.updateRowByKey(item);
			void this.updateChecklistCounter();
			this.handleOnChange(shouldSave);
		};

		/**
		 * @private
		 * @param {CheckListFlatTreeItem} item
		 * @param {'left' | 'right'} direction
		 */
		#handleOnTabMove = (item, direction) => {
			const isLeft = direction === 'left';
			const parentItems = isLeft ? item.tabOut() : item.tabIn();
			const moveIds = item.getMoveIds();

			this.reloadItem(item);
			this.updateActionMenu(item);
			parentItems.forEach((parentItem) => {
				this.reloadItem(parentItem);
			});

			this.handleOnChange();
			this.updateRows({ itemIds: moveIds });
		};

		/**
		 * @param {Array<number | string>} moveIds
		 * @param {Object} targetRef
		 */
		handleOnShowChecklistsMenu = (moveIds, targetRef) => {
			const { checklists } = this.props;

			ChecklistsMenu.open({
				targetRef,
				parentWidget: this.getParentWidget(),
				moveItemToChecklist: (checklistId) => {
					void this.moveItemToChecklist({ checklistId, moveIds });
				},
				checklists,
				sourceChecklistId: this.checklist.getId(),
			});
		};

		/**
		 * @private
		 * @param {ChecklistChangeMembersParams} params
		 */
		#handleOnChangeMembers = ({ members, item, memberType }) => {
			if (members.length > 0)
			{
				const membersMap = members.map(({ id, title, imageUrl }) => ({
					id,
					name: title,
					image: imageUrl,
					type: item.getMemberType(memberType),
				}));

				// itemRef.setMembersToText(members.map(({ title }) => title));
				item.clearMemberByType(memberType);
				item.addMembers(membersMap);
			}
			else
			{
				item.clearMemberByType(memberType);
			}

			const hasMy = item.getMember(item.getUserId());
			const { onlyMine } = this.state;

			if (onlyMine && !hasMy)
			{
				this.removeElementFilterIsEnabled(item);
			}
		};

		/**
		 * @private
		 * @param {ChecklistChangeAttachmentsParams} params
		 * @return {Promise<void>}
		 */
		#handleOnChangeAttachments = ({ item, shouldRender }) => {
			this.updateActionMenu(item);
			this.handleOnChange();

			return this.updateRows({ itemIds: [item.getId()], animation: 'automatic', shouldRender });
		};

		/** @param {CheckListFlatTreeItem} item */
		removeElementFilterIsEnabled(item)
		{
			if (this.timerId)
			{
				clearTimeout(this.timerId);
				this.timerId = null;

				return Promise.resolve();
			}

			const { onlyMine, hideCompleted } = this.state;

			const shouldFilter = (onlyMine && this.checklist.shouldFilterOnlyMine(item))
				|| (hideCompleted && this.checklist.shouldFilterHideCompleted(item));

			if (shouldFilter)
			{
				return Promise.resolve();
			}

			return new Promise((resolve) => {
				this.timerId = setTimeout(async () => {
					await this.deleteRows([item.getKey()]);
					this.showEmptyToast();
					this.timerId = null;
					resolve();
				}, 1000);
			});
		}

		/**
		 * @param {ChecklistMoveItemParams} params
		 * @return {Promise<void>}
		 */
		async moveItemToChecklist({ checklistId, moveIds })
		{
			const { onMoveToCheckList } = this.props;
			this.handleOnBlurFocusedItem();
			this.updateChecklistCounter();

			const openChecklist = await onMoveToCheckList({
				moveIds,
				toCheckListId: checklistId,
				sourceChecklistId: this.checklist.getId(),
			});

			toastMovedItem({ layoutWidget: this.getParentWidget(), onButtonTap: openChecklist });
		}

		/**
		 * @param {number | string} itemId
		 * @param {ChecklistMemberType} memberType
		 */
		openUserSelectionManager = (itemId, memberType) => {
			const item = this.checklist.getItemById(itemId);
			const userIds = item.getMembersIds(memberType);
			const userConfig = this.getUserFieldConfig(memberType);

			if (!this.checklist.canAddAccomplice())
			{
				const config = userConfig();

				void UserListManager.open({
					title: config.selectorTitle,
					users: item.getMembers(),
					testId: `checklist-user-list-${memberType}`,
					layoutWidget: this.getParentWidget(),
				});

				return;
			}

			this.setSaveFocus(true);
			const userFieldInstance = UserField({
				id: memberType,
				value: userIds,
				readOnly: false,
				required: false,
				multiple: true,
				showTitle: false,
				config: userConfig({
					items: item.getPrepareMembers(),
					groupId: this.props.groupId,
					parentWidget: this.getParentWidget(),
				}),
				onSelectorHidden: this.handleOnFocusItem,
				onChange: this.#handleOnChangeUsers({ item, memberType }),
			});

			userFieldInstance.openSelector();
		};

		/** @param {ChecklistMemberType} memberType */
		openTariffRestrictionWidget = (memberType) => {
			this.setSaveFocus(true);

			MEMBER_TYPE_RESTRICTION_FEATURE_META[memberType].showRestriction({
				parentWidget: this.getParentWidget(),
				onHidden: () => this.handleOnFocusItem(),
			});
		};

		/**
		 * @private
		 * @param {ChecklistChangeUsersParams} params
		 * @return {(event: Object, members?: Object[]) => void}
		 */
		#handleOnChangeUsers = ({ item, memberType }) => (_, members = []) => {
			this.#handleOnChangeMembers({ item, members, memberType });
			this.updateActionMenu(item);
			this.updateRows({
				itemIds: [item.getId()],
				animation: 'fade',
				saveFocus: true,
			});
			this.handleOnChange();
		};

		/**
		 * @param {ChecklistMemberType} entityMemberType
		 * @return {(config?: Object) => Object}
		 */
		getUserFieldConfig(entityMemberType)
		{
			const fieldConfigMap = {
				[MEMBER_TYPE.auditor]: makeAuditorsFieldConfig,
				[MEMBER_TYPE.accomplice]: makeAccomplicesFieldConfig,
			};

			return fieldConfigMap[entityMemberType];
		}

		/** @return {MainChecklistItem | undefined} */
		getFocusedItemRef()
		{
			if (this.focusedItemId)
			{
				return this.getItemRef(this.focusedItemId);
			}

			return null;
		}

		/**
		 * @param {number | string} id
		 * @return {MainChecklistItem | undefined}
		 */
		getItemRef(id)
		{
			return this.itemRefMap.get(id);
		}

		/**
		 * @param {CheckListFlatTreeItem | null} focusedItem
		 * @return {Promise<void>}
		 */
		handleShowMenu = async (focusedItem) => {
			if (!this.menuRef || !focusedItem)
			{
				return;
			}

			this.updateActionMenu(focusedItem);
			if (!this.menuRef.isShownMenu())
			{
				const isStubMenu = this.checklistQueue.getElementPosition(STUB_MENU.key);
				if (!isStubMenu)
				{
					void this.checklistQueue.appendRows([STUB_MENU], 'none');
				}

				await this.menuRef.show();
			}
		};

		/** @return {void} */
		handleHideMenu = () => {
			if (!this.menuRef)
			{
				return;
			}

			void this.deleteRows([STUB_MENU.key], 'none');
			this.menuRef.hide();
		};

		/** @param {CheckListFlatTreeItem} item */
		updateActionMenu = (item) => {
			this.menuRef?.setItem(item);
		};

		/**
		 * @param {number | string | null} focusedItemId
		 * @return {Array<number | string | null>}
		 */
		setFocused(focusedItemId)
		{
			const blurItemId = this.focusedItemId;
			if (blurItemId && blurItemId !== focusedItemId)
			{
				this.syncItemText(blurItemId);
			}

			this.focusedItemId = focusedItemId;
			this.checklist.getItemById(focusedItemId)?.focus();
			this.checklist.getItemById(blurItemId)?.blur();

			return [blurItemId, focusedItemId];
		}

		/**
		 * @param {number | string | null} itemId
		 * @param {boolean} [shouldSave]
		 * @param {boolean} [force]
		 * @return {boolean}
		 */
		syncItemText(itemId, shouldSave = true, force = false)
		{
			if (!itemId)
			{
				return false;
			}

			return Boolean(this.getItemRef(itemId)?.syncTitleText?.(shouldSave, force));
		}

		/** @return {void} */
		handleOnFocusItem = () => {
			const focusedItem = this.getFocusedItemRef();
			if (focusedItem)
			{
				focusedItem.textInputFocus();
			}
		};

		/** @return {void} */
		handleOnBlurFocusedItem = () => {
			const focusedItem = this.getFocusedItemRef();

			if (focusedItem)
			{
				this.syncFocusedItemText();
				focusedItem.textInputBlur();
			}
		};

		/**
		 * @param {boolean} [shouldSave]
		 * @param {boolean} [force]
		 * @return {boolean}
		 */
		syncFocusedItemText(shouldSave = true, force = false)
		{
			return this.syncItemText(this.focusedItemId, shouldSave, force);
		}

		/** @return {void} */
		showToastNoRights = () => {
			toastNoRights({
				layoutWidget: this.getParentWidget(),
			});
		};

		/**
		 * @private
		 * @param {Array<number | string> | number | string} values
		 * @return {Array<number | string>}
		 */
		prepareArray(values)
		{
			return unique(Array.isArray(values) ? values : [values]).filter(Boolean);
		}

		/** @return {CheckListFlatTreeItem | null} */
		getFocusedItem()
		{
			return this.checklist.getItemById(this.focusedItemId);
		}

		/** @param {Boolean} save */
		setSaveFocus(save)
		{
			this.saveFocus = save;
		}

		/**
		 * @param {string} itemKey
		 * @return {boolean}
		 */
		shouldButtonAdd(itemKey)
		{
			return itemKey === buttonAddItemType.key && this.checklist.canAdd();
		}

		/**
		 * @private
		 * @return {Object}
		 */
		#nativeListView()
		{
			return IS_IOS ? ListView : OptimizedListView;
		}
	}

	module.exports = { Checklist };
});
