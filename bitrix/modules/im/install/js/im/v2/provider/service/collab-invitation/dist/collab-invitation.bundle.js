/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_const,im_v2_lib_rest,im_v2_lib_utils) {
	'use strict';

	class CollabInvitationService {
	  addEmployees({
	    dialogId,
	    members
	  }) {
	    const payload = {
	      data: {
	        dialogId,
	        members: im_v2_lib_utils.Utils.user.prepareSelectorIds(members)
	      }
	    };
	    im_v2_lib_rest.runAction(im_v2_const.RestMethod.socialnetworkMemberAdd, payload).catch(([error]) => {
	      console.error('CollabInvitationService: add employee error', error);
	    });
	  }
	  copyLink(collabId, userLang) {
	    const payload = {
	      data: {
	        collabId,
	        userLang
	      }
	    };
	    return im_v2_lib_rest.runAction(im_v2_const.RestMethod.intranetInviteGetLinkByCollabId, payload).catch(([error]) => {
	      console.error('CollabInvitationService: getting invite link error', error);
	      throw error;
	    });
	  }
	  updateLink(collabId) {
	    const payload = {
	      data: {
	        collabId
	      }
	    };
	    return im_v2_lib_rest.runAction(im_v2_const.RestMethod.intranetInviteRegenerateLinkByCollabId, payload).catch(([error]) => {
	      console.error('CollabInvitationService: updating invite link error', error);
	      throw error;
	    });
	  }
	}

	exports.CollabInvitationService = CollabInvitationService;

}((this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}),BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=collab-invitation.bundle.js.map
