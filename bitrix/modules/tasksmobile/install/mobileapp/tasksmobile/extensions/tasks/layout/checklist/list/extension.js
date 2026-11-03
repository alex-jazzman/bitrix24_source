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
	const { ItemPresenter, ChecklistPresenter } = require('tasks/layout/checklist/presenter');

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

			const initialFocusedItemId = this.focusedItemId
				|| props.checklist.getFocusedItemId()
				|| props.checklist.getItemByIndex(1)?.getId()
				|| null;

			this.setFocused(initialFocusedItemId);

			/** @type {ListViewQueueWorker} */
			this.checklistQueue = new ListViewQueueWorker();
			/** @type {ChecklistActionsMenu | null} */
			this.menuRef = null;

			this.#initState(props);
			// a fresh widget keeps the filter but not its per-item exceptions
			props.checklist.setFilter(this.state, true);

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
			const { onlyMine = false, hideCompleted = false } = props.checklist.getFilter();

			this.state = { onlyMine, hideCompleted };
		}

		initialKeyboardHandlers()
		{
			this.onKeyboardWillHide = () => {
				if (!this.isShowKeyboard)
				{
					return;
				}

				this.isShowKeyboard = false;
				this.handleHideMenu();
			};

			this.onKeyboardWillShow = () => {
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
			};

			Keyboard.on(Keyboard.Event.WillHide, this.onKeyboardWillHide);
			Keyboard.on(Keyboard.Event.WillShow, this.onKeyboardWillShow);
		}

		componentWillUnmount()
		{
			Keyboard.off(Keyboard.Event.WillHide, this.onKeyboardWillHide);
			Keyboard.off(Keyboard.Event.WillShow, this.onKeyboardWillShow);
		}

		/** @return {ChecklistView} */
		get checklist()
		{
			const { checklist } = this.props;

			return checklist;
		}

		/** @param {ChecklistReloadParams} [params] */
		reload(params = {})
		{
			// setFilter replaces conditions while setState merges - pass the whole next filter
			this.checklist.setFilter({ ...this.state, ...params }, true);

			this.setState(
				params,
				() => {
					this.showEmptyToast();
				},
			);
		}

		/**
		 * @private
		 * @param {ChecklistItemView} item
		 */
		reloadItem(item)
		{
			if (!item)
			{
				return;
			}

			// root and unrendered rows have no ref
			const checklistItem = this.getItemRef(item.getId());
			checklistItem?.reload();
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
			this.reloadItem(this.checklist.getRoot());
		}

		/**
		 * @param {ChecklistItemView} item
		 * @param {boolean} [shouldRender]
		 * @return {Promise<void>}
		 */
		updateRowByKey = (item, shouldRender = true) => {
			const key = item.getKey();
			const updateItem = ItemPresenter.getListViewItem(item);

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
					items.push(ItemPresenter.getListViewItem(treeItem));
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
		 * @param {string[]} keys - keys (nodeId) of the moved subtree
		 * @return {Promise<void>}
		 */
		async removeMovedRows(keys)
		{
			if (!Array.isArray(keys) || keys.length === 0)
			{
				return;
			}

			await this.deleteRows(keys).catch(console.error);
			this.updateChecklistCounter();
			this.showEmptyToast();
		}

		/**
		 * @private
		 * @param {ChecklistItemView} item
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
		 * @param {ChecklistItemView[]} [checklistItems]
		 * @return {boolean}
		 */
		shouldEmptyToast(checklistItems)
		{
			const isEmptyList = (items) => items.filter((item) => !item.isRoot()).length === 0;

			if (checklistItems)
			{
				return isEmptyList(checklistItems);
			}

			return isEmptyList(ChecklistPresenter.getFilteredItems(this.checklist, this.state));
		}

		/** @return {Object[]} */
		getItems()
		{
			const primitiveItems = this.checklist
				.getVisibleItems()
				.map((item) => ItemPresenter.getListViewItem(item));
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
		 * @param {ChecklistItemView} checklistItem
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
		 * @param {ChecklistItemView} focusedItem
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

			// commit on blur, not while typing: reconciliation remounts the row and breaks typing
			item.commit();
			this.handleOnChange();

			return Promise.resolve();
		};

		handleOnToggleImportant = () => {
			const focusedItem = this.getFocusedItem();
			this.getFocusedItemRef()?.toggleImportant();

			if (focusedItem?.hasTitle())
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
			return this.insertNewItem(this.checklist.getRoot());
		};

		/**
		 * @param {ChecklistItemView} [submitItem]
		 * @return {Promise<void>}
		 */
		handleOnSubmit = async (submitItem) => {
			const focusedItem = this.getFocusedItem();
			const item = submitItem || focusedItem;

			if (!item)
			{
				return null;
			}

			if (item.isRoot())
			{
				return this.insertNewItem(item);
			}

			// use the field buffer, not the store: reconciliation may transiently clear the title there
			const bufferText = this.getItemRef(item.getId())?.getTextValue?.();
			if (bufferText && bufferText !== item.getTitle())
			{
				item.setTitle(bufferText);
			}

			if (!bufferText && !item.hasTitle())
			{
				return null;
			}

			item.commit();

			return this.insertNewItem(item);
		};

		/**
		 * @param {ChecklistItemView} item
		 * @return {Promise<void>}
		 */
		async insertNewItem(item)
		{
			if (!this.checklist.canAdd())
			{
				return;
			}

			const insertPosition = this.checklist.getInsertPosition(item);
			const shouldInsert = this.preInsertValidationFocus(insertPosition);

			if (!shouldInsert)
			{
				return;
			}

			const newItem = this.checklist.addItem(item);

			const { onlyMine } = this.state;

			if (onlyMine)
			{
				this.checklist.setAlwaysShow(newItem.getId(), true);
			}

			if (!newItem)
			{
				return;
			}

			this.setFocused(newItem.getId());
			await this.insertRows(ItemPresenter.getListViewItem(newItem), insertPosition).catch(console.error);
			await this.afterInsert(newItem);
		}

		/**
		 * @param {number} insertPosition
		 * @return {boolean}
		 */
		preInsertValidationFocus(insertPosition)
		{
			const positionedItem = this.checklist.getVisibleItemByIndex(insertPosition);

			if (!positionedItem || positionedItem.hasTitle())
			{
				return true;
			}

			this.handleOnFocus(positionedItem);
			this.handleOnFocusItem();

			return false;
		}

		/**
		 * @param {ChecklistItemView} item
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
		 * @param {ChecklistItemView} item
		 */
		handleOnToggleComplete = (item) => {
			const { hideCompleted } = this.state;

			if (hideCompleted)
			{
				this.removeElementFilterIsEnabled(item);
			}

			const shouldSave = this.checklist.isAutoComplete();
			void this.updateRowByKey(item);
			// completion cascades up the store, but ancestor rows must be repainted manually
			this.#reloadAncestors(item);
			void this.updateChecklistCounter();
			this.handleOnChange(shouldSave);
		};

		/**
		 * @private
		 * @param {ChecklistItemView} item
		 */
		#reloadAncestors(item)
		{
			const visited = new Set([item.getId()]);
			let parent = item.getParent?.();

			while (parent && !parent.isRoot?.() && !visited.has(parent.getId()))
			{
				visited.add(parent.getId());
				this.reloadItem(parent);
				parent = parent.getParent?.();
			}
		}

		/**
		 * @private
		 * @param {ChecklistItemView} item
		 * @param {'left' | 'right'} direction
		 */
		#handleOnTabMove = (item, direction) => {
			const isLeft = direction === 'left';
			const parentItems = isLeft ? item.outdent() : item.indent();
			// seed with the item id so the moved item itself is included, not only its descendants
			const moveIds = item.getSubtreeIds(item.getId());

			this.updateActionMenu(item);
			parentItems.forEach((parentItem) => {
				this.reloadItem(parentItem);
			});

			this.handleOnChange();

			// reloadItem (setState), not updateRows: the latter remounts the TextInput and drops focus
			moveIds.forEach((id) => {
				this.reloadItem(this.checklist.getItemById(id));
			});
		};

		/**
		 * @param {Array<number | string>} moveIds
		 * @param {Object} targetRef
		 */
		handleOnShowChecklistsMenu = (moveIds, targetRef) => {
			// current list from the store (including ones created by move), not a snapshot prop
			const { getChecklists } = this.props;
			const checklists = getChecklists ? getChecklists() : this.props.checklists;

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
			// memberType - long role ('accomplice'|'auditor'); store key - 'accomplices'|'auditors'
			const role = `${memberType}s`;

			if (members.length > 0)
			{
				const membersList = members.map(({ id, title, imageUrl }) => ({
					id,
					name: title,
					image: imageUrl,
				}));

				item.clearMembers(role);
				item.addMembers({ [role]: membersList });
			}
			else
			{
				item.clearMembers(role);
			}

			item.saveMembers();

			const hasMy = ItemPresenter.getFieldMembers(item)[item.getUserId()];
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

		/** @param {ChecklistItemView} item */
		removeElementFilterIsEnabled(item)
		{
			if (this.timerId)
			{
				clearTimeout(this.timerId);
				this.timerId = null;

				return Promise.resolve();
			}

			const { onlyMine, hideCompleted } = this.state;

			const shouldFilter = (onlyMine && this.checklist.shouldShowMine(item))
				|| (hideCompleted && this.checklist.shouldShowCompleted(item));

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
			const userIds = ItemPresenter.getMembersIds(item, memberType);
			const userConfig = this.getUserFieldConfig(memberType);

			if (!this.checklist.canAddAccomplice())
			{
				const config = userConfig();

				void UserListManager.open({
					title: config.selectorTitle,
					users: ItemPresenter.getMembers(item),
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
					items: ItemPresenter.getPreparedMembers(item),
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
		 * @param {ChecklistItemView | null} focusedItem
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

		/** @param {ChecklistItemView} item */
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

		/** @return {ChecklistItemView | null} */
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
