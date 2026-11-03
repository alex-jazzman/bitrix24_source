/* eslint-disable */
declare namespace BX.Call.Application {
	/**
	 * Vue-based implementation of the CallView interface.
	 *
	 * All inbound writes (controller → store) are routed to the appropriate entity store:
	 * - users / media display facts → usersStore
	 * - local hardware / streams / devices → mediaStore
	 * - layout / buttons / panels → uiStore
	 * - recording → recordingStore
	 *
	 * Vue intents (button click → action → bridge) flow back through the same `#eventEmitter`
	 * the controller listens on. The bridge is attached to every store that has intent actions.
	 */
	class VueCallViewAdapter implements BX.Call.Lib.ViewContract.CallView {
		constructor({ container, pinia, hiddenButtons, ...extraOptions }: {
			container: HTMLElement;
			pinia: BX.Vue3.Pinia.Pinia;
			hiddenButtons?: string[];
		});
		get speakerId(): string;
		set speakerId(id: string);
		get speakerMuted(): boolean;
		get visible(): boolean;
		get size(): string;
		get isFullScreen(): boolean;
		get isPreparing(): boolean;
		set isPreparing(value: boolean);
		get isActivePiPFromController(): boolean;
		set isActivePiPFromController(value: boolean);
		get microphoneId(): string;
		set microphoneId(id: string);
		get container(): HTMLElement;
		get enableAutoPip(): boolean;
		get buttons(): any;
		get elements(): any;
		get localUser(): any;
		get userRegistry(): any;
		get talkingService(): any;
		get viewVisibility(): any;
		get renameSlider(): any;
		show(): void;
		hide(): void;
		close(): void;
		destroy(): void;
		getButtonElement(buttonId: string, elementType?: string): HTMLElement | null;
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
		setUserStats(userId: number, stats: any): void;
		setUserDirection(userId: number, direction: string): void;
		removeScreenUsers(): void;
		getUserFloorRequestState(userId: number): boolean;
		getUserTalking(userId: number): boolean;
		getConnectedUserCount(withYou?: boolean): number;
		pinUser(userId: number): void;
		unpinUser(): void;
		resetTalkingUsers(): void;
		notifyUserJoined(userId: number): void;
		notifyUserLeft(userId: number): void;
		setButtonActive(buttonName: string, isActive: boolean): void;
		setButtonPopupKind(buttonName: string, kind: BX.Call.Lib.ViewContract.ButtonPopupKind): void;
		setButtonCounter(buttonName: string, counter: number): void;
		blockButtons(buttons: string[], options?: BX.Call.Lib.ViewContract.BlockButtonsOptions): void;
		unblockButtons(buttons: string[], options?: BX.Call.Lib.ViewContract.BlockButtonsOptions): void;
		blockAddUser(): void;
		unblockAddUser(): void;
		blockSwitchCamera(options?: BX.Call.Lib.ViewContract.BlockButtonsOptions): void;
		unblockSwitchCamera(options?: BX.Call.Lib.ViewContract.BlockButtonsOptions): void;
		blockSwitchMicrophone(options?: BX.Call.Lib.ViewContract.BlockButtonsOptions): void;
		unblockSwitchMicrophone(options?: BX.Call.Lib.ViewContract.BlockButtonsOptions): void;
		blockScreenSharing(): void;
		blockHistoryButton(): void;
		disableMediaSelection(): void;
		enableMediaSelection(): void;
		showButtons(buttons: string[]): void;
		hideButtons(buttons: string[]): void;
		updateButtons(skippedElementsList?: string[]): void;
		isButtonBlocked(buttonName: string): boolean;
		setUiState(uiState: string): void;
		setLayout(newLayout: string): void;
		setSize(size: string): void;
		setTitle(title: string): void;
		setAccessibleName(): void;
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
		notifyConnectionLost(): void;
		notifyBroadcastRightLost(): void;
		notifySpeechSignal(_signal: {
			userId: number;
			local?: boolean;
		}, _speaking: boolean): void;
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
		setVideoRenderer(userId: number, mediaRenderer: any): void;
		releaseVideoRenderer(userId: number): void;
		setBadNetworkIndicator(userId: number, badNetworkIndicator: boolean): void;
		setTrackSubscriptionFailed(data: any): void;
		setMicrophoneLevel(level: number): void;
		setCommonRecordState(commonRecordState: any): void;
		getDefaultCommonRecordState(): any;
		showSelfTest(): void;
		showSecurityKeyError(): void;
		showFatalError(params: any): void;
		showCloudRecordPromo(isCloudRecordFeaturesEnabled: boolean, callId: number): void;
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled: boolean, callId: number, options?: BX.Call.Lib.ViewContract.CloudRecordInfoPopupOptions): void;
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
		showConfirmModal(params: any): Promise<string>;
		trackAvailabilityChanged(): void;
		confirmSpeakerSelection(): void;
		subscribe(eventName: string, listener: Function): any;
		unsubscribe(eventName: string, listener: Function): any;
		/**
		 * Wraps handler to receive unwrapped event.data, matching legacy View behavior.
		 */
		setCallback(name: string, cb: Function): void;
		removeCallback(name: string, cb: Function): void;
		isHidden(): boolean;
		setGuestLink(link: string | null): void;
	}

	/**
	 * Manages the Vue application lifecycle for the call view.
	 * Responsible exclusively for mount/unmount — does NOT implement CallView.
	 */
	class CallVueApplication {
		constructor({ pinia }: {
			pinia: BX.Vue3.Pinia.Pinia;
		});
		provide(key: string, value: unknown): void;
		mount(container: HTMLElement): void;
		unmount(): void;
		destroy(): void;
	}
}
