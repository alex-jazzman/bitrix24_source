import { AccessRightsBoolKind, AccessRightsRoleKind } from 'socialnetwork.v2.const';
import { type ProjectModel } from 'socialnetwork.v2.model.project';

type DefaultPermissions = $PropertyType<ProjectModel, 'permissions'>;

export class AccessRightsService
{
	static getDefaultPermissions(): Promise<DefaultPermissions>
	{
		return Promise.resolve({
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
		});
	}
}
