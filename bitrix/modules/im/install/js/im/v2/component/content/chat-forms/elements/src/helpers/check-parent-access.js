import { SelectorEntity, type SelectorEntityItem } from 'im.v2.const';
import { ChatAccessManager } from 'im.v2.lib.access';
import { Utils } from 'im.v2.lib.utils';

type UserIdFields = {
	memberEntities: SelectorEntityItem[],
	managerIds: number[],
	ownerId: number,
};

type CheckParentAccessParams = UserIdFields & { parentChatId: number };

export const checkParentAccess = (params: CheckParentAccessParams): Promise<boolean> => {
	const { memberEntities, managerIds, ownerId, parentChatId } = params;
	if (hasSelectedDepartments(memberEntities))
	{
		return ChatAccessManager.askForParentAccess();
	}

	const parentDialogId = Utils.dialog.buildChatDialogId(parentChatId);
	const allUserIds = collectChatUserIds({ memberEntities, managerIds, ownerId });

	return ChatAccessManager.canAddUsersToParent(parentDialogId, allUserIds);
};

const hasSelectedDepartments = (selectorEntities: SelectorEntityItem[]): boolean => {
	return selectorEntities.some(([entityType]) => entityType === SelectorEntity.department);
};

const collectChatUserIds = (params: UserIdFields): string[] => {
	const { memberEntities, managerIds, ownerId } = params;
	const entityUserIds = getEntityUserIds(memberEntities);
	const allIds = new Set([...entityUserIds, ...managerIds, ownerId]);

	return [...allIds].map((id) => String(id));
};

const getEntityUserIds = (memberEntities: SelectorEntityItem[]): number[] => {
	return memberEntities
		.filter(([entityType]) => entityType === SelectorEntity.user)
		.map(([, userId]) => Number(userId));
};
