/** @module tasks/checklist/view-model/src/view/item-view */
jn.define('tasks/checklist/view-model/src/view/item-view', (require, exports, module) => {
	const store = require('statemanager/redux/store');
	const checklistsSlice = require('tasks/statemanager/redux/slices/checklists');
	const itemsSlice = require('tasks/statemanager/redux/slices/checklist-items');
	const { ChecklistEntityType, ChecklistMemberType } = require('tasks/checklist/enum');
	const {
		selectById: selectChecklistById,
		checklistTitleChanged,
		toggleItems,
	} = checklistsSlice;
	const {
		collectCompletionCascade,
		serverItemIds,
	} = require('tasks/statemanager/redux/slices/checklists/model');
	const support = require('tasks/checklist/view-model/support');
	const {
		computeDepth,
		normalizeAttachments,
		upsertAttachment,
		removeAttachmentById,
	} = support;
	const {
		selectById: selectItemById,
		selectItemsByChecklistId,
		selectItemChildren,
		itemTitleChanged,
		itemsToggled,
		itemImportantToggled,
		itemTabbedIn,
		itemTabbedOut,
		itemMembersAdded,
		itemMembersClearedByType,
		attachmentsChanged,
	} = itemsSlice;

	const ITEMS_SLICE_NAME = 'tasks:checklistItems';
	const CHECKLISTS_SLICE_NAME = 'tasks:checklists';

	/** @class ChecklistItemView */
	class ChecklistItemView
	{
		#isRoot = false;

		/** @type {object|null} */
		#modelSliceRef = null;

		/** @type {ChecklistItemReduxModel|ChecklistReduxModel|undefined} */
		#cachedModel;

		/** @param {ChecklistItemViewModelProps} params */
		constructor({ itemId, checklistId, context, isRoot = false, viewModel })
		{
			this.itemId = itemId;
			this.checklistId = checklistId;
			this.context = context;
			this.#isRoot = isRoot;
			/** @type {ChecklistView} */
			this.viewModel = viewModel;
		}

		/** @return {object} */
		#store()
		{
			return store;
		}

		/** @return {ChecklistItemReduxModel|ChecklistReduxModel|undefined} */
		#model()
		{
			const state = this.#store().getState();
			const sliceName = this.#isRoot ? CHECKLISTS_SLICE_NAME : ITEMS_SLICE_NAME;
			const sliceRef = state[sliceName];

			if (sliceRef !== this.#modelSliceRef)
			{
				this.#modelSliceRef = sliceRef;
				this.#cachedModel = this.#isRoot
					? selectChecklistById(state, this.itemId)
					: selectItemById(state, this.itemId);
			}

			return this.#cachedModel;
		}

		/** @param {object} action */
		#dispatch(action)
		{
			this.#store().dispatch(action);
		}

		/** @return {ChecklistItemId} */
		getId()
		{
			return this.itemId;
		}

		/** @return {string} */
		getNodeId()
		{
			return this.#model()?.nodeId;
		}

		/** @return {number|null} */
		getServerId()
		{
			return this.#model()?.serverId ?? null;
		}

		/**
		 * ListView row key. It is the store id, not `nodeId`: callers pass store ids into
		 * row operations (`removeMovedRows`, `deleteRows`), and `nodeId` is not unique across entities.
		 *
		 * @return {string}
		 */
		getKey()
		{
			return String(this.itemId);
		}

		/** @return {ChecklistItemId} */
		getParentId()
		{
			return this.#model()?.parentId;
		}

		/** @return {number} */
		getIndex()
		{
			return this.viewModel.indexOf(this.itemId);
		}

		/** @return {string} */
		getTitle()
		{
			return this.#model()?.title ?? '';
		}

		/** @param {string} [title] */
		setTitle(title = '')
		{
			if (this.#isRoot)
			{
				this.#dispatch(checklistTitleChanged({ checklistId: this.itemId, title }));

				return;
			}

			this.#dispatch(itemTitleChanged({ itemId: this.itemId, title }));
		}

		/** @return {boolean} */
		hasTitle()
		{
			return Boolean(this.getTitle().trim());
		}

		/** @return {string} */
		getDisplayIndex()
		{
			return this.#model()?.displaySortIndex ?? '';
		}

		/** @return {number} */
		getDepth()
		{
			return computeDepth(
				this.getParentId(),
				this.checklistId,
				(id) => selectItemById(this.#store().getState(), id)?.parentId,
			);
		}

		/** @return {number} */
		getSortIndex()
		{
			return this.#model()?.sortIndex ?? 0;
		}

		/** @return {boolean} */
		isComplete()
		{
			return Boolean(this.#model()?.isComplete);
		}

		toggle()
		{
			if (!this.canToggle())
			{
				return;
			}

			const next = !this.isComplete();
			const items = selectItemsByChecklistId(this.#store().getState(), this.checklistId);
			const itemIds = collectCompletionCascade(items, this.itemId, next);
			const byId = new Map(items.map((item) => [item.id, item]));

			this.#toggleV2Cascade(itemIds, byId, next);
		}

		/**
		 * @param {ChecklistItemId[]} itemIds
		 * @param {Map<ChecklistItemId, ChecklistItemReduxModel>} byId
		 * @param {boolean} next
		 */
		#toggleV2Cascade(itemIds, byId, next)
		{
			const persistsPerEdit = !ChecklistEntityType.isDod(this.context.entityType);
			const serverIds = serverItemIds(itemIds.map((id) => byId.get(id)?.serverId));

			if (persistsPerEdit && serverIds.length > 0)
			{
				this.#dispatch(toggleItems({
					entityType: this.context.entityType,
					entityId: this.context.entityId,
					itemIds,
					serverIds,
					isComplete: next,
				}));

				return;
			}

			this.#dispatch(itemsToggled({ itemIds, isComplete: next }));
		}

		/** @return {boolean} */
		isImportant()
		{
			return Boolean(this.#model()?.isImportant);
		}

		/** @param {boolean} important */
		setImportant(important)
		{
			this.#dispatch(itemImportantToggled({ itemId: this.itemId, isImportant: Boolean(important) }));
		}

		commit()
		{}

		saveMembers()
		{}

		syncAttachments()
		{}

		syncMove()
		{}

		/** @return {boolean} */
		isFocused()
		{
			return this.viewModel.isFocused(this.itemId);
		}

		focus()
		{
			this.viewModel.focus(this.itemId);
		}

		blur()
		{
			this.viewModel.blur(this.itemId);
		}

		/** @return {boolean} */
		isRoot()
		{
			return this.#isRoot;
		}

		/** @return {boolean} */
		isNew()
		{
			return Boolean(this.#model()?.isNew);
		}

		/** @return {boolean} */
		shouldRemove()
		{
			return !this.hasAttachments() && !this.hasChildren() && !this.hasMembers();
		}

		/** @return {ChecklistItemActions} */
		#actions()
		{
			return this.#model()?.actions ?? {};
		}

		/** @return {boolean} */
		canAdd()
		{
			return support.canAdd(this.context);
		}

		/** @return {boolean} */
		canEdit()
		{
			return support.canEdit(this.context, this.#rootCreatedBy());
		}

		/** @return {number|null} */
		getCreatedBy()
		{
			return this.#model()?.createdBy ?? null;
		}

		/** @return {number|null} */
		#rootCreatedBy()
		{
			return this.viewModel.getRoot()?.getCreatedBy?.() ?? null;
		}

		/** @return {boolean} */
		canRemove()
		{
			return support.canRemove(this.#actions());
		}

		/** @return {boolean} */
		canToggle()
		{
			return support.canToggle(this.#actions());
		}

		/** @return {boolean} */
		canAddAccomplice()
		{
			return this.canEdit();
		}

		/** @return {boolean} */
		canIndent()
		{
			return support.canIndent(this.getDepth(), Boolean(this.viewModel.getPrevSiblingById(this.itemId)));
		}

		/** @return {boolean} */
		canOutdent()
		{
			return support.canOutdent(this.getDepth());
		}

		/** @return {ChecklistMember[]} */
		getAccomplices()
		{
			return support.getAccomplices(this.#model());
		}

		/** @return {ChecklistMember[]} */
		getAuditors()
		{
			return support.getAuditors(this.#model());
		}

		/** @return {ChecklistMember[]} */
		getMembers()
		{
			return support.getMembers(this.#model());
		}

		/** @return {boolean} */
		hasMembers()
		{
			return this.getMembersCount() > 0;
		}

		/** @return {number} */
		getMembersCount()
		{
			return support.countMembers(this.#model());
		}

		/** @return {boolean} */
		hasAccomplices()
		{
			return (this.#model()?.accomplices ?? []).length > 0;
		}

		/** @return {boolean} */
		hasAuditors()
		{
			return (this.#model()?.auditors ?? []).length > 0;
		}

		/** @param {{ accomplices?: ChecklistMember[], auditors?: ChecklistMember[] }} members */
		addMembers({ accomplices = [], auditors = [] } = {})
		{
			this.#dispatch(itemMembersAdded({ itemId: this.itemId, accomplices, auditors }));
		}

		/** @param {'accomplices'|'auditors'} role */
		clearMembers(role)
		{
			if (ChecklistMemberType.isStoreKey(role))
			{
				this.#dispatch(itemMembersClearedByType({ itemId: this.itemId, role }));
			}
		}

		/** @return {ChecklistAttachmentV2[]} */
		getAttachments()
		{
			return this.#model()?.attachments ?? [];
		}

		/** @return {boolean} */
		hasAttachments()
		{
			return this.getAttachmentsCount() > 0;
		}

		/** @return {boolean} */
		hasUploadingAttachments()
		{
			return this.getAttachments().some((attachment) => attachment?.isUploading);
		}

		/** @return {number} */
		getAttachmentsCount()
		{
			return this.getAttachments().length;
		}

		/** @param {ChecklistAttachmentV2[]|Object<string, ChecklistAttachmentV2>} attachments */
		setAttachments(attachments)
		{
			this.#dispatch(attachmentsChanged({
				itemId: this.itemId,
				attachments: normalizeAttachments(attachments),
			}));
		}

		/** @param {ChecklistAttachmentV2} attachment */
		addAttachment(attachment)
		{
			if (!attachment)
			{
				return;
			}

			this.setAttachments(upsertAttachment(this.getAttachments(), attachment));
		}

		/** @param {ChecklistItemId} id */
		removeAttachment(id)
		{
			this.setAttachments(removeAttachmentById(this.getAttachments(), id));
		}

		/** @return {ChecklistItemReduxModel[]} */
		#childModels()
		{
			return selectItemChildren(this.#store().getState(), this.itemId);
		}

		/** @return {number} */
		getChildrenCount()
		{
			return this.#childModels().length;
		}

		/** @return {number} */
		getCompletedChildrenCount()
		{
			return this.#childModels().filter((child) => child.isComplete).length;
		}

		/**
		 * @param {boolean} [deep]
		 * @return {ChecklistItemView[]}
		 */
		getChildren(deep = false)
		{
			return this.viewModel.getChildren(this.itemId, deep);
		}

		/** @return {boolean} */
		hasChildren()
		{
			return this.getChildrenCount() > 0;
		}

		/** @return {ChecklistItemView[]} */
		indent()
		{
			const oldParent = this.getParent();
			const newParent = this.viewModel.getPrevSiblingById(this.itemId);

			this.#dispatch(itemTabbedIn({ itemId: this.itemId }));
			this.syncMove();

			return [oldParent, newParent].filter(Boolean);
		}

		/** @return {ChecklistItemView[]} */
		outdent()
		{
			const oldParent = this.getParent();
			const newParent = oldParent ? oldParent.getParent() : null;

			this.#dispatch(itemTabbedOut({ itemId: this.itemId }));
			this.syncMove();

			return [oldParent, newParent].filter(Boolean);
		}

		/** @return {ChecklistItemView|undefined} */
		getParent()
		{
			const parentId = this.getParentId();
			if (!parentId || parentId === this.checklistId)
			{
				return this.viewModel.getRoot();
			}

			return this.viewModel.getItemById(parentId);
		}

		/**
		 * @param {ChecklistItemId} [seedId]
		 * @return {ChecklistItemId[]}
		 */
		getSubtreeIds(seedId)
		{
			const ids = seedId ? [seedId] : [];
			this.getChildren(true).forEach((descendant) => {
				ids.push(descendant.getId());
			});

			return ids;
		}

		/** @return {number} */
		getTaskId()
		{
			return this.viewModel.getTaskId();
		}

		/** @return {number} */
		getUserId()
		{
			return this.viewModel.getUserId();
		}
	}

	module.exports = { ChecklistItemView };
});
