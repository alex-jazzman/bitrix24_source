/** @module tasks/checklist/controller */
jn.define('tasks/checklist/controller', (require, exports, module) => {
	const { Loc } = require('loc');
	const { clone } = require('utils/object');
	const { ChecklistWidget } = require('tasks/checklist/widget');
	const { CheckListFlatTree } = require('tasks/checklist/flat-tree');
	const { PropTypes } = require('utils/validation');
	const { showErrorToast, Position } = require('toast');

	class ChecklistController
	{
		/** @param {ChecklistControllerProps} props */
		constructor(props)
		{
			PropTypes.validate(ChecklistController.propTypes, props, 'ChecklistController');

			this.props = {
				...ChecklistController.defaultProps,
				...props,
			};

			this.widgetMap = new Map();
			this.checklistsMap = new Map();
			this.currentOpenChecklistId = null;
			this.handleOnSave = this.save.bind(this);

			this.setChecklistTree(props.checklistTree);
		}

		/** @param {string|number} taskId */
		setTaskId(taskId)
		{
			this.props.taskId = taskId;
		}

		/** @param {number} groupId */
		setGroupId(groupId)
		{
			this.props.groupId = groupId;
		}

		/** @param {ChecklistDiskConfig} value */
		setDiskConfig(value)
		{
			this.props.diskConfig = value;
		}

		/** @return {ChecklistReduxData} */
		getReduxData()
		{
			const checklists = [...this.getChecklists().values()];
			const checklistDetails = [];
			let totalCompleted = 0;
			let totalUncompleted = 0;

			checklists.forEach((checklist) => {
				const completed = checklist.getCompleteCount();
				const uncompleted = checklist.getUncompleteCount();

				checklistDetails.push({
					title: checklist.getRootItem()?.getTitle(),
					completed,
					uncompleted,
				});

				totalCompleted += completed;
				totalUncompleted += uncompleted;
			});

			return {
				checklistDetails,
				completed: totalCompleted,
				uncompleted: totalUncompleted,
			};
		}

		/**
		 * @param {ChecklistSaveParams} params
		 * @return {Promise}
		 */
		static save({ taskId, items })
		{
			if (!Array.isArray(items))
			{
				return Promise.reject(new Error('Checklist: No items to save'));
			}

			return new Promise((resolve, reject) => {
				BX.ajax.runAction(
					'tasks.checklist.checklist.save',
					{
						data: {
							nodes: items,
							taskId,
						},
					},
				).then((response) => {
					if (response?.status !== 'success')
					{
						reject(response);

						return;
					}

					resolve(response.data);
				}).catch(reject);
			});
		}

		/**
		 * @param {ChecklistToggleCompletedParams} params
		 * @return {Promise}
		 */
		static toggleCompletedItems = ({ value, userId }) => {
			return new Promise((resolve) => {
				BX.ajax.runComponentAction(
					'bitrix:tasks.widget.checklist.new',
					'updateTaskOption',
					{
						mode: 'class',
						data: {
							option: 'show_completed',
							value,
							userId,
							entityType: 'TASK',
						},
					},
				).then((result) => {
					resolve(result);
				}).catch(console.error);
			});
		};

		/**
		 * @param {MakeChecklistFlatTreesParams} params
		 * @return {CheckListFlatTree[]}
		 */
		static makeChecklistFlatTrees(params)
		{
			const { rawChecklistTree, userId, taskId } = params;
			const checklists = rawChecklistTree?.descendants || [];

			if (checklists.length === 0)
			{
				return [];
			}

			return checklists.map((checklist) => new CheckListFlatTree({
				userId,
				taskId,
				checklist,
			}));
		}

		/** @return {Map<ChecklistItemId, CheckListFlatTree>} */
		getChecklists()
		{
			return this.checklistsMap;
		}

		/** @return {ChecklistItemId[]} */
		getChecklistsIds()
		{
			return [...this.checklistsMap.keys()];
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {Checklist|null}
		 */
		getViewChecklistComponent(checklistId)
		{
			const checklistWidget = this.widgetMap.get(checklistId);

			if (!checklistWidget)
			{
				return null;
			}

			return checklistWidget.getComponent();
		}

		/** @param {ChecklistItemId} checklistId */
		closeChecklistWidget(checklistId)
		{
			const checklistWidget = this.widgetMap.get(checklistId);
			if (!checklistWidget)
			{
				return;
			}

			checklistWidget.close();
		}

		/** @return {ChecklistItemData[][]} */
		getChecklistFlatTree()
		{
			const checklistsFlatTree = [];

			this.getChecklists().forEach((checklist) => {
				checklistsFlatTree.push(checklist.getFlatTree());
			});

			return checklistsFlatTree;
		}

		/** @param {SetChecklistsParams} params */
		setChecklists({ checklistsFlatTree, checklistsTree, clear = false })
		{
			if (clear)
			{
				this.clearChecklists();
			}

			if (checklistsFlatTree)
			{
				this.setChecklistFlatTree(checklistsFlatTree);
			}
			else if (checklistsTree)
			{
				this.setChecklistTree(clone(checklistsTree));
			}
		}

		/** @param {ChecklistItemData[][]} checklistsFlatTree */
		setChecklistFlatTree(checklistsFlatTree)
		{
			clone(checklistsFlatTree).forEach((checklistFlatTree) => {
				this.addChecklist(new CheckListFlatTree({ checklistFlatTree, ...this.getTaskParams() }));
			});
		}

		/** @param {ChecklistItemData} tree */
		setChecklistTree(tree)
		{
			const checklists = tree?.descendants || [];

			if (checklists.length === 0)
			{
				return;
			}

			checklists.forEach((checklist) => {
				this.addChecklist(new CheckListFlatTree({ checklist, ...this.getTaskParams() }));
			});
		}

		clearChecklists()
		{
			this.checklistsMap.clear();
		}

		/** @param {CheckListFlatTree} checklist */
		addChecklist(checklist)
		{
			const checklistId = checklist.getId();
			this.checklistsMap.set(checklistId, checklist);
		}

		/** @param {string | number} checklistId */
		#deleteChecklist(checklistId)
		{
			this.#removeChecklistById(checklistId);
			this.#removeFromWidgetMap(checklistId);
		}

		/** @param {ChecklistItemId} checklistId */
		#removeChecklistById(checklistId)
		{
			this.checklistsMap.delete(checklistId);
		}

		/**
		 * @private
		 * @param {string | number} checklistId
		 */
		#removeFromWidgetMap(checklistId)
		{
			this.currentOpenChecklistId = null;
			this.widgetMap.delete(checklistId);
		}

		/**
		 * @private
		 * @param {AddToWidgetMapParams} params
		 */
		addToWidgetMap({ checklistId, checklistWidget })
		{
			this.widgetMap.set(checklistId, checklistWidget);
		}

		/**
		 * @param {OpenChecklistParams} params
		 * @return {Promise}
		 */
		openChecklist(params)
		{
			const { userId, groupId, diskConfig, inLayout, hideCompleted, hideMoreMenu, parentWidget } = this.props;
			const { checklist } = params;
			const checklistId = checklist.getId();
			this.currentOpenChecklistId = checklistId;

			return new Promise((resolve) => {
				ChecklistWidget.open({
					userId,
					groupId,
					diskConfig,
					parentWidget,
					hideCompleted,
					hideMoreMenu,
					inLayout: Boolean(inLayout),
					checklists: this.checklistsMap,
					onSave: this.handleOnSave,
					onClose: this.#handleOnClose,
					onCompletedChanged: this.#handleOnChange,
					menuMore: {
						accessRestrictions: checklist.getAccessRestrictions(),
						onToggleCompletedItems: (value) => {
							void ChecklistController.toggleCompletedItems({ value, userId });
						},
						actions: {
							onRemove: this.handleOnRemove(checklistId),
							onCreateChecklist: this.handleOnCreateChecklist(checklistId),
							onMoveToCheckList: this.handleOnMoveToChecklist,
						},
					},
					...params,
				}).then((checklistWidget) => {
					this.addToWidgetMap({ checklistId, checklistWidget });
					resolve(checklistWidget);
				}).catch(console.error);
			});
		}

		/**
		 * @param {BuildDefaultListParams} params
		 * @return {CheckListFlatTree}
		 */
		createNewChecklist(params)
		{
			const newChecklist = CheckListFlatTree.buildDefaultList({ ...params, ...this.getTaskParams() });
			this.addChecklist(newChecklist);

			return newChecklist;
		}

		/**
		 * @param {MoveToChecklistParams} moveParams
		 * @return {Promise<(function(): Promise<void>)|null>}
		 */
		handleOnMoveToChecklist = async (moveParams) => {
			const { moveIds, sourceChecklistId } = moveParams;

			if (moveIds.length === 0)
			{
				console.error('Checklist: MoveIds is empty');

				return null;
			}

			let toCheckListId = moveParams.toCheckListId;
			let checklist = toCheckListId ? this.checklistsMap.get(toCheckListId) : null;

			if (!toCheckListId)
			{
				checklist = this.createChecklist({ addBlankItem: false });
				toCheckListId = checklist.getId();
			}

			await this.moveToChecklist({ moveIds, toCheckListId, sourceChecklistId });

			return async () => {
				const { checklistWidget } = await this.openChecklist({
					checklist,
					focusedItemId: moveIds[0],
					parentWidget: this.getParentWidgetByChecklistId(sourceChecklistId),
				}).catch(console.error);

				checklistWidget.handleOnChange();
			};
		};

		/** @param {MoveToChecklistParams} params */
		async moveToChecklist({ moveIds, toCheckListId, sourceChecklistId })
		{
			const sourceChecklist = this.checklistsMap.get(sourceChecklistId);
			const receivingChecklist = this.checklistsMap.get(toCheckListId);
			const moveItems = moveIds
				.map((moveId) => sourceChecklist.getItemById(moveId))
				.filter(Boolean);
			const viewSourceChecklist = this.getViewChecklistComponent(sourceChecklistId);

			for (const item of moveItems)
			{
				// eslint-disable-next-line no-await-in-loop
				await viewSourceChecklist?.handleOnRemoveItem({ item });
				receivingChecklist.addMovedItem(item, moveIds);
			}

			const viewReceivingChecklist = this.getViewChecklistComponent(toCheckListId);
			viewReceivingChecklist?.reload({});
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {LayoutWidget}
		 */
		getParentWidgetByChecklistId(checklistId)
		{
			const { parentWidget } = this.props;
			const checklistWidget = this.widgetMap.get(checklistId);

			if (!checklistWidget)
			{
				return parentWidget;
			}

			return checklistWidget.getLayoutWidget();
		}

		/**
		 * @private
		 * @param {ChecklistItemId} checklistId
		 * @return {function(): Promise}
		 */
		handleOnCreateChecklist = (checklistId) => () => {
			return this.openChecklist({
				checklist: this.createChecklist(),
				parentWidget: this.getParentWidgetByChecklistId(checklistId),
			});
		};

		/**
		 * @private
		 * @param {BuildDefaultListParams} [params]
		 * @return {CheckListFlatTree}
		 */
		createChecklist(params = {})
		{
			return this.createNewChecklist({
				number: this.checklistsMap.size,
				addBlankItem: true,
				...params,
			});
		}

		/** @return {ChecklistItemRequestData[]|null} */
		getChecklistRequestData()
		{
			let shouldAbort = false;
			const requestData = [];

			this.checklistsMap.forEach((checklist) => {
				const rootItem = checklist.getRootItem();
				if (!rootItem.hasItemTitle() && rootItem?.hasDescendants())
				{
					shouldAbort = true;
				}

				if (rootItem?.hasDescendants())
				{
					requestData.push(checklist.getRequestData());
				}
			});

			if (shouldAbort)
			{
				return null;
			}

			return requestData.flat();
		}

		#filterEmptyChecklists()
		{
			this.checklistsMap.forEach((checklist, id) => {
				const rootItem = checklist.getRootItem();
				if (!rootItem)
				{
					this.#removeChecklistById(id);

					return;
				}

				const isEmptyChecklist = !rootItem.hasDescendants();
				if (isEmptyChecklist && !rootItem.isFocused())
				{
					this.#removeChecklistById(id);
				}
			});
		}

		#handleOnChange = () => {
			const { onChange } = this.props;

			onChange?.(this);
		};

		async save(checklistId = this.currentOpenChecklistId)
		{
			const { taskId } = this.getTaskParams();

			this.getViewChecklistComponent(checklistId)?.syncFocusedItemText?.(false, true);
			this.#filterEmptyChecklists();
			this.#handleOnChange();

			// an entity that is not on the server yet (task being created, template) has nowhere to save:
			// such a checklist is sent within the entity itself, so closing must not be blocked
			if (!taskId)
			{
				return true;
			}

			const items = this.getChecklistRequestData();

			if (!Array.isArray(items))
			{
				return false;
			}

			try
			{
				const response = await ChecklistController.save({ taskId, items });
				this.#updateAfterSave(response, checklistId);
			}
			catch (error)
			{
				showErrorToast({
					message: Loc.getMessage('TASKSMOBILE_CHECKLIST_CONTROLLER_SAVE_ERROR'),
					position: Position.BOTTOM,
				});

				console.error(error);

				return false;
			}

			return true;
		}

		#handleOnClose = async (checklistId) => {
			const checklist = this.checklistsMap.get(checklistId);

			if (!checklist || !this.widgetMap.has(checklistId))
			{
				return true;
			}

			this.getViewChecklistComponent(checklistId)?.syncFocusedItemText?.(false, true);

			if (checklist.canUpdate() || checklist.canAdd())
			{
				const isSaved = await this.save(checklistId);
				if (!isSaved)
				{
					return false;
				}
			}

			this.#removeFromWidgetMap(checklistId);
			this.props.onClose?.();

			return true;
		};

		handleOnRemove = (checklistId) => () => {
			this.closeChecklistWidget(checklistId);
			this.#deleteChecklist(checklistId);
			void this.handleOnSave();
		};

		/** @return {ChecklistTaskParams} */
		getTaskParams()
		{
			const { userId, taskId, groupId, diskConfig, hideCompleted, autoCompleteItem } = this.props;

			return { userId, taskId, groupId, diskConfig, hideCompleted, autoCompleteItem };
		}

		/**
		 * @param {Record<string, { id: ChecklistItemId }>} items
		 * @param {ChecklistItemId} checklistId
		 */
		#updateAfterSave(items, checklistId)
		{
			if (!items)
			{
				return;
			}

			const checklist = this.checklistsMap.get(checklistId);
			if (!checklist)
			{
				return;
			}

			checklist.getTreeItems().forEach((item) => {
				const savedItem = items[item.getNodeId()];

				if (savedItem)
				{
					item.setId(savedItem.id);
				}
			});
		}

		/** @return {boolean} */
		hasUploadingFiles()
		{
			for (const checklist of this.checklistsMap.values())
			{
				for (const item of checklist.getTreeItems())
				{
					if (item.hasUploadingAttachments())
					{
						return true;
					}
				}
			}

			return false;
		}

		/**
		 * @param {ChecklistItemId} checklistId
		 * @return {CheckListFlatTree|null}
		 */
		getChecklistById(checklistId)
		{
			return this.checklistsMap.get(checklistId) || null;
		}
	}

	ChecklistController.defaultProps = {
		autoCompleteItem: true,
		hideMoreMenu: false,
	};

	ChecklistController.propTypes = {
		taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		groupId: PropTypes.number,
		userId: PropTypes.number,
		checklistTree: PropTypes.object,
		diskConfig: PropTypes.object,
		hideCompleted: PropTypes.bool,
		hideMoreMenu: PropTypes.bool,
		inLayout: PropTypes.bool,
		onChange: PropTypes.func,
		onClose: PropTypes.func,
		parentWidget: PropTypes.object,
	};

	module.exports = { ChecklistController };
});
