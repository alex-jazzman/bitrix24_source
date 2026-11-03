/** @module tasks/checklist/view-model/src/view/checklist-view */
jn.define('tasks/checklist/view-model/src/view/checklist-view', (require, exports, module) => {
	const store = require('statemanager/redux/store');

	const itemsSlice = require('tasks/statemanager/redux/slices/checklist-items');
	const { calcCounters, makeNewItem } = require('tasks/statemanager/redux/slices/checklists/model');
	const { ChecklistItemView } = require('tasks/checklist/view-model/src/view/item-view');
	const { ChecklistEntityType } = require('tasks/checklist/enum');
	const {
		computeVisible,
		shouldShowMine,
		shouldShowCompleted,
		collectDescendants,
		createRefKeyer,
		makeNoopFocusController,
	} = require('tasks/checklist/view-model/support');

	const {
		selectById: selectItemById,
		selectItemsByChecklistId,
		selectItemChildren,
		itemAdded,
		itemRemoved,
	} = itemsSlice;

	const ITEMS_SLICE_NAME = 'tasks:checklistItems';

	/** @class ChecklistView */
	class ChecklistView
	{
		/** @param {ChecklistViewModelProps} params */
		constructor({ checklistId, context, focusController, userId, taskId, autoCompleteItem = false })
		{
			this.checklistId = checklistId;
			this.context = context;
			/** @type {ChecklistFocusController} */
			this.focusController = focusController ?? makeNoopFocusController();
			this.userId = userId ? Number.parseInt(userId, 10) : context.entityId;
			this.taskId = taskId ?? (ChecklistEntityType.isTask(context.entityType) ? context.entityId : null);
			this.autoCompleteItem = autoCompleteItem;
			this.conditions = {};
			this.alwaysShow = new Set();

			/** @type {Map<ChecklistItemId, ChecklistItemView>} */
			this.itemViewRegistry = new Map();
			this.rootViewModel = this.createItemView({
				itemId: checklistId,
				checklistId,
				context,
				isRoot: true,
				viewModel: this,
			});

			this.#visibleSignature = null;
			this.#visibleCache = null;
			this.refKey = createRefKeyer();
		}

		/** @type {string|null} */
		#visibleSignature;

		/** @type {ChecklistItemView[]|null} */
		#visibleCache;

		/** @return {object} */
		#store()
		{
			return store;
		}

		/** @param {object} action */
		#dispatch(action)
		{
			this.#store().dispatch(action);
		}

		/**
		 * @param {ChecklistItemViewModelProps} params
		 * @return {ChecklistItemView}
		 */
		createItemView(params)
		{
			return new ChecklistItemView(params);
		}

		/**
		 * @param {ChecklistItemId} id
		 * @return {ChecklistItemView}
		 */
		#itemViewFor(id)
		{
			if (id === this.checklistId)
			{
				return this.rootViewModel;
			}

			if (!this.itemViewRegistry.has(id))
			{
				this.itemViewRegistry.set(id, this.createItemView({
					itemId: id,
					checklistId: this.checklistId,
					context: this.context,
					viewModel: this,
				}));
			}

			return this.itemViewRegistry.get(id);
		}

		/** @return {ChecklistItemReduxModel[]} */
		#rawItems()
		{
			return selectItemsByChecklistId(this.#store().getState(), this.checklistId);
		}

		/** @return {ChecklistItemId} */
		getId()
		{
			return this.checklistId;
		}

		/** @return {ChecklistItemView} */
		getRoot()
		{
			return this.rootViewModel;
		}

		/** @return {ChecklistItemView[]} */
		getAllItems()
		{
			return [this.rootViewModel, ...this.#rawItems().map((item) => this.#itemViewFor(item.id))];
		}

		/** @return {ChecklistItemView[]} */
		getVisibleItems()
		{
			const itemsSliceRef = this.#store().getState()[ITEMS_SLICE_NAME];
			const signature = `${this.refKey(itemsSliceRef)}|${JSON.stringify(this.conditions || {})}|${this.alwaysShow.size}`;

			if (signature === this.#visibleSignature && this.#visibleCache)
			{
				return this.#visibleCache;
			}

			const visible = this.#computeVisible(this.conditions);

			this.#visibleSignature = signature;
			this.#visibleCache = visible;

			return visible;
		}

		/**
		 * @param {ChecklistConditions} conditions
		 * @return {ChecklistItemView[]}
		 */
		computeVisibleItems(conditions)
		{
			return this.#computeVisible(conditions || {});
		}

		/**
		 * @param {ChecklistConditions} conditions
		 * @return {ChecklistItemView[]}
		 */
		#computeVisible(conditions)
		{
			return computeVisible(this.getAllItems(), conditions || {}, this.#filterDeps());
		}

		/** @return {ChecklistFilterDeps} */
		#filterDeps()
		{
			return {
				userId: this.getUserId(),
				alwaysShow: this.alwaysShow,
				getChildren: (id) => this.getChildren(id),
			};
		}

		/**
		 * @param {ChecklistItemView} item
		 * @return {boolean}
		 */
		shouldShowMine(item)
		{
			return shouldShowMine(item, this.#filterDeps());
		}

		/**
		 * @param {ChecklistItemView} item
		 * @return {boolean}
		 */
		shouldShowCompleted(item)
		{
			return shouldShowCompleted(item, this.#filterDeps());
		}

		/**
		 * @param {ChecklistItemId} id
		 * @return {ChecklistItemView|undefined}
		 */
		getItemById(id)
		{
			if (id === this.checklistId)
			{
				return this.rootViewModel;
			}

			const model = selectItemById(this.#store().getState(), id);

			return model ? this.#itemViewFor(id) : undefined;
		}

		/**
		 * @param {ChecklistItemId} id
		 * @return {number}
		 */
		indexOf(id)
		{
			return this.getVisibleItems().findIndex((item) => item.getId() === id);
		}

		/**
		 * @param {number} index
		 * @return {ChecklistItemView|undefined}
		 */
		getItemByIndex(index)
		{
			return this.getAllItems()[index];
		}

		/**
		 * Counterpart of indexOf: both address the rendered list, unlike getItemByIndex.
		 *
		 * @param {number} index
		 * @return {ChecklistItemView|undefined}
		 */
		getVisibleItemByIndex(index)
		{
			return this.getVisibleItems()[index];
		}

		/** @return {ChecklistItemView} */
		getLastItem()
		{
			const items = this.getAllItems();

			return items[items.length - 1];
		}

		/**
		 * @param {ChecklistItemView} item
		 * @return {ChecklistItemView[]}
		 */
		getSiblings(item)
		{
			const parentId = item.getParentId();

			return this.getAllItems().filter((treeItem) => treeItem.getParentId() === parentId);
		}

		/**
		 * @param {ChecklistItemId} id
		 * @return {ChecklistItemView|null}
		 */
		getPrevSiblingById(id)
		{
			const item = this.getItemById(id);
			if (!item)
			{
				return null;
			}

			const siblings = this.getSiblings(item);
			const currentIndex = siblings.findIndex((sibling) => sibling.getId() === id);
			const prevIndex = currentIndex - 1;

			return prevIndex < 0 ? null : siblings[prevIndex];
		}

		/**
		 * @param {ChecklistItemId} id
		 * @param {boolean} [deep]
		 * @return {ChecklistItemView[]}
		 */
		getChildren(id, deep = false)
		{
			const state = this.#store().getState();

			return collectDescendants(id, (parentId) => selectItemChildren(state, parentId), deep)
				.map((child) => this.#itemViewFor(child.id));
		}

		/**
		 * @param {ChecklistItemId} id
		 * @param {boolean} [deep]
		 * @return {number}
		 */
		getChildrenCount(id, deep = false)
		{
			if (!deep)
			{
				return selectItemChildren(this.#store().getState(), id).length;
			}

			return this.getChildren(id, deep).length;
		}

		/**
		 * @param {ChecklistItemView} [item]
		 * @return {number}
		 */
		getInsertPosition(item)
		{
			if (!item)
			{
				return this.getLength() + 1;
			}

			const currentIndex = this.indexOf(item.getId());

			return currentIndex + this.#visibleDescendantsCount(item.getId()) + 1;
		}

		/**
		 * The insert position indexes the rendered list, so descendants hidden by the filter must
		 * not shift it - otherwise the new row lands past the end of the list and stays invisible.
		 *
		 * @param {ChecklistItemId} id
		 * @return {number}
		 */
		#visibleDescendantsCount(id)
		{
			const visibleIds = new Set(this.getVisibleItems().map((item) => item.getId()));

			return this.getChildren(id, true).filter((child) => visibleIds.has(child.getId())).length;
		}

		/**
		 * @param {ChecklistItemView} item
		 * @return {boolean}
		 */
		hasItem(item)
		{
			return Boolean(this.getItemById(item.getId()));
		}

		/** @return {number} */
		getLength()
		{
			return this.getVisibleItems().length;
		}

		/**
		 * @param {ChecklistItemView} afterItem
		 * @return {ChecklistItemView}
		 */
		addItem(afterItem)
		{
			let parentId = afterItem.getParentId();

			if (afterItem.isRoot())
			{
				parentId = this.checklistId;
			}

			const item = makeNewItem({
				checklistId: this.checklistId,
				entityType: this.context.entityType,
				entityId: this.context.entityId,
				parentId,
			});

			this.#dispatch(itemAdded({ item, afterItemId: afterItem.isRoot() ? null : afterItem.getId() }));

			return this.#itemViewFor(item.id);
		}

		/**
		 * @param {ChecklistItemView} item
		 * @return {string[]}
		 */
		removeItem(item)
		{
			if (!this.hasItem(item))
			{
				return [];
			}

			const removeKeys = [item.getKey()];
			this.getChildren(item.getId(), true).forEach((descendant) => {
				removeKeys.push(descendant.getKey());
			});

			this.#dispatch(itemRemoved({ itemId: item.getId() }));

			return removeKeys.filter(Boolean);
		}

		/** @return {number} */
		getCompletedCount()
		{
			return calcCounters(this.#rawItems()).completed;
		}

		/** @return {number} */
		getUncompleteCount()
		{
			return calcCounters(this.#rawItems()).uncompleted;
		}

		/** @return {ChecklistItemId|undefined} */
		getFocusedItemId()
		{
			return this.focusController.getFocusedItemId?.();
		}

		/**
		 * @param {ChecklistItemId} id
		 * @return {boolean}
		 */
		isFocused(id)
		{
			return Boolean(this.focusController.isFocused?.(id));
		}

		/** @param {ChecklistItemId} id */
		focus(id)
		{
			this.focusController.focus?.(id);
		}

		/** @param {ChecklistItemId} id */
		blur(id)
		{
			this.focusController.blur?.(id);
		}

		/**
		 * The view model outlives the widget, so it keeps the filter between sessions - same as
		 * `areCompletedCollapsed` on the web check-list model.
		 *
		 * @return {ChecklistConditions}
		 */
		getFilter()
		{
			return { ...this.conditions };
		}

		/**
		 * @param {ChecklistConditions} conditions
		 * @param {boolean} [reload]
		 */
		setFilter(conditions, reload)
		{
			if (reload)
			{
				this.alwaysShow.clear();
			}

			this.conditions = conditions || {};
		}

		/**
		 * @param {ChecklistItemId} id
		 * @param {boolean} value
		 */
		setAlwaysShow(id, value)
		{
			if (value)
			{
				this.alwaysShow.add(id);
			}
			else
			{
				this.alwaysShow.delete(id);
			}
		}

		/** @return {boolean} */
		canAdd()
		{
			return this.rootViewModel.canAdd();
		}

		/** @return {boolean} */
		canEdit()
		{
			return this.rootViewModel.canEdit();
		}

		/** @return {boolean} */
		canRemove()
		{
			return this.rootViewModel.canRemove();
		}

		/** @return {boolean} */
		canAddAccomplice()
		{
			return this.rootViewModel.canAddAccomplice();
		}

		/** @return {ChecklistAccessRestrictions} */
		getAccessRestrictions()
		{
			return {
				add: this.canAdd(),
				update: this.canEdit(),
				remove: this.canRemove(),
				addAccomplice: this.canAddAccomplice(),
			};
		}

		/** @return {boolean} */
		isAutoComplete()
		{
			return Boolean(this.autoCompleteItem);
		}

		/** @param {number|string} userId */
		setUserId(userId)
		{
			this.userId = Number.parseInt(userId, 10);
		}

		/** @return {number} */
		getUserId()
		{
			return this.userId;
		}

		/** @param {number|string} taskId */
		setTaskId(taskId)
		{
			this.taskId = Number.parseInt(taskId, 10);
		}

		/** @return {number} */
		getTaskId()
		{
			return this.taskId;
		}
	}

	module.exports = { ChecklistView };
});
