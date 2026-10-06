export interface CallView
{
	// region Properties

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

	// endregion

	// region Lifecycle

	show(): void;
	hide(): void;
	close(): void;
	destroy(): void;

	// endregion

	// region Users

	addUser(userId: number, state?: string, direction?: string): void;
	appendUsers(userStates: { [userId: string]: string }): void;
	updateUserData(userData: { [userId: string]: any }): void;
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

	// endregion

	// region Buttons

	setButtonActive(buttonName: string, isActive: boolean): void;
	setButtonCounter(buttonName: string, counter: number): void;
	blockButtons(buttons: string[]): void;
	unblockButtons(buttons: string[]): void;
	blockAddUser(): void;
	unblockAddUser(): void;
	blockSwitchCamera(): void;
	unblockSwitchCamera(): void;
	blockSwitchMicrophone(): void;
	unblockSwitchMicrophone(): void;
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

	// endregion

	// region UI State

	setUiState(uiState: string): void;
	setLayout(newLayout: string): void;
	setSize(size: string): void;
	setTitle(title: string): void;
	setMaxWidth(maxWidth: number | null): void;
	removeMaxWidth(): void;
	setWindowFocusState(isActive: boolean): void;
	setRoomState(roomState: string): void;
	setHotKeyTemporaryBlock(isActive: boolean, force?: boolean): void;
	toggleStatePictureInPictureCallWindow(isActive: boolean): void;

	// endregion

	// region Media

	setLocalStream(streamData: { mediaRenderer?: any; stream?: MediaStream; flipVideo?: boolean }): void;
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

	// endregion

	// region Recording

	setCommonRecordState(commonRecordState: any): void;
	getDefaultCommonRecordState(): any;

	// endregion

	// region Notifications & Popups

	showSelfTest(): void;
	showSecurityKeyError(): void;
	showFatalError(params: any): void;
	showCloudRecordPromo(isCloudRecordFeaturesEnabled: boolean, callId: number): void;
	showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled: boolean, callId: number): void;
	showCommonRecordMenuPopup(isDesktopRecord?: boolean): void;
	showCommonRecordStartModal(): void;
	showCommonRecordStartNotify(userId: number, state?: string): void;
	showCopilotErrorNotify(errorType: string): void;
	showCopilotNotify(callId?: number, errorCode?: string): void;
	showCopilotResultNotify(): void;
	closeCopilotNotify(): void;
	updateCopilotState(isActive: boolean): void;
	updateCopilotFeatureState(isEnabled: boolean): void;
	updateFloorRequestNotification(): void;

	// endregion

	// region Modals

	showConfirmModal(params: any): Promise<string>;

	// endregion

	// region Events

	subscribe(eventName: string, listener: Function): any;
	unsubscribe(eventName: string, listener: Function): any;
	setCallback(name: string, cb: Function): void;
	removeCallback(name: string, cb: Function): void;

	// endregion
}
