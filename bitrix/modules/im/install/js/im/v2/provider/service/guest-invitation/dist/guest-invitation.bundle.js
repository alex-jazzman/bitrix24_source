/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_const, im_v2_lib_rest, im_v2_application_core) {
	'use strict';

	const InvitationType = {
		email: 'email',
		phone: 'phone'
	};
	class GuestInvitationService {
		generateInviteLink(chatId) {
			const payload = {
				data: {
					chatId
				}
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2GuestLinkGenerate, payload).then(({
				sharingLink
			}) => {
				void im_v2_application_core.Core.getStore().dispatch('sidebar/sharedLink/set', sharingLink);
				return sharingLink;
			}).catch(([error]) => {
				console.error('GuestInvitationService: generate invite link error', error);
				throw error;
			});
		}
		updateLink(chatId) {
			const payload = {
				data: {
					chatId
				}
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2GuestLinkRegenerate, payload).then(({
				sharingLink
			}) => {
				return im_v2_application_core.Core.getStore().dispatch('sidebar/sharedLink/regenerate', {
					newLink: sharingLink
				});
			}).catch(([error]) => {
				console.error('GuestInvitationService: regenerate invite link error', error);
				throw error;
			});
		}
		inviteByEmail(chatId, invitations) {
			const data = {
				chatId,
				invitations
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2GuestLinkInviteByEmail, {
				data
			}).catch(([error]) => {
				console.error('GuestInvitationService: invite by email error', error);
				throw error;
			});
		}
		inviteByPhone(chatId, invitations) {
			const data = {
				chatId,
				invitations
			};
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2GuestLinkInviteByPhoneNumber, {
				data
			}).catch(([error]) => {
				console.error('GuestInvitationService: invite by phone number error', error);
				throw error;
			});
		}
	}

	exports.GuestInvitationService = GuestInvitationService;
	exports.InvitationType = InvitationType;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Application);
//# sourceMappingURL=guest-invitation.bundle.js.map
