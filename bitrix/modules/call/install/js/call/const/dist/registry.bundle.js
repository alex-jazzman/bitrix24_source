/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_public) {
	'use strict';

	const CallTypes = {
		video: {
			id: 'video',
			locCode: 'CALL_CONTENT_CHAT_HEADER_VIDEOCALL',
			start: dialogId => {
				void im_public.Messenger.startVideoCall(dialogId);
			}
		},
		audio: {
			id: 'audio',
			locCode: 'CALL_CONTENT_CHAT_HEADER_CALL_MENU_AUDIO',
			start: dialogId => {
				void im_public.Messenger.startVideoCall(dialogId, false);
			}
		}
	};

	const ParticipantTrackType = {
		AUDIO: 0,
		VIDEO: 1,
		SCREENSHARE: 2
	};

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
	exports.ConferenceErrorCode = ConferenceErrorCode;
	exports.ConferenceFieldState = ConferenceFieldState;
	exports.ConferenceRightPanelMode = ConferenceRightPanelMode;
	exports.ConferenceStateType = ConferenceStateType;
	exports.ConferenceUserState = ConferenceUserState;
	exports.ParticipantTrackType = ParticipantTrackType;

})(this.BX.Call.Const = this.BX.Call.Const || {}, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
