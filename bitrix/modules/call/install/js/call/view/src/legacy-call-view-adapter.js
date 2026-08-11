// @flow

import { type CallView } from 'call.lib.view-contract';
import { type View } from './view';

export class LegacyCallViewAdapter implements CallView
{
	wrappedView: View;

	constructor(view: View)
	{
		this.wrappedView = view;
	}

	// region Properties

	get speakerId(): string
	{
		return this.wrappedView.speakerId;
	}

	get speakerMuted(): boolean
	{
		return this.wrappedView.speakerMuted;
	}

	get visible(): boolean
	{
		return this.wrappedView.visible;
	}

	get size(): string
	{
		return this.wrappedView.size;
	}

	get isFullScreen(): boolean
	{
		return this.wrappedView.isFullScreen;
	}

	get isPreparing(): boolean
	{
		return this.wrappedView.isPreparing;
	}

	set isPreparing(value: boolean)
	{
		this.wrappedView.isPreparing = value;
	}

	get isActivePiPFromController(): boolean
	{
		return this.wrappedView.isActivePiPFromController;
	}

	set isActivePiPFromController(value: boolean)
	{
		this.wrappedView.isActivePiPFromController = value;
	}

	get microphoneId(): string
	{
		return this.wrappedView.microphoneId;
	}

	set microphoneId(value: string)
	{
		this.wrappedView.microphoneId = value;
	}

	get container(): HTMLElement
	{
		return this.wrappedView.container;
	}

	get enableAutoPip(): boolean
	{
		return this.wrappedView.enableAutoPip;
	}

	get buttons(): any
	{
		return this.wrappedView.buttons;
	}

	get elements(): any
	{
		return this.wrappedView.elements;
	}

	get localUser(): any
	{
		return this.wrappedView.localUser;
	}

	get userRegistry(): any
	{
		return this.wrappedView.userRegistry;
	}

	get talkingService(): any
	{
		return this.wrappedView.talkingService;
	}

	isHidden(): boolean
	{
		return this.wrappedView.isHidden();
	}

	get renameSlider(): any
	{
		return this.wrappedView.renameSlider;
	}

	// endregion

	// region Lifecycle

	show(): void
	{
		this.wrappedView.show();
	}

	hide(): void
	{
		this.wrappedView.hide();
	}

	close(): void
	{
		this.wrappedView.close();
	}

	destroy(): void
	{
		this.wrappedView.destroy();
	}

	// endregion

	// region Users

	addUser(userId: number, state?: string, direction?: string): void
	{
		this.wrappedView.addUser(userId, state, direction);
	}

	appendUsers(userStates: {[userId: string]: string}): void
	{
		this.wrappedView.appendUsers(userStates);
	}

	updateUserData(userData: {[userId: string]: any}): void
	{
		this.wrappedView.updateUserData(userData);
	}

	setLocalUserId(userId: number): void
	{
		this.wrappedView.setLocalUserId(userId);
	}

	setLocalUserDirection(direction: string): void
	{
		this.wrappedView.setLocalUserDirection(direction);
	}

	setUserState(userId: number, newState: string): void
	{
		this.wrappedView.setUserState(userId, newState);
	}

	setUserMicrophoneState(userId: number, isMicrophoneOn: boolean): void
	{
		this.wrappedView.setUserMicrophoneState(userId, isMicrophoneOn);
	}

	setUserCameraState(userId: number, cameraState: boolean): void
	{
		this.wrappedView.setUserCameraState(userId, cameraState);
	}

	setUserVideoPaused(userId: number, videoPaused: boolean): void
	{
		this.wrappedView.setUserVideoPaused(userId, videoPaused);
	}

	setUserMedia(userId: number, kind: string, track: ?MediaStreamTrack): void
	{
		this.wrappedView.setUserMedia(userId, kind, track);
	}

	setUserConnectionQuality(userId: number, connectionQuality: any): void
	{
		this.wrappedView.setUserConnectionQuality(userId, connectionQuality);
	}

	setUserFloorRequestState(userId: number, userFloorRequestState: boolean): void
	{
		this.wrappedView.setUserFloorRequestState(userId, userFloorRequestState);
	}

	setUserTalking(userId: number, talking: boolean): void
	{
		this.wrappedView.setUserTalking(userId, talking);
	}

	setUserPermissionToSpeakState(userId: number, permissionToSpeakState: boolean): void
	{
		this.wrappedView.setUserPermissionToSpeakState(userId, permissionToSpeakState);
	}

	setAllUserPermissionToSpeakState(permissionToSpeakState: boolean): void
	{
		this.wrappedView.setAllUserPermissionToSpeakState(permissionToSpeakState);
	}

	setUserScreenState(userId: number, screenState: boolean): void
	{
		this.wrappedView.setUserScreenState(userId, screenState);
	}

	setUserStats(userId: number, stats: any, mediaServerId: number): void
	{
		this.wrappedView.setUserStats(userId, stats, mediaServerId);
	}

	setUserDirection(userId: number, direction: string): void
	{
		this.wrappedView.setUserDirection(userId, direction);
	}

	removeScreenUsers(): void
	{
		this.wrappedView.removeScreenUsers();
	}

	getUserFloorRequestState(userId: number): boolean
	{
		return this.wrappedView.getUserFloorRequestState(userId);
	}

	getUserTalking(userId: number): boolean
	{
		return this.wrappedView.getUserTalking(userId);
	}

	getConnectedUserCount(withYou: boolean): number
	{
		return this.wrappedView.getConnectedUserCount(withYou);
	}

	pinUser(userId: number): void
	{
		this.wrappedView.pinUser(userId);
	}

	unpinUser(): void
	{
		this.wrappedView.unpinUser();
	}

	resetTalkingUsers(): void
	{
		this.wrappedView.resetTalkingUsers();
	}

	notifyUserJoined(userId: number): void
	{
		// no-op: legacy handles this internally
	}

	notifyUserLeft(userId: number): void
	{
		// no-op: legacy handles this internally
	}

	// endregion

	// region Buttons

	setButtonActive(buttonName: string, isActive: boolean): void
	{
		this.wrappedView.setButtonActive(buttonName, isActive);
	}

	setButtonCounter(buttonName: string, counter: number): void
	{
		this.wrappedView.setButtonCounter(buttonName, counter);
	}

	blockButtons(buttons: string[]): void
	{
		this.wrappedView.blockButtons(buttons);
	}

	unblockButtons(buttons: string[]): void
	{
		this.wrappedView.unblockButtons(buttons);
	}

	blockAddUser(): void
	{
		this.wrappedView.blockAddUser();
	}

	unblockAddUser(): void
	{
		this.wrappedView.unblockAddUser();
	}

	blockSwitchCamera(): void
	{
		this.wrappedView.blockSwitchCamera();
	}

	unblockSwitchCamera(): void
	{
		this.wrappedView.unblockSwitchCamera();
	}

	blockSwitchMicrophone(): void
	{
		this.wrappedView.blockSwitchMicrophone();
	}

	unblockSwitchMicrophone(): void
	{
		this.wrappedView.unblockSwitchMicrophone();
	}

	blockScreenSharing(): void
	{
		this.wrappedView.blockScreenSharing();
	}

	blockHistoryButton(): void
	{
		this.wrappedView.blockHistoryButton();
	}

	disableMediaSelection(): void
	{
		this.wrappedView.disableMediaSelection();
	}

	enableMediaSelection(): void
	{
		this.wrappedView.enableMediaSelection();
	}

	showButtons(buttons: string[]): void
	{
		this.wrappedView.showButtons(buttons);
	}

	hideButtons(buttons: string[]): void
	{
		// Legacy View handles hidden buttons internally via constructor config — no-op
	}

	updateButtons(skippedElementsList?: string[]): void
	{
		this.wrappedView.updateButtons(skippedElementsList);
	}

	isButtonBlocked(buttonName: string): boolean
	{
		return this.wrappedView.isButtonBlocked(buttonName);
	}

	getButtonElement(buttonId: string, elementType: string = 'root'): HTMLElement | null
	{
		return this.wrappedView.buttons[buttonId]?.elements?.[elementType] ?? null;
	}

	// endregion

	// region UI State

	setUiState(uiState: string): void
	{
		this.wrappedView.setUiState(uiState);
	}

	setLayout(newLayout: string): void
	{
		this.wrappedView.setLayout(newLayout);
	}

	setSize(size: string): void
	{
		this.wrappedView.setSize(size);
	}

	setTitle(title: string): void
	{
		this.wrappedView.setTitle(title);
	}

	setMaxWidth(maxWidth: number | null): void
	{
		this.wrappedView.setMaxWidth(maxWidth);
	}

	removeMaxWidth(): void
	{
		this.wrappedView.removeMaxWidth();
	}

	setWindowFocusState(isActive: boolean): void
	{
		this.wrappedView.setWindowFocusState(isActive);
	}

	setRoomState(roomState: string): void
	{
		this.wrappedView.setRoomState(roomState);
	}

	setHotKeyTemporaryBlock(isActive: boolean, force?: boolean): void
	{
		this.wrappedView.setHotKeyTemporaryBlock(isActive, force);
	}

	toggleStatePictureInPictureCallWindow(isActive: boolean): void
	{
		this.wrappedView.toggleStatePictureInPictureCallWindow(isActive);
	}

	// endregion

	// region Media

	setLocalStream(streamData: {mediaRenderer?: any, stream?: MediaStream, flipVideo?: boolean}): void
	{
		this.wrappedView.setLocalStream(streamData);
	}

	setLocalStreamVideoTrack(videoTrack: ?MediaStreamTrack): void
	{
		this.wrappedView.setLocalStreamVideoTrack(videoTrack);
	}

	flipLocalVideo(flipVideo: boolean): void
	{
		this.wrappedView.flipLocalVideo(flipVideo);
	}

	setMicrophoneId(microphoneId: string): void
	{
		this.wrappedView.setMicrophoneId(microphoneId);
	}

	setSpeakerId(speakerId: string): void
	{
		this.wrappedView.setSpeakerId(speakerId);
	}

	setCameraId(cameraId: string): void
	{
		this.wrappedView.setCameraId(cameraId);
	}

	muteSpeaker(mute: boolean): void
	{
		this.wrappedView.muteSpeaker(mute);
	}

	releaseLocalMedia(): void
	{
		this.wrappedView.releaseLocalMedia();
	}

	trackAvailabilityChanged(userId: number, kind: string, available: boolean): void
	{
		this.wrappedView.trackAvailabilityChanged(userId, kind, available);
	}

	setVideoRenderer(userId: number, mediaRenderer: any): void
	{
		this.wrappedView.setVideoRenderer(userId, mediaRenderer);
	}

	releaseVideoRenderer(userId: number): void
	{
		// no-op: legacy View manages renderer lifecycle internally
	}

	setBadNetworkIndicator(userId: number, badNetworkIndicator: boolean): void
	{
		this.wrappedView.setBadNetworkIndicator(userId, badNetworkIndicator);
	}

	setTrackSubscriptionFailed(data: any): void
	{
		this.wrappedView.setTrackSubscriptionFailed(data);
	}

	setMicrophoneLevel(level: number): void
	{
		this.wrappedView.setMicrophoneLevel(level);
	}

	confirmSpeakerSelection(deviceId: string): void
	{
		this.wrappedView.confirmSpeakerSelection(deviceId);
	}

	// endregion

	// region Recording

	setCommonRecordState(commonRecordState: any): void
	{
		this.wrappedView.setCommonRecordState(commonRecordState);
	}

	getDefaultCommonRecordState(): any
	{
		return this.wrappedView.getDefaultCommonRecordState();
	}

	// endregion

	// region Notifications & Popups

	showSelfTest(): void
	{
		this.wrappedView.showSelfTest();
	}

	showSecurityKeyError(): void
	{
		this.wrappedView.showSecurityKeyError();
	}

	showFatalError(params: any): void
	{
		this.wrappedView.showFatalError(params);
	}

	showCloudRecordPromo(isCloudRecordFeaturesEnabled: boolean, callId: number): void
	{
		this.wrappedView.showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId);
	}

	showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled: boolean, callId: number): void
	{
		this.wrappedView.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId);
	}

	showCommonRecordMenuPopup(isDesktopRecord?: boolean): void
	{
		this.wrappedView.showCommonRecordMenuPopup(isDesktopRecord);
	}

	showCommonRecordStartModal(): void
	{
		this.wrappedView.showCommonRecordStartModal();
	}

	showCommonRecordStartNotify(userId: number, state?: string): void
	{
		this.wrappedView.showCommonRecordStartNotify(userId, state);
	}

	showCopilotErrorNotify(errorType: string): void
	{
		this.wrappedView.showCopilotErrorNotify(errorType);
	}

	showCopilotNotify(callId?: number, errorCode?: string): void
	{
		this.wrappedView.showCopilotNotify(callId, errorCode);
	}

	showCopilotResultNotify(): void
	{
		this.wrappedView.showCopilotResultNotify();
	}

	closeCopilotNotify(): void
	{
		this.wrappedView.closeCopilotNotify();
	}

	updateCopilotState(isActive: boolean): void
	{
		this.wrappedView.updateCopilotState(isActive);
	}

	updateCopilotFeatureState(isEnabled: boolean): void
	{
		this.wrappedView.updateCopilotFeatureState(isEnabled);
	}

	updateFloorRequestNotification(): void
	{
		this.wrappedView.updateFloorRequestNotification();
	}

	// endregion

	// region Modals

	showConfirmModal(params: any): Promise<string>
	{
		return this.wrappedView.showConfirmModal(params);
	}

	// endregion

	// region Events

	subscribe(eventName: string, listener: Function): any
	{
		return this.wrappedView.subscribe(eventName, listener);
	}

	unsubscribe(eventName: string, listener: Function): any
	{
		return this.wrappedView.unsubscribe(eventName, listener);
	}

	setCallback(name: string, cb: Function): void
	{
		this.wrappedView.setCallback(name, cb);
	}

	removeCallback(name: string, cb: Function): void
	{
		this.wrappedView.removeCallback(name, cb);
	}

	// endregion
}
