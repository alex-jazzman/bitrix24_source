/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_const, im_v2_lib_logger) {
	'use strict';

	const MinimalRoleForAction = {
		[im_v2_const.ActionByRole.readMessage]: im_v2_const.UserRole.member,
		[im_v2_const.ActionByRole.setReaction]: im_v2_const.UserRole.member,
		[im_v2_const.ActionByRole.openMessageMenu]: im_v2_const.UserRole.member,
		[im_v2_const.ActionByRole.openAvatarMenu]: im_v2_const.UserRole.member,
		[im_v2_const.ActionByRole.openSidebarMenu]: im_v2_const.UserRole.member,
		[im_v2_const.ActionByRole.subscribeToComments]: im_v2_const.UserRole.member,
		[im_v2_const.ActionByRole.openComments]: im_v2_const.UserRole.guest,
		[im_v2_const.ActionByRole.openSidebar]: im_v2_const.UserRole.guest
	};

	const DEFAULT_TYPE = 'default';
	class PermissionManager {
		static #instance;
		#rolePermissions = {};
		#chatTypePermissions = {};
		#userTypePermissions = {};
		#actionGroups = {};
		#actionGroupsDefaultRoles = {};
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		static init() {
			PermissionManager.getInstance();
		}
		constructor() {
			const {
				permissions
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_logger.Logger.warn('PermissionManager: permission from server', permissions);
			this.#init(permissions);
		}
		canPerformActionByRole(actionType, dialogId) {
			return this.#canPerformActionByRole(actionType, dialogId) && this.#canPerformActionByChatType(actionType, dialogId) && this.#canPerformActionByChatSettings(actionType, dialogId);
		}
		canPerformActionByUserType(actionType) {
			const externalUserType = this.#getUserType(im_v2_application_core.Core.getUserId());
			const userPermissions = this.#userTypePermissions[externalUserType];
			if (!actionType || !userPermissions) {
				return true;
			}
			const action = im_v2_const.ActionByUserType[actionType];
			return userPermissions[action] ?? true;
		}
		getDefaultRolesForActionGroups(chatType) {
			if (!this.#actionGroupsDefaultRoles[chatType]) {
				return this.#actionGroupsDefaultRoles[DEFAULT_TYPE];
			}
			return this.#actionGroupsDefaultRoles[chatType];
		}
		#init(rawPermissions) {
			this.#rolePermissions = MinimalRoleForAction;
			if (!rawPermissions) {
				return;
			}
			const {
				byChatType,
				byUserType,
				actionGroups,
				actionGroupsDefaults
			} = rawPermissions;
			this.#chatTypePermissions = this.#prepareChatTypePermissions(byChatType);
			this.#userTypePermissions = byUserType;
			this.#actionGroups = actionGroups;
			this.#actionGroupsDefaultRoles = actionGroupsDefaults;
		}
		#canPerformActionByRole(actionType, dialogId) {
			const {
				role: userRole
			} = this.#getDialog(dialogId);
			if (main_core.Type.isUndefined(this.#rolePermissions[actionType])) {
				return true;
			}
			const minimalRole = this.#rolePermissions[actionType];
			return this.#checkMinimalRole(minimalRole, userRole);
		}
		#canPerformActionByChatType(rawActionType, dialogId) {
			let actionType = rawActionType;
			const dialog = this.#getDialog(dialogId);
			const {
				role: userRole,
				ownerId
			} = dialog;
			let {
				type: chatType
			} = dialog;
			if (main_core.Type.isUndefined(this.#chatTypePermissions[chatType])) {
				chatType = DEFAULT_TYPE;
			}
			actionType = this.#handleKickAndLeaveActionType(actionType, ownerId);
			if (main_core.Type.isUndefined(this.#chatTypePermissions[chatType]?.[actionType])) {
				return true;
			}
			const minimalRole = this.#chatTypePermissions[chatType][actionType];
			return this.#checkMinimalRole(minimalRole, userRole);
		}
		#canPerformActionByChatSettings(actionType, dialogId) {
			const {
				role: userRole,
				type: chatType,
				permissions: chatPermissions
			} = this.#getDialog(dialogId);
			if (chatType === im_v2_const.ChatType.user) {
				return true;
			}
			const actionGroup = this.#getGroupByAction(actionType);
			if (!actionGroup) {
				return true;
			}
			let minimalRoleForGroup = chatPermissions[actionGroup];
			if (!minimalRoleForGroup) {
				minimalRoleForGroup = im_v2_const.UserRole.member;
			}
			return this.#checkMinimalRole(minimalRoleForGroup, userRole);
		}
		#getGroupByAction(actionType) {
			const searchResult = Object.entries(this.#actionGroups).find(([_, groupActions]) => {
				return groupActions.includes(actionType);
			});
			if (!searchResult) {
				return null;
			}
			const [groupName] = searchResult;
			return groupName;
		}
		#prepareChatTypePermissions(permissionsByChatType) {
			const preparedPermissions = {
				...permissionsByChatType
			};
			const SERVER_USER_CHAT_TYPE = 'private';
			preparedPermissions[im_v2_const.ChatType.user] = preparedPermissions[SERVER_USER_CHAT_TYPE];
			return preparedPermissions;
		}
		#checkMinimalRole(minimalRole, roleToCheck) {
			if (minimalRole === im_v2_const.UserRole.none) {
				return false;
			}
			const roleWeights = {};
			Object.values(im_v2_const.UserRole).forEach((role, index) => {
				roleWeights[role] = index;
			});
			return roleWeights[roleToCheck] >= roleWeights[minimalRole];
		}
		#getDialog(dialogId) {
			return im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		}
		#getUserType(userId) {
			return im_v2_application_core.Core.getStore().getters['users/get'](userId, true).type;
		}
		#handleKickAndLeaveActionType(actionType, ownerId) {
			const isOwner = ownerId === im_v2_application_core.Core.getUserId();
			// for kick check if users can leave this type of chat
			if (actionType === im_v2_const.ActionByRole.kick) {
				return im_v2_const.ActionByRole.leave;
			}
			if (actionType === im_v2_const.ActionByRole.leave && isOwner) {
				return im_v2_const.ActionByRole.leaveOwner;
			}
			return actionType;
		}
	}

	exports.PermissionManager = PermissionManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=permission.bundle.js.map
