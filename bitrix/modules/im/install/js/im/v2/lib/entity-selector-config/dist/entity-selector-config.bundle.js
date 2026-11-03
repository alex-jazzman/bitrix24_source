/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_const, im_v2_lib_feature, im_v2_lib_permission) {
	'use strict';

	const StructureTarget = Object.freeze({
		chat: 'chat',
		collabProject: 'collabProject'
	});
	const CHAT_TYPES_ACCEPTING_NODES = new Set([im_v2_const.ChatType.chat, im_v2_const.ChatType.open, im_v2_const.ChatType.channel, im_v2_const.ChatType.openChannel]);
	const PERSON_ENTITIES = new Set([im_v2_const.SelectorEntity.user, im_v2_const.SelectorEntity.bot]);
	const NODE_ENTITIES = new Set([im_v2_const.SelectorEntity.department, im_v2_const.SelectorEntity.structureNode]);
	const TEAM_BASE_OPTIONS = {
		includedNodeEntityTypes: ['team'],
		useMultipleTabs: true,
		visual: {
			avatarMode: 'node',
			tagStyle: 'none'
		}
	};
	const TEAM_PROJECT_OPTIONS = {
		...TEAM_BASE_OPTIONS,
		restricted: 'view'
	};
	const MESSENGER_RECENT_OPTIONS = {
		fillDialogByRecent: true,
		includeOnly: ['users'],
		excludeGuests: true,
		excludeCurrentUser: true
	};
	const DEPARTMENT_SELECT_OPTIONS = {
		selectMode: 'usersAndDepartments',
		allowFlatDepartments: true,
		allowSelectRootDepartment: true
	};
	const getEntitiesConfig = (options = {}) => {
		const entities = [];
		const withMessengerRecent = options.withRecent === true;
		if (withMessengerRecent) {
			entities.push(getMessengerRecentEntity());
		}
		entities.push(getUserEntity(withMessengerRecent));
		if (offersBots(options)) {
			entities.push(getBotEntity());
		}
		const withDepartmentSelect = offersDepartmentSelect(options);
		if (offersDepartmentEntity(options)) {
			entities.push(getDepartmentEntity(withDepartmentSelect));
		}
		if (offersTeams(options)) {
			const teamOptions = linksToCollabProject(options) ? TEAM_PROJECT_OPTIONS : TEAM_BASE_OPTIONS;
			const withTeamSelect = withDepartmentSelect || linksToCollabProject(options);
			entities.push({
				id: im_v2_const.SelectorEntity.structureNode,
				options: withTeamSelect ? {
					...teamOptions,
					...DEPARTMENT_SELECT_OPTIONS
				} : {
					...teamOptions
				}
			});
		}
		return entities;
	};
	const getMessengerRecentEntity = () => {
		return {
			id: im_v2_const.SelectorEntity.recent,
			dynamicLoad: true,
			searchable: false,
			options: {
				...MESSENGER_RECENT_OPTIONS
			}
		};
	};
	const getBotEntity = () => {
		return {
			id: im_v2_const.SelectorEntity.bot,
			dynamicLoad: false,
			dynamicSearch: true
		};
	};
	const getDepartmentEntity = withSelectOptions => {
		if (withSelectOptions) {
			return {
				id: im_v2_const.SelectorEntity.department,
				options: {
					...DEPARTMENT_SELECT_OPTIONS
				}
			};
		}
		return {
			id: im_v2_const.SelectorEntity.department
		};
	};
	const getUserEntity = withMessengerRecent => {
		if (withMessengerRecent) {
			return {
				id: im_v2_const.SelectorEntity.user,
				options: {
					fillDialog: false
				}
			};
		}
		return {
			id: im_v2_const.SelectorEntity.user
		};
	};
	const offersStructureNodes = (options = {}) => {
		return offersDepartmentSelect(options) || offersTeams(options);
	};
	const offersDepartmentEntity = options => {
		if (!isEmployee() || options.chatType === im_v2_const.ChatType.user) {
			return false;
		}
		if (options.invitationPopup !== true || linksToCollabProject(options)) {
			return true;
		}
		return canChooseDepartment(options);
	};
	const offersDepartmentSelect = options => {
		return offersDepartmentEntity(options) && canChooseDepartment(options);
	};
	const canChooseDepartment = options => {
		return canLinkDepartments(options) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.chatDepartments);
	};
	const offersBots = options => {
		return options.invitationPopup === true && options.chatType !== im_v2_const.ChatType.copilot;
	};
	const offersTeams = options => {
		return options.withTeams === true && canOfferTeams(options) && im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.teamsInStructureAvailable);
	};
	const isPersonEntity = entityId => {
		return PERSON_ENTITIES.has(entityId);
	};
	const isLinkableNodeEntity = entityId => {
		return NODE_ENTITIES.has(entityId);
	};
	const canLinkStructureNodeToChat = (options = {}) => {
		return isEmployee() && acceptsStructureNodes(options.chatType) && canLinkStructureNode(options.dialogId);
	};
	const canLinkDepartments = options => {
		if (linksToCollabProject(options)) {
			return true;
		}
		return acceptsStructureNodes(options.chatType) && canLinkStructureNode(options.dialogId);
	};
	const canOfferTeams = options => {
		if (linksToCollabProject(options)) {
			return isEmployee();
		}
		return canLinkStructureNodeToChat(options);
	};
	const linksToCollabProject = options => {
		return options.structureTarget === StructureTarget.collabProject;
	};
	const isEmployee = () => {
		return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByUserType(im_v2_const.ActionByUserType.linkStructureNode);
	};
	const acceptsStructureNodes = chatType => {
		return chatType === undefined || CHAT_TYPES_ACCEPTING_NODES.has(chatType);
	};
	const canLinkStructureNode = dialogId => {
		if (dialogId === undefined) {
			return true;
		}
		return im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.linkStructureNode, dialogId);
	};

	exports.StructureTarget = StructureTarget;
	exports.canLinkStructureNodeToChat = canLinkStructureNodeToChat;
	exports.getEntitiesConfig = getEntitiesConfig;
	exports.isLinkableNodeEntity = isLinkableNodeEntity;
	exports.isPersonEntity = isPersonEntity;
	exports.offersStructureNodes = offersStructureNodes;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=entity-selector-config.bundle.js.map
