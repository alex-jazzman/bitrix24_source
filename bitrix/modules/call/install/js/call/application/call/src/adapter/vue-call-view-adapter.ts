import { Event, Dom } from 'main.core';
import { MediaStreamRegistry } from 'call.lib.media-registry';
import {
	type BlockButtonsOptions,
	type ButtonPopupKind,
	type CallView,
	type CloudRecordInfoPopupOptions,
} from 'call.lib.view-contract';
import { useUsersStore, useMediaStore, useUiStore, useRecordingStore } from 'call.store';
import type { Pinia } from 'ui.vue3.pinia';
import { toControllerAction } from 'call.mapping';
import { CallVueApplication } from '../application/call-vue-application';

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
export class VueCallViewAdapter implements CallView
{
	#container: HTMLElement;
	#app: CallVueApplication | null = null;
	#isMounted = false;
	#isDestroyed = false;
	#isVisible = false;
	#isActivePiP = false;
	#eventEmitter = new Event.EventEmitter();
	#deprecationWarned: Set<string> = new Set();

	// Map<eventName, Map<originalHandler, wrappedHandler>>
	#callbackWrappers: Map<string, Map<Function, Function>> = new Map();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#getUsersStore(): any { return useUsersStore(); }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#getMediaStore(): any { return useMediaStore(); }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#getUiStore(): any { return useUiStore(); }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#getRecordingStore(): any { return useRecordingStore(); }

	#translateEventData(eventName: string, data: any): any
	{
		if (eventName === 'onButtonClick' && data?.buttonName)
		{
			const translated = { ...data, buttonName: toControllerAction(data.buttonName) };

			if (data.buttonName === 'microphone')
			{
				translated.muted = !this.#getMediaStore().isMicrophoneMuted;
			}
			else if (data.buttonName === 'camera')
			{
				translated.video = !this.#getMediaStore().isCameraOn;
			}

			return translated;
		}

		return data;
	}

	constructor({
		container,
		pinia,
		hiddenButtons,
		...extraOptions
	}: {
		container: HTMLElement;
		pinia: Pinia;
		hiddenButtons?: string[];
	})
	{
		this.#container = container;
		this.#isMounted = false;
		this.#isDestroyed = false;
		this.#eventEmitter.setEventNamespace('BX.Call.VueCallViewAdapter');
		this.#app = new CallVueApplication({ pinia });

		const bridge = {
			emit: (eventName: string, data: any): void =>
			{
				this.#eventEmitter.emit(eventName, this.#translateEventData(eventName, data));
			},
		};

		this.#getMediaStore().attachBridge(bridge);
		this.#getUiStore().attachBridge(bridge);
		this.#getRecordingStore().attachBridge(bridge);

		if (Array.isArray(hiddenButtons) && hiddenButtons.length > 0)
		{
			this.#getUiStore().hideButtons(hiddenButtons);
		}
	}

	// region Properties

	get speakerId(): string
	{
		return this.#getMediaStore().speakerDeviceId ?? '';
	}

	set speakerId(id: string)
	{
		this.#getMediaStore().setDeviceIds({ speakerId: id });
	}

	get speakerMuted(): boolean
	{
		return this.#getMediaStore().isSpeakerMuted;
	}

	get visible(): boolean
	{
		return this.#isVisible;
	}

	get size(): string
	{
		return this.#getUiStore().size ?? 'full';
	}

	get isFullScreen(): boolean
	{
		return this.#getUiStore().isFullScreen;
	}

	get isPreparing(): boolean
	{
		return this.#getUiStore().uiState === 'Preparing';
	}

	set isPreparing(value: boolean)
	{
		this.#getUiStore().setUiState(value ? 'Preparing' : 'Connected');
	}

	get isActivePiPFromController(): boolean
	{
		return this.#isActivePiP;
	}

	set isActivePiPFromController(value: boolean)
	{
		this.#isActivePiP = value;
	}

	get microphoneId(): string
	{
		return this.#getMediaStore().microphoneDeviceId ?? '';
	}

	set microphoneId(id: string)
	{
		this.#getMediaStore().setDeviceIds({ microphoneId: id });
	}

	get container(): HTMLElement
	{
		return this.#container;
	}

	get enableAutoPip(): boolean
	{
		return false;
	}

	get buttons(): any
	{
		return null;
	}

	get elements(): any
	{
		return { root: this.#container };
	}

	get localUser(): any
	{
		return null;
	}

	get userRegistry(): any
	{
		if (!this.#deprecationWarned.has('userRegistry'))
		{
			console.warn('[VueCallViewAdapter] userRegistry is deprecated. Use usersStore.users instead.');
			this.#deprecationWarned.add('userRegistry');
		}

		return null;
	}

	get talkingService(): any
	{
		if (!this.#deprecationWarned.has('talkingService'))
		{
			console.warn('[VueCallViewAdapter] talkingService is deprecated. Use usersStore.talkingQueue instead.');
			this.#deprecationWarned.add('talkingService');
		}

		return null;
	}

	get viewVisibility(): any
	{
		return {
			getCurrentVisibility: () => (this.#isVisible ? 'visible' : 'hidden'),
		};
	}

	get renameSlider(): any
	{
		return {
			close: () => {
				this.#getUiStore().closeRenameSlider();
			},
		};
	}

	// endregion

	// region Lifecycle

	show(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isVisible = true;

		if (this.#isMounted)
		{
			Dom.style(this.#container, 'display', '');

			return;
		}

		this.#app!.mount(this.#container);
		this.#isMounted = true;
		Dom.style(this.#container, 'display', '');
		this.#eventEmitter.emit('onShow', {});
	}

	hide(): void
	{
		if (this.#isDestroyed || !this.#isMounted)
		{
			return;
		}

		this.#isVisible = false;
		Dom.style(this.#container, 'display', 'none');
	}

	close(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isVisible = false;
		Dom.style(this.#container, 'display', 'none');
		this.#eventEmitter.emit('onClose', {});
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isVisible = false;
		this.#eventEmitter.emit('onDestroy', {});
		this.#app?.destroy();
		this.#app = null;
		this.#isMounted = false;
		this.#isDestroyed = true;
		MediaStreamRegistry.clear();
		this.#eventEmitter.unsubscribeAll();
		this.#callbackWrappers.clear();
	}

	// endregion

	getButtonElement(buttonId: string, elementType: string = 'root'): HTMLElement | null
	{
		if (!this.#container)
		{
			return null;
		}

		const escapedId = CSS.escape(buttonId);
		const escapedType = CSS.escape(elementType);

		return this.#container.querySelector(`[data-button-id="${escapedId}"][data-element-type="${escapedType}"]`) ?? null;
	}

	// region Users

	addUser(userId: number, state?: string, direction?: string): void
	{
		this.#getUsersStore().upsertUser(userId, { state: (state ?? 'Idle') as string });
	}

	appendUsers(userStates: { [userId: string]: string }): void
	{
		const usersStore = this.#getUsersStore();

		Object.entries(userStates).forEach(([id, state]) => {
			usersStore.upsertUser(parseInt(id, 10), { state });
		});
	}

	updateUserData(userData: { [userId: string]: any }): void
	{
		const usersStore = this.#getUsersStore();

		Object.entries(userData).forEach(([userId, data]) => {
			const fields: Record<string, unknown> = {};

			if (data.name !== undefined)
			{
				fields.name = data.name;
			}

			if (data.avatar_hr !== undefined)
			{
				fields.avatar = data.avatar_hr;
			}
			else if (data.avatar !== undefined)
			{
				fields.avatar = data.avatar;
			}

			usersStore.updateUser(parseInt(userId, 10), fields);
		});
	}

	setLocalUserId(userId: number): void
	{
		this.#getUsersStore().setCurrentUser(userId);
	}

	setLocalUserDirection(direction: string): void
	{
		// no-op — local direction is not tracked
	}

	setUserState(userId: number, newState: string): void
	{
		this.#getUsersStore().updateUser(userId, { state: newState });
	}

	setUserMicrophoneState(userId: number, isMicrophoneOn: boolean): void
	{
		this.#getUsersStore().updateUser(userId, { microphoneState: isMicrophoneOn });
	}

	setUserCameraState(userId: number, cameraState: boolean): void
	{
		this.#getUsersStore().updateUser(userId, { cameraState });
	}

	setUserVideoPaused(userId: number, videoPaused: boolean): void
	{
		this.#getUsersStore().updateUser(userId, { videoPaused });
	}

	setUserMedia(userId: number, kind: string, track: MediaStreamTrack | null | undefined): void
	{
		if (kind === 'audio' || kind === 'sharingAudio')
		{
			MediaStreamRegistry.setAudioTrack(userId, track ?? null);

			return;
		}

		if (kind === 'video')
		{
			if (track)
			{
				const stream = new MediaStream([track]);
				MediaStreamRegistry.setRenderer(userId, stream);
			}
			else
			{
				MediaStreamRegistry.removeRenderer(userId);
			}

			this.#getUsersStore().incrementStreamVersion(userId);
		}
	}

	setUserConnectionQuality(userId: number, connectionQuality: any): void
	{
		this.#getUsersStore().updateUser(userId, { connectionQuality });
	}

	setUserFloorRequestState(userId: number, userFloorRequestState: boolean): void
	{
		this.#getUsersStore().setFloorRequest(userId, userFloorRequestState);
	}

	setUserTalking(userId: number, talking: boolean): void
	{
		this.#getUsersStore().updateUser(userId, { talking });
	}

	setUserPermissionToSpeakState(userId: number, permissionToSpeakState: boolean): void
	{
		// permissionToSpeak is not part of the new User type — skip on MVP
	}

	setAllUserPermissionToSpeakState(permissionToSpeakState: boolean): void
	{
		// skip on MVP
	}

	setUserScreenState(userId: number, screenState: boolean): void
	{
		this.#getUsersStore().updateUser(userId, { screenSharingState: screenState });
	}

	setUserStats(userId: number, stats: any): void
	{
		// stub — stats not tracked
	}

	setUserDirection(userId: number, direction: string): void
	{
		// direction not tracked in new User type — skip
	}

	removeScreenUsers(): void
	{
		// stub
	}

	getUserFloorRequestState(userId: number): boolean
	{
		return this.#getUsersStore().userById(userId)?.floorRequestState ?? false;
	}

	getUserTalking(userId: number): boolean
	{
		return this.#getUsersStore().userById(userId)?.talking ?? false;
	}

	getConnectedUserCount(withYou: boolean = false): number
	{
		const count = this.#getUsersStore().connectedUsers.length;

		return withYou ? count + 1 : count;
	}

	pinUser(userId: number): void
	{
		this.#getUiStore().setPinnedUser(userId);
	}

	unpinUser(): void
	{
		this.#getUiStore().setPinnedUser(null);
	}

	resetTalkingUsers(): void
	{
		const usersStore = this.#getUsersStore();

		Object.keys(usersStore.users).forEach((userId) => {
			usersStore.updateUser(parseInt(userId, 10), { talking: false });
		});
	}

	notifyUserJoined(userId: number): void
	{
		// no-op
	}

	notifyUserLeft(userId: number): void
	{
		// no-op
	}

	// endregion

	// region Buttons

	setButtonActive(buttonName: string, isActive: boolean): void
	{
		this.#getUiStore().setButtonState(buttonName, { active: isActive });
	}

	setButtonPopupKind(buttonName: string, kind: ButtonPopupKind): void
	{
		// no-op: the popup layer of a panel button is not part of the Vue rendering yet
	}

	setButtonCounter(buttonName: string, counter: number): void
	{
		this.#getUiStore().setButtonState(buttonName, { counter });
	}

	// The announcement option of the port is taken and dropped by every blocking call below: this
	// view has no picture-in-picture window, and nothing else in it speaks a blocking out loud.
	blockButtons(buttons: string[], options?: BlockButtonsOptions): void
	{
		this.#getUiStore().blockButtons(buttons);
	}

	unblockButtons(buttons: string[], options?: BlockButtonsOptions): void
	{
		this.#getUiStore().unblockButtons(buttons);
	}

	blockAddUser(): void { this.#getUiStore().blockButtons(['addUser']); }
	unblockAddUser(): void { this.#getUiStore().unblockButtons(['addUser']); }
	blockSwitchCamera(options?: BlockButtonsOptions): void { this.#getUiStore().blockButtons(['camera']); }
	unblockSwitchCamera(options?: BlockButtonsOptions): void { this.#getUiStore().unblockButtons(['camera']); }
	blockSwitchMicrophone(options?: BlockButtonsOptions): void { this.#getUiStore().blockButtons(['microphone']); }
	unblockSwitchMicrophone(options?: BlockButtonsOptions): void { this.#getUiStore().unblockButtons(['microphone']); }
	blockScreenSharing(): void { this.#getUiStore().blockButtons(['screen']); }
	blockHistoryButton(): void { this.#getUiStore().blockButtons(['history']); }
	disableMediaSelection(): void { this.#getUiStore().blockButtons(['microphone', 'camera', 'speaker']); }
	enableMediaSelection(): void { this.#getUiStore().unblockButtons(['microphone', 'camera', 'speaker']); }
	showButtons(buttons: string[]): void { this.#getUiStore().showButtons(buttons); }
	hideButtons(buttons: string[]): void { this.#getUiStore().hideButtons(buttons); }

	updateButtons(skippedElementsList?: string[]): void
	{
		// no-op: Vue reactivity handles button rendering automatically
	}

	isButtonBlocked(buttonName: string): boolean
	{
		return this.#getUiStore().isButtonBlocked(buttonName);
	}

	// endregion

	// region UI State

	setUiState(uiState: string): void { this.#getUiStore().setUiState(uiState); }
	setLayout(newLayout: string): void { this.#getUiStore().setLayout(newLayout); }
	setSize(size: string): void { this.#getUiStore().setSize(size); }
	setTitle(title: string): void { this.#getUiStore().setCallTitle(title); }

	setAccessibleName(): void
	{
		// no-op: this view has no accessible-name channel yet, setCallTitle drives the folded header,
		// not the window name. Kept so the contract holds while the Vue layer is behind its flag.
	}

	focusWindow(options?: { force?: boolean }): void
	{
		// no-op: focus handling for the Vue window is not implemented yet
	}

	releaseFocusBeforeHide(): boolean
	{
		// no-op: the Vue window never takes the focus, so the caller has nothing to restore
		return false;
	}

	restoreFocusAfterHide(): void
	{
		// no-op: focus handling for the Vue window is not implemented yet
	}

	setMaxWidth(maxWidth: number | null): void { this.#getUiStore().setMaxWidth(maxWidth); }
	removeMaxWidth(): void { this.#getUiStore().setMaxWidth(null); }
	setWindowFocusState(isActive: boolean): void { this.#getUiStore().setWindowFocus(isActive); }
	setRoomState(roomState: string): void { this.#getUiStore().setRoomState(roomState); }

	setHotKeyTemporaryBlock(isActive: boolean, force?: boolean): void
	{
		// no-op: hotkey management is not relevant to Vue rendering
	}

	toggleStatePictureInPictureCallWindow(isActive: boolean): void
	{
		// no-op: PiP window state managed externally
	}

	// endregion

	// region Call environment

	// The three below are no-ops: push-to-talk is assembled by the legacy call window, and this view
	// has neither a hold policy nor a picture-in-picture window of its own to feed with these facts.
	// They are kept so the contract holds while the Vue layer is behind its flag.

	notifyConnectionLost(): void
	{}

	notifyBroadcastRightLost(): void
	{}

	notifySpeechSignal(_signal: { userId: number; local?: boolean }, _speaking: boolean): void
	{}

	// endregion

	// region Media

	setLocalStream(streamData: { mediaRenderer?: any; stream?: MediaStream; flipVideo?: boolean }): void
	{
		const { stream = null, flipVideo = false } = streamData;
		const mediaStore = this.#getMediaStore();

		if (!stream)
		{
			MediaStreamRegistry.removeLocalStream();
			mediaStore.setLocalMediaMetadata({ hasLocalVideo: false, hasLocalAudio: false });
			mediaStore.incrementLocalStreamVersion();

			return;
		}

		MediaStreamRegistry.setLocalStream(stream);
		mediaStore.setLocalMediaMetadata({
			hasLocalVideo: stream.getVideoTracks().length > 0,
			hasLocalAudio: stream.getAudioTracks().length > 0,
		});
		mediaStore.setFlipLocalVideo(Boolean(flipVideo));
		mediaStore.incrementLocalStreamVersion();
	}

	setLocalStreamVideoTrack(videoTrack: MediaStreamTrack | null | undefined): void
	{
		const stream = MediaStreamRegistry.getLocalStream();

		if (!stream)
		{
			return;
		}

		stream.getVideoTracks().forEach((track) => {
			stream.removeTrack(track);
		});

		if (videoTrack)
		{
			stream.addTrack(videoTrack);
		}

		const mediaStore = this.#getMediaStore();
		MediaStreamRegistry.setLocalStream(stream);
		mediaStore.setLocalMediaMetadata({ hasLocalVideo: Boolean(videoTrack) });
		mediaStore.incrementLocalStreamVersion();
	}

	flipLocalVideo(flipVideo: boolean): void
	{
		this.#getMediaStore().setFlipLocalVideo(flipVideo);
	}

	setMicrophoneId(microphoneId: string): void
	{
		this.#getMediaStore().setDeviceIds({ microphoneId });
	}

	setSpeakerId(speakerId: string): void
	{
		this.#getMediaStore().setDeviceIds({ speakerId });
	}

	setCameraId(cameraId: string): void
	{
		this.#getMediaStore().setDeviceIds({ cameraId });
	}

	muteSpeaker(mute: boolean): void
	{
		this.#getMediaStore().setSpeakerMuted(mute);
	}

	releaseLocalMedia(): void
	{
		const mediaStore = this.#getMediaStore();
		MediaStreamRegistry.removeLocalStream();
		mediaStore.setLocalMediaMetadata({ hasLocalVideo: false, hasLocalAudio: false });
		mediaStore.incrementLocalStreamVersion();
	}

	setVideoRenderer(userId: number, mediaRenderer: any): void
	{
		if (!mediaRenderer)
		{
			MediaStreamRegistry.removeRenderer(userId);
			this.#getUsersStore().incrementStreamVersion(userId);

			return;
		}

		MediaStreamRegistry.setRenderer(userId, mediaRenderer);
		this.#getUsersStore().incrementStreamVersion(userId);
	}

	releaseVideoRenderer(userId: number): void
	{
		MediaStreamRegistry.removeRenderer(userId);
		this.#getUsersStore().incrementStreamVersion(userId);
	}

	setBadNetworkIndicator(userId: number, badNetworkIndicator: boolean): void
	{
		// badNetworkIndicator is not part of the new User type — skip on MVP
	}

	setTrackSubscriptionFailed(data: any): void
	{
		// stub
	}

	setMicrophoneLevel(level: number): void
	{
		// stub
	}

	// endregion

	// region Recording

	setCommonRecordState(commonRecordState: any): void
	{
		this.#getRecordingStore().setState({
			state: commonRecordState.state,
			type: commonRecordState.type,
			initiatorId: commonRecordState.initiatorId,
		});
	}

	getDefaultCommonRecordState(): any
	{
		return { state: 'Inactive', type: null, initiatorId: null };
	}

	// endregion

	// region Notifications & Popups (mostly stubs — UI handles these reactively)

	showSelfTest(): void { /* stub */ }
	showSecurityKeyError(): void { /* stub */ }
	showFatalError(params: any): void { /* stub */ }
	showCloudRecordPromo(isCloudRecordFeaturesEnabled: boolean, callId: number): void { /* stub */ }
	showCloudRecordInfoPopup(
		isCloudRecordFeaturesEnabled: boolean,
		callId: number,
		options?: CloudRecordInfoPopupOptions,
	): void { /* stub */ }

	showCommonRecordMenuPopup(isDesktopRecord?: boolean): void { /* stub */ }
	showCommonRecordStartModal(): void { /* stub */ }
	showCommonRecordStartNotify(userId: number, state?: string): void { /* stub */ }
	showCopilotErrorNotify(errorType: string): void { /* stub */ }
	showCopilotNotify(callId?: number, errorCode?: string): void { /* stub */ }
	showCopilotResultNotify(): void { /* stub */ }
	closeCopilotNotify(): void { /* stub */ }

	updateCopilotState(isActive: boolean): void
	{
		this.#getUiStore().setCopilotActive(isActive);
	}

	updateCopilotFeatureState(isEnabled: boolean): void
	{
		this.#getUiStore().setCopilotFeaturesEnabled(isEnabled);
	}

	updateFloorRequestNotification(): void { /* stub */ }

	// endregion

	// region Modals

	showConfirmModal(params: any): Promise<string>
	{
		return Promise.resolve('cancel');
	}

	// endregion

	// region CallView contract stubs

	trackAvailabilityChanged(): void { /* stub */ }
	confirmSpeakerSelection(): void { /* stub */ }

	// endregion

	// region Events

	subscribe(eventName: string, listener: Function): any
	{
		this.#eventEmitter.subscribe(eventName, listener as any);
	}

	unsubscribe(eventName: string, listener: Function): any
	{
		this.#eventEmitter.unsubscribe(eventName, listener as any);
	}

	/**
	 * Wraps handler to receive unwrapped event.data, matching legacy View behavior.
	 */
	setCallback(name: string, cb: Function): void
	{
		const wrapper = (event: any): void => cb(event.data);

		if (!this.#callbackWrappers.has(name))
		{
			this.#callbackWrappers.set(name, new Map());
		}

		this.#callbackWrappers.get(name)!.set(cb, wrapper);
		this.#eventEmitter.subscribe(name, wrapper as any);
	}

	removeCallback(name: string, cb: Function): void
	{
		const nameMap = this.#callbackWrappers.get(name);

		if (!nameMap)
		{
			return;
		}

		const wrapper = nameMap.get(cb);

		if (wrapper)
		{
			this.#eventEmitter.unsubscribe(name, wrapper as any);
			nameMap.delete(cb);
		}
	}

	// endregion

	isHidden(): boolean
	{
		return false;
	}

	setGuestLink(link: string | null): void
	{
		// stub
	}
}
