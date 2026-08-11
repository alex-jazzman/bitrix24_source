// @flow

import { Event, Dom } from 'main.core';
import { MediaStreamRegistry } from 'call.lib.media-registry';
import { type CallView } from 'call.lib.view-contract';
import { useCallStore } from 'call.store';
import { toControllerAction } from 'call.mapping';
import { CallVueApplication } from '../application/call-vue-application';

/**
 * Vue-based implementation of the CallView interface.
 */
export class VueCallViewAdapter implements CallView
{
	#container = null;
	#app = null;
	#isMounted = false;
	#isDestroyed = false;
	#isVisible = false;
	#isActivePiP = false;
	#eventEmitter = null;
	#deprecationWarned = new Set();

	// Map<eventName, Map<originalHandler, wrappedHandler>>
	#callbackWrappers = null;

	/**
	 * Returns the call Pinia store instance.
	 * Safe to call multiple times — Pinia returns the same cached instance per active Pinia.
	 *
	 * @returns {object}
	 */
	#getCallStore(): any
	{
		return useCallStore();
	}

	#translateEventData(eventName: string, data: any): any
	{
		if (eventName === 'onButtonClick' && data?.buttonName)
		{
			const translated = { ...data, buttonName: toControllerAction(data.buttonName) };

			if (data.buttonName === 'microphone')
			{
				translated.muted = !this.#getCallStore().isMicrophoneMuted;
			}
			else if (data.buttonName === 'camera')
			{
				translated.video = !this.#getCallStore().isCameraOn;
			}

			return translated;
		}

		return data;
	}

	constructor({ container, pinia, hiddenButtons, ...extraOptions }: { container: HTMLElement, pinia: any, hiddenButtons?: string[] })
	{
		this.#container = container;
		this.#isMounted = false;
		this.#isDestroyed = false;
		this.#eventEmitter = new Event.EventEmitter();
		this.#callbackWrappers = new Map();
		this.#app = new CallVueApplication({ pinia });

		this.#app.provide('callActionBridge', {
			emit: (eventName, data) =>
			{
				this.#eventEmitter.emit(eventName, this.#translateEventData(eventName, data));
			},
		});

		if (Array.isArray(hiddenButtons) && hiddenButtons.length > 0)
		{
			this.#getCallStore().hideButtons(hiddenButtons);
		}
	}

	// region Properties

	get speakerId(): string
	{
		return this.#getCallStore().currentSpeakerId ?? '';
	}

	set speakerId(id: string): void
	{
		this.#getCallStore().setDeviceIds({ speakerId: id });
	}

	get speakerMuted(): boolean
	{
		return this.#getCallStore().isSpeakerMuted;
	}

	get visible(): boolean
	{
		return this.#isVisible;
	}

	get size(): string
	{
		return this.#getCallStore().size ?? 'full';
	}

	get isFullScreen(): boolean
	{
		return this.#getCallStore().isFullScreen;
	}

	get isPreparing(): boolean
	{
		return this.#getCallStore().uiState === 'Preparing';
	}

	set isPreparing(value: boolean): void
	{
		this.#getCallStore().setUiState(value ? 'Preparing' : 'Connected');
	}

	get isActivePiPFromController(): boolean
	{
		return this.#isActivePiP;
	}

	set isActivePiPFromController(value: boolean): void
	{
		this.#isActivePiP = value;
	}

	get microphoneId(): string
	{
		return this.#getCallStore().currentMicrophoneId ?? '';
	}

	set microphoneId(id: string): void
	{
		this.#getCallStore().setDeviceIds({ microphoneId: id });
	}

	get container(): HTMLElement | null
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
			console.warn('[VueCallViewAdapter] userRegistry is deprecated. Use callStore.users instead.');
			this.#deprecationWarned.add('userRegistry');
		}

		return null;
	}

	get talkingService(): any
	{
		if (!this.#deprecationWarned.has('talkingService'))
		{
			console.warn('[VueCallViewAdapter] talkingService is deprecated. Use callStore.talkingQueue instead.');
			this.#deprecationWarned.add('talkingService');
		}

		return null;
	}

	isHidden(): boolean
	{
		return !this.#isVisible;
	}

	get renameSlider(): any
	{
		return {
			close: () => {
				this.#getCallStore().closeRenameSlider();
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

		this.#app.mount(this.#container);
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
		this.#app.destroy();
		this.#app = null;
		this.#isMounted = false;
		this.#isDestroyed = true;
		MediaStreamRegistry.clear();
		this.#eventEmitter.unsubscribeAll();
		this.#callbackWrappers = null;
	}

	// endregion

	// region New method

	/**
	 * Returns a specific HTML element of a button by querying data-attributes in the Vue DOM.
	 *
	 * @param {string} buttonId
	 * @param {string} elementType
	 * @returns {HTMLElement | null}
	 */
	getButtonElement(buttonId: string, elementType: string = 'root'): HTMLElement | null
	{
		if (!this.#container)
		{
			return null;
		}

		const escapedId = CSS.escape(buttonId);
		const escapedType = CSS.escape(elementType);

		return this.#container.querySelector(
			`[data-button-id="${escapedId}"][data-element-type="${escapedType}"]`,
		) ?? null;
	}

	// endregion

	// region Users

	addUser(userId: number, state?: string, direction?: string): void
	{
		this.#getCallStore().updateUser(userId, { state: state ?? 'Idle', direction: direction ?? null });
	}

	appendUsers(userStates: {[userId: string]: string}): void
	{
		const store = this.#getCallStore();

		Object.entries(userStates).forEach(([id, state]) =>
		{
			store.updateUser(parseInt(id, 10), { state });
		});
	}

	updateUserData(userData: {[userId: string]: any}): void
	{
		const store = this.#getCallStore();

		Object.entries(userData).forEach(([userId, data]) =>
		{
			const fields = {};

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

			store.updateUser(parseInt(userId, 10), fields);
		});
	}

	setLocalUserId(userId: number): void
	{
		this.#getCallStore().localUserId = userId;
	}

	setLocalUserDirection(direction: string): void
	{
		// store doesn't track local direction separately — no-op
	}

	setUserState(userId: number, newState: string): void
	{
		this.#getCallStore().setUserState(userId, newState);
	}

	setUserMicrophoneState(userId: number, isMicrophoneOn: boolean): void
	{
		this.#getCallStore().setUserMicrophoneState(userId, isMicrophoneOn);
	}

	setUserCameraState(userId: number, cameraState: boolean): void
	{
		this.#getCallStore().setUserCameraState(userId, cameraState);
	}

	setUserVideoPaused(userId: number, videoPaused: boolean): void
	{
		this.#getCallStore().setUserVideoPaused(userId, videoPaused);
	}

	setUserMedia(userId: number, kind: string, track: ?MediaStreamTrack): void
	{
		if (kind === 'audio' || kind === 'sharingAudio')
		{
			MediaStreamRegistry.setAudioTrack(userId, track ?? null);
		}
	}

	setUserConnectionQuality(userId: number, connectionQuality: any): void
	{
		this.#getCallStore().setUserConnectionQuality(userId, connectionQuality);
	}

	setUserFloorRequestState(userId: number, userFloorRequestState: boolean): void
	{
		this.#getCallStore().setUserFloorRequestState(userId, userFloorRequestState);
	}

	setUserTalking(userId: number, talking: boolean): void
	{
		this.#getCallStore().setUserTalking(userId, talking);
	}

	setUserPermissionToSpeakState(userId: number, permissionToSpeakState: boolean): void
	{
		this.#getCallStore().updateUser(userId, { permissionToSpeakState });
	}

	setAllUserPermissionToSpeakState(permissionToSpeakState: boolean): void
	{
		const store = this.#getCallStore();

		Object.keys(store.users).forEach((userId) =>
		{
			store.updateUser(parseInt(userId, 10), { permissionToSpeakState });
		});
	}

	setUserScreenState(userId: number, screenState: boolean): void
	{
		this.#getCallStore().updateUser(userId, { screenState });
	}

	setUserStats(userId: number, stats: any): void
	{
		// stub — stats not tracked in store
	}

	setUserDirection(userId: number, direction: string): void
	{
		this.#getCallStore().updateUser(userId, { direction });
	}

	removeScreenUsers(): void
	{
		// stub
	}

	getUserFloorRequestState(userId: number): boolean
	{
		return this.#getCallStore().users[userId]?.floorRequestState ?? false;
	}

	getUserTalking(userId: number): boolean
	{
		return this.#getCallStore().users[userId]?.talking ?? false;
	}

	getConnectedUserCount(withYou: boolean = false): number
	{
		const count = this.#getCallStore().connectedUsers.length;

		return withYou ? count + 1 : count;
	}

	pinUser(userId: number): void
	{
		this.#getCallStore().pinUser(userId);
	}

	unpinUser(): void
	{
		this.#getCallStore().unpinUser();
	}

	resetTalkingUsers(): void
	{
		const store = this.#getCallStore();

		Object.keys(store.users).forEach((userId) =>
		{
			store.setUserTalking(parseInt(userId, 10), false);
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
		this.#getCallStore().setButtonState(buttonName, { active: isActive });
	}

	setButtonCounter(buttonName: string, counter: number): void
	{
		this.#getCallStore().setButtonState(buttonName, { counter });
	}

	blockButtons(buttons: string[]): void
	{
		this.#getCallStore().blockButtons(buttons);
	}

	unblockButtons(buttons: string[]): void
	{
		this.#getCallStore().unblockButtons(buttons);
	}

	blockAddUser(): void
	{
		this.#getCallStore().blockButtons(['addUser']);
	}

	unblockAddUser(): void
	{
		this.#getCallStore().unblockButtons(['addUser']);
	}

	blockSwitchCamera(): void
	{
		this.#getCallStore().blockButtons(['camera']);
	}

	unblockSwitchCamera(): void
	{
		this.#getCallStore().unblockButtons(['camera']);
	}

	blockSwitchMicrophone(): void
	{
		this.#getCallStore().blockButtons(['microphone']);
	}

	unblockSwitchMicrophone(): void
	{
		this.#getCallStore().unblockButtons(['microphone']);
	}

	blockScreenSharing(): void
	{
		this.#getCallStore().blockButtons(['screen']);
	}

	blockHistoryButton(): void
	{
		this.#getCallStore().blockButtons(['history']);
	}

	disableMediaSelection(): void
	{
		this.#getCallStore().blockButtons(['microphone', 'camera', 'speaker']);
	}

	enableMediaSelection(): void
	{
		this.#getCallStore().unblockButtons(['microphone', 'camera', 'speaker']);
	}

	showButtons(buttons: string[]): void
	{
		this.#getCallStore().showButtons(buttons);
	}

	hideButtons(buttons: string[]): void
	{
		this.#getCallStore().hideButtons(buttons);
	}

	updateButtons(skippedElementsList?: string[]): void
	{
		// no-op: Vue reactivity handles button rendering automatically
	}

	isButtonBlocked(buttonName: string): boolean
	{
		return this.#getCallStore().isButtonBlocked(buttonName);
	}

	// endregion

	// region UI State

	setUiState(uiState: string): void
	{
		this.#getCallStore().setUiState(uiState);
	}

	setLayout(newLayout: string): void
	{
		this.#getCallStore().setLayout(newLayout);
	}

	setSize(size: string): void
	{
		this.#getCallStore().setSize(size);
	}

	setTitle(title: string): void
	{
		this.#getCallStore().setCallTitle(title);
	}

	setMaxWidth(maxWidth: number | null): void
	{
		this.#getCallStore().setMaxWidth(maxWidth);
	}

	removeMaxWidth(): void
	{
		this.#getCallStore().setMaxWidth(null);
	}

	setWindowFocusState(isActive: boolean): void
	{
		this.#getCallStore().setWindowFocus(isActive);
	}

	setRoomState(roomState: string): void
	{
		this.#getCallStore().setRoomState(roomState);
	}

	setHotKeyTemporaryBlock(isActive: boolean, force?: boolean): void
	{
		// no-op: hotkey management is not relevant to Vue rendering
	}

	toggleStatePictureInPictureCallWindow(isActive: boolean): void
	{
		// no-op: PiP window state managed externally
	}

	// endregion

	// region Media

	setLocalStream(streamData: {mediaRenderer?: any, stream?: MediaStream, flipVideo?: boolean}): void
	{
		const { stream = null, flipVideo = false } = streamData;
		const store = this.#getCallStore();

		if (!stream)
		{
			MediaStreamRegistry.removeLocalStream();
			store.setLocalMediaMetadata({ hasLocalVideo: false, hasLocalAudio: false });
			store.incrementLocalStreamVersion();

			return;
		}

		MediaStreamRegistry.setLocalStream(stream);
		store.setLocalMediaMetadata({
			hasLocalVideo: stream.getVideoTracks().length > 0,
			hasLocalAudio: stream.getAudioTracks().length > 0,
			flipLocalVideo: Boolean(flipVideo),
		});
		store.incrementLocalStreamVersion();
	}

	setLocalStreamVideoTrack(videoTrack: ?MediaStreamTrack): void
	{
		const stream = MediaStreamRegistry.getLocalStream();

		if (!stream)
		{
			return;
		}

		stream.getVideoTracks().forEach((track) =>
		{
			stream.removeTrack(track);
		});

		if (videoTrack)
		{
			stream.addTrack(videoTrack);
		}

		const store = this.#getCallStore();
		MediaStreamRegistry.setLocalStream(stream);
		store.setLocalMediaMetadata({ hasLocalVideo: Boolean(videoTrack) });
		store.incrementLocalStreamVersion();
	}

	flipLocalVideo(flipVideo: boolean): void
	{
		this.#getCallStore().setLocalMediaMetadata({ flipLocalVideo: flipVideo });
	}

	setMicrophoneId(microphoneId: string): void
	{
		this.#getCallStore().setDeviceIds({ microphoneId });
	}

	setSpeakerId(speakerId: string): void
	{
		this.#getCallStore().setDeviceIds({ speakerId });
	}

	setCameraId(cameraId: string): void
	{
		this.#getCallStore().setDeviceIds({ cameraId });
	}

	muteSpeaker(mute: boolean): void
	{
		this.#getCallStore().setMediaState({ isSpeakerMuted: mute });
	}

	releaseLocalMedia(): void
	{
		const store = this.#getCallStore();
		MediaStreamRegistry.removeLocalStream();
		store.setLocalMediaMetadata({ hasLocalVideo: false, hasLocalAudio: false });
		store.incrementLocalStreamVersion();
	}

	setVideoRenderer(userId: number, mediaRenderer: any): void
	{
		if (!mediaRenderer)
		{
			MediaStreamRegistry.removeRenderer(userId);

			return;
		}

		MediaStreamRegistry.setRenderer(userId, mediaRenderer);
		this.#getCallStore().incrementUserStreamVersion(userId);
	}

	releaseVideoRenderer(userId: number): void
	{
		MediaStreamRegistry.removeRenderer(userId);
		this.#getCallStore().incrementUserStreamVersion(userId);
	}

	setBadNetworkIndicator(userId: number, badNetworkIndicator: boolean): void
	{
		this.#getCallStore().updateUser(userId, { badNetworkIndicator });
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
		this.#getCallStore().setRecordState({
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

	// region Notifications & Popups

	showSelfTest(): void
	{
		// stub
	}

	showSecurityKeyError(): void
	{
		// stub
	}

	showFatalError(params: any): void
	{
		// stub
	}

	showCloudRecordPromo(isCloudRecordFeaturesEnabled: boolean, callId: number): void
	{
		// stub
	}

	showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled: boolean, callId: number): void
	{
		// stub
	}

	showCommonRecordMenuPopup(isDesktopRecord?: boolean): void
	{
		// stub
	}

	showCommonRecordStartModal(): void
	{
		// stub
	}

	showCommonRecordStartNotify(userId: number, state?: string): void
	{
		// stub
	}

	showCopilotErrorNotify(errorType: string): void
	{
		// stub
	}

	showCopilotNotify(callId?: number, errorCode?: string): void
	{
		// stub
	}

	showCopilotResultNotify(): void
	{
		// stub
	}

	closeCopilotNotify(): void
	{
		// stub
	}

	updateCopilotState(isActive: boolean): void
	{
		this.#getCallStore().setCopilotState(isActive);
	}

	updateCopilotFeatureState(isEnabled: boolean): void
	{
		this.#getCallStore().setCopilotFeaturesEnabled(isEnabled);
	}

	updateFloorRequestNotification(): void
	{
		// stub
	}

	// endregion

	// region Modals

	showConfirmModal(params: any): Promise<string>
	{
		return Promise.resolve('cancel');
	}

	// endregion

	// region Events

	subscribe(eventName: string, listener: Function): any
	{
		this.#eventEmitter.subscribe(eventName, listener);
	}

	unsubscribe(eventName: string, listener: Function): any
	{
		this.#eventEmitter.unsubscribe(eventName, listener);
	}

	/**
	 * Wraps handler to receive unwrapped event.data, matching legacy View behavior.
	 * The wrapper is stored keyed by [eventName][originalHandler] for future unsubscription.
	 *
	 * @param {string} name
	 * @param {Function} cb
	 */
	setCallback(name: string, cb: Function): void
	{
		const wrapper = (event) => cb(event.data);

		if (!this.#callbackWrappers.has(name))
		{
			this.#callbackWrappers.set(name, new Map());
		}

		this.#callbackWrappers.get(name).set(cb, wrapper);
		this.#eventEmitter.subscribe(name, wrapper);
	}

	/**
	 * Removes a previously set callback by retrieving its wrapper from #callbackWrappers.
	 *
	 * @param {string} name
	 * @param {Function} cb
	 */
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
			this.#eventEmitter.unsubscribe(name, wrapper);
			nameMap.delete(cb);
		}
	}

	// endregion
}
