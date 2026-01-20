/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,im_public) {
	'use strict';

	const CallTypes = {
	  video: {
	    id: 'video',
	    locCode: 'CALL_CONTENT_CHAT_HEADER_VIDEOCALL',
	    start: dialogId => {
	      im_public.Messenger.startVideoCall(dialogId);
	    }
	  },
	  audio: {
	    id: 'audio',
	    locCode: 'CALL_CONTENT_CHAT_HEADER_CALL_MENU_AUDIO',
	    start: dialogId => {
	      im_public.Messenger.startVideoCall(dialogId, false);
	    }
	  }
	};

	/**
	 * Bitrix Messenger
	 * Conference constants
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	const ConferenceFieldState = Object.freeze({
	  view: 'view',
	  edit: 'edit',
	  create: 'create'
	});
	const ConferenceStateType = Object.freeze({
	  preparation: 'preparation',
	  call: 'call'
	});
	const ConferenceErrorCode = Object.freeze({
	  userLimitReached: 'userLimitReached',
	  detectIntranetUser: 'detectIntranetUser',
	  bitrix24only: 'bitrix24only',
	  kickedFromCall: 'kickedFromCall',
	  unsupportedBrowser: 'unsupportedBrowser',
	  missingMicrophone: 'missingMicrophone',
	  unsafeConnection: 'unsafeConnection',
	  wrongAlias: 'wrongAlias',
	  notStarted: 'notStarted',
	  finished: 'finished',
	  userLeftCall: 'userLeftCall',
	  noSignalFromCamera: 'noSignalFromCamera'
	});
	const ConferenceRightPanelMode = Object.freeze({
	  hidden: 'hidden',
	  chat: 'chat',
	  users: 'users',
	  split: 'split'
	});

	//BX.Call.UserState sync
	const ConferenceUserState = Object.freeze({
	  Idle: 'Idle',
	  Busy: 'Busy',
	  Calling: 'Calling',
	  Unavailable: 'Unavailable',
	  Declined: 'Declined',
	  Ready: 'Ready',
	  Connecting: 'Connecting',
	  Connected: 'Connected',
	  Failed: 'Failed'
	});

	exports.CallTypes = CallTypes;
	exports.ConferenceFieldState = ConferenceFieldState;
	exports.ConferenceStateType = ConferenceStateType;
	exports.ConferenceErrorCode = ConferenceErrorCode;
	exports.ConferenceRightPanelMode = ConferenceRightPanelMode;
	exports.ConferenceUserState = ConferenceUserState;

}((this.BX.Call.Const = this.BX.Call.Const || {}),BX.Messenger.v2.Lib));
//# sourceMappingURL=registry.bundle.js.map
