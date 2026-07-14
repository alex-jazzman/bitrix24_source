/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, ui_vue3_pinia, socialnetwork_v2_const) {
	'use strict';

	const defaultProjectFeatures = Object.freeze({
		tasks: true,
		chat: true,
		calendar: true,
		files: true,
		landingKnowledge: false,
		blog: true,
		forum: false,
		photo: false,
		search: true,
		marketplace: false,
		groupLists: false,
		wiki: false
	});
	const useProjectStore = ui_vue3_pinia.defineStore('project', {
		state: () => ({
			id: null,
			avatar: null,
			title: '',
			description: '',
			goal: '',
			ownerId: null,
			chatId: null,
			members: [],
			moderators: [],
			privacyType: socialnetwork_v2_const.PrivacyType.Closed,
			tags: [],
			features: {
				...defaultProjectFeatures
			},
			baseFeatureId: 'chat',
			availableFeatures: [],
			toggleableFeatures: [],
			permissions: {
				project: {
					whoCanInvite: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					manageMessages: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					manageMessagesAutoDelete: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					messagesAutoDeleteDelay: '',
					showHistory: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
					canGuestCopyText: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
					canGuestScreenshot: socialnetwork_v2_const.AccessRightsBoolKind.Yes,
					allowGuestsInvitation: socialnetwork_v2_const.AccessRightsBoolKind.Yes
				},
				tasks: {
					view: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					view_all: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					sort: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					createTasks: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					editTasks: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					deleteTasks: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators
				},
				blog: {
					view_post: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					premoderate_post: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					write_post: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					moderate_post: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					full_post: socialnetwork_v2_const.AccessRightsRoleKind.Owner,
					view_comment: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					premoderate_comment: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					write_comment: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					moderate_comment: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators,
					full_comment: socialnetwork_v2_const.AccessRightsRoleKind.OwnerAndModerators
				},
				landingKnowledge: {
					read: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					edit: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					sett: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants,
					delete: socialnetwork_v2_const.AccessRightsRoleKind.AllParticipants
				}
			},
			defaultPermissions: null,
			publication: false,
			dates: {
				startTs: 0,
				finishTs: 0
			}
		}),
		getters: {
			messagesAutoDeleteDelay: state => {
				return state.permissions.project.messagesAutoDeleteDelay || socialnetwork_v2_const.AutoDeleteMessageDelay.Off;
			}
		},
		actions: {
			init({
				projectId,
				publication
			}) {
				this.id = projectId;
				this.publication = publication;
			},
			patchProject(patch = {}) {
				this.$patch(patch);
			},
			updateMessagesAutoDeleteDelay(delay) {
				this.permissions.project.messagesAutoDeleteDelay = delay;
			},
			updatePermission(groupId, fieldName, value) {
				if (!Object.hasOwn(this.permissions, groupId) || !Object.hasOwn(this.permissions[groupId], fieldName)) {
					void console.error(`Property '${groupId}.${fieldName}' does not exist`);
					return;
				}
				this.permissions[groupId][fieldName] = value;
			},
			updateFeature(featureId, value) {
				if (!Object.hasOwn(this.features, featureId)) {
					void console.error(`Property 'features.${featureId}' does not exist`);
					return;
				}
				this.features[featureId] = value;
			}
		}
	});

	exports.defaultProjectFeatures = defaultProjectFeatures;
	exports.useProjectStore = useProjectStore;

})(this.BX.Socialnetwork.V2.Model = this.BX.Socialnetwork.V2.Model || {}, BX.Vue3.Pinia, BX.Socialnetwork.V2);
//# sourceMappingURL=project.bundle.js.map
