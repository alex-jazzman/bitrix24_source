/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_lib_feature, im_v2_lib_theme, im_v2_const) {
	'use strict';

	const CollabManager = {
		isCurrentUserGuest() {
			const {
				type
			} = im_v2_application_core.Core.getStore().getters['users/get'](im_v2_application_core.Core.getUserId());
			return type === im_v2_const.UserType.collaber;
		},
		shouldUseAccentColor(chat) {
			if (!isCollabV2Available()) {
				return true;
			}
			return chat.containsCollaber;
		},
		getBackgroundId(chat) {
			if (!isCollabV2Available() || chat.containsCollaber) {
				return im_v2_lib_theme.SpecialBackground.collab;
			}
			return im_v2_lib_theme.SpecialBackground.collabV2;
		},
		getSearchItemSubtitleText() {
			return getMessage('IM_SEARCH_ITEM_COLLAB_TYPE', 'IM_SEARCH_ITEM_COLLAB_V2_TYPE');
		},
		getSidebarHeaderText() {
			return getMessage('IM_SIDEBAR_COLLAB_HEADER_TITLE', 'IM_SIDEBAR_COLLAB_V2_HEADER_TITLE');
		},
		getSidebarChatTypeText() {
			return getMessage('IM_SIDEBAR_CHAT_TYPE_COLLAB', 'IM_SIDEBAR_CHAT_TYPE_COLLAB_V2');
		},
		getMentionItemSubtitleText() {
			return getMessage('IM_TEXTAREA_MENTION_COLLAB_TYPE', 'IM_TEXTAREA_MENTION_COLLAB_V2_TYPE');
		},
		getKickUserText() {
			return getMessage('IM_LIB_MENU_USER_KICK_FROM_COLLAB', 'IM_LIB_MENU_USER_KICK_FROM_COLLAB_V2');
		},
		getBeforeDeleteText() {
			return getMessage('IM_NOTIFIER_COLLAB_DELETE_PROGRESS', 'IM_NOTIFIER_COLLAB_V2_DELETE_PROGRESS');
		},
		getNotEmptyDeleteErrorText() {
			return getMessage('IM_NOTIFIER_COLLAB_DELETE_ENTITIES_ERROR', 'IM_NOTIFIER_COLLAB_V2_DELETE_ENTITIES_ERROR');
		},
		getDeleteConfirmTitleText() {
			return getMessage('IM_LIB_CONFIRM_DELETE_COLLAB_TITLE', 'IM_LIB_CONFIRM_DELETE_COLLAB_V2_TITLE');
		},
		getDeleteConfirmText() {
			return getMessage('IM_LIB_CONFIRM_DELETE_COLLAB_TEXT', 'IM_LIB_CONFIRM_DELETE_COLLAB_V2_TEXT');
		},
		getDeleteErrorText() {
			return getMessage('IM_NOTIFIER_COLLAB_DELETE_ERROR', 'IM_NOTIFIER_COLLAB_V2_DELETE_ERROR');
		},
		getLeaveConfirmTitleText() {
			return getMessage('IM_LIB_CONFIRM_LEAVE_COLLAB_TITLE', 'IM_LIB_CONFIRM_LEAVE_COLLAB_V2_TITLE');
		},
		getLeaveConfirmText() {
			return getMessage('IM_LIB_CONFIRM_LEAVE_COLLAB_TEXT', 'IM_LIB_CONFIRM_LEAVE_COLLAB_V2_TEXT');
		},
		getLeaveErrorText() {
			return getMessage('IM_NOTIFIER_COLLAB_LEAVE_ERROR', 'IM_NOTIFIER_COLLAB_V2_LEAVE_ERROR');
		},
		getKickConfirmTitleText() {
			return getMessage('IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_TITLE', 'IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_V2_TITLE');
		},
		getKickConfirmText() {
			return getMessage('IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_TEXT', 'IM_LIB_CONFIRM_USER_KICK_FROM_COLLAB_V2_TEXT');
		},
		getKickErrorText() {
			return getMessage('IM_NOTIFIER_COLLAB_KICK_ERROR', 'IM_NOTIFIER_COLLAB_V2_KICK_ERROR');
		},
		getCopyLinkError() {
			return getMessage('IM_NOTIFIER_COLLAB_COPY_LINK_FORBIDDEN_ERROR', 'IM_NOTIFIER_COLLAB_V2_COPY_LINK_FORBIDDEN_ERROR');
		},
		getInviteHeaderText() {
			return getMessage('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_TITLE', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_TITLE');
		},
		getInviteTitleText() {
			if (this.isCurrentUserGuest()) {
				return main_core.Loc.getMessage('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_DESCRIPTION_TITLE_GUEST');
			}
			return getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TITLE_EMPLOYEE', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_DESCRIPTION_TITLE_EMPLOYEE');
		},
		getInviteDescriptionText() {
			if (this.isCurrentUserGuest()) {
				return getMessage('IM_ENTITY_SELECTOR_ADD_TO_COLLAB_DESCRIPTION_TEXT_GUEST', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_DESCRIPTION_TEXT_GUEST');
			}
			return getMessage('IM_ENTITY_SELECTOR_ADD_TO_CHAT_DESCRIPTION_TEXT_GUEST', 'IM_ENTITY_SELECTOR_ADD_TO_COLLAB_V2_DESCRIPTION_TEXT_EMPLOYEE');
		},
		getListEmptyStateText() {
			return getMessage('IM_LIST_COLLAB_EMPTY_MSGVER_1', 'IM_LIST_COLLAB_V2_EMPTY_TITLE');
		},
		getListEmptyStateSubtitleText() {
			if (!isCollabV2Available()) {
				return '';
			}
			return main_core.Loc.getMessage('IM_LIST_COLLAB_V2_EMPTY_SUBTITLE');
		},
		getSearchInputText() {
			return getMessage('IM_LIST_CONTAINER_COLLAB_SEARCH_INPUT_PLACEHOLDER', 'IM_LIST_CONTAINER_COLLAB_V2_SEARCH_INPUT_PLACEHOLDER');
		},
		getInviteArticleCode() {
			return isCollabV2Available() ? '28397818' : '22706836';
		}
	};
	const isCollabV2Available = () => {
		return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isCollabV2Available);
	};
	const getMessage = (v1key, v2key) => {
		if (isCollabV2Available()) {
			return main_core.Loc.getMessage(v2key);
		}
		return main_core.Loc.getMessage(v1key);
	};

	exports.CollabManager = CollabManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Const);
//# sourceMappingURL=collab.bundle.js.map
