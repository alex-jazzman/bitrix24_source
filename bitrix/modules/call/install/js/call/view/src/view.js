import 'main.polyfill.intersectionobserver';

import { Browser, Dom, Event, Runtime, Text, Type, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';

import { DesktopApi } from 'im.v2.lib.desktop-api';
import { PromoManager } from 'im.v2.lib.promo';

import { Clipboard } from 'call.adapter.clipboard';
import {
	BackgroundDialog,
	Hardware,
	UserState,
	Util,
	CallAI,
	CopilotNotify,
	CopilotNotifyType,
	MediaRenderer,
	UnsupportedBrowserFeatures,
	CallCommonRecordState,
	CallCloudRecord,
} from 'call.core';
import { PipCoordinator } from 'call.feature.pip';
import { WindowFocusScope } from 'call.lib.a11y';
import { PushToTalkCoordinator } from 'call.lib.push-to-talk';
import { CallWindowNameType } from 'call.lib.view-contract';
import {
	ViewEvent,
	ViewLayout,
	ViewUiState,
	ViewSize,
	ViewRoomState,
} from 'call.mapping';

import { AhaMomentNotify } from './aha-moment-notify';
import * as Buttons from './buttons';
import { isBottomCenterMenuVisible } from './buttons/helpers/bottom-center-menu';
import { getMicrophoneSideIcon } from './buttons/helpers/microphone-side-icon';
import { CallPopupQueue } from './call-popup-queue';
import { CallUser } from './call-user';
import { ConfirmModal } from './confirm-modal';
import { DeviceSelector } from './device-selector';
import { FloorRequest } from './floor-request';
import { CallUserMobile, MobileMenu, MobileSlider, UserSelectorMobile } from './mobile';
import { NotificationManager } from './notifications';
import { PictureInPictureWindow } from './picture-in-picture-window';
import { CloudRecordInfoPopup, CloudRecordInfoPopupSource } from './record/cloud-record-info-popup';
import { CommonRecordMenuPopup } from './record/common-record-menu-popup';
import { createDefaultCommonRecordState } from './record/common-record-state';
import { TalkingService } from './talking-service';
import { checkAndEncodeURI, EXPECTED_EMPTIED, EXPECTED_VOLUME_CHANGE, setVolume } from './tools';
import { shouldShowLocalUser } from './user/local-user-visibility';
import { getNewUserDirection } from './user/new-user-direction';
import { UserOrderingState } from './user/ordering/user-ordering-state';
import { isSameUser } from './user/same-user';
import { UserModel, UserRegistry } from './user/user-registry';

// the mode marks the element whose activation a hold took; what that mark hides is declared here
import './css/push-to-talk.css';
import './css/view.css';

const Layouts = ViewLayout;
const UiState = ViewUiState;
const Size = ViewSize;
const RoomState = ViewRoomState;
const EventName = ViewEvent;

const ARIA_KEY_BY_CALL_TYPE = {
	[CallWindowNameType.Private]: 'CALL_VIEW_WINDOW_ARIA_PRIVATE',
	[CallWindowNameType.Group]: 'CALL_VIEW_WINDOW_ARIA_GROUP',
	[CallWindowNameType.Conference]: 'CALL_VIEW_WINDOW_ARIA_CONFERENCE',
};

const RerenderReason = {
	VideoEnabled: 'videoEnabled',
	VideoDisabled: 'videoDisabled',
	UserDisconnected: 'userDisconnected',
};

const SwapType = {
	Direct: 'direct',
	Replace: 'replace',
};

const AUDIO_ELEMENT_EVENTS = ['pause', 'play', 'volumechange', 'emptied'];

const beginingPosition = -1;
const newUserPosition = 999;
const addButtonPosition = 1001;

const MIN_WIDTH = 250;

const SIDE_USER_WIDTH = 160; // keep in sync with .bx-messenger-videocall-user-block .bx-messenger-videocall-user width
const SIDE_USER_HEIGHT = 90; // keep in sync with .bx-messenger-videocall-user height

const MAX_USERS_PER_PAGE = 19;
const MIN_GRID_USER_WIDTH = 180;
const MIN_GRID_USER_HEIGHT = 100;

const CHANGE_VIDEO_RERENDER_DELAY = 3000;
const WAITING_VIDEO_DELAY = 3000;

const CALLCONTROL_PROMO_ID = 'call:callcontrol-notify-promo:07052025:all';
const CLOUD_RECORD_PROMO_ID = 'call:cloud-record-info-popup:09092025:all';

// source of a microphone command; the hold policy names its own, an absent field reads as this one
const MICROPHONE_SOURCE_BUTTON = 'mic_button';

// the microphone change caused by a command confirms it. A command the controller drops (no
// microphone, no room speaker) and a command that changed nothing get no confirmation at all,
// so the memory of it has to expire on its own.
const MICROPHONE_COMMAND_CONFIRM_TIMEOUT = 1000;

const BrowserClock = {
	now: () => Date.now(),
	after: (ms, callback) => setTimeout(callback, ms),
	cancel: (timerId) => clearTimeout(timerId),
};

// Closing alone is not enough: the layer owns the ARIA of the trigger and puts the snapshot back on
// destroy only. close() comes first, it is what keeps the onDone chain of the promo queue intact.
export function closeCommonRecordPopupLayer(layer)
{
	layer?.close();
	layer?.destroy?.();

	return null;
}

/**
 * @typedef {object} ViewUserData
 * @property {string} [name]
 * @property {string} [avatar]
 * @property {string} [avatar_hr] - preferred over avatar when both are given
 * @property {string} [gender] - 'M' or 'F', anything else is read as 'M'
 */

/**
 * @typedef {object} ViewOptions
 * @property {?string} title
 * @property {HTMLElement} container
 * @property {number} baseZIndex
 * @property {string} cameraId
 * @property {string} microphoneId
 * @property {boolean} [externalSpeakerManagement]
 * @property {boolean} showChatButtons
 * @property {boolean} showUsersButton
 * @property {boolean} showShareButton
 * @property {boolean} showRecordButton
 * @property {boolean} showDocumentButton
 * @property {boolean} [showCopilotButton]
 * @property {boolean} showButtonPanel
 * @property {boolean} broadcastingMode
 * @property {number[]} broadcastingPresenters
 * @property {string} language
 * @property {Object<string, ViewUserData>} userData - keyed by user id
 * @property {number} userLimit
 * @property {boolean} isIntranetOrExtranet
 * @property {boolean} mediaSelectionBlocked
 * @property {string[]} blockedButtons
 * @property {string[]} hiddenButtons
 * @property {string[]} hiddenTopButtons
 * @property {string} uiState
 * @property {string} layout
 * @property {Object<string, string>} userStates - UserState keyed by user id
 * @property {string} [localUserState] - initial UserState of the local user
 * @property {boolean} [showAddUserButtonInList]
 * @property {boolean} isCopilotFeaturesEnabled
 * @property {boolean} isCopilotActive
 * @property {boolean} [isWindowFocus]
 * @property {boolean} isVideoconf
 * @property {function(): ?object} [getCurrentCall]
 * @property {?HTMLElement} [focusOpener]
 */

export class View
{
	centralUser;
	callMenu;
	participantsMenu;
	pinnedUser;
	userMenu;
	userId;
	userRegistry;
	users;
	screenUsers;

	#commonRecord;
	#confirmModal;
	#callPopupQueue;

	#onFullScreenChangeHandler;
	#onResizeHandler;
	#onOrientationChangeHandler;
	#onKeyDownHandler;

	#onAddUser;
	#onUserStateUpdated;

	#isPreparing;
	#isActivePiPFromController;

	#guestLink = null;
	#pendingMicrophoneCommand = null;
	// The record state the layers on screen were drawn for. Only setCommonRecordState moves it: the
	// record menu edits commonRecordState in place while it waits for the server, so that object
	// alone no longer tells which state the layers were built for.
	#appliedRecordState = null;

	/**
	 * @param {ViewOptions} config
	 */
	constructor(config)
	{
		this.destroyed = false;
		this.title = config.title;
		this.container = config.container;
		this.baseZIndex = config.baseZIndex;
		this.cameraId = config.cameraId;
		this.microphoneId = config.microphoneId;
		this.getCurrentCall = Type.isFunction(config.getCurrentCall) ? config.getCurrentCall : null;

		this.speakerId = '';
		this.speakerMuted = false;
		this.#applyDisplayConfig(config);

		this.limitation = null;
		this.activeUsers = new Set();
		this.rerenderTimeout = null;
		this.waitingForUserMediaTimeouts = new Map();
		this.rerenderQueue = new Map();
		this.cameraTrackWatchers = new Map();
		this.audioElementWatchers = new Map();

		this.broadcastingMode = config.broadcastingMode === true;
		this.broadcastingPresenters = Type.isArray(config.broadcastingPresenters) ? config.broadcastingPresenters : [];

		this.currentPage = 1;
		this.pagesCount = 1;

		this.usersPerPage = 0; // initializes after rendering and on resize

		this.language = config.language || '';

		this.lastPosition = 1;

		const localUserModel = this.#initUsers(config);

		this.cache = new Map();

		this.#initLocalUser(localUserModel);

		this.centralUser = this.localUser; // show local user until someone is connected
		this.centralUserMobile = null;
		this.pinnedUser = null;
		this.presenterId = null;

		this.returnToGridAfterScreenStopped = false;

		this.mediaSelectionBlocked = (config.mediaSelectionBlocked === true);

		this.visible = false;
		this.#initElementRefs();

		this.previousTopButtonList = [];
		this.needToRerenderTopButtonList = false;
		this.previousButtonList = [];
		this.needToRerenderButtonList = false;

		this.size = Size.Full;
		this.maxWidth = null;
		this.isMuted = Hardware.isMicrophoneMuted;
		this.isCameraOn = Hardware.isCameraOn;
		this.isFullScreen = false;
		this.isUserBlockFolded = false;

		this.#resetCommonRecordState();

		this.#initButtonRestrictions(config);

		this.uiState = config.uiState || UiState.Calling;
		this.layout = config.layout || Layouts.Centered;
		this.whiteSpaceInUserGrid = 0;
		this.roomState = RoomState.None;

		this.eventEmitter = new EventEmitter(this, 'BX.Call.View');

		this.#initEventHandlers();

		this.resizeObserver = new BX.ResizeObserver(this.#onResizeHandler);
		this.intersectionObserver = null;

		// timers
		this.switchPresenterTimeout = 0;

		this.accessibleName = '';

		this.focusScope = new WindowFocusScope();
		this.focusScope.captureOpener(config.focusOpener ?? null);

		this.deviceSelector = null;
		this.deviceSelectorInitiator = null;
		this.userSelector = null;

		this.renameSlider = null;

		this.userSize = { width: 0, height: 0 };

		this.#initHotKeys();

		this.#isPreparing = false;

		this.isWindowFocus = config.isWindowFocus || false;
		this.#isActivePiPFromController = false;

		this.#initPipCoordinator();
		this.#initPushToTalkCoordinator();

		this.init();
		this.subscribeEvents(config);
		if (Type.isPlainObject(config.userStates))
		{
			this.appendUsers(config.userStates);
		}

		this.hideEarTimer = null;

		this.isCopilotFeaturesEnabled = config.isCopilotFeaturesEnabled || false;
		this.isCopilotActive = config.isCopilotActive || false;
		this.copilotNotify = null;

		this.pictureInPictureCallWindow = null;

		this.floorRequestNotifications = [];
		this.currentPiPUserId = null;

		this.isVideoconf = config.isVideoconf || false;

		this.needToShowCallcontrolPromo = this.isVideoconf
			? false
			: PromoManager.getInstance().needToShow(CALLCONTROL_PROMO_ID);

		this.#commonRecord = {
			infoPopup: null,
			menuPopup: null,
			notify: null,
		};

		this.#confirmModal = null;
		this.#callPopupQueue = new CallPopupQueue();
	}

	#applyDisplayConfig(config)
	{
		this.externalSpeakerManagement = (config.externalSpeakerManagement === true);
		this.showChatButtons = (config.showChatButtons === true);
		this.showUsersButton = (config.showUsersButton === true);
		this.showShareButton = (config.showShareButton !== false);
		this.showRecordButton = (config.showRecordButton !== false);
		this.showDocumentButton = (config.showDocumentButton !== false);
		this.showCopilotButton = (config.showCopilotButton !== false);
		this.showButtonPanel = (config.showButtonPanel !== false);
		this.showAddUserButtonInList = config.showAddUserButtonInList || false;
		this.preferInitialWindowPlacementPictureInPicture = true;
	}

	#initUsers(config)
	{
		this.userData = {};
		if (config.userData)
		{
			this.updateUserData(config.userData);
		}
		this.userLimit = config.userLimit || 1;
		this.userId = Loc.getMessage('USER_ID');
		this.isIntranetOrExtranet = config.isIntranetOrExtranet !== false;
		this.users = {}; // Call participants. The key is the user id.
		this.screenUsers = {}; // Screen sharing participants. The key is the user id.
		this.userRegistry = new UserRegistry();
		this.talkingService = new TalkingService();

		this.userRegistry.subscribe('changed', this.talkingService.refreshQueue);

		const localUserModel = new UserModel({
			id: this.userId,
			state: Type.isString(config.localUserState) ? config.localUserState : UserState.Connected,
			localUser: true,
			order: beginingPosition,
			name: this.userData[this.userId] ? this.userData[this.userId].name : '',
			avatar: this.userData[this.userId] ? this.userData[this.userId].avatar_hr : '',
		});

		if (this.userId)
		{
			this.userRegistry.push(localUserModel);
		}

		return localUserModel;
	}

	#initLocalUser(localUserModel)
	{
		this.localUser = new CallUser({
			parentContainer: this.container,
			userModel: localUserModel,
			allowBackgroundItem: BackgroundDialog.isAvailable() && this.isIntranetOrExtranet,
			allowMaskItem: BackgroundDialog.isMaskAvailable() && this.isIntranetOrExtranet,
			onUserRename: this.#onUserRename.bind(this),
			onUserRenameInputFocus: this.#onUserRenameInputFocus.bind(this),
			onUserRenameInputBlur: this.#onUserRenameInputBlur.bind(this),
			onClick: this.#onUserClick.bind(this),
			onTurnOffParticipantMic: this.#onTurnOffParticipantMic.bind(this),
			onTurnOffParticipantCam: this.#onTurnOffParticipantCam.bind(this),
			onTurnOffParticipantScreenshare: this.#onTurnOffParticipantScreenshare.bind(this),
			onPin: this.#onUserPin.bind(this),
			onUnPin: this.#onUserUnPin.bind(this),
		});
	}

	#initElementRefs()
	{
		this.elements = {
			root: null,
			wrap: null,
			watermark: null,
			container: null,
			overlay: null,
			topPanel: null,
			bottom: null,
			notificationPanel: null,
			panel: null,
			audioContainer: null,
			screenAudioContainer: null,
			audio: {
				// userId: <audio> for this user's stream
			},
			screenAudio: {
				// userId: <audio> for this user's stream
			},
			center: null,
			localUserMobile: null,
			userBlock: null,
			ear: {
				left: null,
				right: null,
			},
			userList: {
				container: null,
				addButton: null,
			},
			userSelectorContainer: null,
			pinnedUserContainer: null,
			renameSlider: {
				input: null,
				button: null,
			},
			pageNavigatorLeft: null,
			pageNavigatorLeftCounter: null,
			pageNavigatorRight: null,
			pageNavigatorRightCounter: null,
		};

		this.buttons = {
			title: null,
			grid: null,
			add: null,
			share: null,
			record: null,
			document: null,
			copilot: null,
			microphone: null,
			camera: null,
			speaker: null,
			screen: null,
			mobileMenu: null,
			chat: null,
			users: null,
			history: null,
			hangup: null,
			fullscreen: null,
			overlay: null,
			status: null,
			returnToCall: null,
			recordStatus: null,
			participants: null,
			participantsMobile: null,
			watermark: null,
			hd: null,
			protected: null,
			more: null,
			hangupOptions: null,
		};
	}

	#initButtonRestrictions(config)
	{
		this.blockedButtons = {};
		const configBlockedButtons = Type.isArray(config.blockedButtons) ? config.blockedButtons : [];
		configBlockedButtons.forEach((buttonCode) => {
			this.blockedButtons[buttonCode] = true;
		});

		this.hiddenButtons = {};
		this.overflownButtons = {};
		if (!this.showUsersButton)
		{
			this.hiddenButtons.users = true;
		}
		const configHiddenButtons = Type.isArray(config.hiddenButtons) ? config.hiddenButtons : [];
		configHiddenButtons.forEach((buttonCode) => {
			this.hiddenButtons[buttonCode] = true;
		});

		this.hiddenTopButtons = {};
		const configHiddenTopButtons = Type.isArray(config.hiddenTopButtons) ? config.hiddenTopButtons : [];
		configHiddenTopButtons.forEach((buttonCode) => {
			this.hiddenTopButtons[buttonCode] = true;
		});
	}

	#initEventHandlers()
	{
		this.#onFullScreenChangeHandler = this.#onFullScreenChange.bind(this);
		this.#onResizeHandler = this.#onResize.bind(this);
		this.#onOrientationChangeHandler = Runtime.debounce(this.#onOrientationChange.bind(this), 500);
		this.#onKeyDownHandler = this.#onKeyDown.bind(this);

		this.#onAddUser = Runtime.throttle(() => {
			if (this.destroyed)
			{
				return;
			}

			this.updateUserList();
			this.updateButtons();
			this.updateUserButtons();
			this.muteSpeaker(this.speakerMuted);
		}, 500);

		this.#onUserStateUpdated = Runtime.throttle((skippedElementsList) => {
			if (this.destroyed)
			{
				return;
			}

			this.updateUserList();
			this.updateButtons(skippedElementsList);
			this.updateUserButtons();
		}, 500);
	}

	#initHotKeys()
	{
		this.hintManager = BX.UI.Hint.createInstance({
			popupParameters: {
				targetContainer: document.body,
				className: 'bx-messenger-videocall-panel-item-hotkey-hint',
				bindOptions: { forceBindPosition: true },
				angle: false,
			},
		});

		this.hotKey = {
			all: Util.isDesktop(),
			microphone: true,
			camera: true,
			screen: true,
			record: true,
			speaker: true,
			chat: true,
			users: true,
			floorRequest: true,
			muteSpeaker: true,
			grid: true,
		};
		this.hotKeyTemporaryBlock = 0;
		this.recordPopupHotKeyGuard = {
			container: null,
			isBlocked: false,
			onFocusIn: null,
			onFocusOut: null,
		};
	}

	#initPipCoordinator()
	{
		const pipUpdateButtons = () => {
			if (this.pictureInPictureCallWindow)
			{
				this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
			}
		};

		this.pipCoordinator = new PipCoordinator({
			togglePip: (active) => this.toggleStatePictureInPictureCallWindow(active),
			isScreenSharing: () => this.hasCurrentUserScreenSharing(),
			isFolded: () => this.size === Size.Folded,
			isVideoconf: () => this.isVideoconf,
			updateButtons: pipUpdateButtons,
			isConnected: () => this.uiState === UiState.Connected,
			isShown: () => this.visible,
			isMacDesktop: DesktopApi.isDesktop() && Browser.isMac(),
		});
	}

	#initPushToTalkCoordinator()
	{
		this.pushToTalkCoordinator = new PushToTalkCoordinator({
			isAvailable: () => Util.isPushToTalkAvailable(),
			callWindowDocument: () => document,
			isMicrophoneMuted: () => Hardware.isMicrophoneMuted,
			isFolded: () => this.size === Size.Folded,
			// the signals the microphone button itself is drawn from: the right to broadcast and the
			// transport hold on publishing both arrive through them
			isMicrophoneActionable: () => !this.isButtonHidden('microphone') && !this.isButtonBlocked('microphone'),
			isModalBlocked: () => this.hotKeyTemporaryBlock > 0,
			setMicrophone: (muted, source) => {
				// the device chooser takes the state of the microphone once, when it opens, so a
				// microphone the hold policy moves under it would go on being drawn as it was
				this.deviceSelector?.destroy();

				this.#rememberMicrophoneCommand(muted);
				this.#emitToggleMute(muted, source);
			},
			// the window takes no decision of its own here: whether the hint is due is for the
			// notification service to say, and only the controller can reach it
			onShortPress: () => this.eventEmitter.emit(EventName.onPushToTalkShortPress),
			localUserId: () => Number(this.userId),
			clock: BrowserClock,
		});
	}

	get enableAutoPip()
	{
		return this.pipCoordinator?.enableAutoPip ?? false;
	}

	isHidden()
	{
		return this.pipCoordinator?.isHidden() ?? false;
	}

	openArticle(articleCode)
	{
		const infoHelper = BX.UI.InfoHelper;

		if (infoHelper.isOpen())
		{
			infoHelper.close();
		}

		infoHelper.show(articleCode);
	}

	onClickButtonWithLimit(limitObj, handle)
	{
		const { enabled, articleCode } = limitObj;

		if (enabled && Type.isFunction(handle))
		{
			handle();

			return;
		}

		if (!enabled && articleCode)
		{
			if (this.size === Size.Folded)
			{
				this.#onBodyClick();
			}

			this.openArticle(articleCode);
		}
	}

	getLimitation()
	{
		this.limitation = Util.getCallFeatures();
	}

	getLimitationByType(type)
	{
		const defaultLimitation = { enable: true };

		const currentLimitation = this.limitation?.[`call_${type}`];

		if (!currentLimitation)
		{
			return defaultLimitation;
		}

		return {
			enabled: currentLimitation.enable,
			articleCode: currentLimitation.articleCode,
		};
	}

	getRecordLimitation()
	{
		return this.getLimitationByType('record');
	}

	getScreenSharingLimitation()
	{
		return this.getLimitationByType('screen_sharing');
	}

	isDesktopCall()
	{
		return DesktopApi.isDesktop();
	}

	checkAvailableBackgroundImage()
	{
		if (!this.isDesktopCall())
		{
			return;
		}

		const { id: backgroundId } = DesktopApi.getBackgroundImage();

		if (!backgroundId || backgroundId === 'none')
		{
			DesktopApi.setCallBackground('none', 'none');
		}
	}

	toggleVisibilityEar()
	{
		if (this.hideEarTimer)
		{
			clearTimeout(this.hideEarTimer);
			this.hideEarTimer = null;
		}

		Dom.addClass(this.elements.root, 'on-mouse-move');
		Dom.addClass(this.elements.ear.top, 'force-visible');
		Dom.addClass(this.elements.ear.bottom, 'force-visible');
		Dom.addClass(this.elements.pageNavigatorLeft, 'force-visible');
		Dom.addClass(this.elements.pageNavigatorRight, 'force-visible');

		this.hideEarTimer = setTimeout(() => {
			Dom.removeClass(this.elements.root, 'on-mouse-move');
			Dom.removeClass(this.elements.ear.top, 'force-visible');
			Dom.removeClass(this.elements.ear.bottom, 'force-visible');
			Dom.removeClass(this.elements.pageNavigatorLeft, 'force-visible');
			Dom.removeClass(this.elements.pageNavigatorRight, 'force-visible');
		}, 5000);
	}

	init()
	{
		this.getLimitation();
		this.checkAvailableBackgroundImage();

		if (this.isFullScreenSupported())
		{
			if (Browser.isChrome() || Browser.isSafari())
			{
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
				window.addEventListener('fullscreenchange', this.#onFullScreenChangeHandler);
				Event.bind(window, 'webkitfullscreenchange', this.#onFullScreenChangeHandler);
			}
			else if (Browser.isFirefox())
			{
				Event.bind(window, 'mozfullscreenchange', this.#onFullScreenChangeHandler);
			}
		}

		if (Browser.isMobile())
		{
			Dom.style(document.documentElement, '--view-height', `${window.innerHeight}px`);
			Event.bind(window, 'orientationchange', this.#onOrientationChangeHandler);
		}

		this.elements.audioContainer = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-audio-container' },
		});

		this.elements.screenAudioContainer = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-audio-container' },
		});

		if (!this.externalSpeakerManagement)
		{
			if (Hardware.initialized)
			{
				this.setSpeakerId(Hardware.defaultSpeaker);
			}
			else
			{
				Hardware.subscribe(Hardware.Events.initialized, () => {
					this.setSpeakerId(Hardware.defaultSpeaker);
				});
			}
		}

		Hardware.subscribe(Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
		Hardware.subscribe(Hardware.Events.onChangeCameraOn, this.setCameraState);

		Event.bind(window, 'keydown', this.#onKeyDownHandler);

		this.onMouseMoveHandler = this.toggleVisibilityEar.bind(this);
		Event.bind(document, 'mousemove', this.onMouseMoveHandler);

		this.keyModifierForCss = Browser.isMac() ? '\\2318 + Shift' : 'Ctrl + Shift';

		Dom.append(this.elements.audioContainer, this.container);
		Dom.append(this.elements.screenAudioContainer, this.container);

		this.pipCoordinator.start();
		this.pushToTalkCoordinator.start();
	}

	get isActivePiPFromController()
	{
		return this.#isActivePiPFromController;
	}

	set isActivePiPFromController(isActive)
	{
		this.#isActivePiPFromController = isActive;
	}

	get isPreparing()
	{
		return this.#isPreparing;
	}

	set isPreparing(isPreparing)
	{
		this.#isPreparing = Boolean(isPreparing);
	}

	subscribeEvents(config)
	{
		for (const event of Object.keys(EventName))
		{
			if (Type.isFunction(config[event]))
			{
				this.setCallback(event, config[event]);
			}
		}
	}

	setCallback(name, cb)
	{
		if (Type.isFunction(cb) && Object.hasOwn(EventName, name))
		{
			this.eventEmitter.subscribe(name, (event) => {
				cb(event.data);
			});
		}
	}

	subscribe(eventName, listener)
	{
		return this.eventEmitter.subscribe(eventName, listener);
	}

	unsubscribe(eventName, listener)
	{
		return this.eventEmitter.unsubscribe(eventName, listener);
	}

	getNextPosition()
	{
		return this.lastPosition++;
	}

	/**
	 * @param {object} userStates {userId -> state}
	 */
	appendUsers(userStates)
	{
		if (!Type.isPlainObject(userStates))
		{
			return;
		}

		const userIds = Object.keys(userStates);
		for (const userId of userIds)
		{
			this.addUser(userId, userStates[userId] || UserState.Idle);
		}
	}

	setCentralUser(userId)
	{
		if (isSameUser(this.centralUser.id, userId))
		{
			return;
		}

		if (!this.users[userId] && !isSameUser(userId, this.userId))
		{
			return;
		}

		const previousCentralUser = this.centralUser;
		this.centralUser = (isSameUser(userId, this.userId) ? this.localUser : this.users[userId]);
		if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile)
		{
			if (this.layout === Layouts.Mobile)
			{
				previousCentralUser.dismount();
			}

			this.updateUserList();

			if (!isSameUser(previousCentralUser.id, this.centralUser.id))
			{
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id,
				});
			}
		}

		if (this.layout === Layouts.Mobile)
		{
			if (this.centralUserMobile)
			{
				this.centralUserMobile.setUserModel(this.userRegistry.get(userId));
			}
			else
			{
				this.centralUserMobile = new CallUserMobile({
					userModel: this.userRegistry.get(userId),
					onClick: () => this.showUserMenu(this.centralUser.id),
				});
				this.centralUserMobile.mount(this.elements.pinnedUserContainer);
			}
		}

		this.userRegistry.get(previousCentralUser.id).centralUser = false;
		this.userRegistry.get(this.centralUser.id).centralUser = true;

		this.eventEmitter.emit(EventName.onSetCentralUser, {
			userId,
			stream: isSameUser(userId, this.userId) ? this.localUser.stream : this.users[userId].stream,
		});

		this.talkingService.refreshQueue();
	}

	getLeftUser(userId)
	{
		let candidateUserId = null;
		const keys = [...this.userRegistry.users.keys()];
		const index = keys.indexOf(userId);

		if (index === -1)
		{
			return candidateUserId;
		}

		const userModels = [...this.userRegistry.users.values()].slice(0, index);
		const totalUserModels = userModels.length;

		for (let i = totalUserModels - 1; i >= 0; i--)
		{
			const userModel = userModels[i];
			if (!userModel.localUser && userModel.state === UserState.Connected)
			{
				candidateUserId = userModel.id;
				break;
			}
		}

		return candidateUserId;
	}

	getRightUser(userId)
	{
		let candidateUserId = null;
		const keys = [...this.userRegistry.users.keys()];
		const index = keys.indexOf(userId);

		if (index === -1)
		{
			return candidateUserId;
		}

		const userModels = [...this.userRegistry.users.values()].slice(index + 1);
		const totalUserModels = userModels.length;

		for (let i = 0; i < totalUserModels; i++)
		{
			const userModel = userModels[i];

			if (!userModel.localUser && userModel.state === UserState.Connected)
			{
				candidateUserId = userModel.id;
				break;
			}
		}

		return candidateUserId;
	}

	getUserCount()
	{
		return Object.keys(this.users).length;
	}

	getConnectedUserCount(withYou)
	{
		let count = this.getConnectedUsers().length;

		if (withYou)
		{
			const userId = parseInt(this.userId, 10);
			if (!this.broadcastingMode || this.broadcastingPresenters.includes(userId))
			{
				count += 1;
			}
		}

		return count;
	}

	getUsersWithVideo()
	{
		if (this.cache.has('usersWithVideo'))
		{
			return this.cache.get('usersWithVideo');
		}

		const users = Object.keys(this.users);
		const result = [];

		users.forEach((userId) => {
			if (this.users[userId].hasVideo())
			{
				result.push(userId);
			}
		});

		this.cache.set('usersWithVideo', result);

		return result;
	}

	getConnectedUsers()
	{
		if (this.cache.has('currentConnectedUser'))
		{
			return this.cache.get('currentConnectedUser');
		}

		const result = [];
		const userModels = [...this.userRegistry.users.values()];
		userModels.forEach((userModel) => {
			if (!isSameUser(userModel.id, this.userId) && userModel.state === UserState.Connected)
			{
				result.push(userModel.id);
			}
		});

		this.cache.set('previousConnectedUserCount', 0);
		this.cache.set('currentConnectedUser', result);

		return result;
	}

	getDisplayedUsers()
	{
		const result = [];
		const userModels = [...this.userRegistry.users.values()];
		userModels.forEach((userModel) => {
			if (
				!isSameUser(userModel.id, this.userId)
				&& (
					// Both sides are the id of a UserModel here (CallUser.id returns userModel.id), so the
					// strict comparison needs no isSameUser: the local user is already filtered out above.
					(userModel.id !== this.centralUser.id && this.layout === Layouts.Centered)
					|| this.layout !== Layouts.Centered
				)
				&& ([UserState.Connected, UserState.Connecting, UserState.Calling].includes(userModel.state))
			)
			{
				result.push(userModel.id);
			}
		});

		return result;
	}

	getActiveUsers()
	{
		if (this.cache.has('activeUsers'))
		{
			return this.cache.get('activeUsers');
		}

		const result = [];
		const userModels = [...this.userRegistry.users.values()];
		userModels.forEach((userModel) => {
			if (userModel.hasActiveState && Object.hasOwn(this.users, userModel.id))
			{
				result.push(userModel.id);
			}
		});

		this.cache.set('activeUsers', result);

		return result;
	}

	getUsersWithCamera()
	{
		// since we don't receive streams from inactive pages
		// we can't use this.getUsersWithVideo() to get number of users with video
		return [...this.userRegistry.users.values()].filter((userModel) => {
			return !isSameUser(userModel.id, this.userId)
				&& userModel.cameraState
				&& userModel.hasActiveState
				&& userModel.state !== UserState.Calling;
		});
	}

	hasUserWithScreenSharing()
	{
		return [...this.userRegistry.users.values()].some((userModel) => userModel.screenState);
	}

	hasCurrentUserScreenSharing()
	{
		const currentUser = this.userRegistry.get(this.userId);

		if (currentUser)
		{
			return currentUser.screenState;
		}

		return false;
	}

	getPresenterUserId()
	{
		let currentPresenterId = this.presenterId || 0;
		if (!this.getConnectedUserCount())
		{
			return null;
		}

		if (isSameUser(currentPresenterId, this.localUser.id))
		{
			currentPresenterId = 0;
		}

		const currentPresenterModel = this.userRegistry.get(currentPresenterId);

		// 1. Current user, who is sharing screen has top priority
		if (currentPresenterModel?.screenState === true)
		{
			return currentPresenterId;
		}

		const users = Object.keys(this.users);

		// 2. If current user is not sharing screen, but someone is sharing - he should become presenter
		const screenSharingUserId = this.#findScreenSharingUserId(users);
		if (screenSharingUserId !== null)
		{
			return screenSharingUserId;
		}

		// 3. If current user is talking, or stopped talking less then one second ago - he should stay presenter
		if (currentPresenterModel && currentPresenterModel.wasTalkingAgo() < 1000)
		{
			return currentPresenterId;
		}

		// 4. Return currently or last talking user, or current user in center
		return this.#findTalkingUserId(users) || this.centralUser.id;
	}

	#findScreenSharingUserId(users)
	{
		for (const userId of users)
		{
			if (Object.hasOwn(this.users, userId) && this.userRegistry.get(userId).screenState === true)
			{
				return parseInt(userId, 10);
			}
		}

		return null;
	}

	#findTalkingUserId(users)
	{
		let minTalkingAgo = Infinity;
		let minTalkingAgoUserId = 0;
		for (const userId of users)
		{
			if (!Object.hasOwn(this.users, userId))
			{
				continue;
			}

			const userWasTalkingAgo = this.userRegistry.get(userId).wasTalkingAgo();
			if (userWasTalkingAgo < 1000)
			{
				return parseInt(userId, 10);
			}

			if (userWasTalkingAgo < minTalkingAgo)
			{
				minTalkingAgo = userWasTalkingAgo;
				minTalkingAgoUserId = parseInt(userId, 10);
			}
		}

		return minTalkingAgoUserId;
	}

	switchPresenter(presenterId)
	{
		const currentPresenterId = this.presenterId || 0;
		const newPresenterId = presenterId || this.getPresenterUserId();

		if (!newPresenterId)
		{
			return;
		}

		this.presenterId = newPresenterId;

		if (currentPresenterId)
		{
			this.userRegistry.get(currentPresenterId).presenter = false;
		}
		this.userRegistry.get(newPresenterId).presenter = true;

		if (this.pictureInPictureCallWindow)
		{
			this.pictureInPictureCallWindow.setCurrentUser(this.getPictureInPictureCallWindowUser());
		}

		if (this.pinnedUser === null)
		{
			this.setCentralUser(newPresenterId);
		}
		else if (currentPresenterId !== newPresenterId)
		{
			this.eventEmitter.emit(EventName.onHasMainStream, {
				userId: this.centralUser.id,
				otherUsers: [currentPresenterId],
			});
		}
	}

	switchPresenterDeferred()
	{
		clearTimeout(this.switchPresenterTimeout);
		this.switchPresenterTimeout = setTimeout(this.switchPresenter.bind(this), 1000);
	}

	setUiState(uiState)
	{
		if (this.uiState === uiState)
		{
			return;
		}

		this.uiState = uiState;
		if (this.uiState === UiState.Error && this.elements.container)
		{
			Dom.clean(this.elements.container);
			Dom.append(this.elements.overlay, this.elements.container);
		}

		if (!this.elements.root)
		{
			return;
		}
		this.updateButtons();
	}

	setLayout(newLayout)
	{
		if (newLayout === this.layout)
		{
			return;
		}

		this.layout = newLayout;

		if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile)
		{
			Dom.removeClass(this.elements.root, 'bx-messenger-videocall-grid');
			Dom.addClass(this.elements.root, 'bx-messenger-videocall-centered');
			this.centralUser.mount(this.elements.center);
			Dom.append(this.elements.userBlock, this.elements.container);

			if (this.layout !== Layouts.Mobile)
			{
				Dom.append(this.elements.userList.container, this.elements.userBlock);
			}

			if (this.layout === Layouts.Centered)
			{
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id,
				});
			}

			this.centralUser.playVideo();
		}

		if (this.layout === Layouts.Grid)
		{
			Dom.removeClass(this.elements.root, 'bx-messenger-videocall-centered');
			Dom.addClass(this.elements.root, 'bx-messenger-videocall-grid');

			Dom.append(this.elements.userList.container, this.elements.container);
			Dom.remove(this.elements.userBlock);

			this.centralUser.dismount();

			if (this.isFullScreen && this.buttons.participants)
			{
				this.buttons.participants.update({
					foldButtonState: Buttons.ParticipantsButton.FoldButtonState.Hidden,
				});
			}
			this.unpinUser();
		}

		if (this.layout === Layouts.Centered && this.isFullScreen)
		{
			this.setUserBlockFolded(true);
		}

		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-fullscreen-mobile', (this.layout === Layouts.Mobile));

		this.updateUserList();
		this.toggleEars();
		this.updateButtons();

		this.talkingService.refreshQueue();

		this.eventEmitter.emit(EventName.onLayoutChange, {
			layout: this.layout,
		});
	}

	setRoomState(roomState)
	{
		if (this.roomState === roomState)
		{
			return;
		}
		this.roomState = roomState;
		if (this.buttons.microphone)
		{
			this.buttons.microphone.setSideIcon(getMicrophoneSideIcon(this.roomState));
		}
	}

	/**
	 * Two lines with two conditions of their own: holding space works wherever the mode is available,
	 * while the letter shortcut is bound in the desktop application alone. In the web that leaves an
	 * open microphone with nothing to say, and the button drops the plate for that state.
	 *
	 * @return {string}
	 */
	#getMicrophoneTooltipText()
	{
		const hotkey = Util.isDesktop() ? `${this.keyModifierForCss} + A` : '';

		if (!Hardware.isMicrophoneMuted || !Util.isPushToTalkAvailable())
		{
			return hotkey;
		}

		const spaceHint = Loc.getMessage('IM_SPACE_HOTKEY');

		return hotkey === '' ? spaceHint : `${spaceHint}\\A${' '}${hotkey}${' '}`;
	}

	setCurrentPage(pageNumber)
	{
		if (pageNumber < 1 || pageNumber > this.pagesCount || pageNumber === this.currentPage)
		{
			return;
		}
		this.currentPage = pageNumber;

		this.recalculateUsersPerPage();
		if (this.elements.root)
		{
			this.elements.pageNavigatorLeftCounter.innerHTML = `${this.currentPage - 1}&nbsp;/&nbsp;${this.pagesCount}`;
			this.elements.pageNavigatorRightCounter.innerHTML = `${this.currentPage + 1}&nbsp;/&nbsp;${this.pagesCount}`;
		}

		if (!(this.layout === Layouts.Grid || this.layout === Layouts.Centered))
		{
			return;
		}

		this.renderUserList();
		this.toggleEars();
		this.talkingService.refreshQueue();
	}

	calculateUsersPerPage()
	{
		if (!this.elements.userList)
		{
			return 1000;
		}

		const containerSize = this.elements.userList.container.getBoundingClientRect();
		let columns = Math.floor(containerSize.width / MIN_GRID_USER_WIDTH) || 1;
		let rows = Math.floor(containerSize.height / MIN_GRID_USER_HEIGHT) || 1;

		if (this.layout === Layouts.Centered)
		{
			const rowsWithoutGap = Math.floor(containerSize.height / SIDE_USER_HEIGHT) || 1;
			const rowGap = 6;

			this.whiteSpaceInUserGrid = containerSize.height
				- rowsWithoutGap * SIDE_USER_HEIGHT
				+ (rowsWithoutGap - 1) * rowGap;

			columns = 1;
			rows = this.whiteSpaceInUserGrid < 0 ? rowsWithoutGap - 1 : rowsWithoutGap;
		}

		let usersPerPage = columns * rows - 1;

		if (isSameUser(this.userId, this.centralUser.id) && this.layout === Layouts.Centered)
		{
			usersPerPage += 1;
		}

		if (!usersPerPage)
		{
			return 1000;
		}

		if (usersPerPage >= MAX_USERS_PER_PAGE)
		{
			// check if the last row should be filled up
			const elementSize = Util.findBestElementSize(
				containerSize.width,
				containerSize.height,
				MAX_USERS_PER_PAGE + 1,
				MIN_GRID_USER_WIDTH,
				MIN_GRID_USER_HEIGHT,
			);

			columns = Math.floor(containerSize.width / elementSize.width);
			rows = Math.floor(containerSize.height / elementSize.height);
			usersPerPage = columns * rows - 1;
		}

		return usersPerPage;
	}

	calculatePagesCount(usersPerPage)
	{
		const pages = Math.ceil((this.getDisplayedUsers().length) / usersPerPage);

		return pages > 0 ? pages : 1;
	}

	recalculateUsersPerPage()
	{
		this.usersPerPage = this.calculateUsersPerPage();

		if (this.currentPage < this.pagesCount && this.layout === Layouts.Centered && this.whiteSpaceInUserGrid > 0)
		{
			this.usersPerPage += 1;
		}
	}

	recalculatePages()
	{
		this.usersPerPage = this.calculateUsersPerPage();
		this.pagesCount = this.calculatePagesCount(this.usersPerPage);

		if (this.currentPage > this.pagesCount)
		{
			this.currentPage = this.pagesCount;
		}

		this.recalculateUsersPerPage();

		if (this.elements.root)
		{
			this.elements.pageNavigatorLeftCounter.innerHTML = `${this.currentPage - 1}&nbsp;/&nbsp;${this.pagesCount}`;
			this.elements.pageNavigatorRightCounter.innerHTML = `${this.currentPage + 1}&nbsp;/&nbsp;${this.pagesCount}`;
		}
	}

	setCameraId(cameraId)
	{
		if ((this.cameraId ?? null) === (cameraId ?? null))
		{
			return;
		}

		if (this.localUser.stream && this.localUser.stream.getVideoTracks().length > 0)
		{
			throw new Error('Can not set camera id while having active stream');
		}
		this.cameraId = cameraId;
	}

	setMicrophoneId(microphoneId)
	{
		if ((this.microphoneId ?? null) === (microphoneId ?? null))
		{
			return;
		}

		if (this.localUser.stream && this.localUser.stream.getAudioTracks().length > 0)
		{
			throw new Error('Can not set microphone id while having active stream');
		}
		this.microphoneId = microphoneId;
	}

	setMicrophoneLevel(level)
	{
		this.microphoneLevel = level;
		this.buttons.microphone?.setLevel(level);
	}

	setGuestLink(link)
	{
		if (this.#guestLink === link)
		{
			return;
		}

		this.#guestLink = link;
		this.updateButtons();
	}

	setCameraState = (event) => {
		if (this.isCameraOn === event.data.isCameraOn)
		{
			return;
		}

		this.isCameraOn = event.data.isCameraOn;

		if (this.buttons.camera)
		{
			if (this.isCameraOn)
			{
				this.buttons.camera.enable();
			}
			else
			{
				this.buttons.camera.disable();
			}
		}

		if (this.pictureInPictureCallWindow)
		{
			this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
		}
	};

	setMuted = (event) => {
		if (this.isMuted === event.data.isMicrophoneMuted)
		{
			return;
		}

		this.isMuted = event.data.isMicrophoneMuted;

		this.#publishMicrophoneChange(this.isMuted);

		if (this.buttons.microphone)
		{
			if (this.isMuted)
			{
				this.buttons.microphone.disable();
			}
			else
			{
				this.buttons.microphone.enable();
			}
		}
		this.userRegistry.get(this.userId).microphoneState = !this.isMuted;

		if (this.pictureInPictureCallWindow)
		{
			this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
		}
	};

	setLocalUserId(userId)
	{
		if (isSameUser(userId, this.userId))
		{
			return;
		}

		this.userId = parseInt(userId, 10);
		this.localUser.userModel.id = this.userId;
		this.localUser.userModel.name = this.userData[this.userId] ? this.userData[this.userId].name : '';
		this.localUser.userModel.avatar = this.userData[this.userId] ? checkAndEncodeURI(this.userData[this.userId].avatar_hr) : '';

		this.userRegistry.push(this.localUser.userModel);
	}

	setUserBlockFolded(isUserBlockFolded)
	{
		this.isUserBlockFolded = isUserBlockFolded;

		Dom.toggleClass(this.elements.userBlock, 'folded', this.isUserBlockFolded);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-userblock-folded', this.isUserBlockFolded);
		if (this.isUserBlockFolded)
		{
			if (this.buttons.participants && this.layout === Layouts.Centered)
			{
				this.buttons.participants.update({
					foldButtonState: Buttons.ParticipantsButton.FoldButtonState.Unfold,
				});
			}
		}
		else if (this.buttons.participants)
		{
			this.buttons.participants.update({
				foldButtonState: (this.isFullScreen && this.layout === Layouts.Centered)
					? Buttons.ParticipantsButton.FoldButtonState.Fold
					: Buttons.ParticipantsButton.FoldButtonState.Hidden,
			});
		}
	}

	addUser(rawUserId, rawState, rawDirection)
	{
		const userId = Number(rawUserId);
		if (this.users[userId])
		{
			return;
		}

		const state = rawState || UserState.Idle;
		const direction = rawDirection || getNewUserDirection(userId, this.broadcastingPresenters);

		const userModel = new UserModel({
			id: userId,
			name: this.userData[userId] ? this.userData[userId].name : '',
			avatar: this.userData[userId] ? this.userData[userId].avatar_hr : '',
			state,
			order: state === UserState.Connected ? this.getNextPosition() : newUserPosition,
			direction,
		});

		this.userRegistry.push(userModel);

		this.users[userId] = this.#createCallUser(userId, userModel);
		userModel.subscribe('changed', this.talkingService.watchTalking);

		this.screenUsers[userId] = new CallUser({
			parentContainer: this.container,
			userModel,
			allowPinButton: false,
			screenSharingUser: true,
		});

		if (this.elements.root && state !== UserState.Idle)
		{
			if (state === UserState.Connected)
			{
				this.cache.set('previousConnectedUserCount', this.cache.get('currentConnectedUser')?.length || 0);
				this.cache.delete('currentConnectedUser');
				this.cache.delete('activeUsers');
			}

			this.#onAddUser();
		}
	}

	#createCallUser(userId, userModel)
	{
		return new CallUser({
			userModel,
			parentContainer: this.container,
			allowPinButton: this.getConnectedUserCount() > 1,
			externalSpeakerManagement: this.externalSpeakerManagement,
			onClick: this.#onUserClick.bind(this),
			onPin: this.#onUserPin.bind(this),
			onUnPin: this.#onUserUnPin.bind(this),
			onTurnOffParticipantMic: this.#onTurnOffParticipantMic.bind(this),
			onTurnOffParticipantCam: this.#onTurnOffParticipantCam.bind(this),
			onTurnOffParticipantScreenshare: this.#onTurnOffParticipantScreenshare.bind(this),
			onAudioElementCreated: this.externalSpeakerManagement
				? (audioElement) => {
					Dom.append(this.elements.audio[userId], this.elements.audioContainer);
					this.eventEmitter.emit(EventName.onAudioElementCreated, {
						userId,
						audioElement,
					});
				}
				: null,
			onAudioPlay: this.externalSpeakerManagement
				? (audioElement) => {
					this.eventEmitter.emit(EventName.onAudioPlay, {
						userId,
						audioElement,
					});
				}
				: null,
		});
	}

	setUserDirection(userId, direction)
	{
		const user = this.userRegistry.get(userId);
		if (!user || user.direction === direction)
		{
			return;
		}

		user.direction = direction;
		this.updateUserList();
	}

	setLocalUserDirection(direction)
	{
		if (this.localUser.userModel.direction !== direction)
		{
			this.localUser.userModel.direction = direction;
			this.updateUserList();
		}
	}

	setUserState(userId, newState)
	{
		const user = this.userRegistry.get(userId);
		if (!user || user.state === newState)
		{
			return;
		}

		if ((user.state === UserState.Connected || newState === UserState.Connected))
		{
			this.cache.set('previousConnectedUserCount', this.cache.get('currentConnectedUser')?.length || 0);
			this.cache.delete('currentConnectedUser');
			this.cache.delete('activeUsers');
		}

		user.state = newState;

		if (newState === UserState.Idle && user.screenState)
		{
			user.prevScreenState = user.screenState;
		}

		if (newState === UserState.Connected && this.uiState === UiState.Calling)
		{
			this.setUiState(UiState.Connected);
		}

		this.#updateCentralUser(userId, newState);
		this.#applyUserConnectionState(userId, newState);
		this.#updateUserPosition(userId, newState);

		if (isSameUser(userId, this.localUser.id))
		{
			this.localUser.userModel.cameraState = this.localUser.hasCameraVideo();
		}

		// Deliberately strict, unlike the isSameUser above: an id that arrives in another form than the one
		// the local user holds keeps the panel in the redraw. Aligning the two changes what is redrawn, so
		// it belongs to a separate task, not to this refactoring.
		const skippedElementsList = userId === this.localUser.id ? [] : ['panel'];

		if (isSameUser(userId, this.presenterId) && newState !== UserState.Connected)
		{
			this.switchPresenter();
		}

		this.#onUserStateUpdated(skippedElementsList);
	}

	#updateCentralUser(userId, newState)
	{
		if (isSameUser(this.centralUser.id, this.userId) && newState === UserState.Connected)
		{
			this.setCentralUser(userId);
		}
		else if (isSameUser(userId, this.centralUser.id))
		{
			switch (newState)
			{
				case UserState.Connecting:
				case UserState.Failed:
					this.centralUser.blurVideo();
					break;

				case UserState.Connected:
					this.centralUser.blurVideo(false);
					break;

				case UserState.Idle:
				{
					const usersWithVideo = this.getUsersWithVideo();
					const connectedUsers = this.getConnectedUsers();

					if (connectedUsers.length === 0)
					{
						this.setCentralUser(this.userId);
					}
					else if (usersWithVideo.length > 0)
					{
						this.setCentralUser(usersWithVideo[0]);
					}
					else
					{
						this.setCentralUser(connectedUsers[0]);
					}

					break;
				}

				default:
			}
		}
	}

	#applyUserConnectionState(userId, newState)
	{
		const user = this.userRegistry.get(userId);

		if (newState === UserState.Connected)
		{
			const timer = setTimeout(() => {
				this.waitingForUserMediaTimeouts.delete(userId);
			}, WAITING_VIDEO_DELAY);
			this.waitingForUserMediaTimeouts.set(userId, timer);

			if (user.prevScreenState && !isSameUser(userId, this.userId))
			{
				this.setUserScreenState(userId, user.prevScreenState);
				user.prevScreenState = false;
			}
		}
		else if (newState === UserState.Idle)
		{
			if (this.isVideoconf && this.pictureInPictureCallWindow && Number(this.currentPiPUserId) === Number(userId))
			{
				this.currentPiPUserId = null;
				this.pictureInPictureCallWindow.setCurrentUser(this.getPictureInPictureCallWindowUser(this.centralUser.id));
			}
			this.setUserFloorRequestState(userId, false);
			this.setUserPermissionToSpeakState(userId, false);
			clearTimeout(this.waitingForUserMediaTimeouts.get(userId));
			this.waitingForUserMediaTimeouts.delete(userId);
			this.rerenderQueue.set(userId, {
				userId,
				reason: RerenderReason.UserDisconnected,
			});
		}
	}

	#updateUserPosition(userId, newState)
	{
		const user = this.userRegistry.get(userId);

		if (newState === UserState.Connected && user.order === newUserPosition)
		{
			user.moveTo(this.getNextPosition());
		}
		else if (newState === UserState.Idle)
		{
			user.moveAsideTo(newUserPosition);
			user.prevCameraState = user.cameraState;
			user.cameraState = false;
		}
	}

	setTitle(title)
	{
		this.title = title;
	}

	setAccessibleName(name, type)
	{
		if (!Type.isStringFilled(name))
		{
			return;
		}

		const ariaKey = ARIA_KEY_BY_CALL_TYPE[type] ?? ARIA_KEY_BY_CALL_TYPE[CallWindowNameType.Private];
		const accessibleName = Loc.getMessage(ariaKey, {
			'#CALL_NAME#': name,
		});

		// A portal the phrase has not reached yet must keep the seeded fallback name instead of an empty one.
		if (!Type.isStringFilled(accessibleName))
		{
			return;
		}

		this.accessibleName = accessibleName;
		this.elements.root?.setAttribute('aria-label', this.accessibleName);
	}

	// An empty result makes Dom drop the attribute: a region with no name is better than a region
	// named "undefined" on a portal the phrase has not reached yet.
	getRootAccessibleName()
	{
		const accessibleName = Type.isStringFilled(this.accessibleName)
			? this.accessibleName
			: Loc.getMessage('CALL_VIEW_WINDOW_ARIA_FALLBACK');

		return Type.isStringFilled(accessibleName) ? accessibleName : '';
	}

	focusWindow(options = {})
	{
		this.focusScope?.focusWindow(this.elements.root, options);
	}

	releaseFocusBeforeHide()
	{
		return this.focusScope?.releaseBeforeDetach(this.elements.root) ?? false;
	}

	restoreFocusAfterHide()
	{
		this.focusScope?.restoreAfterDetach();
	}

	getUserTalking(userId)
	{
		const user = this.userRegistry.get(userId);
		if (!user)
		{
			return false;
		}

		return Boolean(user.talking);
	}

	setUserTalking(userId, talking)
	{
		const user = this.userRegistry.get(userId);
		if (!user)
		{
			return;
		}

		user.talking = talking;

		if (isSameUser(userId, this.userId))
		{
			return;
		}

		if (isSameUser(userId, this.presenterId) && !talking)
		{
			this.switchPresenterDeferred();
		}
		else
		{
			this.switchPresenter();
		}
	}

	setUserStats(userId, stats, mediaServerId)
	{
		this.pictureInPictureCallWindow?.setStats(userId, stats);

		if (isSameUser(userId, this.localUser.id))
		{
			this.localUser.showStats(stats, mediaServerId);
			this.updateButtons();

			return;
		}

		if (this.users[userId]?.isMounted())
		{
			this.users[userId].showStats(stats, mediaServerId);
		}

		if (this.screenUsers[userId]?.isMounted())
		{
			this.screenUsers[userId].showStats(stats, mediaServerId);
		}
	}

	setTrackSubscriptionFailed(data)
	{
		const user = this.users[data.participant.userId];
		if (user && data.participant.userId && data.track)
		{
			user.showTrackSubscriptionFailed(data.track);
		}
	}

	setUserMicrophoneState(userId, isMicrophoneOn)
	{
		const user = this.userRegistry.get(userId);
		if (user)
		{
			user.microphoneState = isMicrophoneOn;
		}
	}

	setUserCameraState(userId, cameraState)
	{
		const user = this.userRegistry.get(userId);
		if (user)
		{
			user.cameraState = cameraState;
		}
	}

	setUserVideoPaused(userId, videoPaused)
	{
		const user = this.userRegistry.get(userId);
		if (user)
		{
			user.videoPaused = videoPaused;
			user.cameraState = !videoPaused;

			if (!user.videoPaused !== videoPaused)
			{
				return;
			}

			this.updateRerenderQueue(
				userId,
				videoPaused ? RerenderReason.VideoDisabled : RerenderReason.VideoEnabled,
			);
		}
	}

	getUserFloorRequestState(userId)
	{
		const user = this.userRegistry.get(userId);

		return user && user.floorRequestState;
	}

	setUserFloorRequestState(userId, userFloorRequestState)
	{
		const user = this.userRegistry.get(userId);
		if (!user)
		{
			return;
		}

		if (user.floorRequestState !== userFloorRequestState)
		{
			const userState = user?.state;
			const userActive = (userState !== UserState.Idle
				&& userState !== UserState.Declined
				&& userState !== UserState.Unavailable
				&& userState !== UserState.Busy
			);
			if (userFloorRequestState && !userActive)
			{
				return;
			}

			user.floorRequestState = userFloorRequestState;

			this.updateFloorRequestNotifications(user, userFloorRequestState);

			if (userFloorRequestState)
			{
				this.showFloorRequestNotification(userId);
			}
		}

		if (isSameUser(userId, this.userId))
		{
			this.setButtonActive('floorRequest', userFloorRequestState);
		}
	}

	setUserPermissionToSpeakState(userId, permissionToSpeakState)
	{
		const user = this.userRegistry.get(userId);
		if (!user)
		{
			return;
		}

		if (user.permissionToSpeak !== permissionToSpeakState)
		{
			const userState = user?.state;
			const userActive = (userState !== UserState.Idle
				&& userState !== UserState.Declined
				&& userState !== UserState.Unavailable
				&& userState !== UserState.Busy
			);
			if (!userActive)
			{
				return;
			}

			user.permissionToSpeak = permissionToSpeakState;
		}
	}

	setAllUserPermissionToSpeakState(permissionToSpeakState)
	{
		for (const userModel of this.userRegistry.users.values())
		{
			userModel.permissionToSpeak = permissionToSpeakState;
		}
	}

	pinUser(userId)
	{
		if (!(userId in this.users) && userId !== Number(this.userId))
		{
			void console.error(`User ${userId} is not known`);

			return;
		}

		if (this.pinnedUser && this.userRegistry.users.has(this.pinnedUser.userModel.id))
		{
			this.userRegistry.get(this.pinnedUser.userModel.id).pinned = false;
		}
		this.pinnedUser = this.users[userId] || this.localUser;
		this.userRegistry.get(this.pinnedUser.userModel.id).pinned = true;
		this.setCentralUser(userId);
		this.eventEmitter.emit(EventName.onUserPinned, { userId });

		this.eventEmitter.emit(EventName.onHasMainStream, {
			userId: this.centralUser.id,
			otherUsers: [...this.activeUsers],
		});
	}

	unpinUser()
	{
		if (this.pinnedUser && this.userRegistry.users.has(this.pinnedUser.userModel.id))
		{
			this.userRegistry.get(this.pinnedUser.userModel.id).pinned = false;
		}
		this.pinnedUser = null;

		this.eventEmitter.emit(EventName.onUserPinned, {
			userId: null,
		});

		this.eventEmitter.emit(EventName.onHasMainStream, {
			userId: null,
			otherUsers: [...this.activeUsers],
		});
		this.switchPresenterDeferred();
	}

	updateFloorRequestNotifications(userModel, floorRequestState)
	{
		const indexFloorRequestInList = this.floorRequestNotifications.findIndex(
			(req) => req.userModel.id === userModel.id,
		);
		const hasFloorRequestInList = indexFloorRequestInList !== -1;
		const currentUser = this.users[userModel.id];
		const currentUserData = {
			userModel,
			avatarBackgroundColor: currentUser?.avatarBackground || Util.getAvatarBackground(),
		};

		if (floorRequestState && !hasFloorRequestInList)
		{
			this.floorRequestNotifications.push(currentUserData);
		}

		if (!floorRequestState && hasFloorRequestInList)
		{
			this.floorRequestNotifications.splice(indexFloorRequestInList, 1);
		}

		this.pictureInPictureCallWindow?.updateFloorRequestState(currentUserData);
	}

	showFloorRequestNotification(userId)
	{
		const userModel = this.userRegistry.get(userId);
		if (!userModel)
		{
			return;
		}

		const notification = FloorRequest.create({
			userModel,
			onAllowSpeakPermissionClicked: (_userModel) => {
				this.#onAllowSpeakPermissionClickedHandler(_userModel);
			},
			onDisallowSpeakPermissionClicked: (_userModel) => {
				this.#onDisallowSpeakPermissionClickedHandler(_userModel);
			},
		});

		notification.mount(this.elements.notificationPanel);
		NotificationManager.addNotification(notification);
	}

	updateFloorRequestNotification()
	{
		if (NotificationManager.notifications.length === 0)
		{
			return;
		}

		NotificationManager.notifications.forEach((notification) => {
			notification.updatePermissionButtonState();
		});
	}

	#onAllowSpeakPermissionClickedHandler(_userModel)
	{
		this.setUserPermissionToSpeakState(_userModel.id, true);
		this.eventEmitter.emit(EventName.onAllowSpeakPermission, {
			userId: _userModel.id,
		});
	}

	#onDisallowSpeakPermissionClickedHandler(_userModel)
	{
		this.eventEmitter.emit(EventName.onDisallowSpeakPermission, {
			userId: _userModel.id,
		});
	}

	setUserScreenState(userId, screenState)
	{
		const user = this.userRegistry.get(userId);
		if (!user)
		{
			return;
		}

		user.screenState = screenState;
		if (!isSameUser(userId, this.userId))
		{
			if (screenState === true && this.layout === Layouts.Grid)
			{
				this.setLayout(Layouts.Centered);
				this.returnToGridAfterScreenStopped = true;
			}

			if (screenState === false
				&& this.layout === Layouts.Centered
				&& !this.hasUserWithScreenSharing()
				&& !this.pinnedUser
				&& this.returnToGridAfterScreenStopped)
			{
				this.returnToGridAfterScreenStopped = false;
				this.setLayout(Layouts.Grid);
			}

			const newPresenterId = screenState ? userId : null;

			this.switchPresenter(newPresenterId);
		}
	}

	flipLocalVideo(flipVideo)
	{
		this.localUser.flipVideo = Boolean(flipVideo);
	}

	setLocalStream(streamData)
	{
		const mediaRenderer = streamData.mediaRenderer;
		const mediaStream = streamData.stream;
		const flipVideo = streamData.flipVideo;

		this.#applyLocalVideoSource(mediaRenderer, mediaStream, flipVideo);

		const videoTracks = mediaStream?.getVideoTracks();
		this.#rememberStreamDevices(mediaStream, mediaRenderer, videoTracks);
		this.#updateCentralUserVideo(mediaRenderer, videoTracks);

		this.updateButtons();
	}

	#applyLocalVideoSource(mediaRenderer, mediaStream, flipVideo)
	{
		if (mediaRenderer) // for Bitrix calls
		{
			this.localUser.videoRenderer = mediaRenderer;
			this.pictureInPictureCallWindow?.setVideoRenderer(this.userId, mediaRenderer);
		}
		else
		{
			const videoTrack = mediaStream.getVideoTracks().length > 0 ? mediaStream.getVideoTracks()[0] : null;
			this.localUser.videoTrack = videoTrack;
			this.pictureInPictureCallWindow?.setVideoRenderer(this.userId, new MediaRenderer({
				kind: 'video',
				track: videoTrack,
			}));
		}

		if (!Type.isUndefined(flipVideo))
		{
			this.flipLocalVideo(flipVideo);
		}
		this.localUser.userModel.cameraState = this.localUser.hasCameraVideo();
	}

	#rememberStreamDevices(mediaStream, mediaRenderer, videoTracks)
	{
		if (videoTracks?.length > 0)
		{
			const videoTrackSettings = videoTracks[0].getSettings();
			this.cameraId = videoTrackSettings.deviceId || '';
		}
		else if (!mediaRenderer)
		{
			this.cameraId = '';
		}

		const audioTracks = mediaStream?.getAudioTracks();
		if (audioTracks?.length > 0)
		{
			const audioTrackSettings = audioTracks[0].getSettings();
			this.microphoneId = audioTrackSettings.deviceId || '';
		}
	}

	#updateCentralUserVideo(mediaRenderer, videoTracks)
	{
		if (this.layout !== Layouts.Grid && isSameUser(this.centralUser.id, this.userId))
		{
			if (mediaRenderer) // for Bitrix ca;ls
			{
				this.centralUser.videoRenderer = mediaRenderer;
			}
			else if (videoTracks.length > 0 || Object.keys(this.users).length === 0)
			{
				this.centralUser.videoTrack = videoTracks[0];
			}
			else
			{
				this.setCentralUser(Object.keys(this.users)[0]);
			}
		}
		else
		{
			this.updateUserList();
		}
	}

	setLocalStreamVideoTrack(videoTrack)
	{
		this.localStreamVideoTrack = videoTrack;

		this.pictureInPictureCallWindow?.setVideoRenderer(this.userId, new MediaRenderer({
			kind: 'sharing',
			track: videoTrack,
		}));
	}

	setSpeakerId(speakerId)
	{
		if (this.speakerId === speakerId && this.speakerId !== undefined)
		{
			return;
		}

		if (!('setSinkId' in HTMLMediaElement.prototype))
		{
			void console.error('Speaker selection is not supported');
		}

		this.speakerId = speakerId;

		const audioElements = Object.values(this.elements.audio);
		let refusalReported = false;
		audioElements.forEach((element) => {
			element.setSinkId(speakerId).catch((error) => {
				// one record per selection and not per element: the walk calls setSinkId on every
				// participant, so an unavailable device would write one identical record per card.
				// The first refusal writes it, so an element whose promise never settles holds nothing up
				if (refusalReported)
				{
					return;
				}

				refusalReported = true;
				Util.sendLog({
					description: 'speaker selection failed',
					scope: 'view',
					elementCount: audioElements.length,
					// the argument and not the field: a later selection may already have overwritten it
					speakerId,
					errorName: error?.name,
					errorMessage: error?.message,
				});
			});
		});

		for (const userId of Object.keys(this.elements.screenAudio))
		{
			void this.elements.screenAudio[userId].setSinkId(this.speakerId);
		}
	}

	muteSpeaker(mute)
	{
		const muted = Boolean(mute);
		const stateChanged = this.speakerMuted !== muted;
		this.speakerMuted = muted;
		const volume = this.speakerMuted ? 0 : 1;

		const audioElements = Object.values(this.elements.audio);
		audioElements.forEach((element) => setVolume(element, volume));

		for (const userId of Object.keys(this.elements.screenAudio))
		{
			this.elements.screenAudio[userId].volume = volume;
		}

		if (stateChanged)
		{
			// one record per change and not per element: the walk touches every participant, so a record
			// of the element would give as many as there are cards. The state is re-applied on a timer
			// with the value it already holds, and such a walk changes nothing worth writing
			Util.sendLog({
				description: 'speaker mute changed',
				muted: this.speakerMuted,
				elementCount: audioElements.length,
			});
		}

		if (!this.buttons.speaker)
		{
			return;
		}

		if (this.speakerMuted)
		{
			this.buttons.speaker.disable();
			this.buttons.speaker.hideArrow();
		}
		else
		{
			this.buttons.speaker.enable();
			if (Hardware.canSelectSpeaker())
			{
				this.buttons.speaker.showArrow();
			}
		}
	}

	updateRerenderQueue(userId, reason)
	{
		if (!this.users[userId])
		{
			throw new Error(`User ${userId} is not a part of this call`);
		}

		if (reason === RerenderReason.VideoEnabled)
		{
			if (this.rerenderQueue.get(userId)?.reason === RerenderReason.VideoDisabled)
			{
				this.#cancelQueuedRerender(userId);
			}
			else if (this.waitingForUserMediaTimeouts.has(userId))
			{
				this.#renderAwaitedUserMedia(userId);
			}
			else
			{
				this.#enqueueRerender(userId, RerenderReason.VideoEnabled);
			}
		}
		else if (reason === RerenderReason.VideoDisabled)
		{
			if (this.rerenderQueue.get(userId)?.reason === RerenderReason.VideoEnabled)
			{
				this.#cancelQueuedRerender(userId);
			}
			else
			{
				this.#enqueueRerender(userId, RerenderReason.VideoDisabled);
			}
		}
	}

	#cancelQueuedRerender(userId)
	{
		this.rerenderQueue.delete(userId);
		if (this.rerenderQueue.size === 0)
		{
			clearTimeout(this.rerenderTimeout);
			this.rerenderTimeout = null;
		}
	}

	#renderAwaitedUserMedia(userId)
	{
		clearTimeout(this.waitingForUserMediaTimeouts.get(userId));
		this.waitingForUserMediaTimeouts.delete(userId);
		this.rerenderQueue.set(userId, {
			userId,
			reason: RerenderReason.VideoEnabled,
		});
		this.renderUserList();
	}

	#enqueueRerender(userId, reason)
	{
		if (!this.rerenderTimeout)
		{
			this.rerenderTimeout = setTimeout(() => {
				this.renderUserList();
			}, CHANGE_VIDEO_RERENDER_DELAY);
		}

		this.rerenderQueue.set(userId, {
			userId,
			reason,
		});
	}

	trackAvailabilityChanged(userId, kind, available)
	{
		const user = this.users[userId];
		if (!user)
		{
			// A track update for a user who already left: keep it in the client console only,
			// the race is expected and floods the log on large conferences.
			// eslint-disable-next-line no-console
			void console.warn(`User ${userId} is not a part of this call`);

			return;
		}

		const userModel = this.userRegistry.get(userId);

		if (kind === 'video' && available)
		{
			userModel.cameraState = true;
			this.updateRerenderQueue(userId, RerenderReason.VideoEnabled);
		}
		else if (kind === 'video' && !available)
		{
			userModel.cameraState = false;
			this.updateRerenderQueue(userId, RerenderReason.VideoDisabled);
		}
	}

	setVideoRenderer(userId, mediaRenderer)
	{
		const user = this.users[userId];
		if (!user)
		{
			throw new Error(`User ${userId} is not a part of this call`);
		}

		this.cache.delete('usersWithVideo');

		const userModel = this.userRegistry.get(userId);
		const userHasCameraVideo = userModel.cameraState;

		if (!('render' in mediaRenderer) || !Type.isFunction(mediaRenderer.render))
		{
			throw new Error('mediaRenderer should have method render');
		}

		if (!('kind' in mediaRenderer) || (mediaRenderer.kind !== 'video' && mediaRenderer.kind !== 'sharing'))
		{
			throw new Error('mediaRenderer should be of video kind');
		}

		user.videoRenderer = mediaRenderer;
		this.pictureInPictureCallWindow?.setVideoRenderer(userId, mediaRenderer);

		if (mediaRenderer.stream && mediaRenderer.kind === 'video' && !userHasCameraVideo)
		{
			userModel.cameraState = true;
			this.updateRerenderQueue(userId, RerenderReason.VideoEnabled);
		}
		else if (!mediaRenderer.stream && mediaRenderer.kind === 'video' && userHasCameraVideo)
		{
			userModel.cameraState = false;
			this.updateRerenderQueue(userId, RerenderReason.VideoDisabled);
		}

		if (isSameUser(this.centralUser.id, userId))
		{
			this.eventEmitter.emit(EventName.onHasMainStream, {
				userId: this.centralUser.id,
			});
		}
	}

	setUserMedia(userId, kind, track)
	{
		const user = this.users[userId];

		if (!user)
		{
			return;
		}

		switch (kind)
		{
			case 'audio':
				if (!this.elements.audio[userId])
				{
					this.elements.audio[userId] = Dom.create('audio');
					if (this.externalSpeakerManagement)
					{
						this.elements.audio[userId].playsInline = true;
					}
					else
					{
						Dom.append(this.elements.audio[userId], this.elements.audioContainer);
					}
					user.audioElement = this.elements.audio[userId];
					this.#watchAudioElement(userId, this.elements.audio[userId]);
				}

				setVolume(this.elements.audio[userId], this.speakerMuted ? 0 : 1);
				user.audioTrack = track;

				// A voice start deliberately queues no rerender of its own: it collides with the one
				// the grid already does for RerenderReason.VideoEnabled.
				break;

			case 'sharingAudio':
				if (!this.elements.screenAudio[userId])
				{
					this.elements.screenAudio[userId] = Dom.create('audio');
					Dom.append(this.elements.screenAudio[userId], this.elements.audioContainer);
					user.screenAudioElement = this.elements.screenAudio[userId];
				}

				this.elements.screenAudio[userId].volume = this.speakerMuted ? 0 : 1;
				user.screenAudioTrack = track;

				break;

			case 'video':
				user.videoTrack = track;
				this.pictureInPictureCallWindow?.setVideoRenderer(userId, new MediaRenderer({
					track,
					kind: 'video',
				}));
				this.#watchCameraTrack(userId, track);
				break;

			case 'screen':
				this.screenUsers[userId].videoTrack = track;
				this.pictureInPictureCallWindow?.setVideoRenderer(userId, new MediaRenderer({
					track,
					kind: 'sharing',
				}));
				this.updateUserList();
				this.setUserScreenState(userId, track !== null);
				break;

			default:
		}
	}

	// On the bare-track path the camera state reaches the model only as an event of its own, so a
	// single lost event would leave an avatar over a live camera once the card starts obeying that
	// state. The media corrects the model both ways here, the way setVideoRenderer() already does on
	// the renderer path.
	//
	// The correction cannot be one read of track.muted at arrival: a freshly received track is muted
	// until its first frames, so it would look like a camera that is off. What the correction listens
	// to is the change of that flag. Whichever source writes the state last wins, media or signal;
	// the guarantee is narrower -- a muted track is never counted as a camera, so a track arriving
	// while the camera is off cannot bring the frozen frame back.
	#watchCameraTrack(userId, track)
	{
		this.#forgetCameraTrack(userId);

		if (!track)
		{
			this.#applyCameraStateFromMedia(userId, false);

			return;
		}

		const onCameraGone = () => this.#applyCameraStateFromMedia(userId, false);
		const onCameraLive = () => this.#applyCameraStateFromMedia(userId, true);

		Event.bind(track, 'mute', onCameraGone);
		Event.bind(track, 'ended', onCameraGone);
		Event.bind(track, 'unmute', onCameraLive);

		this.cameraTrackWatchers.set(userId, { track, onCameraGone, onCameraLive });

		if (track.readyState === 'ended')
		{
			onCameraGone();
		}
		else if (!track.muted)
		{
			// a track that is already flowing sends no unmute of its own
			onCameraLive();
		}
	}

	#forgetCameraTrack(userId)
	{
		const watcher = this.cameraTrackWatchers.get(userId);
		if (!watcher)
		{
			return;
		}

		Event.unbind(watcher.track, 'mute', watcher.onCameraGone);
		Event.unbind(watcher.track, 'ended', watcher.onCameraGone);
		Event.unbind(watcher.track, 'unmute', watcher.onCameraLive);

		this.cameraTrackWatchers.delete(userId);
	}

	// The element outlives every track of the participant -- it is created once, reused until the call
	// ends and never taken out of elements.audio -- so the watcher is put on it at creation, once per
	// participant, and not on each change of the track the way the camera one is.
	#watchAudioElement(userId, element)
	{
		const onElementEvent = (event) => this.#logAudioElementState(userId, event.type);
		AUDIO_ELEMENT_EVENTS.forEach((eventName) => Event.bind(element, eventName, onElementEvent));

		this.audioElementWatchers.set(userId, { element, onElementEvent });
	}

	#logAudioElementState(userId, eventName)
	{
		const watcher = this.audioElementWatchers.get(userId);
		if (!watcher)
		{
			return;
		}

		const { element } = watcher;

		if (eventName === 'volumechange' && element[EXPECTED_VOLUME_CHANGE])
		{
			// our own assignment of the volume: muting the speaker already has a record of the whole
			// walk. The first volumechange spends the mark, one nobody asked for is written
			element[EXPECTED_VOLUME_CHANGE] = false;

			return;
		}

		if (eventName === 'emptied' && element[EXPECTED_EMPTIED])
		{
			// our own assignment of srcObject: the release already has its record, and a reattachment
			// is not an event of its own. The first emptied spends the mark, an unasked one is written
			element[EXPECTED_EMPTIED] = false;

			return;
		}

		Util.sendLog({
			description: 'audio element state changed',
			userModelId: this.users[userId]?.userModel?.id,
			event: eventName,
			paused: element.paused,
			volume: element.volume,
			readyState: element.readyState,
			srcObjectPresent: element.srcObject !== null,
		});
	}

	#forgetAudioElement(userId)
	{
		const watcher = this.audioElementWatchers.get(userId);
		if (!watcher)
		{
			return;
		}

		AUDIO_ELEMENT_EVENTS.forEach((eventName) => Event.unbind(watcher.element, eventName, watcher.onElementEvent));

		this.audioElementWatchers.delete(userId);
	}

	#forgetAudioElements()
	{
		for (const userId of this.audioElementWatchers.keys())
		{
			this.#forgetAudioElement(userId);
		}
	}

	#forgetCameraTracks()
	{
		for (const userId of this.cameraTrackWatchers.keys())
		{
			this.#forgetCameraTrack(userId);
		}
	}

	#applyCameraStateFromMedia(userId, cameraState)
	{
		if (this.destroyed || !this.users[userId])
		{
			return;
		}

		const userModel = this.userRegistry.get(userId);
		if (!userModel || userModel.cameraState === cameraState)
		{
			return;
		}

		userModel.cameraState = cameraState;
		this.updateRerenderQueue(
			userId,
			cameraState ? RerenderReason.VideoEnabled : RerenderReason.VideoDisabled,
		);
	}

	removeScreenUsers()
	{
		for (const userId of Object.keys(this.screenUsers))
		{
			this.screenUsers[userId].videoTrack = null;
		}
		this.updateUserList();
	}

	setBadNetworkIndicator(userId, badNetworkIndicator)
	{
		if (this.users[userId])
		{
			this.users[userId].badNetworkIndicator = badNetworkIndicator;
		}
	}

	setUserConnectionQuality(userId, connectionQuality)
	{
		if (this.users[userId])
		{
			this.users[userId].connectionQuality = connectionQuality;
		}

		if (this.localUser.id === userId)
		{
			this.localUser.connectionQuality = connectionQuality;
		}
	}

	applyIncomingVideoConstraints(activeUsers, inactiveUsers)
	{
		let users = [];
		let videoWidth = this.userSize.width;

		if (this.layout === Layouts.Grid)
		{
			users = activeUsers.map((userId) => {
				return { userId, videoWidth };
			});
		}
		else if (this.layout === Layouts.Centered)
		{
			const containerSize = this.elements.center.getBoundingClientRect();
			users = [];

			activeUsers.forEach((userId) => {
				videoWidth = isSameUser(this.centralUser.id, userId)
					? Math.floor(containerSize.width)
					: SIDE_USER_WIDTH;

				users.push({ userId, videoWidth });
			});
		}
		this.toggleSubscribingVideoInRenderUserList(users, true);

		users = inactiveUsers.map((userId) => {
			return { userId };
		});
		this.toggleSubscribingVideoInRenderUserList(users, false);
	}

	getDefaultCommonRecordState()
	{
		return createDefaultCommonRecordState();
	}

	// The state, the mirror the layers are compared against and the description of the button belong
	// together: the call may end while the recording runs, and a description left behind outlives it.
	#resetCommonRecordState()
	{
		this.commonRecordState = this.getDefaultCommonRecordState();
		this.#appliedRecordState = this.commonRecordState.state;
		this.#syncRecordButtonStateDescription();
	}

	setCommonRecordState(commonRecordState)
	{
		const previousState = this.#appliedRecordState;

		this.commonRecordState = commonRecordState;
		this.#appliedRecordState = this.commonRecordState?.state;

		if (this.buttons.recordStatus)
		{
			this.buttons.recordStatus.update(this.commonRecordState);
		}

		this.#syncRecordButtonStateDescription();

		if (!isSameUser(this.commonRecordState.userId, this.userId))
		{
			if ([CallCommonRecordState.Stopped, CallCommonRecordState.Destroyed].includes(this.commonRecordState.state))
			{
				this.unblockButtons(['record']);
			}
			else
			{
				this.blockButtons(['record']);
			}
		}

		if (this.elements.topPanel)
		{
			if ([CallCommonRecordState.Stopped, CallCommonRecordState.Destroyed].includes(this.commonRecordState.state))
			{
				delete (this.elements.topPanel.dataset.recordState);
			}
			else
			{
				this.elements.topPanel.dataset.recordState = commonRecordState.state;
			}
		}

		if (previousState !== this.#appliedRecordState)
		{
			this.#closeStaleCommonRecordPopups();
		}
	}

	// the record state is a description of the record button, never part of its name (WCAG 2.5.3)
	#syncRecordButtonStateDescription()
	{
		if (!this.buttons.record)
		{
			return;
		}

		const messageKey = {
			[CallCommonRecordState.Started]: 'CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE',
			[CallCommonRecordState.Resumed]: 'CALL_VIEW_RECORD_STATUS_ARIA_ACTIVE',
			[CallCommonRecordState.Paused]: 'CALL_VIEW_RECORD_STATUS_ARIA_PAUSED',
		}[this.commonRecordState?.state];

		this.buttons.record.setStateDescription(messageKey ? (Loc.getMessage(messageKey) ?? '') : '');
	}

	show()
	{
		if (!this.elements.root)
		{
			this.render();
		}
		Dom.append(this.elements.root, this.container);

		if (this.layout !== Layouts.Mobile)
		{
			this.startIntersectionObserver();
		}
		this.updateButtons();
		this.updateUserList();

		this.resumeVideo();
		this.toggleEars();
		this.visible = true;

		this.eventEmitter.emit(EventName.onShow);
		this.focusScope?.focusWindow(this.elements.root);

		// We specifically disable the face improve feature to improve call quality.
		this.disableFaceImprove();
		this.checkPanelOverflow();
	}

	hide()
	{
		this.closeCopilotNotify();
		this.clearCallcontrolPromo();
		if (this.overflownButtonsPopup)
		{
			this.overflownButtonsPopup.close();
		}

		const needsHistoryRestore = this.focusScope?.releaseBeforeDetach(this.elements.root) ?? false;

		Dom.remove(this.elements.root);

		// History restore runs only after the root left the document (ALG-02).
		if (needsHistoryRestore)
		{
			this.focusScope?.restoreAfterDetach();
		}

		this.visible = false;
	}

	startIntersectionObserver()
	{
		this.intersectionObserver = new IntersectionObserver(
			this.#onIntersectionChange.bind(this),
			{
				root: this.elements.userList.container,
				threshold: 0.5,
			},
		);
	}

	/**
	 * @param {CallUser} callUser
	 */
	observeIntersections(callUser)
	{
		if (this.intersectionObserver && callUser.elements.root)
		{
			this.intersectionObserver.observe(callUser.elements.root);
		}
	}

	/**
	 * @param {CallUser} callUser
	 */
	unobserveIntersections(callUser)
	{
		if (this.intersectionObserver && callUser.elements.root)
		{
			this.intersectionObserver.unobserve(callUser.elements.root);
		}
	}

	showDeviceSelector(bindElement)
	{
		if (this.deviceSelector)
		{
			return;
		}

		this.deviceSelectorInitiator = bindElement;

		this.deviceSelector = new DeviceSelector({
			viewElement: this.container,
			parentElement: bindElement,
			...(this.getCurrentCall ? { currentCall: this.getCurrentCall() } : {}),
			zIndex: this.baseZIndex + 500,
			microphoneEnabled: !Hardware.isMicrophoneMuted,
			microphoneId: this.microphoneId || Hardware.defaultMicrophone,
			cameraEnabled: Hardware.isCameraOn,
			cameraId: this.cameraId,
			speakerEnabled: !this.speakerMuted,
			speakerId: this.speakerId,
			allowNoiseSuppression: Hardware.enableNoiseSuppression,
			faceImproveEnabled: Util.isDesktop() && DesktopApi.isDesktop() && DesktopApi.getCameraSmoothingStatus(),
			allowFaceImprove: false,
			allowBackground: BackgroundDialog.isAvailable() && this.isIntranetOrExtranet,
			allowMask: BackgroundDialog.isMaskAvailable() && this.isIntranetOrExtranet,
			allowAdvancedSettings: !Type.isUndefined(window.BXIM) && this.isIntranetOrExtranet,
			switchCameraBlocked: this.isButtonBlocked('camera'),
			switchMicrophoneBlocked: this.isButtonBlocked('microphone'),
			callbacks: {
				onMicrophoneSelect: (deviceId) => this.#onMicrophoneSelected(deviceId),
				onMicrophoneSwitch: () => this.#onMicrophoneButtonClick(),
				onCameraSelect: (deviceId) => this.#onCameraSelected(deviceId),
				onCameraSwitch: () => this.#onCameraButtonClick(),
				onSpeakerSelect: (deviceId) => this.#onSpeakerSelected(deviceId),
				onSpeakerSwitch: () => this.#onSpeakerButtonClick(),
				onChangeNoiseSuppression: (allowNoiseSuppression) => this.#onChangeNoiseSuppression(allowNoiseSuppression),
				onChangeFaceImprove: (faceImproveEnabled) => this.#onChangeFaceImprove(faceImproveEnabled),
				onChangeVideoQuality: (params) => this.onChangeVideoQuality(params),
				onAdvancedSettingsClick: () => this.eventEmitter.emit(EventName.onOpenAdvancedSettings),
				onDestroy: () => {
					Dom.removeClass(this.buttons?.microphone.elements.arrow, 'rotate');
					Dom.removeClass(this.buttons?.camera.elements.arrow, 'rotate');
					this.deviceSelector = null;
					this.deviceSelectorInitiator?.setAttribute('aria-expanded', 'false');
					if (!document.activeElement || document.activeElement === document.body)
					{
						this.deviceSelectorInitiator?.focus();
					}
					this.deviceSelectorInitiator = null;
				},
				onShow: () => {
					// the chevron follows the popup, not the intent to open it: a throw while
					// building or showing the selector must not leave the button expanded
					this.deviceSelectorInitiator?.setAttribute('aria-expanded', 'true');
					this.eventEmitter.emit(EventName.onDeviceSelectorShow, {});
				},
			},
		});

		this.deviceSelector.show();
	}

	showCallMenu()
	{
		const menuItems = [
			{
				text: Loc.getMessage('IM_M_CALL_BTN_WANT_TO_SAY'),
				iconClass: 'hand',
				onClick: this.#onMobileCallMenuFloorRequestClick.bind(this),
			},
			{
				text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_PARTICIPANTS_LIST'),
				iconClass: 'participants',
				onClick: this.#onMobileCallMenShowParticipantsClick.bind(this),
			},
			{
				text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_COPY_INVITE'),
				iconClass: 'add-participant',
				onClick: this.#onMobileCallMenuCopyInviteClick.bind(this),

			},
			// eslint-disable-next-line unicorn/no-negated-condition
			!this.isIntranetOrExtranet
				? {
					text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME'),
					iconClass: 'change-name',
					onClick: () => {
						this.callMenu.close();
						setTimeout(this.showRenameSlider.bind(this), 100);
					},
				}
				: null,
			{
				separator: true,
			},
			{
				text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_CANCEL'),
				enabled: false,
				onClick: this.#onMobileCallMenuCancelClick.bind(this),
			},
		];

		this.callMenu = new MobileMenu({
			parent: this.elements.root,
			items: menuItems,
			onClose: () => this.callMenu.destroy(),
			onDestroy: () => {
				this.callMenu = null;
			},
		});

		this.callMenu.show();
	}

	showUserMenu(userId)
	{
		const userModel = this.userRegistry.get(userId);
		if (!userModel)
		{
			return;
		}

		let pinItem = null;
		if (this.pinnedUser && isSameUser(this.pinnedUser.id, userId))
		{
			pinItem = {
				text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_UNPIN'),
				iconClass: 'unpin',
				onClick: () => {
					this.userMenu.close();
					this.unpinUser();
				},
			};
		}
		else if (!isSameUser(this.userId, userId))
		{
			pinItem = {
				text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_PIN'),
				iconClass: 'pin',
				onClick: () => {
					this.userMenu.close();
					this.pinUser(userId);
				},
			};
		}

		const menuItems = [
			{
				userModel,
				enabled: false,
			},
			{
				separator: true,
			},
			pinItem,
			isSameUser(this.userId, userId) && !this.isIntranetOrExtranet
				? {
					text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME'),
					iconClass: 'change-name',
					onClick: () => {
						this.userMenu.close();
						setTimeout(this.showRenameSlider.bind(this), 100);
					},
				}
				: null,
			{
				separator: true,
			},
			{
				text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_CANCEL'),
				enabled: false,
				onClick: () => this.userMenu.close(),
			},
		];

		this.userMenu = new MobileMenu({
			parent: this.elements.root,
			items: menuItems,
			onClose: () => this.userMenu.destroy(),
			onDestroy: () => {
				this.userMenu = null;
			},
		});
		this.userMenu.show();
	}

	showParticipantsMenu()
	{
		if (this.participantsMenu)
		{
			return;
		}

		const menuItems = [{
			userModel: this.localUser.userModel,
			showSubMenu: true,
			onClick: () => {
				this.participantsMenu.close();
				this.showUserMenu(this.localUser.userModel.id);
			},
		}];

		[...this.userRegistry.users.values()].forEach((userModel) => {
			if (userModel.localUser || userModel.state !== UserState.Connected)
			{
				return;
			}

			if (menuItems.length > 0)
			{
				menuItems.push({
					separator: true,
				});
			}

			menuItems.push({
				userModel,
				showSubMenu: true,
				onClick: () => {
					this.participantsMenu.close();
					this.showUserMenu(userModel.id);
				},
			});
		});

		this.participantsMenu = new MobileMenu({
			parent: this.elements.root,
			items: menuItems,
			header: Loc.getMessage('IM_M_CALL_PARTICIPANTS').replace('#COUNT#', String(this.getConnectedUserCount(true))),
			largeIcons: true,

			onClose: () => {
				this.participantsMenu.destroy();
			},
			onDestroy: () => {
				this.participantsMenu = null;
			},
		});

		this.participantsMenu.show();
	}

	/**
	 * @param {Object} params
	 * @param {string} params.text
	 * @param {string} [params.subText]
	 */
	showMessage(params)
	{
		const statusNode = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-user-status bx-messenger-videocall-user-status-wide' },
		});

		if (Type.isStringFilled(params.text))
		{
			const textNode = Dom.create('div', {
				props: { className: 'bx-messenger-videocall-status-text' },
				text: params.text,
			});
			Dom.append(textNode, statusNode);
		}

		this.#showErrorLayout(statusNode);
	}

	hideMessage()
	{
		this.elements.overlay.textContent = '';
	}

	renderSelfTestCallLayout()
	{
		const errorContainer = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-error-container' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-error-container-icon-alert' },
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-error-message' },
					text: Loc.getMessage('CALL_CONNECTED_ERROR'),
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-error-button-self-test' },
					text: Loc.getMessage('CALL_RUN_SELF_TEST'),
					events: {
						click: () => {
							Util.startSelfTest();
						},
					},
				}),
			],
		});

		this.#showErrorLayout(errorContainer);
	}

	renderReloadPageLayout()
	{
		const errorContainer = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-error-container' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-error-container-icon-alert' },
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-error-message' },
					html: Loc.getMessage('CALL_SECURITY_KEY_CHANGED', { '[break]': '<br/>' }),
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-error-button-self-test' },
					text: Loc.getMessage('CALL_RELOAD_PAGE'),
					events: {
						click: () => {
							this.destroy();
							location.reload();
						},
					},
				}),
			],
		});

		this.#showErrorLayout(errorContainer);
	}

	#showErrorLayout(content)
	{
		if (!this.elements.root)
		{
			this.render();
			Dom.append(this.elements.root, this.container);
		}

		if (this.elements.overlay.childElementCount)
		{
			Dom.clean(this.elements.overlay);
		}

		Dom.append(content, this.elements.overlay);
	}

	/**
	 * @param {Object} params
	 * @param {string} params.text
	 * @param {string} [params.subText]
	 */
	showFatalError(params)
	{
		this.showMessage(params);
		this.#prepareErrorState();
	}

	showSecurityKeyError()
	{
		this.renderReloadPageLayout();
		this.#prepareErrorState();
	}

	showSelfTest()
	{
		this.renderSelfTestCallLayout();
		this.#prepareErrorState();
	}

	#prepareErrorState()
	{
		this.setUiState(UiState.Error);
		// in some cases video elements may still be shown on the error screen, let's hide them
		Dom.style(this.elements.userList.container, 'display', 'none');
	}

	close()
	{
		// the window closes for good, and the conference does not destroy it afterwards: a microphone
		// the hold policy still holds is handed back here, while the subscribers of the window are
		// there to carry the command
		this.pushToTalkCoordinator?.stop();

		if (this.buttons.recordStatus)
		{
			this.buttons.recordStatus.stopViewUpdate();
		}

		// removing the root below takes the layers with it, but neither the document listeners of
		// main.popup nor the focus trap; the window is going away, so a block the guard holds goes too
		this.closeCommonRecordPopups();
		this.stopRecordPopupHotKeyGuard(true);
		this.#resetCommonRecordState();

		if (this.elements.root)
		{
			Dom.remove(this.elements.root);
		}

		if (this.pictureInPictureCallWindow)
		{
			this.toggleStatePictureInPictureCallWindow(false);
		}

		this.visible = false;
		this.eventEmitter.emit(EventName.onClose);

		this.clearCallcontrolPromo();
	}

	setSize(size)
	{
		if (this.size === size)
		{
			return;
		}

		this.size = size;
		// folding takes the container out of the DOM without any focus event of the browser window,
		// so this is the only moment the zone learns that the call window left it
		this.pushToTalkCoordinator?.onFoldChanged();

		if (this.size === Size.Folded)
		{
			this.clearCallcontrolPromo();

			if (this.overflownButtonsPopup)
			{
				this.overflownButtonsPopup.close();
			}

			if (this.elements.panel)
			{
				Dom.addClass(this.elements.panel, 'bx-messenger-videocall-panel-folded');
			}
			Dom.remove(this.elements.container);
			Dom.remove(this.elements.topPanel);
			Dom.style(this.elements.root, 'maxWidth', null);
			this.updateButtons();
		}
		else
		{
			if (this.elements.panel)
			{
				Dom.removeClass(this.elements.panel, 'bx-messenger-videocall-panel-folded');
			}
			Dom.append(this.elements.topPanel, this.elements.wrap);
			Dom.append(this.elements.container, this.elements.wrap);
			if (this.maxWidth > 0)
			{
				Dom.style(this.elements.root, 'maxWidth', `${Math.max(this.maxWidth, MIN_WIDTH)}px`);
			}
			this.updateButtons();
			this.updateUserList();
			this.resumeVideo();
		}

		if (this.pictureInPictureCallWindow)
		{
			this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
		}
	}

	isButtonBlocked(buttonName)
	{
		switch (buttonName)
		{
			case 'camera':
				return this.#isCameraButtonBlocked();
			case 'chat':
				return !this.showChatButtons || this.blockedButtons[buttonName] === true;
			case 'microphone':
				return !Util.havePermissionToBroadcast('mic') || this.blockedButtons[buttonName] === true;
			case 'floorRequest':
				return (this.uiState !== UiState.Connected) || this.blockedButtons[buttonName] === true;
			case 'screen':
				return !this.showShareButton || (!this.isScreenSharingSupported() || this.isFullScreen) || this.blockedButtons[buttonName] === true || !Util.havePermissionToBroadcast('screenshare');
			case 'users':
				return !this.showUsersButton || this.blockedButtons[buttonName] === true;
			case 'record':
				return !this.showRecordButton || this.blockedButtons[buttonName] === true;
			case 'document':
				return !this.showDocumentButton || this.blockedButtons[buttonName] === true;
			case 'copilot':
				return !this.showCopilotButton || this.blockedButtons[buttonName] === true;
			default:
				return this.blockedButtons[buttonName] === true;
		}
	}

	isButtonHidden(buttonName)
	{
		return this.hiddenButtons[buttonName] === true;
	}

	showButton(buttonCode)
	{
		this.showButtons([buttonCode]);
	}

	hideButton(buttonCode)
	{
		this.hideButtons([buttonCode]);
	}

	#isCameraButtonBlocked()
	{
		const isForceBlock = this.blockedButtons.camera === true;
		const noCamPermission = !Util.havePermissionToBroadcast('cam');
		const isUserConnecting = this.localUser.userModel.state === UserState.Connecting;

		return isForceBlock || noCamPermission || isUserConnecting;
	}

	checkPanelOverflow()
	{
		const delta = this.elements.panel.scrollWidth - this.elements.panel.offsetWidth;
		const mediumButtonMinWidth = (this.layout === Layouts.Mobile)
			? 60
			: 66; // todo: move to constants maybe? or maybe even calculate dynamically somehow?

		if (delta > 0)
		{
			this.#hideOverflownButtons(delta, mediumButtonMinWidth);

			return true;
		}

		return this.#restoreOverflownButtons(mediumButtonMinWidth);
	}

	#hideOverflownButtons(delta, mediumButtonMinWidth)
	{
		let countOfButtonsToHide = Math.ceil(delta / mediumButtonMinWidth) + 1;

		const buttons = this.getButtonList();

		for (let i = buttons.length - 1; i >= 0; i--)
		{
			if (buttons[i] === 'hangupOptions' || buttons[i] === 'hangup' || buttons[i] === 'close' || buttons[i] === 'more')
			{
				continue;
			}

			this.overflownButtons[buttons[i]] = true;
			countOfButtonsToHide -= 1;
			if (!countOfButtonsToHide)
			{
				break;
			}
		}
	}

	#restoreOverflownButtons(mediumButtonMinWidth)
	{
		const hiddenButtonsCount = Object.keys(this.overflownButtons).length;
		if (hiddenButtonsCount > 0)
		{
			const unusedPanelSpace = this.calculateUnusedPanelSpace();
			if (unusedPanelSpace > 320)
			{
				this.#restoreButtonsForSpace(unusedPanelSpace, hiddenButtonsCount, mediumButtonMinWidth);

				return true;
			}
		}

		return false;
	}

	#restoreButtonsForSpace(unusedPanelSpace, hiddenButtonsCount, mediumButtonMinWidth)
	{
		let countOfButtonsToShow = Math.min(Math.floor(unusedPanelSpace / mediumButtonMinWidth), hiddenButtonsCount);
		const buttonsLeftHidden = hiddenButtonsCount - countOfButtonsToShow;
		if (buttonsLeftHidden === 1)
		{
			countOfButtonsToShow += 1;
		}

		if (countOfButtonsToShow === hiddenButtonsCount)
		{
			// show all buttons;
			this.overflownButtons = {};
		}
		else
		{
			for (let i = 0; i < countOfButtonsToShow; i++)
			{
				delete this.overflownButtons[Object.keys(this.overflownButtons)[0]];
			}
		}
	}

	/**
	 * @param {string[]} buttons Array of buttons names to show
	 */
	showButtons(buttons)
	{
		if (!Type.isArray(buttons))
		{
			void console.error('buttons should be array');
		}

		buttons.forEach((buttonName) => {
			if (Object.hasOwn(this.hiddenButtons, buttonName))
			{
				delete this.hiddenButtons[buttonName];
			}
		});

		this.updateButtons();
	}

	/**
	 * @param {string[]} buttons Array of buttons names to hide
	 */
	hideButtons(buttons)
	{
		if (!Type.isArray(buttons))
		{
			void console.error('buttons should be array');
		}

		buttons.forEach((buttonName) => {
			this.hiddenButtons[buttonName] = true;
		});
		this.updateButtons();
	}

	blockAddUser()
	{
		this.blockButtons(['add']);
		if (this.elements.userList.addButton)
		{
			Dom.remove(this.elements.userList.addButton);
		}
	}

	unblockAddUser()
	{
		this.unblockButtons(['add']);

		this.updateButtons();
	}

	blockSwitchCamera(options)
	{
		this.blockButtons(['camera'], options);
	}

	unblockSwitchCamera(options)
	{
		this.unblockButtons(['camera'], options);
	}

	blockSwitchMicrophone(options)
	{
		this.blockButtons(['microphone'], options);
	}

	unblockSwitchMicrophone(options)
	{
		this.unblockButtons(['microphone'], options);
	}

	blockScreenSharing()
	{
		this.blockButtons(['screen']);
	}

	blockHistoryButton()
	{
		this.blockButtons(['history']);
	}

	/**
	 * @param {string[]} buttons Array of buttons names to block
	 * @param {object} [options]
	 * @param {boolean} [options.announce=true] Whether the picture-in-picture window speaks the change
	 */
	blockButtons(buttons, options)
	{
		if (!Type.isArray(buttons))
		{
			void console.error('buttons should be array');
		}

		buttons.forEach((buttonName) => {
			this.blockedButtons[buttonName] = true;
			if (this.buttons[buttonName])
			{
				this.buttons[buttonName].setBlocked(true);
			}
		});

		this.#syncDeviceSelectorAvailability();

		this.syncPictureInPictureBlockedButtons(options);
	}

	/**
	 * @param {string[]} buttons Array of buttons names to unblock
	 * @param {object} [options]
	 * @param {boolean} [options.announce=true] Whether the picture-in-picture window speaks the change
	 */
	unblockButtons(buttons, options)
	{
		if (!Type.isArray(buttons))
		{
			void console.error('buttons should be array');
		}

		buttons.forEach((buttonName) => {
			delete this.blockedButtons[buttonName];
			if (this.buttons[buttonName])
			{
				this.buttons[buttonName].setBlocked(this.isButtonBlocked(buttonName));
			}
		});

		this.#syncDeviceSelectorAvailability();

		this.syncPictureInPictureBlockedButtons(options);
	}

	/**
	 * Keeps the open device selector on the same blocking predicate as the panel buttons.
	 *
	 * The predicate reads more than the blocked list - the camera also follows uiState - so both
	 * columns are re-read on every button update, not only when the blocked list itself changes.
	 */
	#syncDeviceSelectorAvailability()
	{
		if (!this.deviceSelector)
		{
			return;
		}

		this.deviceSelector.toggleMicrophoneAvailability(!this.isButtonBlocked('microphone'));
		this.deviceSelector.toggleCameraAvailability(!this.isButtonBlocked('camera'));
	}

	disableMediaSelection()
	{
		this.mediaSelectionBlocked = true;
	}

	enableMediaSelection()
	{
		this.mediaSelectionBlocked = false;
		if (this.buttons.microphone && this.isMediaSelectionAllowed())
		{
			this.buttons.microphone.showArrow();
		}

		if (this.buttons.camera && this.isMediaSelectionAllowed())
		{
			this.buttons.camera.showArrow();
		}
	}

	isMediaSelectionAllowed()
	{
		return this.layout !== Layouts.Mobile
			&& (this.uiState === UiState.Preparing || this.uiState === UiState.Connected)
			&& !this.mediaSelectionBlocked
			&& !this.isFullScreen;
	}

	getButtonList()
	{
		let result = [];

		if (this.uiState === UiState.Error)
		{
			result.push('close');
		}

		if (this.uiState === UiState.Initializing)
		{
			result.push('hangup');
		}

		if (this.size === Size.Folded)
		{
			result.push('title', 'spacer', 'returnToCall', 'hangup');
		}

		if (result.length > 0)
		{
			this.needToRerenderButtonList = this.previousButtonList.toString() !== result.toString();
			this.previousButtonList = result;

			return result;
		}

		result = this.#getMainButtonList();

		result = result.filter((buttonCode) => {
			return !Object.prototype.hasOwnProperty.call(this.hiddenButtons, buttonCode)
				&& !Object.prototype.hasOwnProperty.call(this.overflownButtons, buttonCode);
		});

		if (Object.keys(this.overflownButtons).length > 0 && isBottomCenterMenuVisible(this.uiState))
		{
			result.push('more');
		}

		if (this.uiState === UiState.Preparing)
		{
			result.push('close');
		}
		else
		{
			result.push('hangup');
		}

		if (
			!Object.prototype.hasOwnProperty.call(this.hiddenButtons, 'hangupOptions')
			&& this.isIntranetOrExtranet
		)
		{
			result.push('hangupOptions');
		}

		this.needToRerenderButtonList = this.previousButtonList.toString() !== result.toString();
		this.previousButtonList = result;

		return result;
	}

	#getMainButtonList()
	{
		const result = [];

		result.push('microphone', 'camera');

		if (this.layout === Layouts.Mobile)
		{
			result.push('mobileMenu');
		}
		else
		{
			result.push('speaker');
		}

		const bottomCenterMenuIsVisible = isBottomCenterMenuVisible(this.uiState);

		if (bottomCenterMenuIsVisible)
		{
			result.push('chat');
		}

		if (this.layout !== Layouts.Mobile)
		{
			result.push('users');
		}

		if (this.layout !== Layouts.Mobile && bottomCenterMenuIsVisible)
		{
			result.push('floorRequest', 'screen', 'record', 'document');
		}

		if (this.layout !== Layouts.Mobile && CallAI.serviceEnabled && bottomCenterMenuIsVisible)
		{
			result.push('copilot');
		}

		return result;
	}

	getTopButtonList()
	{
		let result = [];

		if (this.layout === Layouts.Mobile)
		{
			return ['participantsMobile'];
		}
		result.push('watermark', 'protected', 'recordStatus', 'spacer');

		if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile)
		{
			result.push('grid');
		}

		if (this.uiState !== UiState.Preparing && this.isFullScreenSupported() && this.layout !== Layouts.Mobile)
		{
			result.push('fullscreen');
		}

		if (this.uiState === UiState.Connected && this.layout !== Layouts.Mobile)
		{
			result.push('feedback');
		}

		if (
			this.uiState === UiState.Connected
			&& this.layout !== Layouts.Mobile
			&& this.#guestLink !== null
		)
		{
			result.push('link');
		}

		if (
			this.uiState === UiState.Connected
			&& this.layout !== Layouts.Mobile
			&& Util.canControlChangeSettings()
			&& Util.isUserControlFeatureEnabled()
		)
		{
			result.push('callcontrol');
		}

		if (this.uiState !== UiState.Preparing)
		{
			result.push('participants');
		}

		result = result.filter((buttonCode) => !Object.hasOwn(this.hiddenTopButtons, buttonCode));

		this.needToRerenderTopButtonList = this.previousTopButtonList.toString() !== result.toString();
		this.previousTopButtonList = result;

		return result;
	}

	render()
	{
		this.#createRootLayout();

		this.talkingService.init({
			root: this.elements.root,
		});
		this.talkingService.refreshQueue();

		this.#createCallPanel();

		if (this.layout === Layouts.Mobile)
		{
			this.#createMobileElements();
		}

		this.centralUser.mount(this.elements.center);

		this.#createUserBlock();

		this.#createUserListElements();

		this.#applyLayoutSetup();

		this.resizeObserver.observe(this.elements.root);
		this.resizeObserver.observe(this.container);

		return this.elements.root;
	}

	#createRootLayout()
	{
		this.elements.root = Dom.create('div', {
			props: { className: 'bx-messenger-videocall bx-messenger-videocall-scope' },
			attrs: {
				role: 'region',
				tabindex: '-1',
				// Seeded from the accessible name only: this.title is a bare, HTML-encoded person name
				// and would name the region "Ivan" instead of one of the four allowed forms.
				'aria-label': this.getRootAccessibleName(),
			},
			children: [
				this.elements.wrap = Dom.create('div', {
					props: { className: `bx-messenger-videocall-wrap ${this.isCopilotActive ? 'bx-messenger-videocall-wrap-with-copilot' : ''}` },
					attrs: { 'data-testid': 'call-window-wrap' },
					children: [
						this.elements.container = Dom.create('div', {
							props: { className: 'bx-messenger-videocall-inner' },
							children: [
								this.elements.center = Dom.create('div', {
									props: { className: 'bx-messenger-videocall-central-user' },
									events: {
										touchstart: this.#onCenterTouchStart.bind(this),
										touchend: this.#onCenterTouchEnd.bind(this),
									},
								}),
								this.elements.pageNavigatorLeft = Dom.create('div', {
									props: { className: 'bx-messenger-videocall-page-navigator left' },
									children: [
										this.elements.pageNavigatorLeftCounter = Dom.create('div', {
											props: { className: 'bx-messenger-videocall-page-navigator-counter left' },
											html: `${this.currentPage - 1}&nbsp;/&nbsp;${this.pagesCount}`,
										}),
										Dom.create('div', {
											props: { className: 'bx-messenger-videocall-page-navigator-icon left' },
										}),
									],
									events: {
										click: this.#onLeftPageNavigatorClick.bind(this),
									},
								}),
								this.elements.pageNavigatorRight = Dom.create('div', {
									props: { className: 'bx-messenger-videocall-page-navigator right' },
									children: [
										this.elements.pageNavigatorRightCounter = Dom.create('div', {
											props: { className: 'bx-messenger-videocall-page-navigator-counter right' },
											html: `${this.currentPage + 1}&nbsp;/&nbsp;${this.pagesCount}`,
										}),
										Dom.create('div', {
											props: { className: 'bx-messenger-videocall-page-navigator-icon right' },
										}),
									],
									events: {
										click: this.#onRightPageNavigatorClick.bind(this),
									},
								}),
							],
						}),
						this.elements.topPanel = Dom.create('div', {
							props: { className: 'bx-messenger-videocall-top-panel' },
						}),
						this.elements.notificationPanel = Dom.create('div', {
							props: { className: 'bx-messenger-videocall-notification-panel' },
						}),
						this.elements.bottom = Dom.create('div', {
							props: { className: 'bx-messenger-videocall-bottom' },
							children: [
								this.elements.userSelectorContainer = Dom.create('div', {
									props: { className: 'bx-messenger-videocall-bottom-user-selector-container' },
								}),
								this.elements.pinnedUserContainer = Dom.create('div', {
									props: { className: 'bx-messenger-videocall-bottom-pinned-user-container' },
								}),
							],
						}),
					],
				}),
			],
			events: {
				click: this.#onBodyClick.bind(this),
			},
		});
	}

	#createCallPanel()
	{
		if (this.showButtonPanel)
		{
			this.elements.panel = Dom.create('div', {
				props: { className: 'bx-messenger-videocall-panel' },
				attrs: { 'data-testid': 'call-panel' },
			});
			Dom.append(this.elements.panel, this.elements.bottom);
		}
		else
		{
			Dom.addClass(this.elements.root, 'bx-messenger-videocall-no-button-panel');
		}
	}

	#createMobileElements()
	{
		this.userSelector = new UserSelectorMobile({
			userRegistry: this.userRegistry,
		});
		this.userSelector.mount(this.elements.userSelectorContainer);

		this.elements.ear.left = Dom.create('div', {
			props: {
				className: 'bx-messenger-videocall-mobile-ear left',
			},
			events: {
				click: this.#onLeftEarClick.bind(this),
			},
		});
		this.elements.ear.right = Dom.create('div', {
			props: {
				className: 'bx-messenger-videocall-mobile-ear right',
			},
			events: {
				click: this.#onRightEarClick.bind(this),
			},
		});
		this.elements.localUserMobile = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-local-user-mobile' },
		});

		if (window.innerHeight < window.innerWidth)
		{
			Dom.addClass(this.elements.root, 'orientation-landscape');
		}

		Dom.append(this.elements.ear.left, this.elements.wrap);
		Dom.append(this.elements.ear.right, this.elements.wrap);
		Dom.append(this.elements.localUserMobile, this.elements.wrap);
	}

	#createUserBlock()
	{
		this.elements.overlay = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-overlay' },
		});

		this.elements.userBlock = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-user-block' },
			children: [
				this.elements.ear.top = Dom.create('div', {
					props: { className: 'bx-messenger-videocall-ear bx-messenger-videocall-ear-top' },
					children: [
						Dom.create('div', {
							props: { className: 'bx-messenger-videocall-ear-icon' },
						}),
					],
					events: {
						click: this.#onTopPageNavigatorClick.bind(this),
					},
				}),
				this.elements.ear.bottom = Dom.create('div', {
					props: { className: 'bx-messenger-videocall-ear bx-messenger-videocall-ear-bottom' },
					children: [
						Dom.create('div', {
							props: { className: 'bx-messenger-videocall-ear-icon' },
						}),
					],
					events: {
						click: this.#onBottomPageNavigatorClick.bind(this),
					},
				}),
			],
		});
	}

	#createUserListElements()
	{
		this.elements.userList.container = Dom.create('div', {
			props: {
				className: 'bx-messenger-videocall-user-list',
			},
			events: {
				scroll: Runtime.debounce(this.toggleEars.bind(this), 300),
				wheel: (e) => {
					this.elements.userList.container.scrollTop += e.deltaY;
				},
			},
		});

		this.elements.userList.addButton = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-user-add' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-user-add-inner' },
				}),
			],
			style: {
				order: addButtonPosition,
			},
			events: {
				click: this.#onAddButtonClick.bind(this),
			},
		});
	}

	#applyLayoutSetup()
	{
		if (this.layout === Layouts.Centered || this.layout === Layouts.Mobile)
		{
			this.centralUser.mount(this.elements.center);
			this.eventEmitter.emit(EventName.onHasMainStream, {
				userId: this.centralUser.id,
				otherUsers: [...this.activeUsers],
			});
			Dom.addClass(this.elements.root, 'bx-messenger-videocall-centered');
			if (this.layout !== Layouts.Mobile)
			{
				Dom.append(this.elements.userBlock, this.elements.container);
			}
		}

		if (this.layout === Layouts.Grid)
		{
			Dom.addClass(this.elements.root, 'bx-messenger-videocall-grid');
		}

		if (this.layout === Layouts.Mobile)
		{
			Dom.addClass(this.elements.root, 'bx-messenger-videocall-fullscreen-mobile');
		}
	}

	toggleSubscribingVideoInRenderUserList(participants, showVideo)
	{
		if (participants.length > 0)
		{
			this.eventEmitter.emit(EventName.onToggleSubscribe, { participants, showVideo });
		}
	}

	getOrderingRules()
	{
		const rules = {
			[RerenderReason.VideoEnabled]: [],
			[RerenderReason.VideoDisabled]: [],
			[RerenderReason.UserDisconnected]: null,
		};

		this.rerenderQueue.forEach((el) => {
			switch (el.reason)
			{
				case RerenderReason.UserDisconnected:
					rules[el.reason] = {
						id: el.userId,
						order: this.userRegistry.get(el.userId).prevOrder,
					};
					break;

				case RerenderReason.VideoEnabled:
				case RerenderReason.VideoDisabled:
					rules[el.reason].push({
						id: el.userId,
						order: this.userRegistry.get(el.userId).order,
					});
					break;

				default:
			}
		});

		this.rerenderQueue.clear();
		rules[RerenderReason.VideoEnabled].sort((a, b) => a.order - b.order);
		rules[RerenderReason.VideoDisabled].sort((a, b) => a.order - b.order);

		return rules;
	}

	applyOrderChanges(changes)
	{
		if (!Type.isArray(changes))
		{
			return;
		}

		changes.forEach((change) => {
			if (change.type === SwapType.Direct)
			{
				change.to.userModel.moveTo(change.to.order);
				this.cache.delete('activeUsers');
			}
			else if (change.type === SwapType.Replace && change.to && change.from)
			{
				change.to.userModel.takeOrderOf(change.from.order);
				change.from.userModel.moveTo(change.to.order);
				this.cache.delete('activeUsers');
			}
		});
	}

	// Pure with respect to `rules`: the caller keeps its arrays untouched and reads the leftovers
	// from the returned value.
	#processVideoRules(rules, params)
	{
		const videoEnabled = rules[RerenderReason.VideoEnabled];
		const videoDisabled = rules[RerenderReason.VideoDisabled];
		const diffBetweenChanges = videoEnabled.length - videoDisabled.length;
		const lessChanges = diffBetweenChanges > 0 ? videoDisabled : videoEnabled;
		const moreChanges = diffBetweenChanges > 0 ? videoEnabled : videoDisabled;

		if (videoEnabled.length > 0 && videoDisabled.length > 0)
		{
			lessChanges.forEach((el, index) => {
				const toUser = this.userRegistry.get(el.id);
				const fromUser = this.userRegistry.get(moreChanges[index].id);

				params.orderChanges.push({
					type: SwapType.Replace,
					to: {
						userModel: fromUser,
						order: fromUser.order,
					},
					from: {
						userModel: toUser,
						order: toUser.order,
					},
				});
			});
		}

		this.applyOrderChanges(params.orderChanges);
		params.clearOrderChanges();

		if (diffBetweenChanges === 0)
		{
			return { videoEnabled: [], videoDisabled: [] };
		}

		const unpaired = moreChanges.slice(moreChanges.length - Math.abs(diffBetweenChanges));

		if (diffBetweenChanges < 0)
		{
			return { videoEnabled: [], videoDisabled: unpaired };
		}

		unpaired.forEach((el) => {
			params.orderChanges.push({
				type: SwapType.Replace,
				from: {
					userModel: this.userRegistry.get(el.id),
					order: this.userRegistry.get(el.id).order,
				},
			});
			params.incompleteSwaps.push(params.orderChanges.length);
		});

		return { videoEnabled: unpaired, videoDisabled: [] };
	}

	processDisconnectRules(rules, params)
	{
		if (!rules[RerenderReason.UserDisconnected])
		{
			return;
		}

		const userModel = this.userRegistry.get(rules[RerenderReason.UserDisconnected].id);

		if (userModel.prevCameraState)
		{
			params.markDisconnectedUserHadVideo();
		}
	}

	completeVideoEnableSwap(userModel, params)
	{
		const swapRemains = params.incompleteSwaps.length;

		if (userModel.state === UserState.Calling)
		{
			return;
		}

		const userAlreadyProcessed = params.usersToKeepActive.includes(userModel.id);

		if (params.usersWithEnabledVideo.includes(userModel.id) && !userAlreadyProcessed)
		{
			params.incompleteSwaps.shift();
			params.usersToKeepActive.push(userModel.id);
		}
		else if (!userModel.cameraState)
		{
			const index = params.incompleteSwaps[swapRemains - 1] - 1;
			const userEnabledVideo = params.orderChanges[index].from.userModel.id;
			const currenUserFromCurrentPage = params.possibleActiveUsers?.includes(userModel.id);
			const changedUserFromCurrentPage = params.possibleActiveUsers?.includes(userEnabledVideo);

			params.setOrderChangeTarget(index, {
				userModel,
				order: userModel.order,
			});

			if (currenUserFromCurrentPage && !changedUserFromCurrentPage)
			{
				params.removeUserFromCurrentPage();
				params.requestUserDeactivation();
			}
			else if (changedUserFromCurrentPage && !currenUserFromCurrentPage)
			{
				params.usersToForceDeactivation.push(userEnabledVideo);
			}
			else if (currenUserFromCurrentPage && changedUserFromCurrentPage)
			{
				params.usersToKeepActive.push(userEnabledVideo);
			}

			params.incompleteSwaps.pop();
		}
	}

	completeVideoDisabledSwap(params)
	{
		let usersProcessed = 0;

		params.unpairedVideoDisabled.forEach((el) => {
			const userWithoutVideo = this.userRegistry.get(el.id);
			const userWithoutVideoIndex = params.activeUsers.indexOf(el.id);
			const userWithoutVideoPage = Math.ceil((userWithoutVideoIndex + 1) / this.usersPerPage);
			const skipUsers = (userWithoutVideoPage - 1) * this.usersPerPage;
			const numberOfUsersWithVideoForSwap = params.usersWithVideo.length - skipUsers;
			const userToSwap = params.usersWithVideo[params.usersWithVideo.length - 1 - usersProcessed];
			// we should add '&& (userWithoutVideo.wasTalkingAgo() <= 60 * 1000)' below
			// to prevent speaking users swap
			const canCompleteVideoSwap = userToSwap && userToSwap.order > el.order;

			if (canCompleteVideoSwap && (numberOfUsersWithVideoForSwap - usersProcessed >= 0))
			{
				usersProcessed++;
				params.orderChanges.push({
					type: SwapType.Replace,
					to: {
						userModel: userWithoutVideo,
						order: userWithoutVideo.order,
					},
					from: {
						userModel: userToSwap,
						order: userToSwap.order,
					},
				});

				const userToSwapIndex = params.activeUsers.indexOf(userToSwap.id);
				const userToSwapPage = Math.ceil((userToSwapIndex + 1) / this.usersPerPage);

				if (userWithoutVideoPage === this.currentPage && userToSwapPage > this.currentPage)
				{
					params.usersToKeepActive.push(userToSwap.id);
					params.usersToForceDeactivation.push(el.id);
					params.requestUserDeactivation();
				}
				else if (userToSwapPage === this.currentPage && userToSwapPage > userWithoutVideoPage)
				{
					params.usersToKeepActive.push(el.id);
					params.usersToForceDeactivation.push(userToSwap.id);
					params.requestUserDeactivation();
				}
			}
		});

		this.applyOrderChanges(params.orderChanges);
	}

	calculateUserActive(userId, currentStatus, userSkipped, params)
	{
		if (params.usersWithEnabledVideo.includes(userId) && !userSkipped && !params.possibleActiveUsers.includes(userId))
		{
			params.addUserToCurrentPage();
			params.cancelUserDeactivation();

			return true;
		}

		if (params.currentPageUsers + params.usersToDeactivate > this.usersPerPage)
		{
			params.removeUserFromCurrentPage();

			return false;
		}

		return currentStatus;
	}

	completeDisconnectSwap(rules, params)
	{
		const disconnectedUser = rules[RerenderReason.UserDisconnected];
		if (!disconnectedUser)
		{
			return;
		}

		const disconnectedUserFromCurrentPage = this.#isDisconnectedUserOnCurrentPage(disconnectedUser, params);

		const userToSwap = params.disconnectedUserHadVideo
			? params.usersWithVideo[params.usersWithVideo.length - 1]
			: this.userRegistry.get(params.activeUsers[params.activeUsers.length - 1]);

		if (!userToSwap || userToSwap.order <= disconnectedUser.order)
		{
			return;
		}

		params.orderChanges.push({
			type: SwapType.Direct,
			to: {
				userModel: userToSwap,
				order: disconnectedUser.order,
			},
		});

		if (
			this.currentPage !== this.pagesCount
			&& disconnectedUserFromCurrentPage
			&& !params.possibleActiveUsers.includes(userToSwap.id)
		)
		{
			params.usersToKeepActive.push(userToSwap.id);
			params.requestUserDeactivation();
		}

		this.applyOrderChanges(params.orderChanges);
	}

	#isDisconnectedUserOnCurrentPage(disconnectedUser, params)
	{
		const lowerOrderOnCurrentPage = this.userRegistry.get(params.possibleActiveUsers[0])?.order;
		const higherOrderOnCurrentPage = this.userRegistry.get(
			params.possibleActiveUsers[params.possibleActiveUsers.length - 1],
		)?.order;

		if (this.currentPage === 1)
		{
			return disconnectedUser.order < lowerOrderOnCurrentPage
				|| (disconnectedUser.order > lowerOrderOnCurrentPage && disconnectedUser.order < higherOrderOnCurrentPage);
		}

		const skipUsers = (this.currentPage - 2) * this.usersPerPage;
		const activeUsersFromPreviousPage = params.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
		const lastActiveUserFromPreviousPage = this.userRegistry.get(
			activeUsersFromPreviousPage[activeUsersFromPreviousPage.length - 1],
		);

		return (disconnectedUser.order > lowerOrderOnCurrentPage
				&& disconnectedUser.order < higherOrderOnCurrentPage)
			|| (disconnectedUser.order < lowerOrderOnCurrentPage
				&& disconnectedUser.order > lastActiveUserFromPreviousPage?.order);
	}

	renderAddUserButtonInList()
	{
		const showAdd = this.showAddUserButtonInList && this.layout === Layouts.Centered && this.uiState === UiState.Connected && !this.isButtonBlocked('add') && this.getConnectedUserCount() < this.userLimit - 1 && !this.isFullScreen && this.elements.userList.addButton;

		if (showAdd)
		{
			Dom.append(this.elements.userList.addButton, this.elements.userList.container);

			return;
		}

		Dom.remove(this.elements.userList.addButton);
	}

	renderUserList()
	{
		clearTimeout(this.rerenderTimeout);
		this.rerenderTimeout = null;
		const prevActiveUsers = new Set(this.activeUsers);

		this.activeUsers.clear();

		const showLocalUser = shouldShowLocalUser(this.localUser.userModel);
		let userCount = 0;
		let skippedUsers = 0;
		let renderedUsers = 0;

		const { orderingRules, orderingParams, skipUsers } = this.#prepareUserOrdering();

		const userModels = [...this.userRegistry.users.values()];
		for (const userModel of userModels)
		{
			const userId = userModel.id;
			if (!Object.hasOwn(this.users, userId))
			{
				continue;
			}

			if (
				isSameUser(userId, this.centralUser.id)
				&& (this.layout === Layouts.Centered || this.layout === Layouts.Mobile)
			)
			{
				this.#renderCentralUserInList(userId, orderingParams, prevActiveUsers);

				continue;
			}

			const state = this.#resolveUserActiveState(
				userModel,
				skipUsers,
				skippedUsers,
				renderedUsers,
				orderingRules,
				orderingParams,
			);

			skippedUsers = state.skippedUsers;

			const mounted = this.#mountUserInList(userId, state.userActive, orderingParams, prevActiveUsers);

			renderedUsers += mounted.renderedUsersDelta;
			userCount += mounted.userCountDelta;
		}

		this.applyOrderChanges(orderingParams.orderChanges);

		userCount += this.#renderLocalUserInList(showLocalUser);

		const prevUserWidth = this.userSize.width;

		this.#updateUserListSizes(userCount);

		this.renderAddUserButtonInList();

		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-user-list-empty', (this.elements.userList.container.childElementCount === 0));
		this.localUser.updatePanelDeferred();

		const { usersToActivate, usersToDeactivate } = this.#getUserChangesAfterRendering(prevActiveUsers, prevUserWidth);

		this.applyIncomingVideoConstraints(usersToActivate, usersToDeactivate);
	}

	#resolveUserActiveState(userModel, skipUsers, initialSkippedUsers, renderedUsers, orderingRules, orderingParams)
	{
		let skippedUsers = initialSkippedUsers;
		let userActive = userModel.hasActiveState;
		let userSkipped = false;

		if (userActive && skipUsers > 0 && skippedUsers < skipUsers)
		{
			// skip users on previous pages
			skippedUsers++;
			userActive = false;
			userSkipped = true;
		}

		if (userActive && this.layout === Layouts.Grid && this.usersPerPage > 0 && renderedUsers < this.usersPerPage)
		{
			orderingParams.addUserToCurrentPage();
		}

		if (this.layout === Layouts.Grid)
		{
			userActive = this.#applyGridOrderingRules(userModel, userActive, userSkipped, orderingRules, orderingParams);
		}

		if (
			userActive
			&& (this.layout === Layouts.Grid || this.layout === Layouts.Centered)
			&& this.usersPerPage > 0
			&& renderedUsers >= this.usersPerPage
		)
		{
			// skip users on following pages
			userActive = false;
		}

		return { userActive, skippedUsers };
	}

	#mountUserInList(userId, userActive, orderingParams, prevActiveUsers)
	{
		const user = this.users[userId];
		const screenUser = this.screenUsers[userId];

		if (userActive)
		{
			this.activeUsers.add(userId);
			if (orderingParams.usersWithEnabledVideo.includes(userId) && prevActiveUsers.has(userId))
			{
				prevActiveUsers.delete(userId);
			}
		}

		if (!userActive)
		{
			user.dismount();
			this.unobserveIntersections(user);
			screenUser.dismount();

			return { renderedUsersDelta: 0, userCountDelta: 0 };
		}

		let userCountDelta = 0;

		if (screenUser.hasVideo())
		{
			screenUser.mount(this.elements.userList.container);
			userCountDelta++;
		}
		else
		{
			screenUser.dismount();
		}
		user.mount(this.elements.userList.container);
		if (!this.isPreparing)
		{
			this.observeIntersections(user);
		}

		return { renderedUsersDelta: 1, userCountDelta: userCountDelta + 1 };
	}

	#prepareUserOrdering()
	{
		const orderingRules = this.getOrderingRules();
		const orderingParams = new UserOrderingState();

		let skipUsers = 0;

		if ((this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.pagesCount > 1)
		{
			skipUsers = (this.currentPage - 1) * this.usersPerPage;
		}

		const unpairedVideo = this.#processVideoRules(orderingRules, orderingParams);
		orderingParams.setUnpairedVideoChanges(unpairedVideo.videoEnabled, unpairedVideo.videoDisabled);
		this.processDisconnectRules(orderingRules, orderingParams);
		orderingParams.usersWithEnabledVideo = orderingParams.unpairedVideoEnabled.map((el) => el.id);
		orderingParams.usersWithDisabledVideo = orderingParams.unpairedVideoDisabled.map((el) => el.id);

		orderingParams.activeUsers = this.getActiveUsers();
		orderingParams.possibleActiveUsers = orderingParams.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);
		orderingParams.usersWithVideo = this.getUsersWithCamera();

		this.completeVideoDisabledSwap(orderingParams);
		this.completeDisconnectSwap(orderingRules, orderingParams);

		orderingParams.activeUsers = this.getActiveUsers();
		orderingParams.possibleActiveUsers = orderingParams.activeUsers.slice(skipUsers, skipUsers + this.usersPerPage);

		return { orderingRules, orderingParams, skipUsers };
	}

	#renderCentralUserInList(userId, orderingParams, prevActiveUsers)
	{
		const user = this.users[userId];
		const screenUser = this.screenUsers[userId];

		if (this.layout === Layouts.Centered)
		{
			this.activeUsers.add(userId);
			if (orderingParams.usersWithEnabledVideo.includes(userId) && prevActiveUsers.has(userId))
			{
				prevActiveUsers.delete(userId);
			}
		}
		this.unobserveIntersections(user);
		if (screenUser.hasVideo())
		{
			screenUser.mount(this.elements.center);
			screenUser.visible = true;
			user.mount(this.elements.userList.container);
		}
		else
		{
			user.visible = true;
			user.mount(this.elements.center);
			screenUser.dismount();
		}
	}

	#applyGridOrderingRules(userModel, initialUserActive, userSkipped, orderingRules, orderingParams)
	{
		if (orderingParams.unpairedVideoEnabled.length > 0)
		{
			return this.#applyVideoEnabledOrdering(userModel, initialUserActive, userSkipped, orderingParams);
		}

		if (orderingParams.unpairedVideoDisabled.length > 0)
		{
			return this.#applyVideoDisabledOrdering(userModel, initialUserActive, orderingParams);
		}

		if (orderingRules[RerenderReason.UserDisconnected])
		{
			return this.#applyUserDisconnectedOrdering(userModel, initialUserActive, orderingParams);
		}

		return initialUserActive;
	}

	#applyVideoEnabledOrdering(userModel, initialUserActive, userSkipped, orderingParams)
	{
		let userActive = this.#resolveVideoEnabledSwap(userModel, initialUserActive, userSkipped, orderingParams);

		if (orderingParams.usersToDeactivate)
		{
			userActive = this.calculateUserActive(userModel.id, userActive, userSkipped, orderingParams);
		}

		if (orderingParams.usersToForceDeactivation.includes(userModel.id))
		{
			userActive = false;
		}

		return userActive;
	}

	#resolveVideoEnabledSwap(userModel, initialUserActive, userSkipped, orderingParams)
	{
		let userActive = initialUserActive;

		if ((userActive || userSkipped) && orderingParams.incompleteSwaps.length > 0)
		{
			const previousIncompleteSwaps = orderingParams.incompleteSwaps.length;
			const index = orderingParams.incompleteSwaps[previousIncompleteSwaps - 1] - 1;
			const userEnabledVideo = orderingParams.orderChanges[index].from;
			const currentUserFromCurrentPage = orderingParams.possibleActiveUsers?.includes(userModel.id);
			const changedUserFromCurrentPage = orderingParams.possibleActiveUsers?.includes(
				userEnabledVideo.userModel.id,
			);

			// code below should be wrapped in condition like
			// !(this.currentPage === 1 && userModel.wasTalkingAgo() <= 60 * 1000))
			// to prevent speaking users swap
			this.completeVideoEnableSwap(userModel, orderingParams);
			const swapCompleted = previousIncompleteSwaps !== orderingParams.incompleteSwaps.length;

			if (
				swapCompleted
				&& userActive
				&& !changedUserFromCurrentPage
				&& !orderingParams.usersToKeepActive.includes(userModel.id)
			)
			{
				userActive = false;
			}
			else if (
				swapCompleted
				&& ((!userSkipped && !currentUserFromCurrentPage) || (userSkipped && changedUserFromCurrentPage))
			)
			{
				userActive = true;
			}
		}

		return userActive;
	}

	#applyVideoDisabledOrdering(userModel, initialUserActive, orderingParams)
	{
		if (orderingParams.usersToKeepActive.includes(userModel.id))
		{
			orderingParams.cancelUserDeactivation();

			return true;
		}

		if (orderingParams.usersToForceDeactivation.includes(userModel.id)
			|| (orderingParams.currentPageUsers + orderingParams.usersToDeactivate > this.usersPerPage)
		)
		{
			orderingParams.removeUserFromCurrentPage();

			return false;
		}

		return initialUserActive;
	}

	#applyUserDisconnectedOrdering(userModel, initialUserActive, orderingParams)
	{
		if (orderingParams.usersToKeepActive.includes(userModel.id))
		{
			orderingParams.cancelUserDeactivation();

			return true;
		}

		if (orderingParams.currentPageUsers + orderingParams.usersToDeactivate > this.usersPerPage)
		{
			orderingParams.removeUserFromCurrentPage();

			return false;
		}

		return initialUserActive;
	}

	#renderLocalUserInList(showLocalUser)
	{
		if (!showLocalUser)
		{
			this.localUser.dismount();

			return 0;
		}

		if (
			(this.layout === Layouts.Centered && isSameUser(this.userId, this.centralUser.id))
			|| this.layout === Layouts.Mobile
		)
		{
			this.localUser.mount(this.elements.center, true);
			this.localUser.visible = true;
		}
		else
		{
			// using force true to always move self to the end of the list
			this.localUser.mount(this.elements.userList.container);
			if (this.layout !== Layouts.Centered || !this.intersectionObserver)
			{
				this.localUser.visible = true;
			}
		}

		return 1;
	}

	#updateUserListSizes(userCount)
	{
		if (this.layout === Layouts.Grid)
		{
			this.updateGridUserSize(userCount);
		}
		else
		{
			Dom.addClass(this.elements.userList.container, 'bx-messenger-videocall-user-list-small');
			Dom.style(this.elements.userList.container, '--avatar-size', null);
			Dom.style(this.elements.userList.container, '--avatar-text-size', null);
			this.updateCentralUserAvatarSize();
		}
	}

	#getUserChangesAfterRendering(
		prevActiveUsers,
		prevVideoWidth,
	)
	{
		const usersToDeactivate = [];
		const activeUsers = new Set(this.activeUsers);
		const videoWidth = this.userSize.width;

		if (this.currentPiPUserId && !activeUsers.has(this.currentPiPUserId))
		{
			activeUsers.add(this.currentPiPUserId);
		}

		prevActiveUsers.forEach((userId) => {
			if (activeUsers.has(userId))
			{
				if (videoWidth === prevVideoWidth)
				{
					activeUsers.delete(userId);
				}
			}
			else
			{
				usersToDeactivate.push(userId);
			}
		});

		const usersToActivate = [...activeUsers];

		return { usersToActivate, usersToDeactivate };
	}

	updateGridUserSize(userCount)
	{
		const containerSize = this.elements.userList.container.getBoundingClientRect();
		this.userSize = Util.findBestElementSize(
			containerSize.width,
			containerSize.height,
			userCount,
			MIN_GRID_USER_WIDTH,
			MIN_GRID_USER_HEIGHT,
		);

		// Change the size to make it possible to make indents between users
		const rows = Math.floor(containerSize.height / MIN_GRID_USER_HEIGHT) || 1;
		this.userSize.width -= 5 * rows;
		this.userSize.height -= 2.75 * rows;
		const avatarSize = Math.round(this.userSize.height * 0.45);
		const avatarTextSize = Math.round(avatarSize * 0.45);
		Dom.style(this.elements.userList.container, '--grid-user-width', `${this.userSize.width}px`);
		Dom.style(this.elements.userList.container, '--grid-user-height', `${this.userSize.height}px`);
		Dom.style(this.elements.userList.container, '--avatar-size', `${avatarSize}px`);
		Dom.style(this.elements.userList.container, '--avatar-text-size', `${avatarTextSize}px`);
		if (this.userSize.width < 220)
		{
			Dom.addClass(this.elements.userList.container, 'bx-messenger-videocall-user-list-small');
		}
		else
		{
			Dom.removeClass(this.elements.userList.container, 'bx-messenger-videocall-user-list-small');
		}
	}

	updateCentralUserAvatarSize()
	{
		if (this.layout === Layouts.Mobile)
		{
			const containerSize = this.elements.root.getBoundingClientRect();

			this.#applyCentralUserAvatarSize(Math.round(containerSize.width * 0.55));

			return;
		}

		if (this.layout === Layouts.Centered)
		{
			const containerSize = this.elements.center.getBoundingClientRect();
			const avatarSize = Math.min(
				Math.round(containerSize.height * 0.45),
				Math.round(containerSize.width * 0.45),
			);

			this.centralUser.setIncomingVideoConstraints(
				Math.floor(containerSize.width),
				Math.floor(containerSize.height),
			);

			this.#applyCentralUserAvatarSize(avatarSize);
		}
	}

	#applyCentralUserAvatarSize(avatarSize)
	{
		const avatarTextSize = Math.round(avatarSize * 0.45);

		Dom.style(this.elements.center, '--avatar-size', `${avatarSize}px`);
		Dom.style(this.elements.center, '--avatar-text-size', `${avatarTextSize}px`);
	}

	renderButtons(buttons, rerender)
	{
		const containers = this.#createButtonPanelContainers(rerender);

		for (const buttonCode of buttons)
		{
			const button = this.#preparePanelButton(buttonCode, rerender);

			if (!rerender)
			{
				continue;
			}

			const element = button
				? button.render()
				: this.#createPanelSpacer(buttonCode);

			if (element)
			{
				Dom.append(element, this.#getPanelButtonContainer(buttonCode, containers));
			}
		}

		return containers.panelInner;
	}

	#createButtonPanelContainers(rerender)
	{
		const panelInner = rerender
			? Dom.create('div', {
				props: { className: 'bx-messenger-videocall-panel-inner' },
			})
			: null;

		if (this.layout === Layouts.Mobile || this.size === Size.Folded)
		{
			return {
				panelInner,
				left: panelInner,
				center: panelInner,
				right: panelInner,
			};
		}

		if (!rerender)
		{
			return {
				panelInner,
				left: null,
				center: null,
				right: null,
			};
		}

		const left = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-inner-left' },
		});
		const center = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-inner-center' },
		});
		const right = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-inner-right' },
		});

		Dom.append(left, panelInner);
		Dom.append(center, panelInner);
		Dom.append(right, panelInner);

		return { panelInner, left, center, right };
	}

	#preparePanelButton(buttonCode, rerender)
	{
		switch (buttonCode)
		{
			case 'title':
				return this.#prepareTitleButton();
			case 'share':
				return rerender ? this.#createShareButton() : null;
			case 'microphone':
				return this.#prepareMicrophoneButton();
			case 'camera':
				return this.#prepareCameraButton();
			case 'screen':
				return this.#prepareScreenButton();
			case 'record':
				return this.#prepareRecordButton();
			case 'document':
				return this.#prepareDocumentButton();
			case 'copilot':
				return this.#prepareCopilotButton();
			case 'returnToCall':
				return rerender ? this.#createReturnToCallButton() : null;
			case 'hangup':
				return rerender ? this.#createHangupButton() : null;
			case 'hangupOptions':
				return rerender ? this.#createHangupOptionsButton() : null;
			case 'close':
				return rerender ? this.#createCloseButton() : null;
			case 'mobileMenu':
				return rerender ? this.#prepareMobileMenuButton() : null;
			case 'chat':
				return this.#prepareChatButton();
			case 'floorRequest':
				return this.#prepareFloorRequestButton();
			case 'more':
				return rerender ? this.#prepareMoreButton() : null;
			// getButtonList() yields 'speaker', which has no button of its own in the panel
			case 'speaker':
			default:
				return null;
		}
	}

	#getPanelButtonContainer(buttonCode, containers)
	{
		switch (buttonCode)
		{
			case 'title':
			case 'microphone':
			case 'camera':
				return containers.left;
			case 'returnToCall':
			case 'hangup':
			case 'hangupOptions':
			case 'close':
				return containers.right;
			case 'spacer':
				return containers.panelInner;
			default:
				return containers.center;
		}
	}

	#createPanelSpacer(buttonCode)
	{
		if (buttonCode !== 'spacer')
		{
			return null;
		}

		return Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-spacer' },
		});
	}

	#prepareTitleButton()
	{
		if (this.buttons.title)
		{
			this.buttons.title.update({
				text: this.title,
				isGroupCall: Object.keys(this.users).length > 1,
			});

			return this.buttons.title;
		}

		this.buttons.title = new Buttons.TitleButton({
			text: this.title,
			isGroupCall: Object.keys(this.users).length > 1,
		});

		return this.buttons.title;
	}

	#prepareMicrophoneButton()
	{
		if (this.buttons.microphone)
		{
			this.buttons.microphone.setBlocked(this.isButtonBlocked('microphone'));

			return this.buttons.microphone;
		}

		this.buttons.microphone = new Buttons.DeviceButton({
			class: 'microphone',
			text: Loc.getMessage('IM_M_CALL_BTN_MIC'),
			enabled: !Hardware.isMicrophoneMuted,
			arrowHidden: this.layout === Layouts.Mobile,
			blocked: this.isButtonBlocked('microphone'),
			showLevel: true,
			sideIcon: getMicrophoneSideIcon(this.roomState),
			arrowAriaLabel: Loc.getMessage('CALL_VIEW_MIC_DEVICE_ARIA'),
			arrowHasPopup: Buttons.AriaHasPopup.Dialog,
			onClick: this.#onMicrophoneButtonClick.bind(this),
			onArrowClick: this.#onMicrophoneArrowClick.bind(this),
			onSideIconClick: this.#onMicrophoneSideIconClick.bind(this),
			// no client check here: the text below is the one place that decides which of
			// the two lines applies, and the button shows no plate for an empty one
			tooltip: {
				position: 'top',
				getText: () => this.#getMicrophoneTooltipText(),
			},
		});

		return this.buttons.microphone;
	}

	#prepareCameraButton()
	{
		if (this.buttons.camera)
		{
			this.buttons.camera.setBlocked(this.isButtonBlocked('camera'));

			return this.buttons.camera;
		}

		this.buttons.camera = new Buttons.DeviceButton({
			class: 'camera',
			text: Loc.getMessage('IM_M_CALL_BTN_CAMERA'),
			enabled: Hardware.isCameraOn,
			arrowHidden: this.layout === Layouts.Mobile,
			blocked: this.isButtonBlocked('camera'),
			arrowAriaLabel: Loc.getMessage('CALL_VIEW_CAMERA_DEVICE_ARIA'),
			arrowHasPopup: Buttons.AriaHasPopup.Dialog,
			onClick: this.#onCameraButtonClick.bind(this),
			onArrowClick: this.#onCameraArrowClick.bind(this),
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'top',
					getText: () => `${this.keyModifierForCss} + V`,
				},
			} : {}),
		});

		return this.buttons.camera;
	}

	#prepareScreenButton()
	{
		if (this.buttons.screen)
		{
			this.buttons.screen.setBlocked(this.isButtonBlocked('screen'));

			return this.buttons.screen;
		}

		this.buttons.screen = new Buttons.SimpleButton({
			class: 'screen',
			backgroundClass: 'bx-messenger-videocall-panel-background-screen',
			text: Loc.getMessage('IM_M_CALL_BTN_SCREEN'),
			blocked: this.isButtonBlocked('screen'),
			isToggle: true,
			onClick: this.#onScreenButtonClick.bind(this),
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'top',
					getText: () => `${this.keyModifierForCss} + S`,
				},
			} : {}),
		});

		return this.buttons.screen;
	}

	#prepareRecordButton()
	{
		if (this.buttons.record)
		{
			this.buttons.record.setBlocked(this.isButtonBlocked('record'));

			return this.buttons.record;
		}

		this.buttons.record = new Buttons.SimpleButton({
			class: 'record',
			backgroundClass: 'bx-messenger-videocall-panel-background-record',
			text: Loc.getMessage('IM_M_CALL_BTN_RECORD'),
			blocked: this.isButtonBlocked('record'),
			// deliberately not a toggle: the button opens a layer, and the state of the
			// recording is told by its state description and by RecordStatusButton
			hasStateDescription: true,
			onClick: this.#onCommonRecordClick.bind(this),
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'top',
					getText: () => `${this.keyModifierForCss} + R`,
				},
			} : {}),
		});

		// the recording may already be running by the time the panel gets its button
		this.#syncRecordButtonStateDescription();

		return this.buttons.record;
	}

	#prepareDocumentButton()
	{
		if (this.buttons.document)
		{
			this.buttons.document.setBlocked(this.isButtonBlocked('document'));

			return this.buttons.document;
		}

		this.buttons.document = new Buttons.SimpleButton({
			class: 'document',
			backgroundClass: 'bx-messenger-videocall-panel-background-document',
			text: Loc.getMessage('IM_M_CALL_BTN_DOCUMENT'),
			blocked: this.isButtonBlocked('document'),
			isToggle: true,
			onClick: this.#onDocumentButtonClick.bind(this),
		});

		return this.buttons.document;
	}

	#prepareCopilotButton()
	{
		if (this.buttons.copilot)
		{
			this.buttons.copilot.setBlocked(this.isButtonBlocked('copilot'));
			this.buttons.copilot.setActive(this.isCopilotActive);

			return this.buttons.copilot;
		}

		this.buttons.copilot = new Buttons.SimpleButton({
			class: 'copilot',
			backgroundClass: 'bx-messenger-videocall-panel-background-copilot',
			text: Loc.getMessage('CALL_BUTTON_COPILOT_TITLE_MSGVER_1'),
			blocked: this.isButtonBlocked('copilot'),
			isToggle: true,
			onClick: this.#onCopilotButtonClick.bind(this),
			isComingSoon: !this.isCopilotFeaturesEnabled,
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'top',
					getText: () => (this.isCopilotActive
						? Loc.getMessage('CALL_COPILOT_BUTTON_ON_HINT_V2_MSGVER_1')
						: Loc.getMessage('CALL_COPILOT_BUTTON_OFF_HINT')),
				},
			} : {}),
		});

		return this.buttons.copilot;
	}

	#prepareChatButton()
	{
		if (this.buttons.chat)
		{
			this.buttons.chat.setBlocked(this.isButtonBlocked('chat'));

			return this.buttons.chat;
		}

		this.buttons.chat = new Buttons.SimpleButton({
			class: 'chat',
			backgroundClass: 'bx-messenger-videocall-panel-background-chat',
			text: Loc.getMessage('IM_M_CALL_BTN_CHAT'),
			blocked: this.isButtonBlocked('chat'),
			isToggle: true,
			counterDescriptionMessageKey: 'CALL_VIEW_CHAT_UNREAD_COUNT',
			onClick: this.#onChatButtonClick.bind(this),
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'top',
					getText: () => `${this.keyModifierForCss} + C`,
				},
			} : {}),
		});

		return this.buttons.chat;
	}

	#prepareFloorRequestButton()
	{
		if (this.buttons.floorRequest)
		{
			this.buttons.floorRequest.setBlocked(this.isButtonBlocked('floorRequest'));

			return this.buttons.floorRequest;
		}

		this.buttons.floorRequest = new Buttons.SimpleButton({
			class: 'floor-request',
			backgroundClass: 'bx-messenger-videocall-panel-background-floor-request',
			text: Loc.getMessage('IM_M_CALL_BTN_WANT_TO_SAY'),
			blocked: this.isButtonBlocked('floorRequest'),
			isToggle: true,
			onClick: this.#onFloorRequestButtonClick.bind(this),
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'top',
					getText: () => `${this.keyModifierForCss} + H`,
				},
			} : {}),
		});

		return this.buttons.floorRequest;
	}

	#createShareButton()
	{
		this.buttons.share = new Buttons.SimpleButton({
			class: 'share',
			text: Loc.getMessage('IM_M_CALL_BTN_LINK'),
			onClick: this.#onShareButtonClick.bind(this),
		});

		return this.buttons.share;
	}

	#createReturnToCallButton()
	{
		this.buttons.returnToCall = new Buttons.SimpleButton({
			class: 'returnToCall',
			text: Loc.getMessage('IM_M_CALL_BTN_RETURN_TO_CALL'),
			onClick: this.#onBodyClick.bind(this),
		});

		return this.buttons.returnToCall;
	}

	#createHangupButton()
	{
		this.buttons.hangup = new Buttons.SimpleButton({
			class: 'hangup',
			backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup',
			text: Object.keys(this.users).length > 1 ? Loc.getMessage('IM_M_CALL_BTN_DISCONNECT') : Loc.getMessage('IM_M_CALL_BTN_HANGUP'),
			onClick: this.#onHangupButtonClick.bind(this),
		});

		return this.buttons.hangup;
	}

	#createHangupOptionsButton()
	{
		this.buttons.hangupOptions = new Buttons.SimpleButton({
			class: 'hangup-options',
			backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup-options',
			ariaLabel: Loc.getMessage('CALL_VIEW_HANGUP_OPTIONS_ARIA'),
			ariaHasPopup: Buttons.AriaHasPopup.Menu,
			onClick: this.#onHangupOptionsButtonClick.bind(this),
		});

		return this.buttons.hangupOptions;
	}

	#createCloseButton()
	{
		this.buttons.close = new Buttons.SimpleButton({
			class: 'close',
			backgroundClass: 'bx-messenger-videocall-panel-icon-background-hangup',
			text: Loc.getMessage('IM_M_CALL_BTN_CLOSE'),
			onClick: this.#onCloseButtonClick.bind(this),
		});

		return this.buttons.close;
	}

	#prepareMobileMenuButton()
	{
		if (!this.buttons.mobileMenu)
		{
			this.buttons.mobileMenu = new Buttons.SimpleButton({
				class: 'sandwich',
				text: Loc.getMessage('IM_M_CALL_BTN_MENU'),
				onClick: this.#onMobileMenuButtonClick.bind(this),
			});
		}

		return this.buttons.mobileMenu;
	}

	#prepareMoreButton()
	{
		if (!this.buttons.more)
		{
			this.buttons.more = new Buttons.SimpleButton({
				class: 'more',
				ariaLabel: Loc.getMessage('CALL_VIEW_MORE_ARIA'),
				ariaHasPopup: Buttons.AriaHasPopup.Dialog,
				onClick: this.#onMoreButtonClick.bind(this),
			});
		}

		return this.buttons.more;
	}

	renderTopButtons(buttons, rerender)
	{
		for (const buttonCode of buttons)
		{
			const button = this.#prepareTopButton(buttonCode);

			if (!rerender)
			{
				continue;
			}

			const element = button
				? button.render()
				: this.#createTopPanelDivider(buttonCode);

			if (element)
			{
				Dom.append(element, this.elements.topPanel);
			}
		}
	}

	#prepareTopButton(buttonCode)
	{
		switch (buttonCode)
		{
			case 'watermark':
				return this.#prepareWaterMarkButton();
			case 'protected':
				return this.#prepareProtectedButton();
			case 'recordStatus':
				return this.#prepareRecordStatusButton();
			case 'grid':
				return this.#prepareGridButton();
			case 'fullscreen':
				return this.#prepareFullScreenButton();
			case 'feedback':
				return this.#prepareFeedbackButton();
			case 'link':
				return this.#prepareLinkButton();
			case 'callcontrol':
				return this.#prepareCallcontrolButton();
			case 'participants':
				return this.#prepareParticipantsButton();
			case 'participantsMobile':
				return this.#prepareParticipantsMobileButton();
			default:
				return null;
		}
	}

	#prepareWaterMarkButton()
	{
		if (!this.buttons.waterMark)
		{
			this.buttons.waterMark = new Buttons.WaterMarkButton({
				language: this.language,
			});
		}

		return this.buttons.waterMark;
	}

	#prepareProtectedButton()
	{
		if (!this.buttons.protected)
		{
			this.buttons.protected = new Buttons.TopFramelessButton({
				iconClass: 'protected',
				textClass: 'protected',
				text: Loc.getMessage('IM_M_CALL_PROTECTED').toLowerCase(),
				tooltip: {
					width: '384px',
					position: 'bottom',
					getText: () => Loc.getMessage('IM_M_CALL_PROTECTED_HINT'),
				},
			});
		}

		return this.buttons.protected;
	}

	#prepareRecordStatusButton()
	{
		if (this.buttons.recordStatus)
		{
			this.buttons.recordStatus.updateView();

			return this.buttons.recordStatus;
		}

		this.buttons.recordStatus = new Buttons.RecordStatusButton({
			userId: this.userId,
			commonRecordState: this.commonRecordState,
			tooltip: {
				position: 'bottom',
				getText: () => {
					const userData = this.userData[this.commonRecordState.userId];

					if (!userData)
					{
						return '';
					}

					const recordingUserName = Text.encode(userData.name);
					const gender = userData.gender || 'M';

					return Loc.getMessage(`CALL_COMMON_RECORD_INITIATOR_HINT_${gender}`).replace('#USER_NAME#', recordingUserName);
				},
			},
		});

		return this.buttons.recordStatus;
	}

	#prepareGridButton()
	{
		const gridButtonState = {
			iconClass: this.layout === Layouts.Grid ? 'speaker' : 'grid',
			text: this.layout === Layouts.Grid
				? Loc.getMessage('IM_M_CALL_SPEAKER_MODE')
				: Loc.getMessage('IM_M_CALL_GRID_MODE_MSGVER_1'),
		};

		if (this.buttons.grid)
		{
			this.buttons.grid.update(gridButtonState);

			return this.buttons.grid;
		}

		this.buttons.grid = new Buttons.TopButton({
			...gridButtonState,
			onClick: this.#onGridButtonClick.bind(this),
			...(Util.isDesktop() ? {
				tooltip: {
					position: 'bottom',
					getText: () => `${this.keyModifierForCss} + W`,
				},
			} : {}),
		});

		return this.buttons.grid;
	}

	#prepareFullScreenButton()
	{
		const fullScreenButtonState = {
			iconClass: this.isFullScreen ? 'fullscreen-leave' : 'fullscreen-enter',
			text: this.isFullScreen
				? Loc.getMessage('IM_M_CALL_WINDOW_MODE')
				: Loc.getMessage('IM_M_CALL_FULLSCREEN_MODE'),
		};

		if (this.buttons.fullscreen)
		{
			this.buttons.fullscreen.update(fullScreenButtonState);

			return this.buttons.fullscreen;
		}

		this.buttons.fullscreen = new Buttons.TopButton({
			...fullScreenButtonState,
			onClick: this.#onFullScreenButtonClick.bind(this),
		});

		return this.buttons.fullscreen;
	}

	#prepareFeedbackButton()
	{
		if (!this.buttons.feedback)
		{
			this.buttons.feedback = new Buttons.TopButton({
				iconClass: 'feedback',
				text: Loc.getMessage('IM_OL_COMMENT_HEAD_BUTTON_VOTE'),
				onClick: this.#onFeedbackButtonClick.bind(this),
			});
		}

		return this.buttons.feedback;
	}

	#prepareLinkButton()
	{
		if (!this.buttons.link)
		{
			this.buttons.link = new Buttons.TopButton({
				iconClass: 'link',
				text: Loc.getMessage('CALL_VIEW_GUEST_LINK_BUTTON_LABEL'),
				onClick: this.#onLinkButtonClick.bind(this),
			});
		}

		return this.buttons.link;
	}

	#prepareCallcontrolButton()
	{
		if (!this.buttons.callcontrol)
		{
			this.buttons.callcontrol = new Buttons.TopButton({
				iconClass: 'callcontrol',
				text: Loc.getMessage('CALL_CALLCONTROL_BUTTON_LABEL'),
				onClick: this.#onCallcontrolButtonClick.bind(this),
			});
		}

		return this.buttons.callcontrol;
	}

	#prepareParticipantsButton()
	{
		const participantsButtonState = {
			foldButtonState: this.#getParticipantsFoldButtonState(),
			allowAdding: !this.isButtonBlocked('add'),
			count: this.getConnectedUserCount(true),
		};

		if (this.buttons.participants)
		{
			this.buttons.participants.update(participantsButtonState);

			return this.buttons.participants;
		}

		this.buttons.participants = new Buttons.ParticipantsButton({
			...participantsButtonState,
			onListClick: this.#onParticipantsButtonListClick.bind(this),
			onAddClick: this.#onAddButtonClick.bind(this),
		});

		return this.buttons.participants;
	}

	#getParticipantsFoldButtonState()
	{
		if (this.isFullScreen && this.layout === Layouts.Centered)
		{
			return this.isUserBlockFolded
				? Buttons.ParticipantsButton.FoldButtonState.Unfold
				: Buttons.ParticipantsButton.FoldButtonState.Fold;
		}

		if (this.showUsersButton)
		{
			return Buttons.ParticipantsButton.FoldButtonState.Active;
		}

		return Buttons.ParticipantsButton.FoldButtonState.Hidden;
	}

	#prepareParticipantsMobileButton()
	{
		if (!this.buttons.participantsMobile)
		{
			this.buttons.participantsMobile = new Buttons.ParticipantsButtonMobile({
				count: this.getConnectedUserCount(true),
				onClick: this.#onParticipantsButtonMobileListClick.bind(this),
			});
		}

		return this.buttons.participantsMobile;
	}

	#createTopPanelDivider(buttonCode)
	{
		const dividerClassNames = {
			separator: 'bx-messenger-videocall-top-separator',
			spacer: 'bx-messenger-videocall-top-panel-spacer',
		};

		if (!Object.hasOwn(dividerClassNames, buttonCode))
		{
			return null;
		}

		return Dom.create('div', {
			props: { className: dividerClassNames[buttonCode] },
		});
	}

	updateCopilotState(isActive)
	{
		this.isCopilotActive = isActive;

		this.setButtonActive('copilot', this.isCopilotActive);

		if (this.elements.wrap)
		{
			this.elements.wrap.classList[this.isCopilotActive ? 'add' : 'remove']('bx-messenger-videocall-wrap-with-copilot');
		}
	}

	updateCopilotFeatureState(isEnabled)
	{
		this.isCopilotFeaturesEnabled = isEnabled;

		if (!this.buttons.copilot)
		{
			return;
		}

		this.buttons.copilot.setIsComingSoon(!this.isCopilotFeaturesEnabled);
	}

	showCopilotNotify(callId = 0, errorCode = '', notifyText = null)
	{
		if (errorCode)
		{
			this.#openCopilotNotify(CopilotNotifyType[errorCode], callId);

			return;
		}

		const notifyType = this.isCopilotActive ? CopilotNotifyType.COPILOT_ENABLED : CopilotNotifyType.COPILOT_DISABLED;
		const promoId = this.isCopilotActive
			? 'call:copilot-notify-warning:21112024:all'
			: 'call:copilot-notify-promo:21112024:all';

		const promoManager = PromoManager.getInstance();

		this.#callPopupQueue.add(1, (onDone) => {
			if (!promoManager.needToShow(promoId))
			{
				onDone();

				return;
			}
			this.#openCopilotNotify(notifyType, callId, onDone, notifyText);
		});
	}

	closeCopilotNotify()
	{
		if (this.copilotNotify)
		{
			this.copilotNotify.close();
			this.copilotNotify = null;
		}
	}

	showCopilotResultNotify()
	{
		this.#openCopilotNotify(CopilotNotifyType.COPILOT_RESULT);
	}

	showCopilotErrorNotify(errorType)
	{
		const notifyType = CopilotNotifyType[errorType];
		this.#openCopilotNotify(notifyType);
	}

	createCopilotNotify(notifyType, callId, onDone = null, notifyText = null)
	{
		if (!this.buttons.copilot)
		{
			return null;
		}

		return new CopilotNotify({
			type: notifyType,
			bindElement: this.buttons.copilot.elements.root,
			targetContainer: this.elements.root,
			notifyText: notifyText ?? '',
			onClose: () => {
				this.copilotNotify = null;
				onDone?.();
			},
			callId,
		});
	}

	#openCopilotNotify(notifyType, callId = 0, onDone = null, notifyText = null)
	{
		this.closeCopilotNotify();

		this.copilotNotify = this.createCopilotNotify(notifyType, callId, onDone, notifyText);

		if (this.copilotNotify)
		{
			this.copilotNotify.show();

			if (!this.copilotNotify.popup)
			{
				this.copilotNotify = null;
				onDone?.();
			}
		}
		else
		{
			onDone?.();
		}
	}

	#showCallControlPromo(onDone = null)
	{
		if (!this.buttons.callcontrol)
		{
			onDone?.();

			return;
		}

		if (this.ahaMomentNotifyCallcontrol)
		{
			this.ahaMomentNotifyCallcontrol.show();
			onDone?.();

			return;
		}

		this.ahaMomentNotifyCallcontrol = new AhaMomentNotify({
			notifyTitle: Loc.getMessage('CALL_CALLCONTROL_AXA_MOMENT_TITLE'),
			notifyText: Loc.getMessage('CALL_CALLCONTROL_AXA_MOMENT_TEXT'),
			bindElement: this.buttons.callcontrol.elements.root,
			promoId: CALLCONTROL_PROMO_ID,
			targetContainer: this.elements.root,
			onClose: () => {
				this.needToShowCallcontrolPromo = false;
				this.ahaMomentNotifyCallcontrol = null;
				onDone?.();
			},
		});

		this.ahaMomentNotifyCallcontrol.show();
	}

	calculateUnusedPanelSpace(buttonList)
	{
		const buttons = buttonList || this.getButtonList();

		const totalButtonWidth = buttons
			.map((buttonName) => this.buttons[buttonName])
			.filter(Boolean)
			.reduce((total, button) => total + (button.elements.root?.getBoundingClientRect().width ?? 0), 0);

		return this.elements.panel.scrollWidth - totalButtonWidth - 32;
	}

	setWindowFocusState(isActive)
	{
		if (isActive === this.isWindowFocus)
		{
			return;
		}

		this.isWindowFocus = isActive;

		if (this.pictureInPictureCallWindow)
		{
			this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
		}
	}

	getPictureInPictureCallWindowGetButtonsList()
	{
		const buttonsList = ['microphone', 'camera'];

		if (this.getButtonActive('screen'))
		{
			buttonsList.push('stop-screen');
		}

		const isViewHidden = this.isHidden();

		if (this.size === Size.Folded || isViewHidden)
		{
			buttonsList.push('returnToCall');
		}

		// if (this.getButtonList().includes('copilot'))
		// {
		// 	buttonsList.push("copilot");
		// }

		return buttonsList;
	}

	getPictureInPictureCallWindowUser(targetUserId = null)
	{
		const isNotMe = (id) => !Type.isNil(id) && Number(id) !== Number(this.userId);

		const currentUserId = targetUserId
			?? (isNotMe(this.presenterId) ? this.presenterId : null)
			?? (isNotMe(this.centralUser?.userModel.id) ? this.centralUser?.userModel.id : null)
			?? this.getAnyOtherUserId();

		const isLocalUser = Number(this.userId) === Number(currentUserId);
		const currentUser = isLocalUser ? this.localUser : this.users[currentUserId];

		const isCurrentPiPUser = Boolean(this.currentPiPUserId) && currentUserId === this.currentPiPUserId;

		if (isCurrentPiPUser)
		{
			return null;
		}

		if (!this.activeUsers.has(currentUserId) && !isLocalUser)
		{
			this.toggleSubscribingVideoInRenderUserList([{ userId: currentUserId }], true);
		}

		if (
			this.currentPiPUserId
			&& Number(this.userId) !== Number(this.currentPiPUserId)
			&& !this.activeUsers.has(this.currentPiPUserId)
		)
		{
			this.toggleSubscribingVideoInRenderUserList([{ userId: this.currentPiPUserId }], false);
		}

		this.currentPiPUserId = currentUserId;

		const modifiedCurrentUser = {
			userModel: this.userRegistry.get(currentUserId),
			avatarBackground: currentUser.avatarBackground,
			videoRenderer: currentUser.videoRenderer,
			previewRenderer: currentUser.previewRenderer,
		};

		if (currentUser.videoTrack)
		{
			modifiedCurrentUser.videoRenderer = new MediaRenderer({
				kind: 'video',
				track: currentUser.videoTrack,
			});
		}

		if (!isLocalUser && this.screenUsers[currentUserId]?.videoTrack)
		{
			modifiedCurrentUser.previewRenderer = new MediaRenderer({
				kind: 'sharing',
				track: this.screenUsers[currentUserId].videoTrack,
			});
		}

		if (isLocalUser && this.localStreamVideoTrack)
		{
			modifiedCurrentUser.previewRenderer = new MediaRenderer({
				kind: 'sharing',
				track: this.localStreamVideoTrack,
			});
		}

		return modifiedCurrentUser;
	}

	getAnyOtherUserId()
	{
		const myId = String(this.userId);

		const anyActiveUser = [...this.activeUsers].find((id) => String(id) !== myId);
		if (anyActiveUser)
		{
			return anyActiveUser;
		}

		const users = this.users || {};

		const anyOtherUser = Object.keys(users).find((id) => String(id) !== myId);
		if (anyOtherUser)
		{
			return anyOtherUser;
		}

		return this.userId;
	}

	getBlockedButtonsListPictureInPictureCallWindow()
	{
		const blockedButtons = [];

		if (this.isButtonBlocked('camera'))
		{
			blockedButtons.push('camera');
		}

		if (this.isButtonBlocked('microphone'))
		{
			blockedButtons.push('microphone');
		}

		if (this.isButtonBlocked('screen'))
		{
			blockedButtons.push('screen');
		}

		return blockedButtons;
	}

	/**
	 * The single way the blocking of the panel reaches the picture-in-picture window. That window
	 * keeps the record of what it has already announced, and a second way in would let the record
	 * and the state drift apart - which is how a blocking gets applied and never spoken.
	 *
	 * @param {object} [options]
	 * @param {boolean} [options.announce=true] Whether the window speaks the change
	 */
	syncPictureInPictureBlockedButtons(options)
	{
		if (!this.pictureInPictureCallWindow)
		{
			return;
		}

		this.pictureInPictureCallWindow.syncBlockButtons(
			this.getBlockedButtonsListPictureInPictureCallWindow(),
			options,
		);
	}

	#onPiPClose()
	{
		this.eventEmitter.emit(EventName.onPiPClose);
	}

	toggleStatePictureInPictureCallWindow(isActive)
	{
		const isPiPAvailable = UnsupportedBrowserFeatures.isPiPAvailable;
		if (isActive && !this.pictureInPictureCallWindow && isPiPAvailable && Util.isPictureInPictureFeatureEnabled())
		{
			this.pictureInPictureCallWindow = new PictureInPictureWindow({
				currentUser: this.getPictureInPictureCallWindowUser(),
				accessibleName: this.getRootAccessibleName(),
				buttons: this.getPictureInPictureCallWindowGetButtonsList(),
				blockedButtons: this.getBlockedButtonsListPictureInPictureCallWindow(),
				preferInitialWindowPlacement: this.preferInitialWindowPlacementPictureInPicture,
				floorRequestNotifications: this.floorRequestNotifications,
				hardwareState: Hardware,
				Buttons,
				CallUser,
				FloorRequest,
				onClose: () => {
					// first of all: the document of a dead window must not stay in the zone, and
					// every way the window can close - the user, another tab taking it over - lands here
					this.pushToTalkCoordinator?.setPipDocument(null);
					this.pictureInPictureCallWindow = null;
					this.currentPiPUserId = null;
					this.#onPiPClose();
				},
				onButtonClick: ({ buttonName, event }) => {
					switch (buttonName)
					{
						case 'microphone':
							this.#onMicrophoneButtonClick(event);
							break;
						case 'camera':
							this.#onCameraButtonClick(event);
							break;
						case 'returnToCall':
							this.eventEmitter.emit(EventName.onPiPBodyClick);
							break;
						case 'stop-screen':
							this.#onScreenButtonClick(event);
							break;
						default:
							break;
					}
				},
			});
			this.pictureInPictureCallWindow.checkAvailableAndCreate()
				.then((pictureWindow) => {
					this.preferInitialWindowPlacementPictureInPicture = false;
					// the keyboard and the focus of this document are listened to by the extension;
					// a subscription of the window itself would deliver every press twice
					this.pushToTalkCoordinator?.setPipDocument(pictureWindow?.document ?? null);
				})
				.catch(console.error)
			;
		}

		if (!isActive && this.pictureInPictureCallWindow)
		{
			this.pipCoordinator?.deactivate();
			this.pictureInPictureCallWindow.close();
		}
	}

	setButtonActive(buttonName, isActive)
	{
		if (!this.buttons[buttonName])
		{
			return;
		}

		this.buttons[buttonName].setActive(isActive);

		if (this.pictureInPictureCallWindow)
		{
			this.pictureInPictureCallWindow.setButtons(this.getPictureInPictureCallWindowGetButtonsList()).updateButtons();
		}
	}

	// A button is created lazily and not every panel button announces a layer, so both misses are a
	// silent skip: the caller synchronises again once the panel is rendered.
	setButtonPopupKind(buttonName, kind)
	{
		const button = this.buttons[buttonName];

		if (!button || !Type.isFunction(button.setPopupKind))
		{
			return;
		}

		button.setPopupKind(kind);
	}

	getButtonActive(buttonName)
	{
		if (!this.buttons || !this.buttons[buttonName])
		{
			return false;
		}

		return this.buttons[buttonName].isActive;
	}

	setButtonCounter(buttonName, counter)
	{
		if (!this.buttons[buttonName])
		{
			return;
		}

		this.buttons[buttonName].setCounter(counter);
	}

	updateUserList()
	{
		if (this.layout === Layouts.Mobile)
		{
			if (this.localUser !== this.centralUser)
			{
				if (this.localUser.hasVideo())
				{
					this.localUser.mount(this.elements.localUserMobile);
					this.localUser.visible = true;
				}
				else
				{
					this.localUser.dismount();
				}

				this.centralUser.mount(this.elements.center);
				this.eventEmitter.emit(EventName.onHasMainStream, {
					userId: this.centralUser.id,
					otherUsers: [...this.activeUsers],
				});
				this.centralUser.visible = true;
			}

			return;
		}

		if ((this.layout === Layouts.Grid || this.layout === Layouts.Centered) && this.size === Size.Full)
		{
			this.recalculatePages();
		}

		this.renderUserList();

		if (!this.elements.userList.container.parentElement)
		{
			if (this.layout === Layouts.Centered)
			{
				Dom.append(this.elements.userList.container, this.elements.userBlock);
			}
			else if (this.layout === Layouts.Grid)
			{
				Dom.append(this.elements.userList.container, this.elements.container);
			}
		}
		this.toggleEars();
	}

	showOverflownButtonsPopup()
	{
		if (this.overflownButtonsPopup)
		{
			this.overflownButtonsPopup.show();

			return;
		}

		const bindElement = this.buttons.more && this.buttons.more.elements.root
			? this.buttons.more.elements.root
			: this.elements.panel;

		this.overflownButtonsPopup = new Popup({
			id: 'bx-call-buttons-popup',
			ariaLabel: Loc.getMessage('CALL_VIEW_MORE_POPUP_ARIA'),
			closeByEsc: true,
			bindElement,
			targetContainer: this.elements.root,
			content: this.renderButtons(Object.keys(this.overflownButtons), true),
			cacheable: false,
			closeIcon: false,
			autoHide: true,
			overlay: { backgroundColor: 'white', opacity: 0 },
			bindOptions: {
				position: 'top',
			},
			angle: { position: 'bottom', offset: 49 },
			className: 'bx-call-buttons-popup',
			contentBackground: 'unset',
			events: {
				onPopupDestroy: () => {
					this.overflownButtonsPopup = null;
					this.buttons.more.setActive(false);

					const moreRoot = this.buttons.more?.elements?.root;
					if (moreRoot)
					{
						moreRoot.setAttribute('aria-expanded', 'false');
						if (!document.activeElement || document.activeElement === document.body)
						{
							moreRoot.focus();
						}
					}
				},
			},
		});
		this.overflownButtonsPopup.show();
		this.buttons.more?.elements?.root?.setAttribute('aria-expanded', 'true');
	}

	resumeVideo()
	{
		for (const userId of Object.keys(this.users))
		{
			const user = this.users[userId];
			user.playVideo();
			const screenUser = this.screenUsers[userId];
			screenUser.playVideo();
		}
		this.localUser.playVideo();
	}

	updateUserButtons()
	{
		const currentConnectedUserCount = this.getConnectedUserCount();
		const previousConnectedUserCount = this.cache.get('previousConnectedUserCount');

		if (currentConnectedUserCount > 1 && previousConnectedUserCount > 1)
		{
			return;
		}

		for (const userId of Object.keys(this.users))
		{
			this.users[userId].allowPinButton = currentConnectedUserCount > 1;
		}
	}

	updateButtons(skippedElementsList = [])
	{
		if (!this.elements.panel)
		{
			return;
		}

		if (!skippedElementsList.includes('panel'))
		{
			const buttonList = this.getButtonList();
			if (this.needToRerenderButtonList)
			{
				Dom.clean(this.elements.panel);
				Dom.append(this.renderButtons(buttonList, this.needToRerenderButtonList), this.elements.panel);
				this.needToRerenderButtonList = false;
			}
			else
			{
				this.renderButtons(buttonList);
			}
		}

		if (this.elements.topPanel)
		{
			const topButtonList = this.getTopButtonList();
			if (this.needToRerenderTopButtonList)
			{
				Dom.clean(this.elements.topPanel);
			}
			this.renderTopButtons(topButtonList, this.needToRerenderTopButtonList);
			this.needToRerenderTopButtonList = false;
		}

		if (this.buttons.participantsMobile)
		{
			this.buttons.participantsMobile.setCount(this.getConnectedUserCount(true));
		}

		if (this.needToShowCallcontrolPromo && this.buttons.callcontrol)
		{
			this.needToShowCallcontrolPromo = false;

			void Promise.resolve(true).then(() => {
				if (this.destroyed)
				{
					return;
				}
				this.#callPopupQueue.add(3, (onDone) => {
					if (this.size === Size.Folded)
					{
						onDone();
					}
					else
					{
						this.#showCallControlPromo(onDone);
					}
				});
			});
		}

		this.renderAddUserButtonInList();

		this.#syncDeviceSelectorAvailability();

		this.syncPictureInPictureBlockedButtons();
	}

	updateUserData(userData)
	{
		for (const userId of Object.keys(userData))
		{
			this.#applyUserData(userId, userData[userId]);
		}
	}

	#applyUserData(userId, data)
	{
		if (!this.userData[userId])
		{
			this.userData[userId] = {
				name: '',
				avatar_hr: '',
				gender: 'M',
			};
		}

		const target = this.userData[userId];

		if (data.name)
		{
			target.name = data.name;
		}

		const avatar = data.avatar_hr || data.avatar;
		if (avatar)
		{
			target.avatar_hr = Util.isAvatarBlank(avatar) ? '' : avatar;
		}

		if (data.gender)
		{
			target.gender = data.gender === 'F' ? 'F' : 'M';
		}

		const userModel = this.userRegistry.get(userId);
		if (userModel)
		{
			userModel.name = target.name;
			userModel.avatar = checkAndEncodeURI(target.avatar_hr);
		}
	}

	isScreenSharingSupported()
	{
		return (navigator.mediaDevices && Type.isFunction(navigator.mediaDevices.getDisplayMedia))
			|| !Type.isUndefined(window.BXDesktopSystem);
	}

	isRecordingHotKeySupported()
	{
		return !Type.isUndefined(window.BXDesktopSystem) && window.BXDesktopSystem.ApiVersion() >= 60;
	}

	isFullScreenSupported()
	{
		if (BX.browser.IsChrome() || BX.browser.IsSafari())
		{
			return document.webkitFullscreenEnabled === true;
		}

		if (BX.browser.IsFirefox())
		{
			return document.fullscreenEnabled === true;
		}

		return false;
	}

	toggleEars()
	{
		this.toggleTopEar();
		this.toggleBottomEar();

		if (this.layout === Layouts.Grid && this.pagesCount > 1 && this.currentPage > 1)
		{
			Dom.addClass(this.elements.pageNavigatorLeft, 'active');
		}
		else
		{
			Dom.removeClass(this.elements.pageNavigatorLeft, 'active');
		}

		if (this.layout === Layouts.Grid && this.pagesCount > 1 && this.currentPage < this.pagesCount)
		{
			Dom.addClass(this.elements.pageNavigatorRight, 'active');
		}
		else
		{
			Dom.removeClass(this.elements.pageNavigatorRight, 'active');
		}
	}

	toggleTopEar()
	{
		if (
			this.layout !== Layouts.Grid
			&& this.pagesCount > 1
		)
		{
			Dom.addClass(this.elements.ear.top, 'active');
		}
		else
		{
			Dom.removeClass(this.elements.ear.top, 'active');
		}
	}

	toggleBottomEar()
	{
		if (
			this.layout !== Layouts.Grid
			&& this.pagesCount > 1
		)
		{
			Dom.addClass(this.elements.ear.bottom, 'active');
		}
		else
		{
			Dom.removeClass(this.elements.ear.bottom, 'active');
		}
	}

	toggleRenameSliderInputLoader()
	{
		Dom.addClass(this.elements.renameSlider.button, 'ui-btn-wait');
	}

	setHotKeyTemporaryBlock(isActive, force)
	{
		if (isActive)
		{
			this.hotKeyTemporaryBlock++;
		}
		else
		{
			this.hotKeyTemporaryBlock--;
			if (this.hotKeyTemporaryBlock < 0 || force)
			{
				this.hotKeyTemporaryBlock = 0;
			}
		}
	}

	isHotKeyActive(name)
	{
		if (!this.hotKey.all)
		{
			return false;
		}

		if (this.hotKeyTemporaryBlock > 0)
		{
			return false;
		}

		if (this.isButtonHidden(name))
		{
			return false;
		}

		if (this.isButtonBlocked(name))
		{
			return false;
		}

		return Boolean(this.hotKey[name]);
	}

	// The three below carry what only the controller sees down to the hold policy. The coordinator is
	// assembled here, so the controller reaches it through the view contract and gets no channel of
	// its own into the extension.

	notifyConnectionLost()
	{
		this.pushToTalkCoordinator?.onConnectionLost();
	}

	notifyBroadcastRightLost()
	{
		this.pushToTalkCoordinator?.onBroadcastRightLost();
	}

	notifySpeechSignal(signal, speaking)
	{
		this.pushToTalkCoordinator?.onSpeechSignal(signal, speaking);
	}

	// While the focus sits inside the record informer, the keys of the call window stay quiet: Space
	// on a native button of the layer is indistinguishable from push-to-talk.
	startRecordPopupHotKeyGuard(container)
	{
		this.stopRecordPopupHotKeyGuard();

		if (!container)
		{
			return;
		}

		const guard = this.recordPopupHotKeyGuard;

		guard.container = container;
		guard.onFocusIn = () => this.setRecordPopupHotKeyBlock(true);
		guard.onFocusOut = (e) => {
			// focusout also fires while the focus travels between the buttons of the layer
			if (container.contains(e.relatedTarget))
			{
				return;
			}

			this.setRecordPopupHotKeyBlock(false);
		};

		Event.bind(container, 'focusin', guard.onFocusIn);
		Event.bind(container, 'focusout', guard.onFocusOut);
	}

	// Belongs to the destruction of the layer, not to its closing: Popup.destroy() emits no close
	// event, and a layer torn down while focused would leave the block raised for the whole call.
	stopRecordPopupHotKeyGuard(force = false)
	{
		const guard = this.recordPopupHotKeyGuard;

		if (guard.container)
		{
			Event.unbind(guard.container, 'focusin', guard.onFocusIn);
			Event.unbind(guard.container, 'focusout', guard.onFocusOut);
		}

		guard.container = null;
		guard.onFocusIn = null;
		guard.onFocusOut = null;

		this.setRecordPopupHotKeyBlock(false, force);
	}

	// The counter is shared with the participant selector and the conference, so the guard moves it
	// once per state change and keeps its own flag: a stray decrement would drop someone else's block.
	setRecordPopupHotKeyBlock(isBlocked, force = false)
	{
		const guard = this.recordPopupHotKeyGuard;

		if (guard.isBlocked === isBlocked)
		{
			return;
		}

		guard.isBlocked = isBlocked;
		this.setHotKeyTemporaryBlock(isBlocked, force);
	}

	showCommonRecordMenuPopup(isDesktopRecord = false)
	{
		if (this.#commonRecord.menuPopup)
		{
			this.#commonRecord.menuPopup.close();

			return;
		}

		const popupType = [CallCommonRecordState.Stopped, CallCommonRecordState.Destroyed].includes(this.commonRecordState.state) ? 'kind' : 'control';

		this.#commonRecord.menuPopup = new CommonRecordMenuPopup({
			state: this.commonRecordState.state,
			popupType,
			isDesktopRecord,
			isServiceEnabled: CallCloudRecord.serviceEnabled,
			bindElement: this.buttons.record?.elements?.root,
			targetContainer: this.elements.root,
			onStart: (kind) => {
				this.eventEmitter.emit(EventName.onCommonRecordMenu, {
					state: CallCommonRecordState.Started,
					kind,
				});
			},
			onStop: () => {
				this.eventEmitter.emit(EventName.onCommonRecordMenu, {
					state: CallCommonRecordState.Stopped,
				});
			},
			onPause: () => {
				const isPaused = this.commonRecordState.state === CallCommonRecordState.Paused;

				this.commonRecordState.state = isPaused ? CallCommonRecordState.Started : CallCommonRecordState.Paused;

				const commonRecordState = isPaused ? CallCommonRecordState.Resumed : this.commonRecordState.state;

				// the indicator and the description say the same state, so the optimistic redraw carries both
				this.buttons.recordStatus?.update(this.commonRecordState);
				this.#syncRecordButtonStateDescription();

				this.eventEmitter.emit(EventName.onCommonRecordMenu, {
					state: commonRecordState,
				});
			},
			onDestroy: () => {
				if (!CallCloudRecord.serviceEnabled)
				{
					return;
				}

				this.eventEmitter.emit(EventName.onCommonRecordMenu, {
					state: CallCommonRecordState.Destroyed,
				});
			},
			onClose: () => {
				// the layer owns the ARIA of the trigger until destroy, so a closed menu is torn down here
				this.#commonRecord.menuPopup?.destroy();
				this.#commonRecord.menuPopup = null;
			},
			onOpenStateChange: (isOpen) => {
				this.buttons.record?.setPopupOpen(isOpen);
			},

		});

		this.#commonRecord.menuPopup.toggle();

		// a menu built without a trigger reports no closing back, and a field left taken by it would send
		// every next click into the early return above: the record menu would stay dead until the call ends
		if (!this.#commonRecord.menuPopup?.isShown())
		{
			this.#commonRecord.menuPopup = null;
		}
	}

	showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, options = {})
	{
		const { onDone = null, source = CloudRecordInfoPopupSource.User } = options;

		if (this.#commonRecord.infoPopup)
		{
			this.#commonRecord.infoPopup.close();
			onDone?.();

			return;
		}

		this.#commonRecord.infoPopup = new CloudRecordInfoPopup({
			isCloudRecordFeaturesEnabled,
			tariffAvailable: CallCloudRecord.tariffAvailable,
			source,
			callId,
			bindElement: this.buttons.record?.elements?.root,
			targetContainer: this.elements.root,
			onClose: () => {
				this.#commonRecord.infoPopup = null;
				onDone?.();
			},
			onDestroy: () => {
				this.stopRecordPopupHotKeyGuard();
			},
			turnOn: () => {
				this.showCommonRecordMenuPopup();
			},
		});

		this.#commonRecord.infoPopup.toggle();
		// a layer built without a trigger reports itself closed right away, so the field can be empty here
		this.startRecordPopupHotKeyGuard(this.#commonRecord.infoPopup?.getPopupContainer());
	}

	showCommonRecordStartNotify(userId, state = CallCommonRecordState.Started)
	{
		if (this.#commonRecord.notify)
		{
			this.#commonRecord.notify.close();
			this.#commonRecord.notify = null;
		}

		const userModel = this.userRegistry.get(userId);
		const userGender = userModel && userModel.data.gender ? userModel.data.gender.toUpperCase() : 'M';

		this.#commonRecord.notify = BX.UI.Notification.Center.notify({
			position: 'top-right',
			autoHideDelay: 8000,
			closeButton: true,
			render() {
				return Dom.create('div', {
					props: {
						className: 'ui-notification-balloon-content call-cloud-record-notify',
					},
					children: [
						Dom.create('div', {
							props: {
								className: 'ui-notification-balloon-message',
							},
							children: [
								Dom.create('div', {
									props: {
										className: 'call-cloud-record-notify__icon',
									},
								}),
								Dom.create('div', {
									props: {
										className: 'call-cloud-record-notify__message',
									},
									text: Loc.getMessage(`CALL_CLOUD_RECORD_NOTIFY_${state.toUpperCase()}_${userGender}`, {
										'#INITIATOR_NAME#': userModel?.data?.name || '',
									}),
								}),
							],
						}),
						Dom.create('div', {
							props: {
								className: 'ui-notification-balloon-actions',
							},
						}),
						this.getCloseButton(),
					],
				});
			},
		});
	}

	// A layer that outlived its record state is torn down, not refilled in place: the items would
	// change under the hand of the user, and the focus would be left on an item that is gone.
	#closeStaleCommonRecordPopups()
	{
		this.#commonRecord.menuPopup = closeCommonRecordPopupLayer(this.#commonRecord.menuPopup);
		this.#commonRecord.infoPopup = closeCommonRecordPopupLayer(this.#commonRecord.infoPopup);
	}

	closeCommonRecordPopups()
	{
		this.#closeStaleCommonRecordPopups();

		if (this.#commonRecord.notify)
		{
			this.#commonRecord.notify.close();
			this.#commonRecord.notify = null;
		}
	}

	/**
	 * @param { Object } params
	 * @param { string } params.title
	 * @param { string } params.message
	 * @param { string } params.yesButtonText
	 * @param { string } params.noButtonText
	 * @returns {Promise}
	 */
	showConfirmModal(params)
	{
		if (this.#confirmModal)
		{
			this.#confirmModal.close();
			this.#confirmModal = null;
		}

		return new Promise((resolve) => {
			let isResolved = false;

			const resolveOnce = (choice) => {
				if (isResolved)
				{
					return;
				}
				isResolved = true;
				resolve(choice);
			};

			this.#confirmModal = new ConfirmModal({
				...params,
				targetContainer: this.elements.root,
				onClose: () => {
					this.#confirmModal = null;
					resolveOnce('close');
				},
				onClickYesButton: () => resolveOnce('yes'),
				onClickNoButton: () => resolveOnce('no'),
			});

			this.#confirmModal.show();
		});
	}

	showCommonRecordStartModal()
	{
		void this.showConfirmModal({
			title: Loc.getMessage('CALL_CLOUD_RECORD_MODAL_START_TITLE'),
			message: Loc.getMessage('CALL_CLOUD_RECORD_MODAL_START_MESSAGE'),
			yesButtonText: Loc.getMessage('CALL_CLOUD_RECORD_MODAL_START_RESUME_BUTTON'),
		});
	}

	showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId)
	{
		// TODO: Remove once PromoManager is available for conferences
		if (this.isVideoconf)
		{
			return;
		}

		const promoManager = PromoManager.getInstance();

		if (!promoManager.needToShow(CLOUD_RECORD_PROMO_ID))
		{
			return;
		}

		this.#callPopupQueue.add(2, (onDone) => {
			void promoManager.markAsWatched(CLOUD_RECORD_PROMO_ID);
			this.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, {
				onDone,
				source: CloudRecordInfoPopupSource.Promo,
			});
		});
	}

	// event handlers

	#onBodyClick()
	{
		this.eventEmitter.emit(EventName.onBodyClick);
	}

	#onCenterTouchStart(e)
	{
		this.centerTouchX = e.pageX;
	}

	#onCenterTouchEnd(e)
	{
		const delta = e.pageX - this.centerTouchX;

		if (delta > 100)
		{
			this.pinUser(this.getRightUser(this.centralUser.id));
			e.preventDefault();
		}

		if (delta < -100)
		{
			this.pinUser(this.getLeftUser(this.centralUser.id));
			e.preventDefault();
		}
	}

	#onFullScreenChange()
	{
		if ('webkitFullscreenElement' in document)
		{
			this.isFullScreen = (Boolean(document.webkitFullscreenElement));
		}
		else if ('fullscreenElement' in document)
		{
			this.isFullScreen = (Boolean(document.fullscreenElement));
		}
		else
		{
			return;
		}

		// safari workaround
		setTimeout(() => {
			if (!this.elements.root)
			{
				return;
			}

			this.eventEmitter.emit(EventName.onFullScreenChange, {
				isFullScreen: this.isFullScreen,
			});

			if (this.isFullScreen)
			{
				Dom.addClass(this.elements.root, 'bx-messenger-videocall-fullscreen');
			}
			else
			{
				Dom.removeClass(this.elements.root, 'bx-messenger-videocall-fullscreen');
			}

			this.updateUserList();
			this.updateButtons();
			this.setUserBlockFolded(this.isFullScreen);
		}, 0);
	}

	#onIntersectionChange(entries)
	{
		const t = {};
		entries.forEach((intersectionEntry) => {
			t[intersectionEntry.target.dataset.userId] = intersectionEntry.isIntersecting;
		});
		for (const userId of Object.keys(t))
		{
			if (this.users[userId])
			{
				this.users[userId].visible = t[userId];
			}

			if (isSameUser(userId, this.localUser.id))
			{
				this.localUser.visible = t[userId];
			}
		}
	}

	#onResize()
	{
		if (!this.elements.root)
		{
			return;
		}

		if (BX.browser.IsMobile())
		{
			Dom.style(document.documentElement, '--view-height', `${window.innerHeight}px`);
		}

		if (this.layout === Layouts.Grid || this.layout === Layouts.Centered)
		{
			this.updateUserList();
		}
		else
		{
			this.updateCentralUserAvatarSize();
			this.toggleEars();
		}

		const rootDimensions = this.elements.root.getBoundingClientRect();
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-450', rootDimensions.width < 450);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-550', rootDimensions.width < 550);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-650', rootDimensions.width < 650);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-700', rootDimensions.width < 700);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-850', rootDimensions.width < 850);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-900', rootDimensions.width < 900);
		Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-width-lt-1050', rootDimensions.width < 1050);

		if (this.checkPanelOverflow())
		{
			this.updateButtons();
			if (this.overflownButtonsPopup && Object.keys(this.overflownButtons).length === 0)
			{
				this.overflownButtonsPopup.close();
			}
		}
	}

	#onOrientationChange()
	{
		if (!this.elements.root)
		{
			return;
		}

		if (window.innerHeight > window.innerWidth)
		{
			Dom.removeClass(this.elements.root, 'orientation-landscape');
		}
		else
		{
			Dom.addClass(this.elements.root, 'orientation-landscape');
		}
	}

	#destroyHotKeyHint()
	{
		if (!Util.isDesktop())
		{
			return;
		}

		if (!this.hintManager.popup)
		{
			return;
		}

		// we need to destroy, not .hide for onShow event handler (see method _showHotKeyHint).
		this.hintManager.hide();
		this.hintManager.popup.destroy();
		this.hintManager.popup = null;
	}

	#onKeyDown(e)
	{
		if (!Util.isDesktop())
		{
			return;
		}

		// a layer with a keyboard of its own has already acted on this event
		if (e.defaultPrevented)
		{
			return;
		}

		if (!(e.shiftKey && (e.ctrlKey || e.metaKey)))
		{
			return;
		}

		if (e.repeat)
		{
			return;
		}

		const hotKey = this.#getHotKeyByCode(e.code);
		if (!hotKey || hotKey.isSupported?.() === false || !this.isHotKeyActive(hotKey.name))
		{
			return;
		}

		e.preventDefault();
		hotKey.run(e);
	}

	#getHotKeyByCode(code)
	{
		const hotKeys = {
			KeyA: {
				name: 'microphone',
				run: (e) => {
					this.#destroyDeviceSelector();
					this.#onMicrophoneButtonClick(e);
				},
			},
			KeyS: {
				name: 'screen',
				run: (e) => this.#onScreenButtonClick(e),
			},
			KeyV: {
				name: 'camera',
				run: (e) => {
					this.#destroyDeviceSelector();
					this.#onCameraButtonClick(e);
				},
			},
			KeyU: {
				name: 'users',
				run: (e) => this.#onUsersButtonClick(e),
			},
			KeyR: {
				name: 'record',
				isSupported: () => this.isRecordingHotKeySupported(),
				run: () => this.#onCommonRecordHotkey(),
			},
			KeyH: {
				name: 'floorRequest',
				run: (e) => this.#onFloorRequestButtonClick(e),
			},
			KeyC: {
				name: 'chat',
				run: (e) => this.#onChatHotKey(e),
			},
			KeyM: {
				name: 'muteSpeaker',
				run: () => this.eventEmitter.emit(EventName.onButtonClick, {
					buttonName: 'toggleSpeaker',
					speakerMuted: this.speakerMuted,
					fromHotKey: true,
				}),
			},
			KeyW: {
				name: 'grid',
				run: () => this.setLayout(this.layout === Layouts.Centered ? Layouts.Grid : Layouts.Centered),
			},
		};

		return hotKeys[code] ?? null;
	}

	#onChatHotKey(e)
	{
		if (this.size === Size.Folded)
		{
			this.#onBodyClick(e);

			return;
		}

		this.#onChatButtonClick(e);
		this.#destroyHotKeyHint();
	}

	#destroyDeviceSelector()
	{
		if (this.deviceSelector)
		{
			this.deviceSelector.destroy();
		}
	}

	#onUserClick(event)
	{
		const userId = event.userId;

		if (isSameUser(userId, this.centralUser.id) && this.layout !== Layouts.Grid && this.isFullScreen)
		{
			Dom.toggleClass(this.elements.root, 'bx-messenger-videocall-hidden-panels');
		}
		else if (this.layout === Layouts.Centered && !isSameUser(userId, this.centralUser.id))
		{
			this.pinUser(userId);
		}
		else if (this.pinnedUser && this.pinnedUser.id === userId)
		{
			this.#onUserUnPin();
		}
		else
		{
			this.#onUserPin({ userId });
		}

		this.eventEmitter.emit(EventName.onUserClick, {
			userId,
			stream: isSameUser(userId, this.userId) ? this.localUser.stream : this.users[userId].stream,
			layout: this.layout,
		});
	}

	#onUserRename(newName)
	{
		this.eventEmitter.emit(EventName.onUserRename, { newName });
	}

	#onUserRenameInputFocus()
	{
		this.setHotKeyTemporaryBlock(true);
	}

	#onUserRenameInputBlur()
	{
		this.setHotKeyTemporaryBlock(false);
	}

	#onUserPin(e)
	{
		if (this.layout === Layouts.Grid)
		{
			this.setLayout(Layouts.Centered);
		}
		this.pinUser(e.userId);
	}

	#onUserUnPin()
	{
		if (this.layout === Layouts.Centered)
		{
			this.setLayout(Layouts.Grid);
		}
		else
		{
			this.unpinUser();
		}
	}

	#onTurnOffParticipantMic(e)
	{
		this.eventEmitter.emit(EventName.onTurnOffParticipantMic, {
			userId: e.userId,
		});
	}

	#onTurnOffParticipantCam(e)
	{
		this.eventEmitter.emit(EventName.onTurnOffParticipantCam, {
			userId: e.userId,
		});
	}

	#onTurnOffParticipantScreenshare(e)
	{
		this.eventEmitter.emit(EventName.onTurnOffParticipantScreenshare, {
			userId: e.userId,
		});
	}

	#onCommonRecordClick()
	{
		const limitObj = this.getRecordLimitation();

		this.onClickButtonWithLimit(limitObj, () => {
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'record',
			});
		});
	}

	#onCommonRecordHotkey()
	{
		const limitObj = this.getRecordLimitation();

		this.onClickButtonWithLimit(limitObj, () => {
			const state = [
				CallCommonRecordState.Stopped,
				CallCommonRecordState.Destroyed,
			].includes(this.commonRecordState.state)
				? CallCommonRecordState.Started
				: CallCommonRecordState.Stopped;

			this.eventEmitter.emit(EventName.onCommonRecordMenu, {
				state,
				hotkey: true,
			});
		});
	}

	#onDocumentButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'document',
			node: e.target,
		});
	}

	#onCopilotButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'copilot',
			node: e.target,
		});
	}

	#onGridButtonClick()
	{
		this.setLayout(this.layout === Layouts.Centered ? Layouts.Grid : Layouts.Centered);
	}

	#onAddButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'inviteUser',
			node: e.currentTarget,
		});
	}

	#onShareButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'share',
			node: e.currentTarget,
		});
	}

	#onMicrophoneButtonClick(e = {})
	{
		if (this.isButtonBlocked('microphone'))
		{
			return;
		}

		if ('stopPropagation' in e)
		{
			e.stopPropagation();
		}

		// a click is not remembered as a command of the hold policy: for the policy it is somebody
		// else's doing, and the microphone it opens must not be released by the next key up
		this.#emitToggleMute(!Hardware.isMicrophoneMuted, MICROPHONE_SOURCE_BUTTON);
	}

	#emitToggleMute(muted, source)
	{
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'toggleMute',
			muted,
			source,
		});
	}

	#rememberMicrophoneCommand(muted)
	{
		this.#forgetMicrophoneCommand();
		this.#pendingMicrophoneCommand = {
			muted,
			timerId: BrowserClock.after(MICROPHONE_COMMAND_CONFIRM_TIMEOUT, () => this.#forgetMicrophoneCommand()),
		};
	}

	#forgetMicrophoneCommand()
	{
		if (this.#pendingMicrophoneCommand === null)
		{
			return;
		}

		BrowserClock.cancel(this.#pendingMicrophoneCommand.timerId);
		this.#pendingMicrophoneCommand = null;
	}

	// the device library reports no source, so everything except the confirmation of the last command
	// of the hold policy counts as somebody else's doing. The memory is one-shot: the first change
	// spends it, otherwise a dropped command would make the next unmute of the same value look ours.
	#publishMicrophoneChange(muted)
	{
		const isOwnCommand = this.#pendingMicrophoneCommand?.muted === muted;

		this.#forgetMicrophoneCommand();

		if (!isOwnCommand)
		{
			this.pushToTalkCoordinator?.onExternalMicrophoneChange(muted);

			return;
		}

		this.#announceMicrophoneState(muted);
	}

	/**
	 * A microphone moved by the hold policy is moved with the focus elsewhere, and aria-checked of a
	 * button nobody stands on is not spoken. A click needs no announcement of its own - the reader
	 * says the new state of the control the user has just operated.
	 *
	 * This is also the only voice the automatic closes have: the silence limit, leaving the zone, a
	 * lost connection and a right taken away all reach the window as a command of the policy.
	 */
	#announceMicrophoneState(muted)
	{
		const phrase = Loc.getMessage(muted ? 'CALL_VIEW_MIC_ANNOUNCE_OFF' : 'CALL_VIEW_MIC_ANNOUNCE_ON');

		if (!phrase)
		{
			return;
		}

		// the picture-in-picture window is a window of its own, with a document and a focus of its
		// own, and a reader following it is not told about a region of the opener. The reader stands
		// where the focus is, so that window is addressed only while the main document holds none -
		// one document at a time, and the one the user is not in would be talking to nobody
		if (!document.hasFocus() && this.pictureInPictureCallWindow?.announceMessage(phrase))
		{
			return;
		}

		// polite: an announcement of the call window never interrupts the screen reader
		LiveAnnouncer.announce(phrase, 'polite');
	}

	#onMicrophoneArrowClick(e)
	{
		e.stopPropagation();
		this.showDeviceSelector(e.currentTarget);
	}

	#onMicrophoneSideIconClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'microphoneSideIcon',
		});
	}

	#onMicrophoneSelected(deviceId)
	{
		this.eventEmitter.emit(EventName.onReplaceMicrophone, {
			deviceId,
		});
	}

	#onCameraButtonClick(e = {})
	{
		if (this.isButtonBlocked('camera'))
		{
			return;
		}

		if ('stopPropagation' in e)
		{
			e.stopPropagation();
		}
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'toggleVideo',
			video: !Hardware.isCameraOn,
		});
	}

	#onCameraArrowClick(e)
	{
		e.stopPropagation();
		this.showDeviceSelector(e.currentTarget);
	}

	#onCameraSelected(deviceId)
	{
		this.eventEmitter.emit(EventName.onReplaceCamera, {
			deviceId,
		});
	}

	#onSpeakerButtonClick()
	{
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'toggleSpeaker',
			speakerMuted: this.speakerMuted,
		});
	}

	#onChangeNoiseSuppression(allowNoiseSuppression)
	{
		this.eventEmitter.emit(EventName.onChangeNoiseSuppression, { allowNoiseSuppression });
	}

	#onChangeFaceImprove(faceImproveEnabled)
	{
		this.eventEmitter.emit(EventName.onChangeFaceImprove, { faceImproveEnabled });
	}

	// The only handler kept public on purpose: it decides what the quality event carries, and the unit
	// test pins that decision directly. Hiding it behind # would leave the rule covered only through the
	// device selector, whose callback the test would then have to build.
	onChangeVideoQuality(params)
	{
		const data = { ...params };
		if (this.layout === Layouts.Centered)
		{
			data.userId = this.centralUser?.id;
		}
		this.eventEmitter.emit(EventName.onChangeVideoQuality, data);
	}

	disableFaceImprove()
	{
		if (
			Util.isDesktop()
			&& DesktopApi.isDesktop()
			&& DesktopApi.getCameraSmoothingStatus()
		)
		{
			this.eventEmitter.emit(EventName.onChangeFaceImprove, {
				faceImproveEnabled: false,
			});
		}
	}

	#onSpeakerSelected(deviceId)
	{
		if (!this.externalSpeakerManagement)
		{
			this.setSpeakerId(deviceId);
		}

		this.eventEmitter.emit(EventName.onReplaceSpeaker, {
			deviceId,
		});
	}

	confirmSpeakerSelection(deviceId)
	{
		this.speakerId = deviceId;
		if (this.deviceSelector)
		{
			this.deviceSelector.confirmSpeakerSelection(deviceId);
		}
	}

	#onScreenButtonClick(e)
	{
		e.stopPropagation();

		const limitObj = this.getScreenSharingLimitation();

		this.onClickButtonWithLimit(limitObj, () => {
			this.eventEmitter.emit(EventName.onButtonClick, {
				buttonName: 'toggleScreenSharing',
				node: e.target,
			});
		});
	}

	#onChatButtonClick(e)
	{
		this.hintManager.hide();
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'showChat',
			node: e.target,
		});
	}

	#onUsersButtonClick(e)
	{
		this.hintManager.hide();
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'toggleUsers',
			node: e.target,
		});
	}

	#onMobileMenuButtonClick(e)
	{
		e.stopPropagation();
		this.showCallMenu();
	}

	#onFloorRequestButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'floorRequest',
			node: e.target,
		});
	}

	#onMoreButtonClick(e)
	{
		e.stopPropagation();
		if (this.overflownButtonsPopup)
		{
			this.overflownButtonsPopup.close();
			this.buttons.more.setActive(false);
		}
		else
		{
			this.showOverflownButtonsPopup();
			this.buttons.more.setActive(true);
		}
	}

	#onHangupButtonClick(e)
	{
		e.stopPropagation();
		this.clearNewLogicRules();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'hangup',
			node: e.target,
		});
	}

	#onHangupOptionsButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'hangupOptions',
			node: e.target,
		});
	}

	#onCloseButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'close',
			node: e.target,
		});
	}

	#onFullScreenButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'fullscreen',
			node: e.target,
		});
	}

	#onFeedbackButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'feedback',
			node: e.target,
		});
	}

	#onLinkButtonClick()
	{
		if (!this.#guestLink)
		{
			return;
		}

		const notifyCopied = () => {
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('CALL_VIEW_GUEST_LINK_COPIED'),
				autoHideDelay: 5000,
				useAirDesign: true,
			});
		};

		const notifyError = () => {
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('CALL_VIEW_GUEST_LINK_COPY_ERROR'),
				autoHideDelay: 5000,
				useAirDesign: true,
			});
		};

		Clipboard.copy(this.#guestLink)
			.then(notifyCopied)
			.catch(notifyError)
		;
	}

	#onCallcontrolButtonClick(e)
	{
		e.stopPropagation();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'callcontrol',
			node: e.target,
		});

		if (this.ahaMomentNotifyCallcontrol)
		{
			void PromoManager.getInstance().markAsWatched(CALLCONTROL_PROMO_ID);
		}

		this.clearCallcontrolPromo();
	}

	#onParticipantsButtonListClick(event)
	{
		if (!this.isButtonBlocked('users'))
		{
			this.#onUsersButtonClick(event);

			return;
		}

		if (!this.isFullScreen)
		{
			return;
		}

		this.setUserBlockFolded(!this.isUserBlockFolded);
	}

	#onParticipantsButtonMobileListClick()
	{
		this.showParticipantsMenu();
	}

	#onMobileCallMenuFloorRequestClick()
	{
		this.callMenu.close();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'floorRequest',
		});
	}

	#onMobileCallMenShowParticipantsClick()
	{
		this.callMenu.close();
		this.showParticipantsMenu();
	}

	#onMobileCallMenuCopyInviteClick()
	{
		this.callMenu.close();
		this.eventEmitter.emit(EventName.onButtonClick, {
			buttonName: 'share',
			node: null,
		});
	}

	showRenameSlider()
	{
		if (!this.renameSlider)
		{
			this.renameSlider = new MobileSlider({
				parent: this.elements.root,
				content: this.renderRenameSlider(),
				onClose: () => this.renameSlider.destroy(),
				onDestroy: () => {
					this.renameSlider = null;
				},
			});
		}

		this.renameSlider.show();
		setTimeout(
			() => {
				this.elements.renameSlider.input.focus();
				this.elements.renameSlider.input.select();
			},
			400,
		);
	}

	renderRenameSlider()
	{
		this.elements.renameSlider.input = Dom.create('input', {
			props: {
				className: 'bx-videocall-mobile-rename-slider-input',
			},
			attrs: {
				type: 'text',
				value: this.localUser.userModel.name,
			},
		});

		this.elements.renameSlider.button = Dom.create('button', {
			props: {
				className: 'bx-videocall-mobile-rename-slider-button ui-btn ui-btn-md ui-btn-primary',
			},
			text: Loc.getMessage('IM_M_CALL_MOBILE_RENAME_CONFIRM'),
			events: {
				click: this.#onMobileUserRename.bind(this),
			},
		});

		return Dom.create('div', {
			props: {
				className: 'bx-videocall-mobile-rename-slider-wrap',
			},
			children: [
				Dom.create('div', {
					props: {
						className: 'bx-videocall-mobile-rename-slider-title',
					},
					text: Loc.getMessage('IM_M_CALL_MOBILE_MENU_CHANGE_MY_NAME'),
				}),
				this.elements.renameSlider.input,
				this.elements.renameSlider.button,
			],
		});
	}

	#onMobileUserRename(event)
	{
		event.stopPropagation();

		const inputValue = this.elements.renameSlider.input.value;
		const newName = inputValue.trim();
		let needToUpdate = true;
		if (newName === this.localUser.userModel.name || newName === '')
		{
			needToUpdate = false;
		}

		if (needToUpdate)
		{
			this.toggleRenameSliderInputLoader();
			this.#onUserRename(newName);
		}
		else
		{
			this.renameSlider.close();
		}
	}

	#onMobileCallMenuCancelClick()
	{
		this.callMenu.close();
	}

	#onLeftEarClick()
	{
		this.pinUser(this.getLeftUser(this.centralUser.id));
	}

	#onRightEarClick()
	{
		this.pinUser(this.getRightUser(this.centralUser.id));
	}

	#onLeftPageNavigatorClick(e)
	{
		e.stopPropagation();
		this.setCurrentPage(this.currentPage - 1);
	}

	#onRightPageNavigatorClick(e)
	{
		e.stopPropagation();
		this.setCurrentPage(this.currentPage + 1);
	}

	#onTopPageNavigatorClick(e)
	{
		e.stopPropagation();
		this.setCurrentPage(this.currentPage === 1 ? this.pagesCount : this.currentPage - 1);
	}

	#onBottomPageNavigatorClick(e)
	{
		e.stopPropagation();
		this.setCurrentPage(this.currentPage === this.pagesCount ? 1 : this.currentPage + 1);
	}

	setMaxWidth(maxWidth)
	{
		if (this.maxWidth !== maxWidth)
		{
			const MAX_WIDTH_SPEAKER_MODE = 650;
			if (maxWidth < MAX_WIDTH_SPEAKER_MODE
				&& (!this.maxWidth || this.maxWidth > MAX_WIDTH_SPEAKER_MODE)
				&& this.layout === Layouts.Centered
			)
			{
				this.setLayout(Layouts.Grid);
			}

			const animateUnsetProperty = this.maxWidth === null;
			this.maxWidth = maxWidth;
			if (this.size !== Size.Folded)
			{
				this.#applyMaxWidth(animateUnsetProperty);
			}
		}
	}

	removeMaxWidth()
	{
		this.setMaxWidth(null);
	}

	#applyMaxWidth(animateUnsetProperty)
	{
		const containerDimensions = this.container.getBoundingClientRect();
		if (this.maxWidth === null)
		{
			Dom.style(this.elements.root, 'maxWidth', `${containerDimensions.width}px`);
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			this.elements.root.addEventListener(
				'transitionend',
				() => Dom.style(this.elements.root, 'maxWidth', null),
				{ once: true },
			);

			return;
		}

		// Reads the inline value, which Dom.style() cannot do: without a value it returns the computed style.
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
		if (!this.elements.root.style.maxWidth && animateUnsetProperty)
		{
			Dom.style(this.elements.root, 'maxWidth', `${containerDimensions.width}px`);
		}

		setTimeout(
			() => {
				Dom.style(this.elements.root, 'maxWidth', `${Math.max(this.maxWidth, MIN_WIDTH)}px`);
			},
			0,
		);
	}

	releaseLocalMedia()
	{
		this.localUser.releaseStream();

		if (isSameUser(this.centralUser.id, this.userId))
		{
			this.centralUser.releaseStream();
		}
	}

	clearNewLogicRules()
	{
		clearTimeout(this.rerenderTimeout);
		this.rerenderTimeout = null;
		this.waitingForUserMediaTimeouts.forEach((timeout) => clearTimeout(timeout));
		this.waitingForUserMediaTimeouts.clear();
		this.rerenderQueue.clear();
	}

	clearCallcontrolPromo()
	{
		if (this.ahaMomentNotifyCallcontrol)
		{
			this.needToShowCallcontrolPromo = false;
			this.ahaMomentNotifyCallcontrol.close();
			this.ahaMomentNotifyCallcontrol = null;
		}
	}

	resetTalkingUsers()
	{
		this.userRegistry.users.forEach((userModel) => {
			if (!userModel.localUser && userModel.talking)
			{
				this.setUserTalking(userModel.id, false);
			}
		});
	}

	destroy()
	{
		// before anything is taken apart: the release the hold policy sends leaves through the event
		// emitter and lands on the microphone button on its way back, and both are gone below
		this.pushToTalkCoordinator?.stop();
		this.pushToTalkCoordinator = null;

		this.destroyed = true;

		this.closeCopilotNotify();
		this.closeCommonRecordPopups();
		// the call is over: a block the guard still holds is dropped even if no layer reported it
		this.stopRecordPopupHotKeyGuard(true);

		if (this.overflownButtonsPopup)
		{
			this.overflownButtonsPopup.close();
		}

		this.preferInitialWindowPlacementPictureInPicture = true;

		const needsHistoryRestore = this.focusScope?.restoreBeforeDetach(this.elements.root) ?? false;

		if (this.elements.root)
		{
			Dom.remove(this.elements.root);
			this.elements.root = null;
		}

		// History restore runs only after the root left the document (ALG-02).
		if (needsHistoryRestore)
		{
			this.focusScope?.restoreAfterDetach();
		}

		this.visible = false;

		this.clearNewLogicRules();

		Event.unbind(window, 'webkitfullscreenchange', this.#onFullScreenChangeHandler);
		Event.unbind(window, 'mozfullscreenchange', this.#onFullScreenChangeHandler);
		Event.unbind(window, 'orientationchange', this.#onOrientationChangeHandler);
		Event.unbind(window, 'keydown', this.#onKeyDownHandler);

		Event.unbind(document, 'mousemove', this.onMouseMoveHandler);

		this.#forgetCameraTracks();
		this.#forgetAudioElements();

		this.resizeObserver.disconnect();
		this.resizeObserver = null;
		if (this.intersectionObserver)
		{
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}

		for (const userId of Object.keys(this.users))
		{
			this.users[userId].userModel.unsubscribe('changed', this.talkingService.watchTalking);
			this.users[userId].destroy();
		}
		this.userData = null;
		this.centralUser.userModel.unsubscribe('changed', this.talkingService.watchTalking);
		this.userRegistry.unsubscribe('changed', this.talkingService.refreshQueue);
		this.talkingService.destroy();
		this.centralUser.destroy();
		this.hintManager.hide();
		this.hintManager = null;

		clearTimeout(this.switchPresenterTimeout);

		if (this.buttons.recordStatus)
		{
			this.buttons.recordStatus.stopViewUpdate();
		}
		this.#resetCommonRecordState();
		this.buttons = null;

		this.eventEmitter.emit(EventName.onDestroy);
		this.eventEmitter.unsubscribeAll();

		Hardware.unsubscribe(Hardware.Events.onChangeMicrophoneMuted, this.setMuted);
		Hardware.unsubscribe(Hardware.Events.onChangeCameraOn, this.setCameraState);

		this.clearCallcontrolPromo();
		this.#callPopupQueue.destroy();

		this.pipCoordinator?.stop();
		this.pipCoordinator = null;

		this.#forgetMicrophoneCommand();

		if (this.deviceSelector)
		{
			this.deviceSelector.destroy();
		}

		this.focusScope?.destroy();
		this.focusScope = null;
	}
}
