/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports) {
	'use strict';

	const StoreToControllerButtonMap = Object.freeze({
		microphone: 'toggleMute',
		camera: 'toggleVideo',
		screen: 'toggleScreenSharing',
		addUser: 'inviteUser',
		chat: 'showChat',
		users: 'toggleUsers',
		history: 'showHistory',
		floorRequest: 'toggleFloorRequest',
		record: 'toggleRecord',
		copilot: 'toggleCopilot',
		document: 'toggleDocument'
	});
	function toControllerAction(name) {
		return StoreToControllerButtonMap[name] ?? name;
	}

	const ViewEvent = Object.freeze({
		onShow: 'onShow',
		onClose: 'onClose',
		onDestroy: 'onDestroy',
		onButtonClick: 'onButtonClick',
		onBodyClick: 'onBodyClick',
		onReplaceCamera: 'onReplaceCamera',
		onReplaceMicrophone: 'onReplaceMicrophone',
		onReplaceSpeaker: 'onReplaceSpeaker',
		onSetCentralUser: 'onSetCentralUser',
		onLayoutChange: 'onLayoutChange',
		onChangeNoiseSuppression: 'onChangeNoiseSuppression',
		onChangeMicAutoParams: 'onChangeMicAutoParams',
		onChangeFaceImprove: 'onChangeFaceImprove',
		onChangeVideoQuality: 'onChangeVideoQuality',
		onUserClick: 'onUserClick',
		onUserRename: 'onUserRename',
		onUserPinned: 'onUserPinned',
		onDeviceSelectorShow: 'onDeviceSelectorShow',
		onOpenAdvancedSettings: 'onOpenAdvancedSettings',
		onHasMainStream: 'onHasMainStream',
		onTurnOffParticipantMic: 'onTurnOffParticipantMic',
		onTurnOffParticipantCam: 'onTurnOffParticipantCam',
		onTurnOffParticipantScreenshare: 'onTurnOffParticipantScreenshare',
		onAllowSpeakPermission: 'onAllowSpeakPermission',
		onDisallowSpeakPermission: 'onDisallowSpeakPermission',
		onToggleSubscribe: 'onToggleSubscribe',
		onUnfold: 'onUnfold',
		onPiPClose: 'onPiPClose',
		onAudioElementCreated: 'onAudioElementCreated',
		onAudioPlay: 'onAudioPlay',
		onCommonRecordMenu: 'onCommonRecordMenu',
		onPiPBodyClick: 'onPiPBodyClick',
		onFullScreenChange: 'onFullScreenChange',
		onPushToTalkShortPress: 'onPushToTalkShortPress'
	});
	const ViewLayout = Object.freeze({
		Grid: 1,
		Centered: 2,
		Mobile: 3
	});
	const ViewUiState = Object.freeze({
		Preparing: 1,
		Initializing: 2,
		Calling: 3,
		Connected: 4,
		Error: 5
	});
	const ViewSize = Object.freeze({
		Folded: 'folded',
		Full: 'full'
	});
	const ViewRoomState = Object.freeze({
		None: 1,
		Speaker: 2,
		NonSpeaker: 3
	});
	const ViewRecordSource = Object.freeze({
		Chat: 'BXCLIENT_CHAT'
	});

	const IncomingCallEvent = Object.freeze({
		onClose: 'onClose',
		onDestroy: 'onDestroy',
		onButtonClick: 'onButtonClick'
	});
	const IncomingCallInternalEvent = Object.freeze({
		setHasCamera: 'CallNotification::setHasCamera',
		contentReady: 'CallNotification::contentReady',
		onButtonClick: 'CallNotification::onButtonClick'
	});

	const CallState = Object.freeze({
		Idle: 'Idle',
		Proceeding: 'Proceeding',
		Connected: 'Connected',
		Finished: 'Finished'
	});
	const Provider = Object.freeze({
		Plain: 'Plain',
		Bitrix: 'Bitrix'
	});
	const CallType = Object.freeze({
		Instant: 1,
		Permanent: 2,
		Large: 3
	});
	const ControllerEvent = Object.freeze({
		onPromoViewed: 'onPromoViewed',
		onOpenVideoConference: 'onOpenVideoConference'
	});

	exports.CallState = CallState;
	exports.CallType = CallType;
	exports.ControllerEvent = ControllerEvent;
	exports.IncomingCallEvent = IncomingCallEvent;
	exports.IncomingCallInternalEvent = IncomingCallInternalEvent;
	exports.Provider = Provider;
	exports.ViewEvent = ViewEvent;
	exports.ViewLayout = ViewLayout;
	exports.ViewRecordSource = ViewRecordSource;
	exports.ViewRoomState = ViewRoomState;
	exports.ViewSize = ViewSize;
	exports.ViewUiState = ViewUiState;
	exports.toControllerAction = toControllerAction;

})(this.BX.Call.Mapping = this.BX.Call.Mapping || {});
//# sourceMappingURL=call-mapping.bundle.js.map
