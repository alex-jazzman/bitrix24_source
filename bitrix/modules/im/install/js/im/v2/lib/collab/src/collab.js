import { Loc } from 'main.core';

import { Core } from 'im.v2.application.core';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { SpecialBackground } from 'im.v2.lib.theme';
import { type ImModelChat, type ImModelUser } from 'im.v2.model';
import { UserType } from 'im.v2.const';

export const CollabManager = {
	isCurrentUserGuest(): boolean
	{
		const { type }: ImModelUser = Core.getStore().getters['users/get'](Core.getUserId());

		return type === UserType.collaber;
	},
	shouldUseAccentColor(chat: ImModelChat): boolean
	{
		if (!isCollabV2Available())
		{
			return true;
		}

		return chat.containsCollaber;
	},
	getBackgroundId(chat: ImModelChat): $Values<typeof SpecialBackground>
	{
		if (!isCollabV2Available() || chat.containsCollaber)
		{
			return SpecialBackground.collab;
		}

		return SpecialBackground.collabV2;
	},
	getSearchItemSubtitleText(): string
	{
		return getMessage('IM_SEARCH_ITEM_COLLAB_TYPE', 'IM_SEARCH_ITEM_COLLAB_V2_TYPE');
	},
	getSidebarHeaderText(): string
	{
		return getMessage('IM_SIDEBAR_COLLAB_HEADER_TITLE', 'IM_SIDEBAR_COLLAB_V2_HEADER_TITLE');
	},
	getSidebarChatTypeText(): string
	{
		return getMessage('IM_SIDEBAR_CHAT_TYPE_COLLAB', 'IM_SIDEBAR_CHAT_TYPE_COLLAB_V2');
	},
	getMentionItemSubtitleText(): string
	{
		return getMessage('IM_TEXTAREA_MENTION_COLLAB_TYPE', 'IM_TEXTAREA_MENTION_COLLAB_V2_TYPE');
	},
	getKickUserText(): string
	{
		return getMessage('IM_LIB_MENU_USER_KICK_FROM_COLLAB', 'IM_LIB_MENU_USER_KICK_FROM_COLLAB_V2');
	},
	getBeforeDeleteText(): string
	{
		return getMessage('IM_NOTIFIER_COLLAB_DELETE_PROGRESS', 'IM_NOTIFIER_COLLAB_V2_DELETE_PROGRESS');
	},
	getNotEmptyDeleteErrorText(): string
	{
		return getMessage('IM_NOTIFIER_COLLAB_DELETE_ENTITIES_ERROR', 'IM_NOTIFIER_COLLAB_V2_DELETE_ENTITIES_ERROR');
	},
	getDeleteConfirmTitleText(): string
	{
		return getMessage('IM_LIB_CONFIRM_DELETE_COLLAB_TITLE', 'IM_LIB_CONFIRM_DELETE_COLLAB_V2_TITLE');
	},
	getDeleteConfirmText(): string
	{
		return getMessage('IM_LIB_CONFIRM_DELETE_COLLAB_TEXT', 'IM_LIB_CONFIRM_DELETE_COLLAB_V2_TEXT');
	},
	getDeleteErrorText(): string
	{
		return getMessage('IM_NOTIFIER_COLLAB_DELETE_ERROR', 'IM_NOTIFIER_COLLAB_V2_DELETE_ERROR');
	},
	getLeaveConfirmTitleText(): string
	{
		return getMessage('IM_LIB_CONFIRM_LEAVE_COLLAB_TITLE', 'IM_LIB_CONFIRM_LEAVE_COLLAB_V2_TITLE');
	},
	getLeaveConfirmText(): string
	{
		return getMessage('IM_LIB_CONFIRM_LEAVE_COLLAB_TEXT', 'IM_LIB_CONFIRM_LEAVE_COLLAB_V2_TEXT');
	},
	getLeaveErrorText(): string
	{
		return getMessage('IM_NOTIFIER_COLLAB_LEAVE_ERROR', 'IM_NOTIFIER_COLLAB_V2_LEAVE_ERROR');
	},
	getKickConfirmTitleText(): string
	{
		return getMessage('IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_TITLE', 'IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_V2_TITLE');
	},
	getKickConfirmText(): string
	{
		return getMessage('IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_TEXT', 'IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_V2_TEXT');
	},
	getKickErrorText(): string
	{
		return getMessage('IM_NOTIFIER_COLLAB_KICK_ERROR', 'IM_NOTIFIER_COLLAB_V2_KICK_ERROR');
	},
	getCopyLinkError(): string
	{
		return getMessage('IM_NOTIFIER_COLLAB_COPY_LINK_FORBIDDEN_ERROR', 'IM_NOTIFIER_COLLAB_V2_COPY_LINK_FORBIDDEN_ERROR');
	},
	getInviteHeaderText(): string
	{
		return getMessage('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_TITLE', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_TITLE');
	},
	getInviteTitleText(): string
	{
		if (this.isCurrentUserGuest())
		{
			return Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_DESCRIPTION_TITLE_GUEST');
		}

		return getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TITLE_EMPLOYEE', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_DESCRIPTION_TITLE_EMPLOYEE');
	},
	getInviteDescriptionText(): string
	{
		if (this.isCurrentUserGuest())
		{
			return getMessage('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_DESCRIPTION_TEXT_GUEST', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_DESCRIPTION_TEXT_GUEST');
		}

		return getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TEXT_GUEST', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_DESCRIPTION_TEXT_EMPLOYEE');
	},
	getListEmptyStateText(): string
	{
		return getMessage('IM_LIST_COLLAB_EMPTY_MSGVER_1', 'IM_LIST_COLLAB_V2_EMPTY_TITLE');
	},
	getListEmptyStateSubtitleText(): string
	{
		if (!isCollabV2Available())
		{
			return '';
		}

		return Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_SUBTITLE');
	},
	getSearchInputText(): string
	{
		return getMessage('IM_LIST_CONTAINER_COLLAB_SEARCH_INPUT_PLACEHOLDER', 'IM_LIST_CONTAINER_COLLAB_V2_SEARCH_INPUT_PLACEHOLDER');
	},
	getInviteArticleCode(): string
	{
		return isCollabV2Available() ? '28397818' : '22706836';
	},
};

const isCollabV2Available = (): boolean => {
	return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
};

const getMessage = (v1key: string, v2key: string): string => {
	if (isCollabV2Available())
	{
		return Loc.getMessage(v2key);
	}

	return Loc.getMessage(v1key);
};
