/* eslint-disable */
/** Store/Vue button display name → Legacy/Controller action name. */
type ButtonDisplayName = 'microphone' | 'camera' | 'screen' | 'addUser' | 'chat' | 'users' | 'history' | 'floorRequest' | 'record' | 'copilot' | 'document';

type ButtonActionName = 'toggleMute' | 'toggleVideo' | 'toggleScreenSharing' | 'inviteUser' | 'showChat' | 'toggleUsers' | 'showHistory' | 'toggleFloorRequest' | 'toggleRecord' | 'toggleCopilot' | 'toggleDocument';

declare namespace BX.Call.Mapping {
	/**
	 * Returns the controller action name for a given store button name.
	 * Unknown names pass through unchanged.
	 */
	function toControllerAction(name: ButtonDisplayName): ButtonActionName;

	function toControllerAction(name: string): string;

	const ViewEvent: Readonly<{
		onShow: "onShow";
		onClose: "onClose";
		onDestroy: "onDestroy";
		onButtonClick: "onButtonClick";
		onBodyClick: "onBodyClick";
		onReplaceCamera: "onReplaceCamera";
		onReplaceMicrophone: "onReplaceMicrophone";
		onReplaceSpeaker: "onReplaceSpeaker";
		onSetCentralUser: "onSetCentralUser";
		onLayoutChange: "onLayoutChange";
		onChangeNoiseSuppression: "onChangeNoiseSuppression";
		onChangeMicAutoParams: "onChangeMicAutoParams";
		onChangeFaceImprove: "onChangeFaceImprove";
		onChangeVideoQuality: "onChangeVideoQuality";
		onUserClick: "onUserClick";
		onUserRename: "onUserRename";
		onUserPinned: "onUserPinned";
		onDeviceSelectorShow: "onDeviceSelectorShow";
		onOpenAdvancedSettings: "onOpenAdvancedSettings";
		onHasMainStream: "onHasMainStream";
		onTurnOffParticipantMic: "onTurnOffParticipantMic";
		onTurnOffParticipantCam: "onTurnOffParticipantCam";
		onTurnOffParticipantScreenshare: "onTurnOffParticipantScreenshare";
		onAllowSpeakPermission: "onAllowSpeakPermission";
		onDisallowSpeakPermission: "onDisallowSpeakPermission";
		onToggleSubscribe: "onToggleSubscribe";
		onUnfold: "onUnfold";
		onPiPClose: "onPiPClose";
		onAudioElementCreated: "onAudioElementCreated";
		onAudioPlay: "onAudioPlay";
		onCommonRecordMenu: "onCommonRecordMenu";
		onPiPBodyClick: "onPiPBodyClick";
		onFullScreenChange: "onFullScreenChange";
	}>;

	const ViewLayout: Readonly<{
		Grid: 1;
		Centered: 2;
		Mobile: 3;
	}>;

	const ViewUiState: Readonly<{
		Preparing: 1;
		Initializing: 2;
		Calling: 3;
		Connected: 4;
		Error: 5;
	}>;

	const ViewSize: Readonly<{
		Folded: "folded";
		Full: "full";
	}>;

	const ViewRoomState: Readonly<{
		None: 1;
		Speaker: 2;
		NonSpeaker: 3;
	}>;

	const ViewRecordSource: Readonly<{
		Chat: "BXCLIENT_CHAT";
	}>;
}
