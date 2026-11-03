import { Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu } from 'main.popup';

import Util from '../util';
import { STREAM_MANAGER_SUPERSEDED } from '../media-stream-manager';
import { AuthoritativeUserNameService } from './authoritative-user-name-service';

/**
 * Manages call window layout: fold/unfold, fullscreen, detached mode, chat visibility, and window focus.
 */
export class LayoutService extends EventEmitter
{
	#pendingTalkingUsers = new Set();
	#authoritativeUserNameService = new AuthoritativeUserNameService();

	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} config.container
	 * @param {*} config.resizeObserver
	 */
	constructor({ viewPort, container, resizeObserver })
	{
		super();
		this.setEventNamespace('BX.Call.LayoutService');

		this.viewPort = viewPort;
		this.container = container;
		this.resizeObserver = resizeObserver;

		this.folded = false;
		this.detached = false;
		this.isWindowFocus = true;

		this.roomMenu = null;
		this.roomListMenu = null;
		this.webScreenSharePopup = null;
	}

	/**
	 * Returns user model from userRegistry.
	 *
	 * @param {number|string} userId
	 * @returns {{ name: string, avatar: string } | null}
	 */
	#getUserModel(userId)
	{
		return this.viewPort.userRegistry?.get(userId) ?? null;
	}

	/**
	 * Folds the call window to a minimized state.
	 *
	 * @param {string} title
	 */
	fold(title)
	{
		if (this.folded)
		{
			return;
		}

		this.folded = true;
		this.resizeObserver.unobserve(this.container);

		// Asked while the window is still rendered: once it is hidden, a focus of its own is
		// indistinguishable from a focus lost for any other reason.
		const focusWasOurs = this.viewPort.releaseFocusBeforeHide();

		this.container.classList.add('bx-messenger-call-overlay-folded');

		// Only now does the focus history skip the hidden window and resolve outside it (ALG-02).
		if (focusWasOurs)
		{
			this.viewPort.restoreFocusAfterHide();
		}

		this.viewPort.setTitle(title);
		this.viewPort.setSize('folded');

		this.emit('LayoutService::onFold');
	}

	/**
	 * Restores the call window from the folded state.
	 *
	 * @param {object} options
	 * @param {boolean} [options.fromPiP]
	 * @param {boolean} [options.isReturnGesture] the caller is an explicit "return to call" control,
	 *        not a side effect of an action taken inside the call window
	 */
	unfold(options = {})
	{
		const { fromPiP = false, isReturnGesture = false } = options;

		if (this.detached)
		{
			this.container.style.removeProperty('width');
			this.viewPort.show();
			this.detached = false;
			this.emit('LayoutService::onUnfoldDetached', { isReturnGesture });
		}

		if (this.folded)
		{
			this.folded = false;

			this.container.classList.remove('bx-messenger-call-overlay-folded');

			this.viewPort.setSize('full');
			this.emit('LayoutService::onUnfold', { fromPiP, isReturnGesture });
		}

		this.emit('LayoutService::onUnfoldComplete');
	}

	/**
	 * Reveals the chat panel inside the call window.
	 */
	showChat()
	{
		this.emit('LayoutService::onShowChat');
	}

	/**
	 * Switches the call window to detached (floating) mode.
	 *
	 * @param {string} callName
	 * @param {string|number} callId
	 * @param {Array} activeUsers
	 */
	setDetached(callName, callId, activeUsers)
	{
		this.detached = true;
		this.viewPort.hide();
		this.container.style.width = '0';
		this.callName = callName;
		this.callId = callId;
		this.activeUsers = activeUsers;
	}

	/**
	 * Returns whether the call window is currently in fullscreen mode.
	 *
	 * @returns {boolean}
	 */
	isFullScreen()
	{
		if ('webkitFullscreenElement' in document)
		{
			return Boolean(document.webkitFullscreenElement);
		}

		if ('fullscreenElement' in document)
		{
			return Boolean(document.fullscreenElement);
		}

		return false;
	}

	/**
	 * Returns whether the call window is currently folded.
	 *
	 * @returns {boolean}
	 */
	get isFolded()
	{
		return this.folded;
	}

	/**
	 * Returns whether the call window is currently in detached mode.
	 *
	 * @returns {boolean}
	 */
	get isDetached()
	{
		return this.detached;
	}

	/**
	 * Toggles the fullscreen state of the call window.
	 */
	toggleFullScreen()
	{
		this.isFullScreen() ? this.exitFullScreen() : this.enterFullScreen();
	}

	/**
	 * Enters fullscreen mode for the call window.
	 */
	enterFullScreen()
	{
		if (this.container.requestFullscreen)
		{
			this.container.requestFullscreen().catch(() => {});
		}
		else if (this.container.webkitRequestFullscreen)
		{
			this.container.webkitRequestFullscreen().catch(() => {});
		}
	}

	/**
	 * Exits fullscreen mode for the call window.
	 */
	exitFullScreen()
	{
		if (document.exitFullscreen)
		{
			document.exitFullscreen().catch(() => {});
		}
		else if (document.webkitExitFullscreen)
		{
			document.webkitExitFullscreen().catch(() => {});
		}
	}

	/**
	 * Updates the call window appearance based on browser window focus state.
	 *
	 * @param {boolean} isActive
	 */
	updateWindowFocusState(isActive)
	{
		this.isWindowFocus = isActive;
		this.viewPort.setWindowFocusState(isActive);
	}

	/**
	 * Sets call window size and syncs to Pinia store.
	 *
	 * @param {string} size
	 */
	setSize(size)
	{
		this.viewPort.setSize(size);
	}

	/**
	 * Sets max width of call window and syncs to Pinia store.
	 *
	 * @param {number|null} maxWidth
	 */
	setMaxWidth(maxWidth)
	{
		this.viewPort.setMaxWidth(maxWidth);
	}

	/**
	 * Opens or closes the current room speaker menu.
	 *
	 * @param {HTMLElement} bindElement
	 * @param {object} currentCall
	 */
	toggleRoomMenu(bindElement, currentCall)
	{
		if (this.roomMenu)
		{
			this.roomMenu.destroy();

			return;
		}

		const roomSpeaker = currentCall.currentRoom().speaker;
		const speakerModel = this.#getUserModel(roomSpeaker);

		if (!speakerModel)
		{
			return;
		}

		const avatarText = speakerModel.avatar
			? ''
			: BX.Utils.text.getFirstLetters(speakerModel.name).toUpperCase()
		;

		this.roomMenu = new Menu({
			targetContainer: this.container,
			bindElement,
			items: [
				{ text: BX.message('IM_CALL_SOUND_PLAYS_VIA'), disabled: true },
				{ html: `<div class="bx-messenger-videocall-room-menu-avatar" style="--avatar: url('${Text.encode(speakerModel.avatar)}')">${avatarText}</div>${Text.encode(speakerModel.name)}` },
				{ delimiter: true },
				{
					text: BX.message('IM_CALL_LEAVE_ROOM'),
					onclick: () => {
						currentCall.leaveCurrentRoom();
						this.roomMenu.close();
					},
				},
				{ delimiter: true },
				{
					text: BX.message('IM_CALL_HELP'),
					onclick: () => {
						this.showRoomHelp();
						this.roomMenu.close();
					},
				},
			],
			events: {
				onDestroy: () => this.roomMenu = null,
			},
		});
		this.roomMenu.show();
	}

	/**
	 * Opens or closes the room list selection menu.
	 *
	 * @param {HTMLElement} bindElement
	 * @param {object} currentCall
	 */
	toggleRoomListMenu(bindElement, currentCall)
	{
		if (this.roomListMenu)
		{
			this.roomListMenu.destroy();

			return;
		}

		if (!currentCall?.listRooms)
		{
			return;
		}

		currentCall.listRooms().then((roomList) => {
			this.roomListMenu = new BX.PopupMenuWindow({
				className: 'bx-call-context-menu-options-container',
				background: '#00428F',
				contentBackground: '#00428F',
				darkMode: true,
				contentBorderRadius: '6px',
				borderRadius: '6px',
				targetContainer: this.container,
				bindElement,
				items: this.prepareRoomListMenuItems(roomList, currentCall),
				events: {
					onDestroy: () => this.roomListMenu = null,
				},
			});
			this.roomListMenu.show();
		});
	}

	/**
	 * Builds the menu item list for the room selection menu.
	 *
	 * @param {Array} roomList
	 * @param {object} currentCall
	 * @returns {Array}
	 */
	prepareRoomListMenuItems(roomList, currentCall)
	{
		let menuItems = [
			{ text: BX.message('IM_CALL_JOIN_ROOM'), disabled: true },
			{ delimiter: true },
		];

		menuItems = menuItems.concat(...roomList.map((room) => {
			return {
				text: this.getRoomDescription(room),
				onclick: () => {
					if (currentCall && currentCall.joinRoom)
					{
						currentCall.joinRoom(room.id);
					}
					this.roomListMenu.destroy();
				},
			};
		}));

		menuItems.push({ delimiter: true });
		menuItems.push({
			text: BX.message('IM_CALL_HELP'),
			onclick: () => {
				this.showRoomHelp();
				this.roomListMenu.close();
			},
		});

		return menuItems;
	}

	/**
	 * Shows a help dialog about rooms.
	 */
	showRoomHelp()
	{
		BX.loadExt('ui.dialogs.messagebox').then(() => {
			BX.UI.Dialogs.MessageBox.alert(
				BX.message('IM_CALL_HELP_TEXT'),
				BX.message('IM_CALL_HELP'),
			);
		});
	}

	/**
	 * Returns a human-readable description of the given room.
	 *
	 * @param {object} roomFields
	 * @returns {string}
	 */
	getRoomDescription(roomFields)
	{
		const userNames = roomFields.userList.map((userId) => {
			const userModel = this.#getUserModel(userId);

			return userModel?.name || '';
		});

		let result = BX.message('IM_CALL_ROOM_DESCRIPTION');
		result = result.replace('#ROOM_ID#', roomFields.id);
		result = result.replace('#PARTICIPANTS_LIST#', userNames.join(', '));

		return result;
	}

	/**
	 * Shows the web screen share popup anchored to the screen-share button.
	 *
	 * @param {object} WebScreenSharePopupClass - constructor to create the popup
	 * @param {HTMLElement} bindElement - element to anchor the popup to (screen-share button root)
	 * @param {Function} onStopSharingClick - callback when user stops sharing
	 * @param {HTMLElement|null} [targetContainer] - override target container (defaults to viewPort.container)
	 */
	showWebScreenSharePopup(WebScreenSharePopupClass, bindElement, onStopSharingClick, targetContainer = null)
	{
		if (this.webScreenSharePopup)
		{
			this.webScreenSharePopup.show();

			return;
		}

		if (!bindElement)
		{
			return;
		}

		this.webScreenSharePopup = new WebScreenSharePopupClass({
			bindElement,
			targetContainer: targetContainer ?? this.viewPort.container,
			onClose: () => {
				this.webScreenSharePopup?.destroy();
				this.webScreenSharePopup = null;
			},
			onStopSharingClick: () => {
				onStopSharingClick();
				this.webScreenSharePopup?.destroy();
				this.webScreenSharePopup = null;
			},
		});
		this.webScreenSharePopup.show();
	}

	/**
	 * Closes the web screen share popup if open.
	 */
	closeWebScreenSharePopup()
	{
		if (this.webScreenSharePopup)
		{
			this.webScreenSharePopup.close();
			this.webScreenSharePopup = null;
		}
	}

	/**
	 * Handles a user media event (local or remote stream).
	 *
	 * @param {object} event
	 */
	handleMediaEvent(event)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (event.local)
		{
			this.viewPort.setLocalStream(event);
			if (event.tag === 'main' || event.mediaRenderer)
			{
				this.viewPort.flipLocalVideo(BX.prop.getBoolean(event, 'flipVideo', false));
			}
		}
		else
		{
			if (event.stopped)
			{
				if ('mediaRenderer' in event)
				{
					if (event.kind === 'video' || event.kind === 'sharing')
					{
						event.mediaRenderer.stream = null;
						this.viewPort.setVideoRenderer(event.userId, event.mediaRenderer);
					}
				}
				else
				{
					this.viewPort.setUserMedia(event.userId, event.kind, null);
				}

				return;
			}

			if ('track' in event)
			{
				this.viewPort.setUserMedia(event.userId, event.kind, event.track);
			}
			else if ('mediaRenderer' in event)
			{
				const { mediaRenderer } = event;
				const kind = mediaRenderer.kind;
				const stream = mediaRenderer.stream;

				if ((kind === 'audio' || kind === 'sharingAudio') && stream)
				{
					this.viewPort.setUserMedia(event.userId, kind, stream.getAudioTracks()[0]);
				}
				else if ((kind === 'video' || kind === 'sharing') && stream)
				{
					this.viewPort.setVideoRenderer(event.userId, mediaRenderer);
				}
			}
		}
	}

	/**
	 * Handles screen state event.
	 *
	 * @param {object} event
	 * @param {object} currentCall
	 */
	handleScreenStateEvent(event, currentCall)
	{
		if (this.viewPort)
		{
			this.viewPort.setUserScreenState(event.userId, event.screenState);
		}

		if (event.userId == BX.Call.Engine.getCurrentUserId())
		{
			this.viewPort?.setButtonActive('screen', event.screenState);

			if (event.screenState)
			{
				if (!Util.isDesktop())
				{
					this.emit('LayoutService::onShowWebScreenSharePopup');
				}
			}
			else
			{
				this.emit('LayoutService::onHideScreenShare');
				this.closeWebScreenSharePopup();
			}

			if (currentCall && currentCall.provider === 'Plain')
			{
				this.emit('LayoutService::onTogglePiP');
			}

			this.viewPort?.updateButtons();
		}
	}

	/**
	 * Handles various user-related engine events.
	 *
	 * @param {string} eventName
	 * @param {object} event
	 */
	handleUserEvent(eventName, event)
	{
		if (!this.viewPort)
		{
			return;
		}

		switch (eventName)
		{
			case 'onUserMicrophoneState':
				this.viewPort.setUserMicrophoneState(event.userId, event.microphoneState);
				if (!event.microphoneState)
				{
					this.viewPort.setUserTalking(event.userId, false);
					this.#pendingTalkingUsers.delete(event.userId);
				}
				else if (this.#pendingTalkingUsers.has(event.userId))
				{
					this.#pendingTalkingUsers.delete(event.userId);
					this.viewPort.setUserTalking(event.userId, true);
				}

				break;
			case 'onUserCameraState':
				this.viewPort.setUserCameraState(event.userId, event.cameraState);
				break;
			case 'onUserVideoPaused':
				this.viewPort.setUserVideoPaused(event.userId, event.videoPaused);
				break;
			case 'onBadNetworkIndicator':
				this.viewPort.setBadNetworkIndicator(event.userId, event.badNetworkIndicator);
				break;
			case 'onConnectionQualityChanged':
				this.viewPort.setUserConnectionQuality(event.userId, event.score);
				break;
			case 'onUserVoiceStarted':
			{
				const userModel = this.#getUserModel(event.userId);
				const isMicrophoneOff = !event.local && userModel && !userModel.microphoneState;
				if (isMicrophoneOff)
				{
					this.#pendingTalkingUsers.add(event.userId);
				}
				else
				{
					this.viewPort.setUserTalking(event.userId, true);
				}
				break;
			}
			case 'onUserVoiceStopped':
				this.#pendingTalkingUsers.delete(event.userId);
				this.viewPort.setUserTalking(event.userId, false);
				break;
			case 'onUserFloorRequest':
				this.viewPort.setUserFloorRequestState(event.userId, event.floorRequestState ?? event.requestActive);
				break;
			case 'onMicrophoneLevel':
				this.viewPort.setMicrophoneLevel(event.level);
				break;
			case 'onTrackSubscriptionFailed':
				this.viewPort.setTrackSubscriptionFailed(event);
				break;
			case 'onUserLeft':
				this.#pendingTalkingUsers.delete(event.userId);
				break;
			default:
				break;
		}
	}

	/**
	 * Prepares local stream and updates viewPort.
	 *
	 * @param {object} params
	 * @returns {Promise<MediaStream>}
	 */
	prepareLocalStream({
		provider, fallback = false, Hardware, CallStreamManager, UnsupportedBrowserFeatures, MediaRenderer,
	})
	{
		const video = {};

		if (Hardware.defaultCamera)
		{
			video.deviceId = { exact: Hardware.defaultCamera };
		}

		if (!fallback)
		{
			video.width = { ideal: 1280 };
			video.height = { ideal: 720 };
		}

		const isNotSupportDevicesListBeforeStream = UnsupportedBrowserFeatures.isNotSupportDevicesListBeforeStream;
		const constraints = { audio: isNotSupportDevicesListBeforeStream, video };

		return CallStreamManager.getUserMedia(constraints).then((stream) => {
			this.localStream = stream;

			if (this.viewPort)
			{
				this.setLocalStream(provider, MediaRenderer, Hardware);
			}

			return stream;
		}).catch((error) => {
			if (error?.name === STREAM_MANAGER_SUPERSEDED)
			{
				// Superseded by a newer device selection - not a media failure. Don't retry with fallback
				// constraints; that capture would register after the newest request and unseat the selected
				// device. Rethrow: callers already handle a prepareLocalStream rejection.
				throw error;
			}

			if (!fallback)
			{
				return this.prepareLocalStream({
					provider, fallback: true, Hardware, CallStreamManager, UnsupportedBrowserFeatures, MediaRenderer,
				});
			}
			throw error;
		});
	}

	/**
	 * Sets local stream to viewPort.
	 *
	 * @param {string} provider
	 * @param {object} MediaRenderer
	 * @param {object} Hardware
	 */
	setLocalStream(provider, MediaRenderer, Hardware)
	{
		if (!this.localStream || !this.viewPort)
		{
			return;
		}

		const isLegacyCall = Util.isLegacyCall(provider);
		const streamData = {
			stream: this.localStream,
			tag: 'main',
			flipVideo: Hardware.enableMirroring,
		};

		if (provider !== 'Plain' || !isLegacyCall)
		{
			const mediaRenderer = new MediaRenderer({
				track: this.localStream.getVideoTracks()[0],
				kind: 'video',
			});
			streamData.mediaRenderer = mediaRenderer;
			streamData.stream = mediaRenderer.stream;
		}

		this.viewPort.setLocalStream(streamData);
	}

	/**
	 * Stops local media stream.
	 */
	stopLocalStream()
	{
		if (this.localStream)
		{
			Util.stopMediaStream(this.localStream);
			this.localStream = null;
		}
	}

	/**
	 * Handles user joined/invited events.
	 *
	 * @param {string} eventName
	 * @param {object} event
	 * @param {object} currentCall
	 */
	handleUserJoinEvent(eventName, event, currentCall)
	{
		if (!this.viewPort)
		{
			return event?.userData ?? {};
		}

		if (eventName === 'onUserInvited')
		{
			const userData = this.#resolveUserData(currentCall, event.userData, [event.userId]);

			if (Util.isLegacyCall(currentCall.provider, currentCall.scheme))
			{
				this.emit('LayoutService::onUpdateCallViewUsers', { callId: currentCall.id, users: [event.userId] });
			}
			else
			{
				Util.setUserData(userData);
				this.viewPort.updateUserData(userData);
				this.#fetchAuthoritativeUserData(currentCall, [event.userId]);
			}
			this.viewPort.addUser(event.userId);

			return userData;
		}
		else if (eventName === 'onUserJoined')
		{
			const userData = this.#resolveUserData(currentCall, event.userData, [event.userId]);
			Util.setUserData(userData);
			this.viewPort.updateUserData(userData);
			this.viewPort.addUser(event.userId, BX.Call.UserState.Connected);
			this.#fetchAuthoritativeUserData(currentCall, [event.userId]);

			return userData;
		}

		return event?.userData ?? {};
	}

	updateUsers(currentCall, userData, userIds, options = {})
	{
		const resolvedUserData = this.#resolveUserData(
			currentCall,
			userData,
			userIds,
			options.getCurrentName,
		);

		if (Object.keys(resolvedUserData).length > 0)
		{
			Util.setUserData(resolvedUserData);
			this.viewPort?.updateUserData(resolvedUserData);
		}

		if (options.fetch !== false)
		{
			this.refreshUsers(currentCall, userIds, { force: options.forceFetch === true });
		}

		return resolvedUserData;
	}

	refreshUsers(currentCall, userIds, options = {})
	{
		this.#fetchAuthoritativeUserData(currentCall, userIds, options);
	}

	setAuthoritativeUserName(userId, name)
	{
		this.#authoritativeUserNameService.setAuthoritativeUserName(userId, name);
	}

	#resolveUserData(currentCall, userData, userIds, getCurrentName = null)
	{
		return this.#authoritativeUserNameService.resolveUserData(
			currentCall,
			userData,
			userIds,
			getCurrentName ?? ((userId) => this.#getUserModel(userId)?.name),
		);
	}

	#fetchAuthoritativeUserData(currentCall, userIds, options = {})
	{
		if (!currentCall)
		{
			return;
		}

		this.#authoritativeUserNameService.fetchUserData(currentCall, userIds, options).then((userData) => {
			if (!this.viewPort || Object.keys(userData).length === 0)
			{
				return;
			}

			Util.setUserData(userData);
			this.viewPort.updateUserData(userData);
		});
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.#pendingTalkingUsers.clear();
		this.#authoritativeUserNameService.reset();

		if (this.roomMenu)
		{
			this.roomMenu.destroy();
			this.roomMenu = null;
		}

		if (this.roomListMenu)
		{
			this.roomListMenu.destroy();
			this.roomListMenu = null;
		}

		this.closeWebScreenSharePopup();

		this.viewPort = null;
		this.container = null;
		this.resizeObserver = null;
	}
}
