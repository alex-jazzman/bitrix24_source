/** @module tasks/layout/checklist/presenter/src/item-presenter */
jn.define('tasks/layout/checklist/presenter/src/item-presenter', (require, exports, module) => {
	const { hashCode } = require('utils/hash');
	const { ChecklistMemberType } = require('tasks/checklist/enum');

	const ITEM_TYPE = 'checkListItem';

	/** @param {object} itemView */
	const getMembers = (itemView) => itemView.getMembers().map((member) => {
		const { role, ...rest } = member;

		return { ...rest, type: ChecklistMemberType.byRole(role)?.getCode() };
	});

	const getPreparedMembers = (itemView) => itemView.getMembers().map((member) => {
		const { role, ...rest } = member;

		return { ...rest, type: role };
	});

	const getFieldMembers = (itemView) => {
		const result = {};
		getMembers(itemView).forEach((member) => {
			result[member.id] = member;
		});

		return result;
	};

	/** @param {string} memberType */
	const getMembersIds = (itemView, memberType) => {
		const code = (ChecklistMemberType.byCode(memberType) ?? ChecklistMemberType.byRole(memberType))?.getCode();

		return getMembers(itemView)
			.filter((member) => member.type === code)
			.map(({ id }) => id);
	};

	const getAttachmentsRecord = (itemView) => {
		const result = {};
		itemView.getAttachments().forEach((attachment) => {
			result[attachment.id] = attachment;
		});

		return result;
	};

	const getHashType = (itemView) => {
		const params = {
			isRoot: itemView.isRoot(),
			focused: itemView.isFocused(),
			attachments: getAttachmentsRecord(itemView),
			members: getMembers(itemView),
			isComplete: itemView.isComplete(),
			isImportant: itemView.isImportant(),
			displayDepth: itemView.getDepth(),
			totalCount: itemView.getChildrenCount(),
		};

		if (itemView.isNew())
		{
			params.nodeId = itemView.getNodeId();
		}

		return `${ITEM_TYPE}-${hashCode(JSON.stringify(params))}`;
	};

	const getListViewItem = (itemView) => ({
		id: itemView.itemId,
		key: itemView.getKey(),
		type: getHashType(itemView),
		nodeId: itemView.getNodeId(),
	});

	const isFirstListDescendant = (itemView) => itemView.viewModel.indexOf(itemView.itemId) === 0;

	const hasAnotherChecklists = () => true;

	module.exports = {
		ITEM_TYPE,
		getMembers,
		getPreparedMembers,
		getFieldMembers,
		getMembersIds,
		getAttachmentsRecord,
		getHashType,
		getListViewItem,
		isFirstListDescendant,
		hasAnotherChecklists,
	};
});
