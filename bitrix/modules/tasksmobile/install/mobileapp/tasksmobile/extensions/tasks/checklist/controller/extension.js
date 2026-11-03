/** @module tasks/checklist/controller */
jn.define('tasks/checklist/controller', (require, exports, module) => {
	const { Loc } = require('loc');
	const { debounce } = require('utils/function');
	const { isOnline } = require('device/connection');
	const { PerfPoint } = require('debug/prism');
	const { showErrorToast, Position } = require('toast');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { batchActions } = require('statemanager/redux/batched-actions');
	const { ChecklistWidget } = require('tasks/checklist/widget');
	const { ChecklistView } = require('tasks/checklist/view-model');
	const { ChecklistEntityType } = require('tasks/checklist/enum');
	const { readChecklistFilter, saveChecklistFilter } = require('tasks/checklist/controller/src/filter-storage');
	const {
		checklistsUpserted,
		checklistsReplacedForEntity,
		checklistRemoved,
		makeNewChecklist,
		makeNewItem,
		selectChecklistsByEntity,
		selectChecklistStats,
		fetchChecklists,
		saveChecklists,
	} = require('tasks/statemanager/redux/slices/checklists');
	// splitFlatList lives in the model submodule (the slice barrel does not re-export it).
	const { splitFlatList, toDodRequestData } = require('tasks/statemanager/redux/slices/checklists/model');
	const {
		itemsUpserted,
		itemsReplacedForEntity,
		itemMovedToChecklist,
		selectHasUploadingAttachments,
		selectItemsByChecklistId,
		selectById: selectItemById,
	} = require('tasks/statemanager/redux/slices/checklist-items');
	const { selectByTaskIdOrGuid } = require('tasks/statemanager/redux/slices/tasks');

	/** @class ChecklistController */
	class ChecklistController
	{
		/** @param {ChecklistControllerProps} props */
		constructor(props)
		{
			this.props = { ...props };
			this.entityType = props.entityType ?? ChecklistEntityType.TASK.getValue();
			this.props.taskId = props.taskId ?? props.entityId;

			/** @type {Map<ChecklistItemId, object>} */
			this.widgetMap = new Map();

			/** @type {Map<ChecklistItemId, ChecklistView>} */
			this.viewModelCache = new Map();

			/** @type {ChecklistFocusController} */
			this.focusController = this.#createFocusController();

			this.handleOnSave = debounce(this.handleOnSave, 1000, this);
		}

		/** @return {Promise} */
		init()
		{
			if (!isOnline() && this.#hasStoreData())
			{
				return Promise.resolve();
			}

			return this.fetch();
		}

		/** @return {boolean} */
		#hasStoreData()
		{
			return selectChecklistsByEntity(
				store.getState(),
				this.entityType,
				this.props.taskId,
			).length > 0;
		}

		/** @return {ChecklistFocusController} */
		#createFocusController()
		{
			return {
				focusedId: null,
				getFocusedItemId()
				{
					return this.focusedId;
				},
				isFocused(id)
				{
					return this.focusedId === id;
				},
				focus(id)
				{
					this.focusedId = id;
				},
				blur(id)
				{
					if (this.focusedId === id)
					{
						this.focusedId = null;
					}
				},
			};
		}

		/** @return {ChecklistEntityContext} */
		getContext()
		{
			return {
				entityType: this.entityType,
				entityId: this.props.taskId,
				userId: Number(this.props.userId) || null,
				...this.#getChecklistRights(),
			};
		}

		/** @return {{ canEditChecklist: boolean, canAddChecklist: boolean }} */
		#getChecklistRights()
		{
			if (ChecklistEntityType.isDod(this.entityType))
			{
				// DoD is edited only via the external scrum save - local rights are closed
				return { canEditChecklist: false, canAddChecklist: false };
			}

			if (!ChecklistEntityType.isTask(this.entityType))
			{
				return { canEditChecklist: true, canAddChecklist: true };
			}

			const task = selectByTaskIdOrGuid(store.getState(), this.props.taskId);

			return {
				canEditChecklist: task?.canUpdateChecklist ?? true,
				canAddChecklist: task?.canAddChecklist ?? true,
			};
		}

		/**
		 * @param {number|string} taskId
		 * @return {void}
		 */
		setTaskId(taskId)
		{
			this.props.taskId = taskId;
		}

		/**
		 * @param {number} groupId
		 * @return {void}
		 */
		setGroupId(groupId)
		{
			this.props.groupId = groupId;
		}

		/**
		 * @param {ChecklistDiskConfig} value
		 * @return {void}
		 */
		setDiskConfig(value)
		{
			this.props.diskConfig = value;
		}

		/** @return {Promise} */
		fetch()
		{
			const point = new PerfPoint(
				'Tasks Checklist Open',
				`${this.entityType} ${this.props.taskId}`,
			).start();

			return dispatch(fetchChecklists(this.getContext())).finally(() => point.end());
		}

		/**
		 * @param {ChecklistV2Raw[]} [rawItems]
		 * @return {void}
		 */
		seedFromV2(rawItems = [])
		{
			const context = this.getContext();
			const { checklists, items } = splitFlatList(rawItems ?? [], context);

			dispatch(batchActions([
				checklistsReplacedForEntity(context),
				itemsReplacedForEntity(context),
				checklistsUpserted({ checklists }),
				itemsUpserted({ items }),
			]));
		}

		/** @return {void} */
		clearChecklists()
		{
			const context = this.getContext();

			dispatch(batchActions([
				checklistsReplacedForEntity(context),
				itemsReplacedForEntity(context),
			]));
		}

		/** @return {ChecklistItemRequestData[]|null} */
		getDodRequestData()
		{
			const state = store.getState();
			const checklists = selectChecklistsByEntity(state, this.entityType, this.props.taskId);
			const itemsByChecklistId = {};
			checklists.forEach((checklist) => {
				itemsByChecklistId[checklist.id] = selectItemsByChecklistId(state, checklist.id);
			});

			return toDodRequestData(checklists, itemsByChecklistId);
		}

		/** @return {Map<ChecklistItemId, ChecklistView>} */
		getChecklists()
		{
			const state = store.getState();
			const checklists = selectChecklistsByEntity(state, this.entityType, this.props.taskId);
			const result = new Map();
			const liveIds = new Set();

			checklists.forEach((checklist) => {
				liveIds.add(checklist.id);
				result.set(checklist.id, this.#getOrCreateViewModel(checklist.id));
			});

			this.viewModelCache.forEach((viewModel, checklistId) => {
				if (!liveIds.has(checklistId))
				{
					this.viewModelCache.delete(checklistId);
				}
			});

			return result;
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {ChecklistView}
		 */
		#getOrCreateViewModel(checklistId)
		{
			if (!this.viewModelCache.has(checklistId))
			{
				const viewModel = new ChecklistView({
					checklistId,
					context: this.getContext(),
					focusController: this.focusController,
					userId: this.props.userId,
					taskId: this.props.taskId,
					autoCompleteItem: false,
				});

				if (this.#persistsFilter())
				{
					viewModel.setFilter(readChecklistFilter(this.props.userId), true);
				}

				this.viewModelCache.set(checklistId, viewModel);
			}

			return this.viewModelCache.get(checklistId);
		}

		/**
		 * Only task checklists show the filter menu, so only they carry the stored preference -
		 * templates and DoD must not inherit it.
		 *
		 * @return {boolean}
		 */
		#persistsFilter()
		{
			return ChecklistEntityType.isTask(this.entityType);
		}

		/**
		 * @private
		 * @param {ChecklistConditions} filter
		 */
		#handleFilterChanged = (filter) => {
			if (this.#persistsFilter())
			{
				saveChecklistFilter(this.props.userId, filter);
			}
		};

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {ChecklistView|null}
		 */
		getChecklistById(checklistId)
		{
			return this.getChecklists().get(checklistId) || null;
		}

		/**
		 * Deep links and chat messages carry the server id, while the store is keyed by store id.
		 *
		 * @param {number} serverId
		 * @return {ChecklistView|null}
		 */
		getChecklistByServerId(serverId)
		{
			const checklists = selectChecklistsByEntity(store.getState(), this.entityType, this.props.taskId);
			const match = checklists.find((checklist) => checklist.serverId === Number(serverId));

			return match ? this.getChecklistById(match.id) : null;
		}

		/** @return {ChecklistStats} */
		getReduxData()
		{
			return selectChecklistStats(store.getState(), this.entityType, this.props.taskId);
		}

		/** @return {boolean} */
		hasUploadingFiles()
		{
			return selectHasUploadingAttachments(store.getState(), this.entityType, this.props.taskId);
		}

		/**
		 * @param {OpenChecklistParams} params
		 * @return {Promise}
		 */
		openChecklist(params)
		{
			const { userId, groupId, diskConfig, inLayout, parentWidget } = this.props;
			const { checklist } = params;
			const checklistId = checklist.getId();

			return new Promise((resolve) => {
				ChecklistWidget.open({
					userId,
					groupId,
					diskConfig,
					parentWidget,
					inLayout: Boolean(inLayout),
					checklists: this.getChecklists(),
					getChecklists: () => this.getChecklists(),
					onSave: () => this.handleOnSave(),
					onClose: () => this.#handleOnClose(checklistId),
					onCompletedChanged: () => this.props.onChange?.(this),
					onFilterChanged: this.#handleFilterChanged,
					menuMore: {
						accessRestrictions: checklist.getAccessRestrictions(),
						actions: {
							onRemove: () => this.#handleOnRemove(checklistId),
							onCreateChecklist: this.handleOnCreateChecklist(checklistId),
							onMoveToCheckList: (moveParams) => this.handleOnMoveToChecklist(moveParams),
						},
					},
					...params,
				}).then((checklistWidget) => {
					this.widgetMap.set(checklistId, checklistWidget);
					resolve(checklistWidget);
				}).catch(console.error);
			});
		}

		/**
		 * @param {CreateNewChecklistParams} [params]
		 * @return {ChecklistView}
		 */
		createNewChecklist(params = {})
		{
			const { title, withBlankItem = true } = params;
			const state = store.getState();
			const existing = selectChecklistsByEntity(state, this.entityType, this.props.taskId);

			const sortIndex = existing.length === 0
				? 0
				: Math.max(...existing.map((checklist) => checklist.sortIndex)) + 1;

			const checklist = makeNewChecklist({
				entityType: this.entityType,
				entityId: this.props.taskId,
				title: title ?? '',
				sortIndex,
				createdBy: Number(this.props.userId) || null,
			});

			const actions = [checklistsUpserted({ checklists: [checklist] })];

			if (withBlankItem)
			{
				const blankItem = makeNewItem({
					checklistId: checklist.id,
					entityType: this.entityType,
					entityId: this.props.taskId,
					parentId: checklist.id,
				});
				actions.push(itemsUpserted({ items: [blankItem] }));
			}

			dispatch(batchActions(actions));

			return this.getChecklistById(checklist.id);
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {function(): Promise}
		 */
		handleOnCreateChecklist = (checklistId) => () => {
			return this.openChecklist({
				checklist: this.createNewChecklist(),
				parentWidget: this.getParentWidgetByChecklistId(checklistId),
			});
		};

		/**
		 * @param {MoveToChecklistParams} moveParams
		 * @return {Promise<function|null>}
		 */
		handleOnMoveToChecklist = async (moveParams) => {
			const { moveIds, sourceChecklistId } = moveParams;
			if (!Array.isArray(moveIds) || moveIds.length === 0)
			{
				return null;
			}

			let toCheckListId = moveParams.toCheckListId;
			if (!toCheckListId)
			{
				const created = this.createNewChecklist({ withBlankItem: false });
				toCheckListId = created.getId();
			}

			const moveSet = new Set(moveIds);
			for (const itemId of moveIds)
			{
				const moved = selectItemById(store.getState(), itemId);
				if (moved && !moveSet.has(moved.parentId))
				{
					dispatch(itemMovedToChecklist({ itemId, checklistId: toCheckListId }));
				}
			}

			this.handleOnSave();

			this.widgetMap.get(sourceChecklistId)?.getComponent?.()?.removeMovedRows?.(moveIds);

			return async () => {
				await this.openChecklist({
					checklist: this.getChecklistById(toCheckListId),
					focusedItemId: moveIds[0],
					parentWidget: this.getParentWidgetByChecklistId(sourceChecklistId),
				});
			};
		};

		/** @return {Promise<boolean>} */
		async handleOnSave()
		{
			this.props.onChange?.(this);

			// a rejected thunk resolves the promise instead of throwing, so check the action itself
			const action = await dispatch(saveChecklists(this.getContext()));

			if (action?.type !== saveChecklists.rejected.type)
			{
				return true;
			}

			// the thunk condition skips the save while offline, for DoD and for an entity the server
			// does not have yet, and none of the three is a failure
			if (action.meta?.condition)
			{
				return false;
			}

			console.error(action.payload ?? action.error);

			showErrorToast(
				{
					message: Loc.getMessage('TASKSMOBILE_CHECKLIST_CONTROLLER_SAVE_ERROR'),
					position: Position.BOTTOM,
				},
				this.#getToastWidget(),
			);

			return false;
		}

		/**
		 * @private
		 * @return {object|null} LayoutWidget
		 */
		#getToastWidget()
		{
			const [openWidget] = [...this.widgetMap.values()];

			return openWidget?.getLayoutWidget?.() ?? this.props.parentWidget ?? null;
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {void}
		 */
		#handleOnRemove(checklistId)
		{
			this.closeChecklistWidget(checklistId);

			dispatch(checklistRemoved({ checklistId }));

			this.handleOnSave();
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {void}
		 */
		#handleOnClose(checklistId)
		{
			this.widgetMap.delete(checklistId);
			this.#removeEmptyChecklists();

			// typing keeps the title in the store without scheduling a save, and closing does not
			// blur the focused field - so the last edit needs its own save here
			if (this.#savesOnClose())
			{
				this.handleOnSave();
			}

			this.props.onClose?.();
		}

		/**
		 * Only a persisted task is saved on close: a template checklist is read-only on mobile and its
		 * store items carry no server ids (copy-prepared prefill), a draft has a guid instead of a task
		 * id, and DoD is saved by the external scrum flow.
		 *
		 * @private
		 * @return {boolean}
		 */
		#savesOnClose()
		{
			return ChecklistEntityType.isTask(this.entityType) && Number(this.props.taskId) > 0;
		}

		/**
		 * @private
		 * @return {void}
		 */
		#removeEmptyChecklists()
		{
			this.getChecklists().forEach((checklist, checklistId) => {
				if (this.widgetMap.has(checklistId))
				{
					return;
				}

				if (!checklist.getRoot()?.hasChildren())
				{
					dispatch(checklistRemoved({ checklistId }));
				}
			});
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {void}
		 */
		closeChecklistWidget(checklistId)
		{
			this.widgetMap.get(checklistId)?.close?.();
			this.widgetMap.delete(checklistId);
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {object} LayoutWidget
		 */
		getParentWidgetByChecklistId(checklistId)
		{
			return this.widgetMap.get(checklistId)?.getLayoutWidget?.() ?? this.props.parentWidget;
		}
	}

	module.exports = { ChecklistController, readChecklistFilter, saveChecklistFilter };
});
