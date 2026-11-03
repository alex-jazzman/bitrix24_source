/* eslint-disable */
/**
 * Carried by the blocking calls of the panel down to the picture-in-picture window, the only part
 * of the view that speaks a blocking out loud. A hold that reports the state of the transport
 * rather than a change of what the user may do - a button held while a track is being published -
 * passes `announce: false`: the user pressed it themselves and has nothing to be told.
 */
type BlockButtonsOptions = {
	announce?: boolean;
};

/**
 * Kind of popup layer a panel button opens: a menu, a dialog, or nothing at all.
 *
 * The vocabulary is declared here and not borrowed from the ARIA token dictionary of the view: that
 * dictionary belongs to the implementation, and the contract must not depend on it. Turning the
 * domain value into ARIA attributes is the job of the button.
 */
type ButtonPopupKind = 'menu' | 'dialog' | null;

interface CallView {
	speakerId: string;
	speakerMuted: boolean;
	visible: boolean;
	size: string;
	isFullScreen: boolean;
	isPreparing: boolean;
	isActivePiPFromController: boolean;
	microphoneId: string;
	container: HTMLElement;
	enableAutoPip: boolean;
	buttons: any;
	elements: any;
	localUser: any;
	userRegistry: any;
	talkingService: any;
	isHidden(): boolean;
	renameSlider: any;
	show(): void;
	hide(): void;
	close(): void;
	destroy(): void;
	addUser(userId: number, state?: string, direction?: string): void;
	appendUsers(userStates: {
		[userId: string]: string;
	}): void;
	updateUserData(userData: {
		[userId: string]: any;
	}): void;
	setLocalUserId(userId: number): void;
	setLocalUserDirection(direction: string): void;
	setUserState(userId: number, newState: string): void;
	setUserMicrophoneState(userId: number, isMicrophoneOn: boolean): void;
	setUserCameraState(userId: number, cameraState: boolean): void;
	setUserVideoPaused(userId: number, videoPaused: boolean): void;
	setUserMedia(userId: number, kind: string, track: MediaStreamTrack | null | undefined): void;
	setUserConnectionQuality(userId: number, connectionQuality: any): void;
	setUserFloorRequestState(userId: number, userFloorRequestState: boolean): void;
	setUserTalking(userId: number, talking: boolean): void;
	setUserPermissionToSpeakState(userId: number, permissionToSpeakState: boolean): void;
	setAllUserPermissionToSpeakState(permissionToSpeakState: boolean): void;
	setUserScreenState(userId: number, screenState: boolean): void;
	setUserStats(userId: number, stats: any, mediaServerId: number): void;
	setUserDirection(userId: number, direction: string): void;
	removeScreenUsers(): void;
	getUserFloorRequestState(userId: number): boolean;
	getUserTalking(userId: number): boolean;
	getConnectedUserCount(withYou: boolean): number;
	pinUser(userId: number): void;
	unpinUser(): void;
	resetTalkingUsers(): void;
	notifyUserJoined(userId: number): void;
	notifyUserLeft(userId: number): void;
	setButtonActive(buttonName: string, isActive: boolean): void;
	setButtonPopupKind(buttonName: string, kind: ButtonPopupKind): void;
	setButtonCounter(buttonName: string, counter: number): void;
	blockButtons(buttons: string[], options?: BlockButtonsOptions): void;
	unblockButtons(buttons: string[], options?: BlockButtonsOptions): void;
	blockAddUser(): void;
	unblockAddUser(): void;
	blockSwitchCamera(options?: BlockButtonsOptions): void;
	unblockSwitchCamera(options?: BlockButtonsOptions): void;
	blockSwitchMicrophone(options?: BlockButtonsOptions): void;
	unblockSwitchMicrophone(options?: BlockButtonsOptions): void;
	blockScreenSharing(): void;
	blockHistoryButton(): void;
	disableMediaSelection(): void;
	enableMediaSelection(): void;
	showButtons(buttons: string[]): void;
	hideButtons(buttons: string[]): void;
	updateButtons(skippedElementsList?: string[]): void;
	isButtonBlocked(buttonName: string): boolean;
	getButtonElement(buttonId: string, elementType?: string): HTMLElement | null;
	setGuestLink(link: string | null): void;
	setUiState(uiState: string): void;
	setLayout(newLayout: string): void;
	setSize(size: string): void;
	setTitle(title: string): void;
	setAccessibleName(name: string, type: CallWindowNameTypeValue): void;
	focusWindow(options?: {
		force?: boolean;
	}): void;
	releaseFocusBeforeHide(): boolean;
	restoreFocusAfterHide(): void;
	setMaxWidth(maxWidth: number | null): void;
	removeMaxWidth(): void;
	setWindowFocusState(isActive: boolean): void;
	setRoomState(roomState: string): void;
	setHotKeyTemporaryBlock(isActive: boolean, force?: boolean): void;
	toggleStatePictureInPictureCallWindow(isActive: boolean): void;
	/**
	 * Facts of the call the window cannot see for itself: only the controller holds the raw events.
	 * The window is told them and drives whatever it owns with them - it is not asked to act.
	 */
	notifyConnectionLost(): void;
	/**
	 * The right to broadcast is revoked without touching the state of the microphone, so this is the
	 * only way the fact reaches the window.
	 */
	notifyBroadcastRightLost(): void;
	/**
	 * Speech signal as the call reports it, unfiltered by participant. `local` is missing on the
	 * endpoint path of the engines, so a reader that needs the local participant compares `userId`.
	 */
	notifySpeechSignal(signal: {
		userId: number;
		local?: boolean;
	}, speaking: boolean): void;
	setLocalStream(streamData: {
		mediaRenderer?: any;
		stream?: MediaStream;
		flipVideo?: boolean;
	}): void;
	setLocalStreamVideoTrack(videoTrack: MediaStreamTrack | null | undefined): void;
	flipLocalVideo(flipVideo: boolean): void;
	setMicrophoneId(microphoneId: string): void;
	setSpeakerId(speakerId: string): void;
	setCameraId(cameraId: string): void;
	muteSpeaker(mute: boolean): void;
	releaseLocalMedia(): void;
	trackAvailabilityChanged(userId: number, kind: string, available: boolean): void;
	setVideoRenderer(userId: number, mediaRenderer: any): void;
	releaseVideoRenderer(userId: number): void;
	setBadNetworkIndicator(userId: number, badNetworkIndicator: boolean): void;
	setTrackSubscriptionFailed(data: any): void;
	setMicrophoneLevel(level: number): void;
	confirmSpeakerSelection(deviceId: string): void;
	setCommonRecordState(commonRecordState: any): void;
	getDefaultCommonRecordState(): any;
	showSelfTest(): void;
	showSecurityKeyError(): void;
	showFatalError(params: any): void;
	showCloudRecordPromo(isCloudRecordFeaturesEnabled: boolean, callId: number): void;
	showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled: boolean, callId: number, options?: CloudRecordInfoPopupOptions): void;
	showCommonRecordMenuPopup(isDesktopRecord?: boolean): void;
	showCommonRecordStartModal(): void;
	showCommonRecordStartNotify(userId: number, state?: string): void;
	showCopilotErrorNotify(errorType: string): void;
	showCopilotNotify(callId?: number, errorCode?: string, notifyText?: string | null): void;
	showCopilotResultNotify(): void;
	closeCopilotNotify(): void;
	updateCopilotState(isActive: boolean): void;
	updateCopilotFeatureState(isEnabled: boolean): void;
	updateFloorRequestNotification(): void;
	showConfirmModal(params: any): Promise<string>;
	subscribe(eventName: string, listener: Function): any;
	unsubscribe(eventName: string, listener: Function): any;
	setCallback(name: string, cb: Function): void;
	removeCallback(name: string, cb: Function): void;
}

type CallWindowNameTypeValue = typeof BX.Call.Lib.ViewContract.CallWindowNameType[keyof typeof BX.Call.Lib.ViewContract.CallWindowNameType];

type CloudRecordInfoPopupOptions = {
	onDone?: (() => void) | null;
	source?: CloudRecordInfoPopupSource;
};

/**
 * Who put the cloud record informer on the screen: the user pressed the record button, or the
 * promo queue raised it on its own.
 *
 * The layer answers the two differently - the one the user asked for takes the keyboard focus,
 * the one that came by itself is announced instead - so the source is passed in rather than
 * guessed from the presence of a callback.
 */
type CloudRecordInfoPopupSource = 'user' | 'promo';

declare namespace BX.Call.Lib.ViewContract {
	const CallViewName = "CallView";

	const CallWindowNameType: Readonly<{
		Private: "private";
		Group: "group";
		Conference: "conference";
	}>;
}
