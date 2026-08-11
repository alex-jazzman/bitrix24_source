export const ViewEvent = Object.freeze({
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
});

export const ViewLayout = Object.freeze({
	Grid: 1,
	Centered: 2,
	Mobile: 3,
});

export const ViewUiState = Object.freeze({
	Preparing: 1,
	Initializing: 2,
	Calling: 3,
	Connected: 4,
	Error: 5,
});

export const ViewSize = Object.freeze({
	Folded: 'folded',
	Full: 'full',
});

export const ViewRoomState = Object.freeze({
	None: 1,
	Speaker: 2,
	NonSpeaker: 3,
});

export const ViewRecordSource = Object.freeze({
	Chat: 'BXCLIENT_CHAT',
});
