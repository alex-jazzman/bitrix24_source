import { defineStore } from 'ui.vue3.pinia';

import {
	AutoDeleteMessageDelay,
	PrivacyType,
	AccessRightsBoolKind,
	AccessRightsRoleKind,
} from 'socialnetwork.v2.const';
import { type ProjectModel, type ProjectFeatures, type NotificationCatalog } from './types';

export const defaultProjectFeatures: ProjectFeatures = Object.freeze({
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
	wiki: false,
});

export const useProjectStore = defineStore('project', {
	state: (): ProjectModel => ({
		id: null,
		avatar: null,
		title: '',
		description: '',
		goal: '',
		ownerId: null,
		chatId: null,
		members: [],
		moderators: [],
		privacyType: PrivacyType.Closed,
		tags: [],
		features: { ...defaultProjectFeatures },
		baseFeatureId: 'chat',
		availableFeatures: [],
		toggleableFeatures: [],
		permissions: {
			project: {
				whoCanInvite: AccessRightsRoleKind.AllParticipants,
				manageMessages: AccessRightsRoleKind.AllParticipants,
				manageMessagesAutoDelete: AccessRightsRoleKind.OwnerAndModerators,
				messagesAutoDeleteDelay: '',
				showHistory: AccessRightsBoolKind.Yes,
				canGuestCopyText: AccessRightsBoolKind.Yes,
				canGuestScreenshot: AccessRightsBoolKind.Yes,
				allowGuestsInvitation: AccessRightsBoolKind.Yes,
			},
			tasks: {
				view: AccessRightsRoleKind.AllParticipants,
				view_all: AccessRightsRoleKind.AllParticipants,
				sort: AccessRightsRoleKind.AllParticipants,
				createTasks: AccessRightsRoleKind.AllParticipants,
				editTasks: AccessRightsRoleKind.OwnerAndModerators,
				deleteTasks: AccessRightsRoleKind.OwnerAndModerators,
			},
			blog: {
				view_post: AccessRightsRoleKind.AllParticipants,
				premoderate_post: AccessRightsRoleKind.AllParticipants,
				write_post: AccessRightsRoleKind.AllParticipants,
				moderate_post: AccessRightsRoleKind.OwnerAndModerators,
				full_post: AccessRightsRoleKind.Owner,
				view_comment: AccessRightsRoleKind.AllParticipants,
				premoderate_comment: AccessRightsRoleKind.AllParticipants,
				write_comment: AccessRightsRoleKind.AllParticipants,
				moderate_comment: AccessRightsRoleKind.OwnerAndModerators,
				full_comment: AccessRightsRoleKind.OwnerAndModerators,
			},
			landingKnowledge: {
				read: AccessRightsRoleKind.AllParticipants,
				edit: AccessRightsRoleKind.AllParticipants,
				sett: AccessRightsRoleKind.AllParticipants,
				delete: AccessRightsRoleKind.AllParticipants,
			},
		},
		defaultPermissions: null,
		publication: false,
		dates: {
			startTs: 0,
			finishTs: 0,
		},
		notifications: null,
		notificationsInitial: null,
	}),
	getters: {
		messagesAutoDeleteDelay: (state): number => {
			return state.permissions.project.messagesAutoDeleteDelay || AutoDeleteMessageDelay.Off;
		},
	},
	actions: {
		init({ projectId, publication, notifications }: { projectId: ?number, publication?: boolean, notifications?: NotificationCatalog | null }): void
		{
			this.id = projectId;
			this.publication = publication;
			if (notifications !== undefined)
			{
				this.notifications = notifications ? structuredClone(notifications) : notifications;
				this.notificationsInitial = notifications ? structuredClone(notifications) : notifications;
			}
		},
		patchProject(patch: Partial<ProjectModel> = {}): void
		{
			this.$patch({
				...patch,
				...(patch.notifications !== undefined
					? {
						notifications: patch.notifications ? structuredClone(patch.notifications) : patch.notifications,
						notificationsInitial: patch.notifications ? structuredClone(patch.notifications) : patch.notifications,
					}
					: {}),
			});
		},
		updateMessagesAutoDeleteDelay(delay: number | string): void
		{
			this.permissions.project.messagesAutoDeleteDelay = delay;
		},
		updatePermission(groupId: string, fieldName: string, value: string): void
		{
			if (!Object.hasOwn(this.permissions, groupId) || !Object.hasOwn(this.permissions[groupId], fieldName))
			{
				void console.error(`Property '${groupId}.${fieldName}' does not exist`);

				return;
			}

			this.permissions[groupId][fieldName] = value;
		},
		updateFeature(featureId: string, value: boolean): void
		{
			if (!Object.hasOwn(this.features, featureId))
			{
				void console.error(`Property 'features.${featureId}' does not exist`);

				return;
			}

			this.features[featureId] = value;
		},
		setNotificationCounter(typeId: string, counterEnabled: boolean): void
		{
			if (!this.notifications)
			{
				return;
			}

			for (const group of this.notifications.groups)
			{
				const type = group.types.find((t) => t.id === typeId);
				if (type)
				{
					type.counterEnabled = counterEnabled;

					return;
				}
			}
		},
	},
});
