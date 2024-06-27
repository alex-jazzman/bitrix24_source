/**
 * @module tasks/checklist/controller
 */
jn.define('tasks/checklist/controller', (require, exports, module) => {
	const { debounce } = require('utils/function');
	const { ChecklistWidget } = require('tasks/checklist/widget');
	const { CheckListFlatTree } = require('tasks/checklist/flat-tree');

	/**
	 * @class ChecklistController
	 */
	class ChecklistController
	{
		constructor(props)
		{
			this.props = props;
			this.currentOpenChecklistId = null;
			this.checklistsMap = new Map();
			this.widgetMap = new Map();
			this.handleOnSave = debounce(this.handleOnSave, 1000, this);
			this.setChecklists(props.checklists);
		}

		/**
		 * @public
		 * @param {object[]} checklists
		 */
		setChecklists(checklists = [])
		{
			this.checklistsMap = new Map();
			checklists.forEach((checklist) => this.addChecklist(checklist));
		}

		/**
		 * @public
		 * @param {string|number} taskId
		 */
		setTaskId(taskId)
		{
			this.props.taskId = taskId;
		}

		/**
		 * @public
		 * @param {number} groupId
		 */
		setGroupId(groupId)
		{
			this.props.groupId = groupId;
		}

		/**
		 * @public
		 * @param {{folderId: number}} value
		 */
		setDiskConfig(value)
		{
			this.props.diskConfig = value;
		}

		/**
		 * @public
		 * @return {{
		 * 	completed: number,
		 * 	uncompleted: number,
		 * 	checklistDetails: { title: string, completed: number, uncompleted: number }[],
		 * }}
		 */
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
		 * @public
		 * @param {number} taskId
		 * @param {FlatArray<object>} items
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
				}).catch(console.error);
			});
		}

		/**
		 *
		 * @param {boolean} value
		 * @param {number} userId
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
		 * @public
		 * @param params
		 * @return {CheckListFlatTree[]|*[]}
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

		getChecklists()
		{
			return this.checklistsMap;
		}

		getChecklistsIds()
		{
			return [...this.checklistsMap.keys()];
		}

		/**
		 * @param {string | number} checklistId
		 * @return {Checklist}
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

		closeChecklistWidget(checklistId)
		{
			const checklistWidget = this.widgetMap.get(checklistId);
			if (!checklistWidget)
			{
				return;
			}

			checklistWidget.close();
		}

		/**
		 * @public
		 * @param {object} tree
		 */
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

		addChecklist(checklist)
		{
			const checklistId = checklist.getId();
			this.checklistsMap.set(checklistId, checklist);
		}

		/**
		 * @private
		 * @param {string | number} checklistId
		 */
		deleteChecklist(checklistId)
		{
			this.checklistsMap.delete(checklistId);
			this.removeFromWidgetMap(checklistId);
		}

		/**
		 * @private
		 * @param {string | number} checklistId
		 */
		removeFromWidgetMap(checklistId)
		{
			this.currentOpenChecklistId = null;
			this.widgetMap.delete(checklistId);
		}

		/**
		 * @private
		 * @param {string | number} checklistId
		 * @param {LayoutWidget} checklistWidget
		 */
		addToWidgetMap({ checklistId, checklistWidget })
		{
			this.widgetMap.set(checklistId, checklistWidget);
		}

		/**
		 * @param {object} params
		 * @param {CheckListFlatTree} [params.checklist]
		 * @param {string | number} [params.focusedItemId]
		 * @return {Promise}
		 */
		openChecklist(params)
		{
			const { userId, groupId, diskConfig, inLayout, hideCompleted, parentWidget } = this.props;
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
		 * @param {object} params
		 * @return {CheckListFlatTree}
		 */
		createNewChecklist(params)
		{
			const newChecklist = CheckListFlatTree.buildDefaultList({ ...params, ...this.getTaskParams() });
			this.addChecklist(newChecklist);

			return newChecklist;
		}

		/**
		 * @param {object} moveParams
		 * @param {number[]} [moveParams.moveIds]
		 * @param {number} [moveParams.toCheckListId]
		 * @param {number} [moveParams.sourceChecklistId]
		 * @param {boolean} [moveParams.open]
		 * @return {void}
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

		/**
		 * @param {number[]} moveIds
		 * @param {number} toCheckListId
		 * @param {number} sourceChecklistId
		 */
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
		 * @return {Promise}
		 */
		handleOnCreateChecklist = (checklistId) => () => {
			return this.openChecklist({
				checklist: this.createChecklist(),
				parentWidget: this.getParentWidgetByChecklistId(checklistId),
			});
		};

		/**
		 * @private
		 * @param params
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

		/**
		 * @public
		 * @return {{}[]}
		 */
		getChecklistRequestData()
		{
			const requestData = [];

			this.checklistsMap.forEach((checklist) => {
				if (checklist?.getRootItem()?.hasDescendants())
				{
					requestData.push(checklist.getRequestData());
				}
			});

			return requestData.flat();
		}

		#filterEmptyChecklists()
		{
			this.checklistsMap.forEach((checklist, id) => {
				const isCurrentChecklist = this.currentOpenChecklistId === id;
				const isEmptyChecklist = !checklist?.getRootItem()?.hasDescendants();

				if (isEmptyChecklist && !isCurrentChecklist)
				{
					this.checklistsMap.delete(id);
				}
			});
		}

		#handleOnChange = () => {
			const { onChange } = this.props;

			onChange(this);
		};

		async handleOnSave()
		{
			const { taskId } = this.getTaskParams();
			if (!taskId)
			{
				return false;
			}

			this.#filterEmptyChecklists();
			this.#handleOnChange();
			const items = this.getChecklistRequestData();

			try
			{
				const response = await ChecklistController.save({ taskId, items });
				this.#updateAfterSave(response);
			}
			catch (error)
			{
				console.error(error);

				return false;
			}

			return true;
		}

		#handleOnClose = (checklistId) => {
			const checklist = this.checklistsMap.get(checklistId);

			if (!checklist || !this.widgetMap.has(checklistId))
			{
				return;
			}

			this.removeFromWidgetMap(checklistId);
			void this.handleOnSave();

			this.props.onClose?.();
		};

		handleOnRemove = (checklistId) => () => {
			this.closeChecklistWidget(checklistId);
			this.deleteChecklist(checklistId);
			void this.handleOnSave();
		};

		getTaskParams()
		{
			const { userId, taskId, groupId, diskConfig, hideCompleted } = this.props;

			return { userId, taskId, groupId, diskConfig, hideCompleted };
		}

		#updateAfterSave(items)
		{
			if (!items)
			{
				console.warn('Items not found after saving the checklist');

				return;
			}

			const checklist = this.checklistsMap.get(this.currentOpenChecklistId);
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

		/**
		 * @public
		 * @return {boolean}
		 */
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
	}

	module.exports = { ChecklistController };
});
