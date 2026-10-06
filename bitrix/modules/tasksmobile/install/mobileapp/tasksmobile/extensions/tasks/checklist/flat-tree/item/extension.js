/**
 * @module tasks/checklist/flat-tree/item
 */
jn.define('tasks/checklist/flat-tree/item', (require, exports, module) => {
	const { hashCode } = require('utils/hash');
	const { merge } = require('utils/object');
	const { Random } = require('utils/random');
	const { Type } = require('type');

	const shortMemberTypes = {
		A: 'accomplice',
		U: 'auditor',
	};

	const memberTypes = {
		accomplice: 'A',
		auditor: 'U',
		...shortMemberTypes,
	};

	class CheckListFlatTreeItem
	{
		/** @param {CheckListFlatTreeItemProps} props */
		constructor(props)
		{
			this.emitter = new JNEventEmitter();
			const { checklist, item } = props;
			/** @type {CheckListFlatTree} */
			this.checklist = checklist;
			this.item = item;

			this.updateListViewType();
		}

		/**
		 * @param {ChecklistItemDraft} [prevItem]
		 * @return {ChecklistItemData}
		 */
		static createItem(prevItem = {})
		{
			const nodeId = Random.getString();

			return merge({
				id: nodeId,
				key: nodeId,
				type: CheckListFlatTreeItem.getItemType(),
				nodeId,
				focused: true,
				isNew: false,
				action: {
					add: true,
					addAccomplice: true,
					modify: true,
					remove: true,
					toggle: true,
				},
				fields: {
					id: nodeId,
					title: '',
					parentId: 0,
					sortIndex: 0,
					displaySortIndex: '',
					isComplete: false,
					isImportant: false,
					isSelected: false,
					isCollapse: false,
					completedCount: 0,
					totalCount: 0,
					members: {},
					attachments: {},
				},
				descendants: [],
			}, prevItem);
		}

		/** @returns {string} itemType */
		static getItemType()
		{
			return 'checkListItem';
		}

		/** @return {ChecklistItemFields} */
		get fields()
		{
			return this.item.fields;
		}

		/** @return {ChecklistItemAction} */
		get action()
		{
			return this.item.action;
		}

		/** @return {CheckListFlatTree} */
		getCheckList()
		{
			return this.checklist;
		}

		/** @param {CheckListFlatTree} checkList */
		setCheckList(checkList)
		{
			this.checklist = checkList;
		}

		/** @return {string} */
		getType()
		{
			return this.item.type;
		}

		updateListViewType()
		{
			this.item.type = this.createHashType();
		}

		/** @return {string} */
		createHashType()
		{
			const params = {
				isRoot: this.isRoot(),
				focused: this.isFocused(),
				attachments: this.getAttachments(),
				members: this.getMembers(),
				isComplete: this.getIsComplete(),
				isImportant: this.getIsImportant(),
				displayDepth: this.getDepth(),
				totalCount: this.getTotalCount(),
			};

			if (this.isNew())
			{
				params.nodeId = this.getNodeId();
			}

			return `${CheckListFlatTreeItem.getItemType()}-${hashCode(JSON.stringify(params))}`;
		}

		/** @return {number} */
		getIndex()
		{
			return this.checklist.getIndexById(this.getId());
		}

		/** @return {ChecklistItemData} */
		getItem()
		{
			return this.item;
		}

		/** @return {ChecklistItemId} */
		getId()
		{
			return this.item.id;
		}

		/** @return {ChecklistItemId} */
		getCopiedId()
		{
			return this.fields.copiedId;
		}

		/** @param {ChecklistItemId} id */
		setId(id)
		{
			this.fields.id = id;
		}

		/** @param {number} totalCount */
		setTotalCount(totalCount)
		{
			if (Type.isNumber(totalCount))
			{
				this.fields.totalCount = Number(totalCount);
			}
		}

		/** @return {ChecklistItemId} */
		getFieldId()
		{
			return this.fields.id;
		}

		/** @return {number} */
		getTotalCount()
		{
			return this.fields.totalCount;
		}

		/** @return {string} */
		getKey()
		{
			return this.item.key;
		}

		/** @return {CheckListFlatTreeItem|undefined} */
		getParent()
		{
			return this.checklist.getItemById(this.getParentId());
		}

		/** @return {ChecklistItemId} */
		getParentId()
		{
			return this.fields.parentId;
		}

		/** @return {string} */
		getTitle()
		{
			return this.fields.title;
		}

		/** @param {string} [title] */
		setTitle(title = '')
		{
			this.fields.title = title;
		}

		/** @param {ChecklistItemId} id */
		setParentId(id)
		{
			if (id)
			{
				this.fields.parentId = id;
			}
		}

		/** @param {number} sortIndex */
		setSortIndex(sortIndex)
		{
			this.fields.sortIndex = sortIndex;
		}

		/** @returns {number} */
		getSortIndex()
		{
			return this.fields.sortIndex;
		}

		/** @param {string} displaySortIndex */
		setDisplaySortIndex(displaySortIndex)
		{
			this.fields.displaySortIndex = displaySortIndex;
		}

		/** @returns {string} */
		getDisplaySortIndex()
		{
			return this.fields.displaySortIndex;
		}

		/** @return {number} */
		getDepth()
		{
			const displaySortIndex = this.getDisplaySortIndex();

			return (displaySortIndex.match(/\./g) || []).length;
		}

		/** @return {ChecklistNodeId} */
		getNodeId()
		{
			return this.item.nodeId;
		}

		/** @param {ChecklistNodeId} [id] */
		setNodeId(id)
		{
			this.item.nodeId = id || Random.getString();
		}

		/** @param {number} completedCount */
		setCompletedCount(completedCount)
		{
			this.fields.completedCount = completedCount;
		}

		/** @return {number} */
		getCompletedCount()
		{
			return this.fields.completedCount;
		}

		/** @return {Record<string, ChecklistAttachment|null>} */
		getAttachments()
		{
			return this.fields.attachments;
		}

		/** @return {number} */
		getAttachmentsCount()
		{
			return Object.keys(this.getAttachments()).length;
		}

		/** @return {boolean} */
		hasAttachments()
		{
			return this.getAttachmentsCount() > 0;
		}

		/** @return {boolean} */
		hasUploadingAttachments()
		{
			return Object.values(this.getAttachments()).some(({ isUploading }) => isUploading);
		}

		/** @param {Record<string, ChecklistAttachment|null>} attachments */
		setAttachments(attachments)
		{
			this.fields.attachments = attachments;
		}

		/** @param {Record<string, ChecklistAttachment>} inputAttachments */
		addAttachments(inputAttachments)
		{
			Object.keys(inputAttachments).forEach((id) => {
				this.updateAttachment(inputAttachments[id]);
			});
		}

		/** @param {ChecklistItemId} id */
		removeAttachment(id)
		{
			delete this.fields.attachments[id];
		}

		/** @param {ChecklistAttachment} attachment */
		updateAttachment(attachment)
		{
			this.fields.attachments[attachment.id] = attachment;
		}

		/** @return {number} */
		getTaskId()
		{
			const taskId = this.checklist.getTaskId();

			if (!taskId)
			{
				console.warn('Checklist: taskId not found');
			}

			return this.checklist.getTaskId();
		}

		/** @return {boolean} */
		isRoot()
		{
			return !this.getParentId() || this.item.isRoot;
		}

		/** @return {boolean} */
		isFocused()
		{
			return this.item.focused;
		}

		/** @return {boolean} */
		isAlwaysShow()
		{
			return this.item.alwaysShow;
		}

		/** @param {boolean} value */
		setAlwaysShow(value)
		{
			this.item.alwaysShow = value;
		}

		/** @return {boolean} */
		isNew()
		{
			return this.item.isNew;
		}

		/** @param {boolean} isNew */
		setIsNew(isNew)
		{
			this.item.isNew = isNew;
		}

		/** @return {boolean} */
		isFirstListDescendant()
		{
			return this.checklist.getIndexById(this.getId()) === 0;
		}

		/** @return {boolean} */
		getIsComplete()
		{
			return this.fields.isComplete;
		}

		/** @return {boolean */
		getIsImportant()
		{
			return this.fields.isImportant;
		}

		/** @return {boolean} */
		checkCanAdd()
		{
			return this.action.add;
		}

		/** @return {boolean} */
		checkCanAddAccomplice()
		{
			if (this.isRoot())
			{
				return this.action.addAccomplice;
			}

			return this.checklist.getRootItem().checkCanAddAccomplice();
		}

		/** @return {boolean} */
		checkCanUpdate()
		{
			return this.action.modify;
		}

		/** @return {boolean} */
		checkCanRemove()
		{
			return this.action.remove;
		}

		/** @return {boolean} */
		checkCanToggle()
		{
			return this.action.toggle;
		}

		/** @return {boolean} */
		shouldRemove()
		{
			return !this.hasAttachments() && !this.hasDescendants() && !this.hasMembers();
		}

		/** @return {boolean} */
		checkCanTabIn()
		{
			const sortIndex = this.getSortIndex();
			const depth = this.getDepth();

			return depth <= 5 && sortIndex > 0;
		}

		/** @return {boolean} */
		checkCanTabOut()
		{
			return Boolean(this.getDepth());
		}

		/** @returns {boolean} */
		hasAnotherCheckLists()
		{
			return true;
		}

		/** @returns {boolean} */
		hasItemTitle()
		{
			return Boolean(this.getTitle().trim());
		}

		blur()
		{
			this.item.focused = false;
		}

		focus()
		{
			this.item.focused = true;
		}

		/** @return {boolean} */
		hasMembers()
		{
			return this.getMembersCount() > 0;
		}

		/** @return {number} */
		getMembersCount()
		{
			return this.getMembers().length;
		}

		/** @returns {ChecklistMember[]} */
		getMembers()
		{
			return Object.values(this.getFieldMembers());
		}

		getPrepareMembers()
		{
			return this.getMembers().map((member) => ({
				...member,
				type: this.getMemberType(member.type),
			}));
		}

		/**
		 * @param {ChecklistMemberType} memberType
		 * @returns {ChecklistItemId[]}
		 */
		getMembersIds(memberType)
		{
			return this.getMembers()
				.filter(({ type }) => type === this.getMemberType(memberType))
				.map(({ id }) => id);
		}

		/** @param {Record<string, ChecklistMember>} members */
		setMembers(members)
		{
			this.fields.members = members;
		}

		/** @param {ChecklistMember[]} members */
		addMembers(members)
		{
			members.forEach((member) => {
				this.addMember(member);
			});
		}

		/**
		 * @param {ChecklistItemId} userId
		 * @returns {ChecklistMember|undefined}
		 */
		getMember(userId)
		{
			const fieldMembers = this.getFieldMembers();

			return fieldMembers[userId];
		}

		/** @returns {Record<string, ChecklistMember>} */
		getFieldMembers()
		{
			return this.fields.members;
		}

		/** @param {ChecklistMember} member */
		addMember(member)
		{
			this.emitter.emit(`${member.type}Add`, [member]);
			const members = this.getFieldMembers();

			members[member.id] = member;
		}

		/** @param {ChecklistMemberType|ChecklistMemberShortType} memberType */
		clearMemberByType(memberType)
		{
			const members = {};
			this.getMembers().forEach((member) => {
				const type = shortMemberTypes[memberType]
					? memberType
					: this.getMemberType(memberType);

				if (type !== member.type)
				{
					members[member.id] = member;
				}
			});

			this.setMembers(members);
		}

		/** @return {boolean} */
		hasAuditor()
		{
			return this.hasMemberType(memberTypes.auditor);
		}

		/** @return {boolean} */
		hasAccomplice()
		{
			return this.hasMemberType(memberTypes.accomplice);
		}

		/**
		 * @param {ChecklistMemberShortType} memberType
		 * @return {boolean}
		 */
		hasMemberType(memberType)
		{
			return this.getMembers().some(({ type }) => memberType === type);
		}

		/**
		 * @param {ChecklistMemberType|ChecklistMemberShortType} type
		 * @return {ChecklistMemberShortType|ChecklistMemberType}
		 */
		getMemberType(type)
		{
			return memberTypes[type];
		}

		/** @return {number} */
		getUserId()
		{
			return this.checklist.getUserId();
		}

		/**
		 *
		 * @param {ChecklistItemId} [moveId]
		 * @return {ChecklistItemId[]}
		 */
		getMoveIds(moveId)
		{
			const moveIds = moveId ? [moveId] : [];
			this.getDescendants(true).forEach((descendant) => {
				moveIds.push(descendant.getId());
			});

			return moveIds;
		}

		/**
		 * @param {boolean} [deep]
		 * @return {CheckListFlatTreeItem[]}
		 */
		getDescendants(deep = false)
		{
			return this.checklist.getDescendants(this.getId(), deep);
		}

		/** @return {boolean} */
		hasDescendants()
		{
			return this.getTotalCount() > 0;
		}

		/**
		 * @param {boolean} [deep]
		 * @return {number}
		 */
		getDescendantsCount(deep = false)
		{
			return this.checklist.getDescendantsCount(this.getId(), deep);
		}

		toggleComplete()
		{
			if (this.getIsSelected() || !this.checkCanToggle())
			{
				return;
			}

			const isComplete = !this.getIsComplete();

			this.setIsComplete(isComplete);
			this.updateComplete(isComplete);
			this.checklist.updateCounters(this.getParent());
			this.updateListViewType();
		}

		/** @param {boolean} isComplete */
		setIsComplete(isComplete)
		{
			this.fields.isComplete = isComplete;
		}

		/** @return {boolean} */
		getIsSelected()
		{
			return this.fields.isSelected;
		}

		/** @param {boolean} important */
		toggleImportant(important)
		{
			this.fields.isImportant = important;
		}

		/** @return {CheckListFlatTreeItem[]} */
		tabOut()
		{
			const oldParent = this.getParent();
			const newParent = this.getParent().getParent();

			this.setParentId(newParent?.getId());
			this.tabMoveUpdateCounter([oldParent, newParent]);
			this.updateListViewType();

			return [oldParent, newParent];
		}

		/** @return {CheckListFlatTreeItem[]} */
		tabIn()
		{
			const oldParent = this.getParent();
			const newParent = this.checklist.getPrevSiblingById(this.getId());

			this.setParentId(newParent?.getId());
			this.tabMoveUpdateCounter([oldParent, newParent]);
			this.updateListViewType();

			return [oldParent, newParent];
		}

		/** @param {CheckListFlatTreeItem[]} items */
		tabMoveUpdateCounter(items)
		{
			items.forEach((item) => {
				this.checklist.updateIndexes(item.getId());
				this.checklist.updateCounters(item);
			});
		}

		updateCompletedCount()
		{
			const { completedCount, totalCount } = this.countCompletedItems();
			const isComplete = totalCount > 0 && completedCount === totalCount;

			this.setCompletedCount(completedCount);
			if (this.isRoot())
			{
				this.setIsComplete(isComplete);
			}
		}

		updateTotalCount()
		{
			this.setTotalCount(this.getDescendantsCount());
		}

		/**
		 * @param {boolean} [recursively]
		 * @return {ChecklistCompletedCounters}
		 */
		countCompletedItems(recursively = false)
		{
			let completedCount = 0;
			const descendants = this.getDescendants();

			descendants.forEach((descendant) => {
				if (descendant.getIsComplete())
				{
					completedCount += 1;
				}

				if (recursively)
				{
					const { completedCount: descendantCompletedItems } = descendant.countCompletedItems(recursively);
					completedCount += descendantCompletedItems;
				}
			});

			return { completedCount, totalCount: descendants.length };
		}

		updateComplete(complete)
		{
			if (!this.checklist.isAutoCompleteItem())
			{
				return;
			}

			const action = complete ? 'complete' : 'renew';
			const taskId = this.getTaskId();
			const checkListItemId = this.getFieldId();

			if (!taskId || !Type.isNumber(checkListItemId))
			{
				return;
			}

			BX.ajax.runAction(
				`tasks.task.checklist.${action}`,
				{
					data: {
						taskId,
						checkListItemId,
					},
				},
			).catch(console.error);
		}
	}

	module.exports = { CheckListFlatTreeItem };
});
