/**
 * @module tasks/checklist/flat-tree
 */
jn.define('tasks/checklist/flat-tree', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Random } = require('utils/random');
	const { CheckListFlatTreeItem } = require('tasks/checklist/flat-tree/item');

	/**
	 * @class CheckListFlatTree
	 */
	class CheckListFlatTree
	{
		constructor(props)
		{
			const { checklist, userId } = props;

			this.isSaved = false;
			this.userId = userId;
			this.taskId = 0;
			const flatTree = this.getFlatTree(checklist);
			this.checklist = flatTree.map((item) => new CheckListFlatTreeItem({ item, checkList: this }));
		}

		/**
		 * @param {object} params
		 * @param {boolean} [params.addBlankItem]
		 * @param {number} [params.number]
		 * @return {CheckListFlatTree}
		 */
		static buildDefaultList(params = {})
		{
			const { addBlankItem = false, items = [], number = 0 } = params;

			const checklistNumber = number >= 1 ? number + 1 : '';
			const title = Loc.getMessage(
				'TASKSMOBILE_CHECKLIST_PARENT_DEFAULT_TEXT',
				{ '#number#': checklistNumber },
			).trim();

			const rootItem = CheckListFlatTreeItem.createItem({
				focused: false,
				fields: { title },
			});

			const flatCheckList = new CheckListFlatTree({ checklist: rootItem });
			if (addBlankItem)
			{
				flatCheckList.addNewItem(flatCheckList.getTreeItem(rootItem));
			}

			items.forEach((item) => {
				flatCheckList.addNewItem(item);
			});

			return flatCheckList;
		}

		getFlatTree(checkListTree)
		{
			const flatList = [];
			const traverse = (descendant) => {
				const { descendants, ...item } = descendant;

				if (!item.key)
				{
					const nodeId = Random.getString();
					const fields = item.fields || {};
					const attachments = this.prepareAttachments(fields.attachments);

					item.isNew = false;
					item.index = flatList.length;
					item.focused = false;
					item.key = nodeId;
					item.type = CheckListFlatTreeItem.getItemType();
					item.nodeId = nodeId;
					item.id = fields?.id;
					fields.attachments = attachments;
					fields.totalCount = descendants.length;
				}

				flatList.push(item);

				if (descendants)
				{
					descendants.forEach((descendantItem) => traverse(descendantItem));
				}
			};

			traverse(checkListTree);

			return flatList;
		}

		/**
		 * @public
		 * @return {CheckListFlatTreeItem}
		 */
		getLastItem()
		{
			return this.checklist[this.getLength() - 1];
		}

		prepareAttachments(attachments)
		{
			const attachmentsFileInfo = {};
			Object.keys(attachments).forEach((id) => {
				const value = attachments[id];
				attachmentsFileInfo[id] = typeof attachments[id] === 'string' ? null : value;
			});

			return attachmentsFileInfo;
		}

		setUserId(userId)
		{
			this.userId = parseInt(userId, 10);
		}

		getUserId()
		{
			return this.userId;
		}

		setTaskId(taskId)
		{
			this.taskId = parseInt(taskId, 10);
		}

		getTaskId()
		{
			return this.taskId;
		}

		/**
		 * @public
		 * @return {CheckListFlatTreeItem[]}
		 */
		getItems(checklist)
		{
			const checklistFlatTree = checklist || this.checklist;

			return checklistFlatTree.map((item) => item.getItem());
		}

		/**
		 * @public
		 * @return {(CheckListFlatTreeItem|null)[]}
		 */
		getTreeItems()
		{
			return this.checklist.map((item) => this.getTreeItem(item));
		}

		/**
		 * @public
		 * @param {object} item
		 * @return {CheckListFlatTreeItem|null}
		 */
		getTreeItem(item)
		{
			return item ? new CheckListFlatTreeItem({ item, checkList: this }) : null;
		}

		addItem(item)
		{
			item.setCheckList(this);
			const parent = item.getParent();
			const parentId = parent?.getId() || this.getRootItem().getId();

			if (!parent)
			{
				item.setParentId(parentId);
			}

			this.checklist.push(item);

			this.updateIndexes(parentId);
		}

		/**
		 * @public
		 * @param {CheckListFlatTreeItem} prevItem
		 * @returns {{position: number, item: CheckListFlatTreeItem}}
		 */
		addNewItem(prevItem)
		{
			const id = prevItem.getId();
			const parentId = prevItem.getParentId() || id;
			const newItem = this.getTreeItem(CheckListFlatTreeItem.createItem({
				isNew: true,
				fields: {
					parentId,
					displaySortIndex: prevItem.getDisplaySortIndex(),
				},
			}));

			newItem.updateListViewType();

			const position = prevItem ? this.getNewItemPosition(id) : this.getLength() + 1;

			if (position === null)
			{
				this.checklist.push(newItem);
			}
			else
			{
				this.checklist.splice(position, 0, newItem);
			}

			this.updateIndexes(parentId);

			return { position, item: newItem };
		}

		/**
		 * @public
		 * @param {CheckListFlatTreeItem} item
		 * @return {string[]}
		 */
		removeItem(item)
		{
			const removeIds = [item.getKey()];
			const descendants = this.getDescendants(item.getId(), true);
			if (descendants.length > 0)
			{
				descendants.forEach((descendant) => {
					this.removeById(descendant.getId());
					removeIds.push(descendant.getKey());
				});
			}

			this.removeById(item.getId());
			this.updateIndexes(item.getParentId());

			return removeIds.filter(Boolean);
		}

		removeById(id)
		{
			const position = this.getIndexById(id);
			this.checklist.splice(position, 1);

			return position;
		}

		getIndexById(id)
		{
			return this.checklist.findIndex((item) => item.getId() === id);
		}

		getIndexByNodeId(nodeId)
		{
			return this.checklist.findIndex(({ nodeId: itemNodeId }) => nodeId === itemNodeId);
		}

		getNewItemPosition(id)
		{
			const currentIndex = this.getIndexById(id);
			const descendantsCount = this.getDescendantsCount(id, true);

			return currentIndex + descendantsCount + 1;
		}

		getSiblings(parentId)
		{
			return this.checklist.filter((item) => parentId === item.getParentId());
		}

		getPrevSiblingById(id)
		{
			const item = this.getItemById(id);
			const siblings = this.getSiblings(item.getParentId());
			const currentIndex = siblings.findIndex((sibling) => sibling.getId() === item.getId());
			const prevIndex = currentIndex - 1;

			if (prevIndex < 0)
			{
				return null;
			}

			return siblings[prevIndex];
		}

		/**
		 * @public
		 * @param {number|string}id
		 * @return {CheckListFlatTreeItem}
		 */
		getItemById(id)
		{
			return this.checklist?.find((item) => item.getId() === id);
		}

		getLength()
		{
			return this.getItems().length;
		}

		setCollapsed(nodeId, isCollapse)
		{
			const item = this.checklist.find(({ nodeId: itemNodeId }) => itemNodeId === nodeId);

			item.fields.isCollapse = isCollapse;
		}

		getDescendants(id, deep = false)
		{
			const childItems = [];
			const traverse = (item) => {
				const childrens = this.checklist.filter((child) => child.getParentId() === item.getId());
				childItems.push(...childrens);

				if (deep)
				{
					childrens.forEach((child) => traverse(child));
				}
			};

			const parentElement = this.getItemById(id);
			if (parentElement)
			{
				traverse(parentElement);
			}

			return childItems;
		}

		getDescendantsCount(id, deep = false)
		{
			return this.getDescendants(id, deep).length;
		}

		getCompleteCount(id)
		{
			const descendants = this.getDescendants(id);

			return descendants.filter(({ fields }) => fields.isComplete).length;
		}

		updateIndexes(id)
		{
			if (!id)
			{
				return;
			}

			this.updateSortIndexes(id);
			this.updateDisplaySortIndexes(id);
		}

		updateSortIndexes(id)
		{
			let sortIndex = 0;
			this.getDescendants(id).forEach((descendant) => {
				descendant.setSortIndex(sortIndex);
				sortIndex += 1;
			});
		}

		updateDisplaySortIndexes(id, sortIndex)
		{
			const item = this.getItemById(id);
			if (!id || !item)
			{
				return;
			}

			item.setDisplaySortIndex(sortIndex || item.getDisplaySortIndex());
			const parentSortIndex = item.getDisplaySortIndex() ? `${item.getDisplaySortIndex()}.` : '';

			let localSortIndex = 0;
			this.getDescendants(id).forEach((descendant) => {
				localSortIndex += 1;
				const newSortIndex = `${parentSortIndex}${localSortIndex}`;
				this.updateDisplaySortIndexes(descendant.getId(), newSortIndex);
			});
		}

		setFields(fields)
		{
			const availableFields = new Set([
				'id',
				'parentId',
				'title',
				'sortIndex',
				'displaySortIndex',
				'isComplete',
				'isImportant',
				'isSelected',
				'isCollapse',
				'completedCount',
				'totalCount',
				'members',
				'attachments',
			]);

			Object.keys(fields).forEach((name) => {
				const camelCaseName = this.snakeToCamelCase(name);

				if (availableFields.has(name))
				{
					const snakeCaseName = this.camelToSnakeCase(name);
					const setMethod = this[this.snakeToCamelCase(`SET_${snakeCaseName}`)].bind(this);
					setMethod(fields[name]);
				}
				else if (availableFields.has(camelCaseName))
				{
					const setMethod = this[this.snakeToCamelCase(`SET_${name}`)].bind(this);
					setMethod(fields[name]);
				}
			});
		}

		camelToSnakeCase(string)
		{
			let snakeCaseString = string;

			if (BX.type.isString(snakeCaseString))
			{
				snakeCaseString = snakeCaseString.replaceAll(/(.)([A-Z])/g, '$1_$2').toUpperCase();
			}

			return snakeCaseString;
		}

		snakeToCamelCase(string)
		{
			let camelCaseString = string;

			if (BX.type.isString(camelCaseString))
			{
				camelCaseString = camelCaseString.toLowerCase();

				camelCaseString = camelCaseString
					.replaceAll(
						/[\s_-]+(.)?/g,
						(match, chr) => {
							return (chr ? chr.toUpperCase() : '');
						},
					)
				;

				return camelCaseString.slice(0, 1).toLowerCase() + camelCaseString.slice(1);
			}

			return camelCaseString;
		}

		/**
		 * @return {CheckListFlatTreeItem}
		 */
		getRootItem()
		{
			return this.checklist.find((item) => item.getParentId() === 0);
		}

		getId()
		{
			return this.getRootItem().getId();
		}

		getFocusedItemId()
		{
			const focusedItem = this.checklist.find((item) => item.isFocused());

			return focusedItem && focusedItem.getId();
		}

		getOnlyMyItems()
		{
			return this.getItems(this.checklist.filter((item) => item.getMember(this.userId)));
		}

		getUncompletedItems()
		{
			return this.getItems(this.checklist.filter((item) => !item.getIsComplete()));
		}

		getRequestData()
		{
			return this.checklist.map((item) => {
				const title = item.getTitle();

				if (!title)
				{
					return null;
				}

				const parent = item.getParent();
				const itemId = item.getId();
				const parentId = item.getParentId();

				const itemRequestData = {
					NODE_ID: item.getNodeId(),
					PARENT_NODE_ID: parent ? parent.getNodeId() : 0,
					ID: Type.isInteger(itemId) ? itemId : null,
					PARENT_ID: Type.isInteger(parentId) ? parentId : null,
					TITLE: title,
					SORT_INDEX: item.getSortIndex(),
					IS_COMPLETE: item.getIsComplete() ? 1 : 0,
					IS_IMPORTANT: item.getIsImportant() ? 1 : 0,
					ATTACHMENTS: {},
					MEMBERS: {},
				};

				if (item.hasAttachments())
				{
					const attachments = item.getAttachments();
					Object.keys(attachments).forEach((id) => {
						if (attachments[id])
						{
							const { serverFileId } = attachments[id];

							itemRequestData.ATTACHMENTS[serverFileId] = serverFileId;
						}
					});
				}

				const members = item.getMembers();
				Object.keys(item.getMembers()).forEach((id) => {
					const { type, name } = members[id];
					itemRequestData.MEMBERS[id] = { TYPE: type, NAME: name };
				});

				return itemRequestData;
			}).filter(Boolean);
		}
	}

	module.exports = { CheckListFlatTree };
});