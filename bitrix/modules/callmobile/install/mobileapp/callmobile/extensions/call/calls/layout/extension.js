/**
 * @module call/calls/layout
 */

jn.define('call/calls/layout', (require, exports, module) => {
	include('Calls');

	const { BottomSheet } = require('bottom-sheet');
	const { UserRegistry, UserModel } = require('call/calls/users');
	const { GridUserCount, StreamQuality } = require('call/const');
	const Icons = require('icons/icons').Icons;
	const { Color, Corner, Indent } = require('tokens');
	const { CallStatus } = require('call/const');
	const { CallMenu } = require('call/calls/menu');
	const { CopilotDrawer } = require('call/calls/layout/copilot-drawer');
	const { FloorRequestsList } = require('call/calls/layout/floor-requests-list');
	const { ParticipantsList } = require('call/calls/layout/participants-list');
	const { CallSettingsManager } = require('call/settings-manager');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Avatar, AvatarShape, AvatarEntityType } = require('ui-system/blocks/avatar');
	const Utils = require('src/util');
	const MobileUtils = require('utils/function');
	const pathToExtension = `${currentDomain}/bitrix/mobileapp/callmobile/extensions/call/calls/layout/`;
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { chain, transition } = require('animation');
	const { ScrollViewGrid } = require('call/calls/layout/scrollview-grid');
	const { ScrollManager } = require('call/calls/layout/scroll-manager');
	const { GridViewGrid } = require('call/calls/layout/gridview-grid');
	const { NameBadge } = require('call/calls/layout/name-badge');
	const { CallTopPanel } = require('call/calls/layout/call-top-panel');

	const LARGE_AVATAR_SIZE = 180;
	const GRAY_MENU_OPTION = '#828B95';

	const Gradients = {
		top: '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" fill="none"><path fill="url(#a)" d="M0 0h375v116H0V0Z"/><defs><linearGradient id="a" x1="0" x2="0" y1="60" y2="0" gradientUnits="userSpaceOnUse"><stop stop-opacity="0"/><stop offset="1" stop-opacity="0.36"/></linearGradient></defs></svg>',
		bottom: '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" fill="none"><path fill="url(#a)" d="M0 0h375v116H0V0Z"/><defs><linearGradient id="a" x1="0" x2="0" y1="60" y2="0" gradientUnits="userSpaceOnUse"><stop stop-opacity="0.36"/><stop offset="1" stop-opacity="0"/></linearGradient></defs></svg>',
	};

	const styles = {
		root: {
			width: '100%',
			height: '100%',
			backgroundColor: '#3A414B',
			backgroundResizeMode: 'stretch',
			alignItems: 'center',
		},
		overlay: {
			position: 'absolute',
			bottom: 0,
			height: '100%',
			opacity: 1,
			width: '100%',
			alignItems: 'center',
		},
		remoteVideo: {
			position: 'absolute',
			width: '100%',
			height: '100%',
			flex: 1,
		},
		localVideo: {
			width: 110,
			bottom: 11,
			right: 10,
			position: 'absolute',
			height: 150,
			borderRadius: 10,
			backgroundColor: '#00000000',
			zIndex: 11,
		},
		localVideoLandscape: {
			width: 150,
			height: 110,
		},
		participantsButton: {
			flexDirection: 'row',
			alignItems: 'center',
			height: 50, // 20(height) + 15(top padding) + 15 (bottom padding)
		},
		participantsButtonIcon: {
			width: 18,
			height: 15,
			marginRight: 8,
		},
		participantsButtonText: {
			fontWeight: 500,
			fontSize: 17,
			color: '#FFFFFF',
			marginRight: 7,
		},
		participantsButtonArrow: {
			backgroundImageSvgUrl: `${pathToExtension}img/arrow.svg`,
			width: 15,
			height: 10,
		},
		userSelector: {
			position: 'absolute',
			height: 19,
			paddingLeft: 8,
			paddingRight: 7,
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'center',
			justifyContent: 'center',
			backgroundColor: '#33000000',
			borderRadius: 9.5,
			// borderWidth: 1,
			// borderColor: "#00FF00"
		},
		userDotOuter: {
			width: 13,
			height: 13,
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: 1,
		},
		userDotInner: {
			width: 7,
			height: 7,
			borderRadius: 3.5,
		},
		centralUser: {
			position: 'absolute',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			alignContent: 'center',
			backgroundColor: '#7F000000',
			height: 24,
			borderRadius: 6,
			paddingLeft: 6,
			paddingRight: 10,
		},
		center: {
			position: 'absolute',
			flexDirection: 'row',
			flex: 1,
			justifyContent: 'space-between',
			alignItems: 'center',
			alignContent: 'center',
			width: '100%',
			height: '100%',
			clickable: false,
		},
		centerGrid: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignContent: 'center',
			width: '100%',
			height: '100%',
			flex: 1,
		},
		leftArrow: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: Color.baseBlackFixed.toHex(0.25),
		},
		rightArrow: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: Color.baseBlackFixed.toHex(0.25),
		},

		largeAvatar: {
			width: LARGE_AVATAR_SIZE,
			height: LARGE_AVATAR_SIZE,
			borderRadius: 90,
		},

		centralUserAvatar: {
			width: 47,
			height: 47,
			marginRight: 10,
			borderRadius: 23.5,
		},
		centralUserAvatarImage: {
			width: 41,
			height: 41,
			borderRadius: 20.5,
			marginLeft: 3,
			marginTop: 3,
		},
		centralUserDescription: {
			height: 47,
			justifyContent: 'center',
		},
		centralUserDescriptionTop: {
			flexDirection: 'row',
			alignItems: 'center',
			height: 20,
		},
		centralUserDescriptionName: {
			marginLeft: 2,
			fontWeight: 400,
			fontSize: 13,
			height: 16,
			color: '#FFFFFF',
		},
		centralUserMicOff: {
			width: 14,
			height: 20,
			marginRight: 6,
		},
		centralUserCameraOff: {
			width: 18,
			height: 20,
			marginRight: 6,
		},
		centralUserArrow: {
			width: 13,
			height: 8,
			marginLeft: 7,
			marginTop: 8,
			marginBottom: 4,
		},
		centralUserDescriptionBottom: {
			height: 16,
			color: '#6FFFFFFF',
		},
		bottomButtonsContainer: {
			height: 66,
			width: '100%',
			flexDirection: 'row',
			alignContent: 'center',
			alignSelf: 'flex-end',
			resizeMode: 'cover',
			justifyContent: 'center',
			paddingHorizontal: 20,
		},
		bottomPanelContainer: {
			flex: 1,
			width: '100%',
			justifyContent: 'flex-end',
		},
		bottomButton: {
			height: 66,
			marginLeft: 4,
			marginRight: 4,
			alignSelf: 'flex-end',
			justifyContent: 'center',
			color: '#ffffff',
		},
		bottomButtonWidthLandscape: {
			width: 75,
		},
		bottomButtonWidthPortrait: {
			width: device.screen.width / 5.6,
		},
		bottomButtonImage: {
			width: 48,
			height: 48,

			alignSelf: 'center',
		},
		bottomButtonText: {
			alignSelf: 'center',
			fontSize: 12,
			fontWeight: '400',
			marginTop: 4,
			height: 14,
			lineHeight: 14,
			color: '#ffffff',
		},
		bottomButtonCounter: {
			position: 'absolute',
			top: 4,
			right: 6,
			height: 14,
			paddingLeft: 7,
			paddingRight: 7,

			borderRadius: 7,
			backgroundColor: '#FF5752',

		},
		bottomButtonCounterText: {
			color: '#ffffff',
			fontWeight: 'bold',
			fontSize: 11,
		},
		videoPausedOverlay: {
			position: 'absolute',
			height: '100%',
			opacity: 0.6,
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#000000',
		},

		copilotOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1 },
		copilotPopup: { marginTop: 70, marginLeft: 8, marginRight: 8, flexDirection: 'column' },
		copilotTopLine: { flexDirection: 'row', justifyContent: 'flex-end' },
		copilotBody: {
			paddingLeft: Indent.XL.toNumber(),
			paddingTop: Indent.XL.toNumber(),
			paddingBottom: Indent.XL.toNumber(),
			flexDirection: 'row',
			alignItems: 'center',
			borderRadius: Corner.XL.toNumber(),
			backgroundColor: '#8E52EC',
		},
		copilotIconHolder: {
			height: '100%',
			width: 98,
			backgroundColor: Color.baseWhiteFixed.toHex(0.12),
			borderRadius: Corner.M.toNumber(),
		},
		copilotMessageHolder: {
			flexDirection: 'column',
			paddingLeft: 12,
			justifyContent: 'space-between',
			height: '100%',
			flex: 1,
		},
		copilotButton: {
			height: 28,
			textAlign: 'center',
			borderRadius: Indent.S.toNumber(),
			borderWidth: 1,
			color: Color.baseWhiteFixed.toHex(),
			borderColor: Color.baseWhiteFixed.toHex(0.32),
		},
		copilotXHolder: {
			flexDirection: 'column',
			paddingRight: Indent.XL.toNumber(),
			alignSelf: 'flex-start',
		},
		deviceOffHint: {
			flexDirection: 'row',
			minHeight: 32,
			maxWidth: '100%',
			backgroundColor: Color.baseBlackFixed.toHex(0.5),
			paddingLeft: Indent.S.toNumber(),
			paddingRight: Indent.XL.toNumber(),
			borderRadius: Corner.M.toNumber(),
			alignContent: 'center',
			alignItems: 'center',
		},
		deviceOffHintText: {
			flexShrink: 1,
			marginLeft: 2,
			fontSize: 15,
			fontWeight: 400,
			lineHeight: 18,
			color: Color.baseWhiteFixed.toHex(),
		},
		dotsContainer: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			width: '100%',
			position: 'absolute',
			bottom: 5,
		},
		dotsBadge: {
			backgroundColor: '#26FFFFFF',
			padding: 7,
			borderRadius: 10,
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
		},
		videoContainer: {
			objectFit: 'contain',
			backgroundResizeMode: 'cover',
			width: '100%',
			height: '100%',
		},
		scrollListItem: {
			backgroundColor: '#26FFFFFF',
			borderRadius: 10,
			objectFit: 'cover',
			backgroundResizeMode: 'cover',
			position: 'relative',
			borderWidth: 2,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		},
		userPin: {
			objectFit: 'cover',
			backgroundResizeMode: 'cover',
			position: 'relative',
			backgroundColor: '#26FFFFFF',
			borderRadius: 15,
		},
		pinIconBadge: {
			position: 'absolute',
			width: 24,
			height: 24,
			top: 8,
			right: 8,
			backgroundColor: '#1BCE7B',
			zIndex: 20,
			borderRadius: 8,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		},
		screenshareViewBadgeContainer: {
			position: 'absolute',
			left: 8,
			backgroundColor: '#7F000000',
			borderRadius: 6,
			zIndex: 20,
			fontWeight: 400,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
		},
	};

	const EventName = {
		Close: 'close',
		Destroy: 'destroy',
		MicButtonClick: 'micButtonClick',
		CameraButtonClick: 'cameraButtonClick',
		MenuButtonClick: 'menuButtonClick',
		FloorRequestButtonClick: 'floorRequestButtonClick',
		ChatButtonClick: 'chatButtonClick',
		PrivateChatButtonClick: 'privateChatButtonClick',
		AnswerButtonClick: 'answerButtonClick',
		HangupButtonClick: 'hangupButtonClick',
		DeclineButtonClick: 'declineButtonClick',
		BodyClick: 'bodyClick',
		ReplaceCamera: 'replaceCamera',
		ReplaceSpeaker: 'replaceSpeaker',
		SetCentralUser: 'setCentralUser',
		SelectAudioDevice: 'selectAudioDevice',
		ToggleSubscriptionRemoteVideo: 'toggleSubscriptionRemoteVideo',
		ToggleCopilot: 'toggleCopilot',
		TestSwitchConnectionType: 'testSwitchConnectionType',
		SwitchCallType: 'switchCallType',
		CallLayoutMounted: 'callLayoutMounted',
	};

	const STARTTALKING_DELAY = 500;
	const STOPTALKING_DELAY = 2000;
	const INACTIVITY_TIMEOUT = 5000;
	// Debounce window for the grid re-sort + re-render (#updateUserInfo). A burst of per-stream
	// setVideoStream calls on mass join/reconnect otherwise triggers one full rankUsers re-sort
	// and re-render of every card per arriving stream (≈100 on a 100-user join). Trailing debounce
	// collapses both rapid bursts and irregularly-spaced arrivals; UPDATE_USER_INFO_MAX_WAIT caps
	// the deferral so a continuous stream of arrivals can't starve the grid update.
	const UPDATE_USER_INFO_DEBOUNCE = 250;
	const UPDATE_USER_INFO_MAX_WAIT = 700;

	const DEVICE_OFF_PHRASES = {
		camera: {
			M: 'MOBILE_CALL_PARTICIPANT_SWITCHED_OFF_CAMERA_M',
			F: 'MOBILE_CALL_PARTICIPANT_SWITCHED_OFF_CAMERA_F',
		},
		microphone: {
			M: 'MOBILE_CALL_PARTICIPANT_SWITCHED_OFF_MICROPHONE_M',
			F: 'MOBILE_CALL_PARTICIPANT_SWITCHED_OFF_MICROPHONE_F',
		},
	};

	const GRIDVIEW_VERSION = '5.6.300';

	class CallLayout extends LayoutComponent
	{
		constructor(props = {})
		{
			super(props);

			this.userRegistry = new UserRegistry();
			this.lastPosition = 0;
			this.userId = env.userId;
			this.centralUserId = env.userId;

			this.presenterId = env.userId;
			this.userData = {};
			this.videoStreams = {};
			this.screenshareStreams = new Map();

			this.switchPresenterTimeout = null;

			this.talkingUsersDelays = new Map();
			this.lastTap = null;

			this.userScrollProgress = 0;
			this.userScrollPage = 0;
			this.currentUserScrollPosition = 0;
			this.beginDragUserScrollPosition = 0;
			this.activeIds = [];
			this.debouncedSubscribe = MobileUtils.debounce(this.subscribeOnNewPage, 3000);
			this.inactivityTimeout = CallSettingsManager.optionsForTestingEnabled
				? CallSettingsManager.mobileCallUIVisibilityTimer
				: INACTIVITY_TIMEOUT;

			this.useGridView = CallSettingsManager.gridViewEnabled && Utils.isGridViewSupported();
			this.viewableIds = [];

			this.state = {
				screenWidth: 0,
				screenHeight: 0,
				toggleListPrev: [],
				width: '100%',
				height: '100%',
				status: props.status || CallStatus.none,
				panelVisible: true,
				microphoneState: true,
				cameraState: props.cameraState === true,
				centralUserVideoPaused: false,
				remoteStream: null,
				localStream: null,
				mirrorLocalVideo: true,
				hideLocalVideo: false,
				showParticipants: true,
				showUserSelector: true,
				centralUserId: this.userId,
				pinnedUserId: 0,
				presenterUserId: 0,
				connectedUsers: [],
				floorRequestUsers: [],
				floorRequestSelf: false,
				totalUsersCount: [],
				isGroupCall: props.isGroupCall === true,
				isVideoCall: props.isVideoCall === true,
				associatedEntityName: props.associatedEntityName,
				associatedEntityAvatar: props.associatedEntityAvatar,
				chatCounter: props.chatCounter || 0,
				soundOutputDevice: props.soundOutputDevice || CallUtil.getSdkAudioManager().currentDevice,
				copilotAvailable: Boolean(props.copilotAvailable),
				isNativeSwitchingTypeSupported: false,
				copilotEnabled: Boolean(props.copilotEnabled),
				associatedEntityAvatarColor: props.associatedEntityAvatarColor,
				activeScreenId: null,
				currentPage: 0,
				isScreenshareSwipeEnabled: true,
				isRotationIconVisible: true,
				screenshareOnEnter: null,
				currentGridPage: 1,
				recordState: false,
				isScreenshareFullScreen: false,
				gridContainerWidth: device.screen.width - 5,
				gridContainerHeight: device.screen.height,
				userScrollUserPerPage: 3,
				isAppActive: true,
				connectionType: 1,
				isReconnecting: false,
				cameraBlocked: false,
			};

			// Instance field, NOT state — setState is async in JN, and reading the timer
			// handle through state caused stale clearTimeout and a flood of duplicate
			// setTimeouts that all fired (panelVisible:false × 51 observed on stand).
			this.inactivityTimer = null;

			this.isDestroyed = false;

			// Debounce state for flushForceRender (empty force-render of in-place mic/video state).
			// Same window as below. Collapses both the call-start sync seed (53 users) and the
			// cross-tick per-bot mic-state stream on a live mass-join into one setState per window.
			this.forceRenderTimer = null;
			this.forceRenderDeferredSince = 0;

			// Debounce state for #updateUserInfo. Collapses a burst of per-stream setVideoStream
			// calls into one re-sort+render after a quiet window (or every MAX_WAIT at the latest).
			this.updateUserInfoTimer = null;
			this.updateUserInfoDeferredSince = 0;

			// Debounce state for updateDisplayedUsers (same window). Collapses the per-user
			// re-render on a live mass-join (≈50 onCallUserJoined → setUserState → render).
			this.displayedUsersTimer = null;
			this.displayedUsersDeferredSince = 0;

			this.localUserModel = new UserModel({
				id: this.userId,
				localUser: true,
				state: BX.Call.UserState.Connected,
			});
			this.userRegistry.push(this.localUserModel);

			this.renderedUsers = [];

			this.scrollManager = new ScrollManager({
				getConnectedUsers: () => this.state.displayedUsers,
				getConnectedUserCount: () => this.getDisplayedUserCount(),
				subscribeOnNewPage: () => this.subscribeOnNewPage(),
			});
		}

		componentDidMount()
		{
			this.emit(EventName.CallLayoutMounted);
		}

		setUserStates(userStates)
		{
			if (!BX.type.isPlainObject(userStates))
			{
				return;
			}

			const userIds = Object.keys(userStates);
			for (const userId of userIds)
			{
				const userState = userStates[userId]

				if (this.userRegistry.get(userId))
				{
					continue;
				}

				this.userRegistry.push(new UserModel({
					id: userId,
					name: this.userData[userId] ? this.userData[userId].name : '',
					avatar: this.userData[userId] ? this.userData[userId].avatar_hr : '',
					gender: this.userData[userId] ? this.userData[userId].gender : 'M',
					state: userState || BX.Call.UserState.Idle,
					order: this.getNextPosition(),
				}));
			}

			// TODO: need to be removed coz we provide static Idle status, but not calculatedState from provider
			// this.userRegistry.users = [...this.rankUsers()];
			//
			// this.setState({
			// 	displayedUsers: this.getDisplayedUsers(),
			// });
			//
			// this.toggleSubscriptionRemoteVideo();
		}

		updateTotalUsersCount(users)
		{
			if (this.state.totalUsersCount === users)
			{
				return;
			}
			this.setState({
				totalUsersCount: users
			});
		}

		setUserData(userData, { skipUpdate = false } = {})
		{
			let changed = false;
			for (const userId in userData)
			{
				if (!Object.hasOwn(userData, userId) || !userData[userId])
				{
					continue;
				}

				if (!this.userData[userId])
				{
					this.userData[userId] = {
						first_name: '',
						last_name: '',
						name: '',
						workPosition: '',
						extranet: false,
						invited: false,
						lastActivityDate: '',
						avatar_hr: '',
						gender: 'M',
					};
					changed = true;
				}

				if (userData[userId].first_name && this.userData[userId].first_name !== userData[userId].first_name)
				{
					this.userData[userId].first_name = userData[userId].first_name;
					changed = true;
				}
				if (userData[userId].last_name && this.userData[userId].last_name !== userData[userId].last_name)
				{
					this.userData[userId].last_name = userData[userId].last_name;
					changed = true;
				}
				if (userData[userId].name && this.userData[userId].name !== userData[userId].name)
				{
					this.userData[userId].name = userData[userId].name;
					changed = true;
				}

				if (userData[userId].work_position && this.userData[userId].workPosition !== userData[userId].work_position)
				{
					this.userData[userId].workPosition = userData[userId].work_position;
					changed = true;
				}

				if (userData[userId].extranet && this.userData[userId].extranet !== userData[userId].extranet)
				{
					this.userData[userId].extranet = userData[userId].extranet;
					changed = true;
				}

				if (userData[userId].invited && this.userData[userId].invited !== userData[userId].invited)
				{
					this.userData[userId].invited = userData[userId].invited;
					changed = true;
				}

				if (userData[userId].last_activity_date && this.userData[userId].lastActivityDate !== userData[userId].last_activity_date)
				{
					this.userData[userId].lastActivityDate = userData[userId].last_activity_date;
					changed = true;
				}

				if (userData[userId].avatar_hr)
				{
					const nextAvatar = Utils.isAvatarBlank(userData[userId].avatar_hr) ? '' : userData[userId].avatar_hr;
					if (this.userData[userId].avatar_hr !== nextAvatar)
					{
						this.userData[userId].avatar_hr = nextAvatar;
						changed = true;
					}
				}

				if (userData[userId].gender)
				{
					const nextGender = userData[userId].gender === 'F' ? 'F' : 'M';
					if (this.userData[userId].gender !== nextGender)
					{
						this.userData[userId].gender = nextGender;
						changed = true;
					}
				}

				const userModel = this.userRegistry.get(userId);
				if (userModel)
				{
					if (userData[userId].avatar_hr)
					{
						const nextAvatar = Utils.isAvatarBlank(userData[userId].avatar_hr) ? '' : userData[userId].avatar_hr;
						if (this.userData[userId].avatar_hr !== nextAvatar)
						{
							this.userData[userId].avatar_hr = nextAvatar;
							changed = true;
						}
					}
					else if (userData[userId].avatar)
					{
						const nextAvatar = Utils.isAvatarBlank(userData[userId].avatar) ? '' : userData[userId].avatar;
						if (this.userData[userId].avatar_hr !== nextAvatar)
						{
							this.userData[userId].avatar_hr = nextAvatar;
							changed = true;
						}
					}
					if (userModel.firstName !== this.userData[userId].first_name)
					{
						userModel.firstName = this.userData[userId].first_name;
						changed = true;
					}
					if (userModel.lastName !== this.userData[userId].last_name)
					{
						userModel.lastName = this.userData[userId].last_name;
						changed = true;
					}
					if (userModel.name !== this.userData[userId].name)
					{
						userModel.name = this.userData[userId].name;
						changed = true;
					}
					if (userModel.workPosition !== this.userData[userId].workPosition)
					{
						userModel.workPosition = this.userData[userId].workPosition;
						changed = true;
					}
					if (userModel.avatar !== this.userData[userId].avatar_hr)
					{
						userModel.avatar = this.userData[userId].avatar_hr;
						changed = true;
					}
					if (userModel.gender !== this.userData[userId].gender)
					{
						userModel.gender = this.userData[userId].gender;
						changed = true;
					}
				}
			}

			// Non-batched callers (controller.onCallUserNameUpdate, onSetCurrentUser) rely on
			// the final empty setState to flush in-place UserModel mutations to UI. Skip when
			// nothing actually changed — controller calls setUserData 10+ times on call start
			// for profile loading; without the guard each fired a no-op setState (53× observed).
			if (changed && !skipUpdate)
			{
				this.flushForceRender();
			}
		}

		addAllUsers(users, { skipUpdate = false } = {})
		{
			users.forEach((userData) => {
				const userId = userData.id;
				// if (!Object.hasOwn(userData, userId) || !userData[userId])
				// {
				// 	continue;
				// }

				if (!this.userData[userId])
				{
					this.userData[userId] = {
						first_name: '',
						last_name: '',
						name: '',
						workPosition: '',
						extranet: false,
						invited: false,
						lastActivityDate: '',
						avatar_hr: '',
						gender: 'M',
					};
				}

				if (userData.first_name)
				{
					this.userData[userId].first_name = userData.first_name;
				}
				if (userData.last_name)
				{
					this.userData[userId].last_name = userData.last_name;
				}
				if (userData.name)
				{
					this.userData[userId].name = userData.name;
				}

				if (userData.work_position)
				{
					this.userData[userId].workPosition = userData.work_position;
				}

				if (userData.extranet)
				{
					this.userData[userId].extranet = userData.extranet;
				}

				if (userData.invited)
				{
					this.userData[userId].invited = userData.invited;
				}

				if (userData.last_activity_date)
				{
					this.userData[userId].lastActivityDate = userData.lastActivityDate;
				}

				if (userData.avatar_hr)
				{
					this.userData[userId].avatar_hr = Utils.isAvatarBlank(userData.avatar_hr) ? '' : userData.avatar_hr;
				}

				if (userData.gender)
				{
					this.userData[userId].gender = userData.gender === 'F' ? 'F' : 'M';
				}

				const userModel = this.userRegistry.get(userId);
				if (userModel)
				{
					userModel.firstName = this.userData[userId].first_name;
					userModel.lastName = this.userData[userId].last_name;
					userModel.name = this.userData[userId].name;
					userModel.workPosition = this.userData[userId].workPosition;
					userModel.avatar = this.userData[userId].avatar_hr;
					userModel.gender = this.userData[userId].gender;
				}

				if (this.userRegistry.get(userId))
				{
					return;
				}

				this.userRegistry.push(new UserModel({
					id: userId,
					name: this.userData[userId] ? this.userData[userId].name : '',
					avatar: this.userData[userId] ? this.userData[userId].avatar_hr : '',
					gender: this.userData[userId] ? this.userData[userId].gender : 'M',
					state: BX.Call.UserState.Idle,
					order: this.getNextPosition(),
				}));
			});

			// TODO: refactor
			this.userRegistry.users = this.sortAllUsers();

			if (!skipUpdate)
			{
				this.setState({
					displayedUsers: this.getDisplayedUsers(),
				});
			}
		}

		/**
		 * Bulk handler for the onUsersJoined event: a single setState plus a single
		 * toggleSubscriptionRemoteVideoGrid call for the whole users batch.
		 * See SDD-mobile-callmobile-start-freezes-2026-06-10, P1.T2 (TPL-01).
		 *
		 * @param {Array<{id, name?, avatar_hr?, avatar?}>} users
		 * @param {{ totalUsersCount?: number }} [options]
		 */
		applyUsersJoined(users, { totalUsersCount } = {})
		{
			if (!Array.isArray(users) || users.length === 0)
			{
				return;
			}

			const userDataMap = {};
			const validUsers = [];
			for (const user of users)
			{
				// `id` may arrive as either Int (legacy) or numeric string (bitrix-jwt
				// endpoint.endpointId, signaling payload). Both are acceptable as object
				// keys and downstream callers (setUserData / userRegistry) tolerate them.
				if (!user || user.id == null || user.id === '')
				{
					console.error('applyUsersJoined: invalid user entry', user);
					continue;
				}

				userDataMap[user.id] = {
					name: user.name,
					avatar_hr: user.avatar_hr,
					avatar: user.avatar,
				};
				validUsers.push(user);
			}

			if (validUsers.length === 0)
			{
				return;
			}

			this.setUserData(userDataMap, { skipUpdate: true });
			this.addAllUsers(validUsers, { skipUpdate: true });
			for (const user of validUsers)
			{
				this.setUserState(user.id, BX.Call.UserState.Connected, false, { skipUpdate: true });
			}

			const stateUpdate = {
				displayedUsers: this.getDisplayedUsers(),
				floorRequestUsers: this.getFloorRequestUsers(3),
				floorRequestSelf: this.userRegistry.get(env.userId).floorRequestState,
				status: this.getDisplayedUserCount() > 0 ? 'call' : this.state.status,
			};
			if (totalUsersCount !== undefined)
			{
				stateUpdate.totalUsersCount = totalUsersCount;
			}

			this.setState(stateUpdate);
			// Use the router (toggleSubscriptionRemoteVideo) instead of toggleSubscriptionRemoteVideoGrid
			// directly — the router selects between grid-view (viewable-based, with viewableIds) and
			// page-based subscription depending on useGridView. Calling Grid directly here skipped the
			// grid-view branch on call start.
			this.toggleSubscriptionRemoteVideo();
		}

		redraw()
		{
			this.setState({});
		}

		// Trailing-debounced empty force-render that flushes in-place UserModel mutations
		// (mic/video state) to the UI. Collapses both a synchronous burst (native mic-state
		// seed for every participant on call start) AND a cross-tick stream (per-bot mic-state
		// arriving as separate onCallUserMicrophoneState events on a live mass-join) into one
		// setState per quiet window. A lone runtime mute/unmute renders after the debounce
		// window — imperceptible for a remote participant's mic icon.
		flushForceRender()
		{
			const now = Date.now();
			if (!this.forceRenderDeferredSince)
			{
				this.forceRenderDeferredSince = now;
			}

			if (this.forceRenderTimer)
			{
				clearTimeout(this.forceRenderTimer);
				this.forceRenderTimer = null;
			}

			if (now - this.forceRenderDeferredSince >= UPDATE_USER_INFO_MAX_WAIT)
			{
				this.#flushForceRenderNow();
				return;
			}

			this.forceRenderTimer = setTimeout(() => {
				this.forceRenderTimer = null;
				this.#flushForceRenderNow();
			}, UPDATE_USER_INFO_DEBOUNCE);
		}

		#flushForceRenderNow()
		{
			if (this.forceRenderTimer)
			{
				clearTimeout(this.forceRenderTimer);
				this.forceRenderTimer = null;
			}
			this.forceRenderDeferredSince = 0;

			if (this.isDestroyed)
			{
				return;
			}

			this.setState({});
		}

		hideUIAfterInactivity()
		{
			if (!this.inactivityTimeout)
			{
				return;
			}

			if (this.inactivityTimer)
			{
				clearTimeout(this.inactivityTimer);
				this.inactivityTimer = null;
			}

			this.inactivityTimer = setTimeout(() => {
				this.inactivityTimer = null;
				// Guard: only flush setState when panelVisible actually changes.
				if (this.state.panelVisible !== false)
				{
					this.setState({ panelVisible: false });
				}
			}, this.inactivityTimeout);
		}

		setIsNativeSwitchingTypeSupported(value)
		{
			this.setState({ isNativeSwitchingTypeSupported: value });
		}

		toggleUI()
		{
			if (this.state.floorRequestSelf)
			{
				this.setState({ panelVisible: !this.state.panelVisible });
				clearTimeout(this.inactivityTimer);
				return;
			}

			this.setState({ panelVisible: !this.state.panelVisible });
			this.hideUIAfterInactivity();
		}

		getNextPosition()
		{
			return this.lastPosition++;
		}

		setCentralUser(userId)
		{
			if (this.centralUserId === userId)
			{
				return;
			}
			/* if (userId == this.userId && this.getUsersWithVideo().length > 0)
			{
				return;
			} */
			const userModel = this.userRegistry.get(userId);

			if (!userModel)
			{
				return;
			}

			this.userRegistry.users.forEach((userModel) => {
				userModel.centralUser = (userModel.id == userId);
			});
			this.centralUserId = userId;
			this.setState({
				centralUserId: userId,
				centralUserVideoPaused: userModel.videoPaused,
				remoteStream: this.videoStreams.hasOwnProperty(userId)
					? this.videoStreams[userId]
					: (this.screenshareStreams.has(userId) || this.screenshareStreams.has(String(userId))
						? this.screenshareStreams.get(userId) || this.screenshareStreams.get(String(userId))
						: null),
				localStream: this.videoStreams.hasOwnProperty(this.userId) ? this.videoStreams[this.userId] : null,
			});
			this.emit(EventName.SetCentralUser, [userId]);

			this.toggleSubscriptionRemoteVideo();
		}

		pinUser(userId)
		{
			if (!this.userRegistry.get(userId))
			{
				console.error(`User ${userId} is not known`);

				return;
			}

			for (let i = 0; i < this.userRegistry.users.length; i++)
			{
				this.userRegistry.users[i].pinned = this.userRegistry.users[i].id === userId;
			}
			this.setCentralUser(userId);
			this.setState({
				pinnedUserId: userId,
			});
		}

		unpinUser()
		{
			for (let i = 0; i < this.userRegistry.users.length; i++)
			{
				this.userRegistry.users[i].pinned = false;
			}

			// The viewable ids left from the pin-grid (rows: 1) describe a different
			// composition than the main grid we're switching back to. Resetting them
			// lets toggleSubscriptionRemoteVideoForGridView fall back to the first page
			// of users until native GridView emits onViewableItemsChanged again.
			this.viewableIds = [];

			this.setCentralUser(this.getPresenterUserId());
			this.setState({
				pinnedUserId: 0,
			});
		}

		getPresenterUserId()
		{
			let currentPresenterId = this.presenterId;
			if (currentPresenterId === this.userId)
			{
				currentPresenterId = 0;
			}

			const currentPresenterModel = this.userRegistry.get(currentPresenterId);

			// 1. Current user, who is sharing screen has top priority
			if (currentPresenterModel && currentPresenterModel.screenState === true)
			{
				return currentPresenterId;
			}

			// 2. If current user is not sharing screen, but someone is sharing - he should become presenter
			const sharingUser = this.userRegistry.users.find((userModel) => userModel.screenState);
			if (sharingUser)
			{
				return sharingUser.id;
			}

			// 3. If current user is talking, or stopped talking less then one second ago - he should stay presenter
			if (currentPresenterModel && currentPresenterModel.wasTalkingAgo() < 1000)
			{
				return currentPresenterId;
			}

			// 4. Return currently talking user
			const usersByTalking = this.userRegistry.users
				.filter((userModel) => userModel.state === BX.Call.UserState.Connected && !userModel.localUser)
				.sort((user1, user2) => {
					return user1.wasTalkingAgo() - user2.wasTalkingAgo();
				});

			if (usersByTalking.length > 0)
			{
				return usersByTalking[0].id;
			}

			// return current presenter
			return this.presenterId;
		}

		getDisplayedUsers()
		{
			return this.userRegistry.users.filter((userModel) => userModel.state === BX.Call.UserState.Connected || userModel.state === BX.Call.UserState.Connecting)
		}

		getDisplayedUserCount()
		{
			return this.getDisplayedUsers().length;
		}

		getParticipants()
		{
			return this.userRegistry.users.filter(
				(userModel) => userModel.state === BX.Call.UserState.Connected || userModel.localUser,
			);
		}

		getFloorRequestUsers(limit = 0)
		{
			const result = [];
			for (const userModel of this.userRegistry.users)
			{
				if (
					userModel.state === BX.Call.UserState.Connected
					&& userModel.floorRequestState
				)
				{
					result.push(userModel);
					if (limit > 0 && result.length >= limit)
					{
						return result;
					}
				}
			}

			return result;
		}

		getLeftUser(userId)
		{
			let candidateUserId = null;
			for (let i = 0; i < this.userRegistry.users.length; i++)
			{
				const userModel = this.userRegistry.users[i];
				if (userModel.id === userId && candidateUserId)
				{
					return candidateUserId;
				}

				if (!userModel.localUser && userModel.state === BX.Call.UserState.Connected)
				{
					candidateUserId = userModel.id;
				}
			}

			return candidateUserId;
		}

		getRightUser(userId)
		{
			let candidateUserId = null;
			for (let i = this.userRegistry.users.length - 1; i >= 0; i--)
			{
				const userModel = this.userRegistry.users[i];
				if (userModel.id == userId && candidateUserId)
				{
					return candidateUserId;
				}

				if (!userModel.localUser && userModel.state == BX.Call.UserState.Connected)
				{
					candidateUserId = userModel.id;
				}
			}

			return candidateUserId;
		}

		switchPresenter(presenterId)
		{
			const newPresenterId = presenterId || this.getPresenterUserId();
			if (!newPresenterId || newPresenterId === this.presenterId)
			{
				return;
			}

			this.presenterId = newPresenterId;
			this.userRegistry.users.forEach((userModel) => userModel.presenter = userModel.id == this.presenterId);
			this.setState({
				presenterUserId: newPresenterId,
			});

			if (!this.state.pinnedUserId)
			{
				this.setCentralUser(newPresenterId);
			}
		}

		switchPresenterDeferred()
		{
			clearTimeout(this.switchPresenterTimeout);
			this.switchPresenterTimeout = setTimeout(this.switchPresenter.bind(this), 1000);
		}

		cancelSwitchPresenter()
		{
			clearTimeout(this.switchPresenterTimeout);
		}

		setChatCounter(chatCounter)
		{
			this.setState({
				chatCounter,
			});
		}

		getIsLandscapeOrientation()
		{
			return device.screen.orientation === 'landscape' || device.screen.height < device.screen.width;
		}

		setCameraState(cameraState)
		{
			if (!CallUtil.havePermissionToBroadcast('cam') && cameraState)
			{
				return;
			}

			this.setState({
				displayedUsers: this.getDisplayedUsers(),
			});
			cameraState = Boolean(cameraState);
			this.localUserModel.cameraState = cameraState;
		}

		setMirrorLocalVideo(mirrorLocalVideo)
		{
			this.setState({
				mirrorLocalVideo,
			});
		}

		setHideLocalVideo(hideLocalVideo)
		{
			this.setState({
				hideLocalVideo,
			});
		}

		setMuted(isMuted)
		{
			this.localUserModel.microphoneState = !isMuted;
			this.setState({
				microphoneState: !isMuted,
			});
		}

		setRecordState(recordState)
		{
			this.setState({
				recordState: recordState === 'started',
			});
		}

		setScreenState(screenState)
		{
			this.setState({
				screenState: screenState,
			});
		}

		setUserState(userId, newState, shouldChangeUI = true, { skipUpdate = false } = {})
		{
			/** @type {UserModel} */
			const user = this.userRegistry.get(userId);
			let newStatus = this.state.status;
			if (!user || user.state == newState)
			{
				return;
			}

			if (newState !== BX.Call.UserState.Connected && this.talkingUsersDelays.has(userId))
			{
				clearTimeout(this.talkingUsersDelays.get(userId));
				this.talkingUsersDelays.delete(userId);
			}

			user.state = newState;

			if (newState == BX.Call.UserState.Connected)
			{
				this.insertUser(userId);
				newStatus = 'call';
				this.hideUIAfterInactivity();

			}

			if (newState == BX.Call.UserState.Connecting && this.getDisplayedUserCount() === 0)
			{
				newStatus = this.state.status == 'call' ? 'call' : 'connecting';
			}

			// maybe switch central user
			if (this.centralUserId == this.userId && newState == BX.Call.UserState.Connected)
			{
				this.setCentralUser(userId);
			}

			if (userId == this.state.pinnedUserId)
			{
				if (newState != BX.Call.UserState.Connected)
				{
					this.unpinUser();
				}
			}
			else if (userId == this.centralUserId)
			{
				if (newState == BX.Call.UserState.Connected)
				{
					// this.centralUser.blurVideo(false);
				}
				else
				{
					this.switchPresenter();
				}
			}

			if (!skipUpdate)
			{
				// Guard: skip setState when none of the values changed.
				// Without this guard, setUserState called from controller for already-Connected
				// users (or other transitions where status stays 'call' and floor-request stays
				// empty) fires ~50 no-op setStates per session — each cascading to N×UserCard +
				// N×NameBadge re-renders.
				const nextFloorRequestUsers = this.getFloorRequestUsers(3);
				const nextFloorRequestSelf = this.userRegistry.get(env.userId).floorRequestState;
				const prevFloorRequestUsers = this.state.floorRequestUsers;
				const floorRequestUsersChanged = !prevFloorRequestUsers
					|| prevFloorRequestUsers.length !== nextFloorRequestUsers.length
					|| nextFloorRequestUsers.some((u, i) => u !== prevFloorRequestUsers[i]);

				if (
					floorRequestUsersChanged
					|| nextFloorRequestSelf !== this.state.floorRequestSelf
					|| newStatus !== this.state.status
				)
				{
					this.setState({
						floorRequestUsers: nextFloorRequestUsers,
						floorRequestSelf: nextFloorRequestSelf,
						status: newStatus,
					});
				}

				if (shouldChangeUI)
				{
					this.updateDisplayedUsers();
				}
			}

			if (!skipUpdate)
			{
				const currentPage = this.scrollManager.getCurrentGridPage();
				if (currentPage !== 1)
				{
					let newPage = this.scrollManager.getCurrentPage();
					if (currentPage > newPage)
					{
						this.scrollManager.setCurrentGridPage(newPage);
						this.subscribeOnNewPage();
						//TODO: should we do smooth scroll after triggering page change due to another user exit?
						//this.scrollPage();
					}
				}

				this.toggleSubscriptionRemoteVideo();
			}
		}

		insertUser(userId)
		{
			const users = this.userRegistry.users;
			const userIndex = users.findIndex(user => user.id === userId);

			if (userIndex === -1) return;

			const user = users[userIndex];

			// The local user must always stay first regardless of camera/screen state,
			// otherwise turning off the local camera in a large room would push
			// env.userId to the bottom of the list.
			if (user.localUser)
			{
				if (userIndex !== 0)
				{
					users.splice(userIndex, 1);
					users.unshift(user);
					users.forEach((u, i) => { u.index = i; });
				}
				else if (user.index !== 0)
				{
					user.index = 0;
				}
				return;
			}

			if (users.length <= GridUserCount.fullFirstPageCount) {
				if (user.index !== userIndex) {
					user.index = userIndex;
				}
				return;
			}

			const remainingStart = GridUserCount.fullFirstPageCount;
			let insertIndex;

			if (user.cameraState || user.screenState)
			{
				let lastWithVideoIndex = remainingStart - 1;
				for (let i = users.length - 1; i >= remainingStart; i--)
				{
					if (users[i].cameraState || users[i].screenState) {
						lastWithVideoIndex = i;
						break;
					}
				}
				insertIndex = lastWithVideoIndex + 1;
			}
			else
			{
				insertIndex = users.length;
			}

			if (insertIndex === userIndex)
			{
				if (user.index !== userIndex)
				{
					user.index = userIndex;
				}
				return;
			}

			const adjustedIndex = insertIndex > userIndex ? insertIndex - 1 : insertIndex;

			users.splice(userIndex, 1);
			users.splice(adjustedIndex, 0, user);

			const startIndex = Math.min(userIndex, adjustedIndex);
			for (let i = startIndex; i < users.length; i++)
			{
				users[i].index = i;
			}
		}

		// Trailing-debounced (same window as #updateUserInfo). The only caller is setUserState,
		// which mutates the user model + state synchronously BEFORE this render call, so deferring
		// the render introduces no race. On a live mass-join (≈50 onCallUserJoined events, each
		// triggering setUserState→updateDisplayedUsers) this collapses the per-user re-render of
		// the whole growing list into one render per quiet window instead of one per join.
		updateDisplayedUsers()
		{
			const now = Date.now();
			if (!this.displayedUsersDeferredSince)
			{
				this.displayedUsersDeferredSince = now;
			}

			if (this.displayedUsersTimer)
			{
				clearTimeout(this.displayedUsersTimer);
				this.displayedUsersTimer = null;
			}

			if (now - this.displayedUsersDeferredSince >= UPDATE_USER_INFO_MAX_WAIT)
			{
				this.#flushDisplayedUsers();
				return;
			}

			this.displayedUsersTimer = setTimeout(() => {
				this.displayedUsersTimer = null;
				this.#flushDisplayedUsers();
			}, UPDATE_USER_INFO_DEBOUNCE);
		}

		#flushDisplayedUsers()
		{
			if (this.displayedUsersTimer)
			{
				clearTimeout(this.displayedUsersTimer);
				this.displayedUsersTimer = null;
			}
			this.displayedUsersDeferredSince = 0;

			if (this.isDestroyed)
			{
				return;
			}

			this.setState({
				displayedUsers: this.getDisplayedUsers(),
			});
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
			/** @type {UserModel} */
			const user = this.userRegistry.get(userId);
			if (user)
			{
				if (this.talkingUsersDelays.has(userId))
				{
					clearTimeout(this.talkingUsersDelays.get(userId));
				}
				if (talking)
				{
					if (user.talking === talking) return;

					const startTimer = setTimeout(() => {
						if (user.state === BX.Call.UserState.Connected && user.microphoneState)
						{
							user.talking = true;
							this.swapUsers(userId);
							this.updateUserTalkingState();
						}
					}, STARTTALKING_DELAY);

					this.talkingUsersDelays.set(userId, startTimer);
				}
				if (!talking)
				{
					const stopTimer = setTimeout(() => {
						if (user.state === BX.Call.UserState.Connected)
						{
							user.talking = false;
							// TODO: remove
							this.updateUserTalkingState();
						}
					}, STOPTALKING_DELAY);

					this.talkingUsersDelays.set(userId, stopTimer);
				}

				if (userId == this.userId && this.state.floorRequestSelf)
				{
					this.hideUIAfterInactivity();
				}
				user.floorRequestState = false;
			}
		}

		updateUserTalkingState(userId)
		{
			this.userRegistry.users = this.rankUsers();

			this.setState({
				floorRequestUsers: this.getFloorRequestUsers(3),
				floorRequestSelf: this.userRegistry.get(env.userId).floorRequestState,
				displayedUsers: this.getDisplayedUsers(),
			});

			if (this.presenterId == userId && !user.talking)
			{
				this.switchPresenterDeferred();
			}
			else
			{
				this.switchPresenter();
			}

			this.toggleSubscriptionRemoteVideo();
		}

		setUserMicrophoneState(userId, isMicrophoneOn)
		{
			/** @type {UserModel} */
			const user = this.userRegistry.get(userId);
			if (user && user.microphoneState !== isMicrophoneOn)
			{
				if (!isMicrophoneOn && this.talkingUsersDelays.has(userId))
				{
					clearTimeout(this.talkingUsersDelays.get(userId));
					this.talkingUsersDelays.delete(userId);
				}

				user.microphoneState = isMicrophoneOn;
				// Coalesced force-render — NameBadge picks up the in-place mutation. Batched so
				// the call-start native seed (mic state for every user) costs one re-render.
				this.flushForceRender();
			}
		}

		setUserVideoPaused(userId, videoPaused)
		{
			/** @type {UserModel} */
			const user = this.userRegistry.get(userId);
			if (user && user.videoPaused != videoPaused)
			{
				user.videoPaused = videoPaused;

				if (userId == this.centralUserId)
				{
					this.setState({ centralUserVideoPaused: videoPaused });
					return;
				}

				// Non-central user: coalesced force-render of the paused-video overlay.
				this.flushForceRender();
			}
		}

		getUserFloorRequestState(userId)
		{
			const user = this.userRegistry.get(userId);
			if (!user)
			{
				return false;
			}

			return Boolean(user.floorRequestState);
		}

		setUserFloorRequestState(userId, userFloorRequestState)
		{
			/** @type {UserModel} */
			const user = this.userRegistry.get(userId);
			if (!user)
			{
				return;
			}
			const state = Boolean(userFloorRequestState);

			if (user.floorRequestState !== state)
			{
				user.floorRequestState = state;

				this.setState({
					floorRequestUsers: this.getFloorRequestUsers(3),
					floorRequestSelf: this.userRegistry.get(env.userId).floorRequestState,
				});
			}

			if (userId == this.userId && !Boolean(userFloorRequestState))
			{
				this.hideUIAfterInactivity();
			}
		}

		setUserScreenState(userId, screenState)
		{
			/** @type {UserModel} */
			const user = this.userRegistry.get(userId);
			if (!user)
			{
				return;
			}

			user.screenState = screenState;
			// if (userId != this.userId)
			// {
			// 	const newPresenterId = screenState ? userId : null;
			//
			// 	this.switchPresenter(newPresenterId);
			// }

			this.userRegistry.users = this.rankUsers();

			this.setState({
				displayedUsers: this.getDisplayedUsers(),
			});

			this.toggleSubscriptionRemoteVideo();
		}

		toggleSubscriptionRemoteVideoGrid()
		{
			if (!this.state.displayedUsers)
			{
				return;
			}

			const actualDisplayedUsers = this.getDisplayedUsers();
			const ids = actualDisplayedUsers.map(user => user.id)

			if (ids.length === 0)
			{
				return;
			}

			const toggleList = [];

			const displayedUserCount = actualDisplayedUsers.length;
			const currentGridPage = this.scrollManager.getCurrentGridPage();
			const isPinMode = this.state.pinnedUserId !== 0;
			const hasScreenshare = (actualDisplayedUsers.some((item) => item.data.screenState) && this.screenshareStreams.size !== 0)
				|| (this.screenshareStreams.size !== 0 && this.state.screenshareOnEnter === null);

			const checkNecessityAddUser = (newState) => {
				const currentUser = this.state.toggleListPrev.find((user) => user.id === newState.id);

				return Boolean(!currentUser
					|| (
						currentUser
						&& (
							currentUser.quality !== newState.quality
							|| currentUser.isShowVideo !== newState.isShowVideo
						)
					));
			};

			ids.forEach((id, displayedIndex) => {
				const userModel = this.userRegistry.get(id);

				if (!userModel || userModel.localUser || userModel.state !== 'Connected')
				{
					return;
				}

				if (!this.state.isAppActive)
				{
					toggleList.push({
						id,
						quality: StreamQuality.low,
						isShowVideo: false,
					});
					return;
				}

				const renderedUser = displayedIndex < GridUserCount.fullFirstPageCount * currentGridPage
					&& displayedIndex >= GridUserCount.fullFirstPageCount * (currentGridPage - 1);
				const isActiveUser = userModel.talking;

				if (!hasScreenshare && !isPinMode)
				{
					if (renderedUser || displayedUserCount <= GridUserCount.fullFirstPageCount)
					{
						toggleList.push({
							id,
							quality: StreamQuality.medium,
							isShowVideo: true,
						});
					}
					if (isActiveUser)
					{
						toggleList.push({
							id,
							quality: StreamQuality.high,
							isShowVideo: true,
						});
					}
					if (!renderedUser && displayedUserCount > GridUserCount.fullFirstPageCount && !isActiveUser)
					{
						toggleList.push({
							id,
							quality: StreamQuality.low,
							isShowVideo: false,
						});
					}
				}

			if (hasScreenshare || isPinMode)
			{
				if (this.screenshareStreams.has(String(id)) || this.screenshareStreams.has(id))
				{
					toggleList.push({
						id,
						quality: StreamQuality.high,
						isShowVideo: true,
					});
					return;
				}
				if (isPinMode && id === this.state.pinnedUserId)
				{
					toggleList.push({
						id,
						quality: StreamQuality.high,
						isShowVideo: true,
					});
					return;
				}
				if (this.activeIds.includes(id))
				{
					toggleList.push({
						id,
						quality: StreamQuality.low,
						isShowVideo: true,
					});
					return;
				}
				else
				{
					toggleList.push({
						id,
						quality: StreamQuality.low,
						isShowVideo: false,
					});
				}
			}
			});

			const filterToggleList = toggleList.filter((item) => checkNecessityAddUser(item));

			this.state.toggleListPrev = toggleList;

			if (filterToggleList.length > 0)
			{
				this.emit(EventName.ToggleSubscriptionRemoteVideo, [filterToggleList]);
			}
		}

		toggleSubscriptionRemoteVideoForGridView(viewableIds)
		{
			if (!this.state.displayedUsers)
			{
				return;
			}

			const ids = this.state.displayedUsers.map(user => user.id);

			if (ids.length === 0)
			{
				return;
			}

			const MAX_VISIBLE_STREAMS = GridUserCount.fullFirstPageCount;

			const toggleList = [];

			const isPinMode = this.state.pinnedUserId !== 0;
			const hasScreenshare = (this.getDisplayedUsers().some((item) => item.data.screenState) && this.screenshareStreams.size !== 0)
				|| (this.screenshareStreams.size !== 0 && this.state.screenshareOnEnter === null);

			const checkNecessityAddUser = (newState) => {
				const currentUser = this.state.toggleListPrev.find((user) => user.id === newState.id);

				return Boolean(!currentUser
					|| (
						currentUser
						&& (
							currentUser.quality !== newState.quality
							|| currentUser.isShowVideo !== newState.isShowVideo
						)
					));
			};

			// Native GridView emits onViewableItemsChanged with a 500ms debounce, and may not
			// emit it at all on small lists. Until the first event, treat the users that fit
			// into the first page viewport as visible. Skip the fallback in pin/screenshare
			// mode where the visible row is smaller (rows: 1) and a separate subscription
			// branch already covers the pinned/screenshare user.
			const effectiveViewableIds = viewableIds.length === 0 && !isPinMode && !hasScreenshare
				? ids.slice(0, MAX_VISIBLE_STREAMS)
				: viewableIds;
			const visibleSet = new Set(effectiveViewableIds.slice(0, MAX_VISIBLE_STREAMS));

			ids.forEach((id) => {
				const userModel = this.userRegistry.get(id);

				if (!userModel || userModel.localUser || userModel.state !== 'Connected')
				{
					return;
				}

				if (!this.state.isAppActive)
				{
					toggleList.push({
						id,
						quality: StreamQuality.low,
						isShowVideo: false,
					});
					return;
				}

				const isVisible = visibleSet.has(id);
				const isActiveUser = userModel.talking;

				if (!hasScreenshare && !isPinMode)
				{
					if (isVisible)
					{
						toggleList.push({
							id,
							quality: StreamQuality.medium,
							isShowVideo: true,
						});
					}

					if (isActiveUser)
					{
						toggleList.push({
							id,
							quality: StreamQuality.high,
							isShowVideo: true,
						});
					}

					if (!isVisible && !isActiveUser)
					{
						toggleList.push({
							id,
							quality: StreamQuality.low,
							isShowVideo: false,
						});
					}
				}

			if (hasScreenshare || isPinMode)
			{
				if (this.screenshareStreams.has(String(id)))
				{
					toggleList.push({
						id,
						quality: StreamQuality.high,
						isShowVideo: true,
					});
					return;
				}
				if (isPinMode && id === this.state.pinnedUserId)
				{
					toggleList.push({
						id,
						quality: StreamQuality.high,
						isShowVideo: true,
					});
					return;
				}
				if (isVisible)
				{
					toggleList.push({
						id,
						quality: StreamQuality.low,
						isShowVideo: true,
					});
					return;
				}
				toggleList.push({
					id,
					quality: StreamQuality.low,
					isShowVideo: false,
				});
			}
			});

			const filterToggleList = toggleList.filter((item) => checkNecessityAddUser(item));

			this.state.toggleListPrev = toggleList;

			if (filterToggleList.length > 0)
			{
				this.emit(EventName.ToggleSubscriptionRemoteVideo, [filterToggleList]);
			}
		}

		toggleSubscriptionRemoteVideo()
		{
			if (this.useGridView)
			{
				if (this.viewableIds)
				{
					this.toggleSubscriptionRemoteVideoForGridView(this.viewableIds);
				}

				return;
			}

			this.toggleSubscriptionRemoteVideoGrid();
		}

		setVideoStream(userId, stream, mirrorLocalVideo = false, { skipUpdate = false } = {})
		{
			const userModel = this.userRegistry.get(userId);
			if (!userModel)
			{
				console.error(`User ${userId} is not known`);

				return;
			}

			if (stream)
			{
				const checkedStream = this.getProperStream(stream);

				let hasVideoInUpdate = false;
				let hasSharingInUpdate = false;

				if (Array.isArray(checkedStream))
				{
					checkedStream.forEach((item) => {
						if (item.kind === 'sharing')
						{
							hasSharingInUpdate = true;
							this.screenshareStreams.set(userId, item);
							userModel.screenState = true;
						}
						else
						{
							hasVideoInUpdate = true;
							this.videoStreams[userId] = item;
							userModel.cameraState = true;
						}
					});
				}
				else
				{
					if (stream.kind === 'sharing')
					{
						hasSharingInUpdate = true;
						this.screenshareStreams.set(userId, stream);
						userModel.screenState = true;
					}
					else
					{
						hasVideoInUpdate = true;
						this.videoStreams[userId] = stream;
						userModel.cameraState = true;
					}
				}

				if (!hasVideoInUpdate && this.videoStreams.hasOwnProperty(userId))
				{
					delete this.videoStreams[userId];
					userModel.cameraState = false;
				}

				if (!hasSharingInUpdate && this.screenshareStreams.has(userId))
				{
					this.screenshareStreams.delete(userId);
					userModel.screenState = false;
				}
			}
			else
			{
				delete this.videoStreams[userId];
				this.screenshareStreams.delete(userId);
				userModel.cameraState = false;
				userModel.screenState = false;
			}

			this.insertUser(userId);

			if (userId == this.centralUserId && userId != env.userId)
			{
				this.setState({
					remoteStream: Array.isArray(stream) ? stream[0] : this.getProperStream(stream),
				});
			}
			else if (userId == this.userId)
			{
				this.setState({
					localStream: Array.isArray(stream) ? stream[0] : stream,
					cameraState: Boolean(stream),
					mirrorLocalVideo,
				});
			}

			if (!skipUpdate)
			{
				this.#updateUserInfo();
			}
		}

		setVideoStreams(userStreams)
		{
			userStreams.forEach((userStream) => {
				this.setVideoStream(
					userStream.id,
					userStream.stream,
					userStream.mirrorLocalVideo ?? false,
					{ skipUpdate: true },
				);
			});

			this.#updateUserInfo();
		}

		// Trailing-debounced wrapper around the grid re-sort + re-render. A lone update
		// (one camera change) runs after UPDATE_USER_INFO_DEBOUNCE; a burst of per-stream
		// setVideoStream calls (mass join/reconnect) collapses into one re-sort per quiet
		// window, with UPDATE_USER_INFO_MAX_WAIT guaranteeing progress during a continuous burst.
		#updateUserInfo()
		{
			const now = Date.now();
			if (!this.updateUserInfoDeferredSince)
			{
				this.updateUserInfoDeferredSince = now;
			}

			if (this.updateUserInfoTimer)
			{
				clearTimeout(this.updateUserInfoTimer);
				this.updateUserInfoTimer = null;
			}

			if (now - this.updateUserInfoDeferredSince >= UPDATE_USER_INFO_MAX_WAIT)
			{
				// maxWait reached — flush now so a continuous burst can't starve the grid
				this.#flushUserInfo();
				return;
			}

			this.updateUserInfoTimer = setTimeout(() => {
				this.updateUserInfoTimer = null;
				this.#flushUserInfo();
			}, UPDATE_USER_INFO_DEBOUNCE);
		}

		#flushUserInfo()
		{
			if (this.updateUserInfoTimer)
			{
				clearTimeout(this.updateUserInfoTimer);
				this.updateUserInfoTimer = null;
			}
			this.updateUserInfoDeferredSince = 0;

			if (this.isDestroyed)
			{
				return;
			}

			this.userRegistry.users = this.rankUsers();

			this.setState({
				displayedUsers: this.getDisplayedUsers(),
			});

			this.toggleSubscriptionRemoteVideo();
		}

		getProperStream(stream)
		{
			return stream?.stream ?? stream;
		}

		setSoundOutputDevice(device)
		{
			if (this.state.soundOutputDevice === device)
			{
				return;
			}
			this.setState({
				soundOutputDevice: device,
			});
		}

		getSoundOutputDevice()
		{
			return this.state.soundOutputDevice;
		}

		updateCopilotState(copilotState)
		{
			const copilotEnabled = Boolean(copilotState);
			if (this.state.copilotEnabled === copilotEnabled)
			{
				return;
			}
			this.setState({
				copilotEnabled: copilotEnabled,
			});
		}

		renderRemoteStreamByPriority()
		{
			if (!this.state.isAppActive)
			{
				return null;
			}
			const rendererParams = {};
			if (this.screenshareStreams.size !== 0)
			{
				const firstKey = this.screenshareStreams.keys().next().value;
				rendererParams.source = this.screenshareStreams.get(firstKey);
			}
			else
			{
				rendererParams.source = this.state.remoteStream;
			}

			return VideoRenderer({
				testId: `callsRemoteVideo_${this.state.centralUserId}`,
				resizeMode: 'center', // ? do we need it?
				style: {
					backgroundImage: this.getBackground(),
					backgroundResizeMode: 'cover',
					...styles.remoteVideo,
				},
				...rendererParams,
			});
		}


		renderLocalStream(showInFrame, bottomMargin)
		{
			if (!this.state.localStream || this.state.hideLocalVideo || !this.state.isAppActive)
			{
				return null;
			}
			const rendererParams = {
				source: ('getVideoTracks' in this.state.localStream)
					? this.state.localStream.getVideoTracks()[0]
					: this.state.localStream,
			};
			const isLandscape = this.getIsLandscapeOrientation();
			let style = null;
			if (showInFrame)
			{
				style = (isLandscape) ? ({ ...styles.localVideo, ...styles.localVideoLandscape }) : styles.localVideo;
				style.bottom = bottomMargin;
				if (isLandscape)
				{
					style.marginRight = 5;
				}
			}
			else
			{
				style = styles.remoteVideo;
			}

			return DraggableView(
				{
					style,
					enabled: showInFrame,
				},

				View(
					{
						testId: showInFrame ? 'callsLocalVideoCenter' : 'callsLocalVideoFrame',
						onClick: () => {
							if (showInFrame)
							{
								this.emit(EventName.ReplaceCamera);
							}
						},
					},
					VideoRenderer({
						style: { width: '100%', height: '100%' },
						mirror: this.state.mirrorLocalVideo,
						local: true,
						...rendererParams,
					}),
					showInFrame && Image({
						style: { position: 'absolute', bottom: 8, right: 8, width: 24, height: 24 },
						resizeMode: 'cover',
						clickable: false,
						svg: { content: Icons.switchCamera },
					}),
				),
			);
		}

		renderOverlay(top = null)
		{
			return View(
				{
					style: {
						...styles.overlay,
						justifyContent: top === null ? 'flex-end' : 'space-between',
					},
					clickable: false,
				},
				top !== null && top,
				this.renderBottomPanel(),
			);
		}

		renderDeviceHints(bottomMargin)
		{
			const userModel = this.userRegistry.get(this.state.centralUserId);

			const hasBoth = !userModel.cameraState && !userModel.microphoneState;

			return View(
				{
					style: {
						position: 'absolute',
						bottom: 0,
						left: 16 + getSafeArea().left,
						right: 16 + getSafeArea().right,
						marginBottom: bottomMargin,
						flexDirection: 'column',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
					},
				},
				!userModel.microphoneState && this.renderDeviceOffHint(
					userModel.name,
					userModel.gender,
					'microphone',
					hasBoth,
				),
				!userModel.cameraState && this.renderDeviceOffHint(
					userModel.name,
					userModel.gender,
					'camera',
					false,
				),
			);
		}

		renderDeviceOffHint(name, gender, device, addBottomMargin = false)
		{
			const normalizedGender = gender === 'F' ? 'F' : 'M';
			const normalizedDevice = device === 'camera' ? 'camera' : 'microphone';

			const phrase = DEVICE_OFF_PHRASES[normalizedDevice]?.[normalizedGender] || DEVICE_OFF_PHRASES.microphone.M;

			return View(
				{
					style: {
						...styles.deviceOffHint,
						...(addBottomMargin ? { marginBottom: 6 } : {}),
					},
				},
				IconView({
					size: 20,
					color: Color.baseWhiteFixed,
					icon: device === 'camera' ? Icon.CAMERA_OFF : Icon.MICROPHONE_OFF,
				}),
				Text({
					style: styles.deviceOffHintText,
					text: BX.message(phrase).replace('#FIRST_NAME#', name),
				}),
			);
		}

		renderVideoPaused()
		{
			const userName = this.userRegistry.get(this.state.centralUserId).name;

			return View(
				{
					style: styles.videoPausedOverlay,
					clickable: false,
				},
				Text({
					style: { fontSize: 15, color: '#FFFFFF' },
					text: BX.message('MOBILE_CALL_USER_PAUSED_VIDEO').replace('#NAME#', userName),
				}),
			);
		}

		/**
		 * @param {string} uri
		 * @param {string} text
		 * @param {string || null} color
		 */
		renderCenterAvatar(uri, text, color)
		{
			const avatar = Avatar({
				testId: 'center-avatar',
				uri: Utils.isAvatarBlank(uri) ? '' : uri,
				name: text,
				entityType: AvatarEntityType.OTHER,
				size: this.getIsLandscapeOrientation() ? 130 : 180,
				useLetterImage: true,
				backgroundColor: Utils.convertHexToColorEnum(color),
				shape: AvatarShape.NONE,
			});

			return View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'center',
						flexGrow: 1,
					},
				},
				avatar,
			)
		}

		getScreenshareLayout()
		{
			if (this.getIsLandscapeOrientation())
			{
				return this.renderScreenshareLayoutLandscape();
			}
			return this.renderScreenshareLayout();
		}

		getCenterHeight()
		{
			const androidOffset = device.screen.height * 0.9 - device.screen.safeArea.top
			const safeAreaLandscapeHeight = device.platform === 'android' ? androidOffset : '90%';

			if (this.state.isScreenshareFullScreen && this.getIsLandscapeOrientation())
			{
				return '100%';
			}

			if (!this.state.isScreenshareFullScreen && this.getIsLandscapeOrientation())
			{
				return safeAreaLandscapeHeight;
			}

			return '90%';
		}

		getMainGridViewGrid()
		{
			if (!this.mainGridViewGrid)
			{
				this.mainGridViewGrid = new GridViewGrid({
					userRegistry: this.userRegistry,
					connectedUsers: [],
					panelVisible: this.state.panelVisible,
					getConnectedUserCount: this.getDisplayedUserCount(),
					gridContainerHeight: this.state.gridContainerHeight,
					videoStreams: this.videoStreams,
					mirrorLocalVideo: this.state.mirrorLocalVideo,
					gridContainerWidth: this.state.gridContainerWidth,
					viewableIds: this.viewableIds,
					orientation: 'vertical',
					onUserClick: (userId) => {
						this.handleSingleTap(() => this.pinUserInGrid(userId));
					},
					onLongTap: (userId) => this.pinUserInGrid(userId),
					onReplaceCamera: () => this.emit(EventName.ReplaceCamera),
					onViewableItemsChanged: (viewableIds) => {
						this.viewableIds = viewableIds;
						this.toggleSubscriptionRemoteVideoForGridView(viewableIds);
					},
				});
			}

			this.mainGridViewGrid.update({
				connectedUsers: this.state.displayedUsers || [],
				panelVisible: this.state.panelVisible,
				getConnectedUserCount: this.getDisplayedUserCount(),
				gridContainerHeight: this.state.gridContainerHeight,
				videoStreams: this.videoStreams,
				mirrorLocalVideo: this.state.mirrorLocalVideo,
				gridContainerWidth: this.state.gridContainerWidth,
				viewableIds: this.viewableIds,
			});

			return this.mainGridViewGrid;
		}

		getPinGridViewGrid(users, size)
		{
			if (!this.pinGridViewGrid)
			{
				this.pinGridViewGrid = new GridViewGrid({
					userRegistry: this.userRegistry,
					connectedUsers: users,
					panelVisible: this.state.panelVisible,
					getConnectedUserCount: users.length,
					gridContainerWidth: this.state.gridContainerWidth,
					gridContainerHeight: this.state.gridContainerHeight,
					itemWidth: size,
					itemHeight: size,
					videoStreams: this.videoStreams,
					mirrorLocalVideo: this.state.mirrorLocalVideo,
					userId: env.userId,
					orientation: this.getIsLandscapeOrientation() ? 'vertical' : 'horizontal',
					rows: 1,
					initialVisibilityFallbackEnabled: false,
					onUserClick: (userId) => this.handleSingleTap(() => this.pinUserInGrid(userId)),
					onLongTap: (userId) => this.pinUserInGrid(userId),
					onReplaceCamera: () => this.emit(EventName.ReplaceCamera),
					onViewableItemsChanged: (viewableIds) => {
						this.viewableIds = viewableIds;
						this.toggleSubscriptionRemoteVideoForGridView(viewableIds);
					},
				});
			}
			else
			{
				this.pinGridViewGrid.update({
					connectedUsers: users,
					panelVisible: this.state.panelVisible,
					getConnectedUserCount: users.length,
					gridContainerWidth: this.state.gridContainerWidth,
					gridContainerHeight: this.state.gridContainerHeight,
					itemWidth: size,
					itemHeight: size,
					videoStreams: this.videoStreams,
					mirrorLocalVideo: this.state.mirrorLocalVideo,
					orientation: this.getIsLandscapeOrientation() ? 'vertical' : 'horizontal',
				});
			}

			return this.pinGridViewGrid;
		}

		getScreenshareGridViewGrid(size)
		{
			const isLandscape = this.getIsLandscapeOrientation();
			const gridContainerWidth = isLandscape ? this.state.gridContainerWidth * 0.22 : this.state.gridContainerWidth;
			const gridContainerHeight = isLandscape ? this.state.gridContainerHeight : this.state.gridContainerHeight * 0.2;
			const orientation = isLandscape ? 'vertical' : 'horizontal';

			if (!this.screenshareGridViewGrid)
			{
				this.screenshareGridViewGrid = new GridViewGrid({
					userRegistry: this.userRegistry,
					connectedUsers: this.state.displayedUsers,
					panelVisible: this.state.panelVisible,
					getConnectedUserCount: this.getDisplayedUserCount(),
					gridContainerWidth,
					gridContainerHeight,
					itemWidth: size,
					itemHeight: size,
					videoStreams: this.videoStreams,
					mirrorLocalVideo: this.state.mirrorLocalVideo,
					orientation,
					rows: 1,
					initialVisibilityFallbackEnabled: false,
					onUserClick: (userId) => this.handleSingleTap(() => this.pinUserInGrid(userId)),
					onLongTap: (userId) => this.pinUserInGrid(userId),
					onReplaceCamera: () => this.emit(EventName.ReplaceCamera),
					onViewableItemsChanged: (viewableIds) => {
						this.viewableIds = viewableIds;
						this.toggleSubscriptionRemoteVideoForGridView(viewableIds);
					},
				});
			}

			this.screenshareGridViewGrid.update({
				connectedUsers: this.state.displayedUsers,
				panelVisible: this.state.panelVisible,
				getConnectedUserCount: this.getDisplayedUserCount(),
				gridContainerWidth,
				gridContainerHeight,
				itemWidth: size,
				itemHeight: size,
				videoStreams: this.videoStreams,
				mirrorLocalVideo: this.state.mirrorLocalVideo,
				orientation,
			});

			return this.screenshareGridViewGrid;
		}

		renderCenterGrid()
		{
			const hasScreenshare = (this.getDisplayedUsers().some((item) => item.data.screenState) && this.screenshareStreams.size !== 0)
				|| (this.screenshareStreams.size !== 0 && this.state.screenshareOnEnter === null);

			const paddingVertical = {
				paddingTop: 5,
				paddingBottom: 5,
			}


			return View(
				{
					style: {
						...styles.centerGrid,
						height: this.getCenterHeight(),
						...paddingVertical,
						clickable: false,
						marginTop: !this.getIsLandscapeOrientation() && device.screen.safeArea.top,
					},
					onLayout: (params) => {
						this.setState({
							gridContainerWidth: params.width,
							gridContainerHeight: params.height - 5,
						});
					},
				},
				hasScreenshare ? this.getScreenshareLayout()
					: (this.state.pinnedUserId
						? this.renderPinLayout()
						: (this.useGridView && this.getDisplayedUserCount() >= 7)
								? this.getMainGridViewGrid()
								: new ScrollViewGrid({
									scrollManager: this.scrollManager,
									userRegistry: this.userRegistry,
									connectedUsers: this.state.displayedUsers,
									panelVisible: this.state.panelVisible,
									mirrorLocalVideo: this.state.mirrorLocalVideo,
									getConnectedUserCount: this.getDisplayedUserCount(),
									subscribeOnNewPage: () => this.subscribeOnNewPage(),
									gridContainerHeight: this.state.gridContainerHeight,
									videoStreams: this.videoStreams,
									isReconnecting: this.state.isReconnecting,
									gridContainerWidth: this.state.gridContainerWidth,
									resetActiveScreenId: () => this.state.activeScreenId = null,
									toggleUI: () => this.toggleUI(),
									onUserClick: (userId) => {
										this.handleSingleTap(() => this.pinUserInGrid(userId));
									},
									onLongTap: (userId) => this.pinUserInGrid(userId),
									onReplaceCamera: () => this.emit(EventName.ReplaceCamera),
								})
					),
			);
		}

		renderCenter()
		{
			if (this.state.centralUserId === this.userId)
			{
				return null;
			}
			const showLargeAvatar = this.state.centralUserId !== this.userId
				&& !this.state.remoteStream
				&& !this.state.centralUserVideoPaused
			;
			const showArrows = this.state.displayedUsers.length > 1;

			return View(
				{
					style: styles.center,
					clickable: false,
				},
				showArrows && View(
					{
						testId: 'callsArrowLeft',
						style: {
							marginLeft: (getSafeArea().left || 8),
							...styles.leftArrow,
						},
						onClick: () => {
							const userId = this.getLeftUser(this.centralUserId);
							this.pinUser(userId);
						},
					},
					Image({
						style: { width: 40, height: 40 },
						resizeMode: 'center',
						svg: { content: Icons.arrowLeft },
					}),
				),
				showLargeAvatar && this.renderCenterAvatar(
					this.userRegistry.get(this.state.centralUserId).avatar,
					this.userRegistry.get(this.state.centralUserId).name,
					CallUtil.userData[this.centralUserId].color,
				),
				showArrows && View(
					{
						testId: 'callsArrowRight',
						style: {
							marginRight: (getSafeArea().right || 8),
							...styles.rightArrow,
						},
						onClick: () => {
							const userId = this.getRightUser(this.centralUserId);
							this.pinUser(userId);
						},
					},
					Image({
						style: { width: 40, height: 40 },
						resizeMode: 'center',
						svg: { content: Icons.arrowRight },
					}),
				),
			);
		}

		changeActiveScreenShareUser(index)
		{
			let users = this.userRegistry.users;
			users = users.filter(user => user);

			if (index !== null)
			{
				const userId = this.userRegistry.users[index]?.id;
				if (userId)
				{
					const actualIndex = users.findIndex(u => u.id === userId);
					if (actualIndex !== -1 && actualIndex !== 0)
					{
						[users[actualIndex], users[0]] = [users[0], users[actualIndex]];
					}
				}
			}

			return users;
		}

		getLeastActiveUser(users)
		{
			let targetIndex = -1;
			let maxAgo = -Infinity;

			for (let i = 1; i < 8 && i < users.length; i++) {
				const user = users[i];
				const ago = user.wasTalkingAgo?.() ?? Infinity;

				if (ago > maxAgo) {
					maxAgo = ago;
					targetIndex = user.index;
				}
			}

			return targetIndex;
		}

		// keys: setTalkingState
		swapUsers(talkingUserId)
		{
			let users = this.userRegistry.users;

			users = users.filter(user => user);

			const talkingUser = users.findIndex(user => user.id === Number(talkingUserId));

			// TODO: ???
			const firstWithVideo = users.findIndex(user => user.cameraState);

			if (!!this.state.pinnedUserId)
			{
				const talkingIndex = users.findIndex(user => user.talking === true);
				if (talkingIndex === -1 || talkingIndex < this.state.userScrollUserPerPage - 1)
				{
					return users;
				}

				[users[talkingIndex], users[1]] = [users[1], users[talkingIndex]];
				setTimeout(() => {
					this.resubscribeForUserScroll();
				});
				return users;
			}

			if (this.state.activeScreenId !== null)
			{
				if (talkingUser !== -1 && talkingUser !== this.state.activeScreenId)
				{
					[users[talkingUser], users[1]] = [users[1], users[talkingUser]];
				}
				setTimeout(() => {
					this.resubscribeForUserScroll();
				});
				return users;
			}

			if (talkingUser === -1 || firstWithVideo === -1 || users[talkingUser].index <= GridUserCount.fullFirstPageIndex)
			{
				return users;
			}

			const leastActiveUser = this.getLeastActiveUser(users);

			if (leastActiveUser)
			{
				[users[talkingUser], users[leastActiveUser]] = [users[leastActiveUser], users[talkingUser]];
				return users;
			}

			const userForReplacement = users.findIndex(user => user.cameraState === false && user.id !== Number(this.userId));

			if (users[talkingUser].cameraState === false && userForReplacement !== -1)
			{
				[users[talkingUser], users[userForReplacement]] = [users[userForReplacement], users[talkingUser]];
				return users;
			}

			return users;
		}

		// keys: start call - do we need this?
		sortAllUsers()
		{
			let users = this.userRegistry.users;

			users = users.filter(user => user);
			const firstPageUsers = users.slice(0, GridUserCount.fullFirstPageCount);
			// Remaining users - sort by screen/camera state
			const remainingUsers = users.slice(GridUserCount.fullFirstPageCount);

			remainingUsers.sort((a, b) => {
				if (a.index <= GridUserCount.fullFirstPageIndex || b.index <= GridUserCount.fullFirstPageIndex)
				{
					return 0;
				}

				if (b.screenState !== a.screenState)
				{
					return Number(b.screenState) - Number(a.screenState);
				}

				return Number(b.cameraState) - Number(a.cameraState);
			});

			users = [...firstPageUsers, ...remainingUsers];
			users.forEach((item, index) => item.index = index);

			return users;
		}

		rankUsers()
		{
			let users = this.userRegistry.users;

			users = users.filter(user => user);

			const talkingUser = users.findIndex(user => user.talking);
			const firstWithVideo = users.findIndex(user => user.cameraState);

			if (!!this.state.pinnedUserId)
			{
				const talkingIndex = users.findIndex(user => user.talking === true);
				if (talkingIndex === -1 || talkingIndex < this.state.userScrollUserPerPage - 1)
				{
					return users;
				}

				[users[talkingIndex], users[1]] = [users[1], users[talkingIndex]];
				setTimeout(() => {
					this.resubscribeForUserScroll();
				});
				return users;
			}

			if (this.state.activeScreenId !== null)
			{
				if (talkingUser !== -1 && talkingUser !== this.state.activeScreenId)
				{
					[users[talkingUser], users[1]] = [users[1], users[talkingUser]];
				}
				setTimeout(() => {
					this.resubscribeForUserScroll();
				});
				return users;
			}

			const firstPageUsers = users.slice(0, GridUserCount.fullFirstPageCount);
			// Remaining users - sort by screen/camera state
			const remainingUsers = users.slice(GridUserCount.fullFirstPageCount);

			remainingUsers.sort((a, b) => {
				if(a.index <= GridUserCount.fullFirstPageIndex || b.index <= GridUserCount.fullFirstPageIndex)
				{
					return 0;
				}

				if (b.screenState !== a.screenState) {
					return Number(b.screenState) - Number(a.screenState);
				}

				return Number(b.cameraState) - Number(a.cameraState);
			});

			users = [...firstPageUsers, ...remainingUsers];
			users.forEach((item, index) => item.index = index);

			if (talkingUser === -1 || firstWithVideo === -1 || users[talkingUser].index <= GridUserCount.fullFirstPageIndex)
			{
				return users;
			}

			const leastActiveUser = this.getLeastActiveUser(users);

			if (leastActiveUser)
			{
				[users[talkingUser], users[leastActiveUser]] = [users[leastActiveUser], users[talkingUser]];
				users.forEach((item, index) => item.index = index);
				return users;
			}

			const userForReplacement = users.findIndex(user => user.cameraState === false && user.id !== Number(this.userId));

			if (users[talkingUser].cameraState === false && userForReplacement !== -1)
			{
				[users[talkingUser], users[userForReplacement]] = [users[userForReplacement], users[talkingUser]];
				users.forEach((item, index) => item.index = index);
				return users;
			}

			return users;
		}

		getStream(id, isLocal = false, scale = true)
		{
			if (!this.state.isAppActive)
			{
				return;
			}
			const rendererParams = {};
			if ('getVideoTracks' in this.videoStreams[id])
			{
				rendererParams.source = this.videoStreams[id].getVideoTracks()[0];
			}
			else
			{
				rendererParams.source = this.videoStreams[id];
			}

			return VideoRenderer({
				testId: `callsRemoteVideo_${this.state.centralUserId}`,
				resizeMode: 'center', // ? do we need it?
				mirror: isLocal,
				style: {
					backgroundResizeMode: 'cover',
					...styles.remoteVideo,
				},
				...rendererParams,
				local: scale,
			});
		}

		getScreenStream(id)
		{
			if (!this.state.isAppActive)
			{
				return;
			}
			const rendererParams = {};

			rendererParams.source = this.screenshareStreams.get(id);

			return VideoRenderer({
				testId: `callsRemoteVideo_${this.state.centralUserId}`,
				resizeMode: 'center', // ? do we need it?
				style: {
					backgroundResizeMode: 'cover',
					...styles.remoteVideo,
				},
				...rendererParams,
			});
		}

		pinUserInGrid(id)
		{
			if (this.state.isReconnecting)
			{
				return;
			}

			this.setState({
				pinnedUserId: id,
			});
		}

		unpinUserInGrid()
		{
			this.setState({ pinnedUserId: 0 }, () => {
				this.toggleSubscriptionRemoteVideo();
			});
		}

		getIsAndroid()
		{
			return device.platform === 'android';
		}

		getScrollViewHeight()
		{
			return device.screen.height;
		}

		subscribeOnNewPage()
		{
			this.toggleSubscriptionRemoteVideo();
			this.redraw();
		}

		scrollToCurrentPage()
		{
			const offset = this.getIsIos() ? PREV_PAGE_TEASER : PREV_PAGE_TEASER_ANDROID;
			this.scrollView.scrollTo({
				x: 0,
				y: this.state.currentGridPage !== 1 ? ((this.state.currentGridPage - 1) * (this.getScrollViewHeight() - offset)) : 0,
				animated: true,
			})
		}

		renderCameraSwitcher()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 8,
						right: 8,
						zIndex: 20,
					},
					onClick: () => {
						this.emit(EventName.ReplaceCamera);
					},
				},
				Image({
					style: { width: 24, height: 24 },
					svg: { content: Icons.rotateIcon },
				}),
			);
		}

		renderScrollItem(item)
		{
			const isThisUser = item.data.id === Number(this.userId);
			return !item.data.cameraState
				? View(
					{
						style: {
							height: '100%',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					Avatar({
						testId: 'scrollItem-avatar',
						uri: this.userRegistry.get(item.data.id).avatar,
						name: BX.utils.html.htmlDecode(item.data.name),
						size: 90,
						backgroundColor: Utils.convertHexToColorEnum(CallUtil.userData[item.data.id]?.color),
					}),
				)
				: View(
					{
						style: {
							...styles.videoContainer,
						},
						clickable: false,
					},
					this.videoStreams.hasOwnProperty(item.data.id) && this.getStream(item.data.id, isThisUser),
					isThisUser && this.renderCameraSwitcher(),
				);
		}

		renderPinLayout()
		{
			const pinnedUser = this.state.displayedUsers.filter((item) => item.id === this.state.pinnedUserId)
			const isThisUser = this.state.pinnedUserId === Number(this.userId);
			const size = this.getIsLandscapeOrientation()
				? (this.state.gridContainerWidth * 0.22 - 5.0 - device.screen.safeArea.right)
				: this.state.gridContainerHeight * 0.22 - 5.0;
			const users = this.state.displayedUsers.filter((item) => item.id !== this.state.pinnedUserId)
			const scrollList = this.renderUserScrollList(
				this.getIsLandscapeOrientation() ? '100%' : size,
				this.getIsLandscapeOrientation() ? size : '100%',
				this.getIsLandscapeOrientation() && 5,
				users,
			);

			return View(
				{
					style: {
						height: '100%',
						width: this.getIsLandscapeOrientation() ? '100%' : '100%',
						display: this.getIsLandscapeOrientation() && 'flex',
						flexDirection: this.getIsLandscapeOrientation() && 'row',
						paddingHorizontal: 5,
					},
					onLayout: () => {
						this.state.currentGridPage = 1;
						this.subscribeOnNewPage();
						this.setState({
							userScrollUserPerPage: Math.ceil(this.state.gridContainerWidth / size),
						});
					},
					onClick: () => {
						this.toggleUI();
					}
				},
				View(
					{
						style: {
							height: this.getIsLandscapeOrientation() ? '100%' : '78%',
							width: this.getIsLandscapeOrientation() ? '78%' : '100%',
						},
						onClick: () => {
							this.handleSingleTap(() => this.unpinUserInGrid())
						},
						onLongClick: () => {
							this.unpinUserInGrid();
						},
					},
					View(
						{
							style: {
								...styles.userPin,
							},
						},
						View(
							{
								style: {
									...styles.pinIconBadge
								}
							},
							Image({
								style: { width: 16, height: 16 },
								svg: { content: Icons.pinIcon },
							}),
						),
						this.state.panelVisible && new NameBadge({
							name: pinnedUser[0].data.name,
							microphoneState: pinnedUser[0].data.microphoneState,
						}),
						View(
							{
								style: {
									...styles.videoContainer,
								},
								clickable: false,
							},
							this.userRegistry.get(this.state.pinnedUserId).cameraState
								? this.videoStreams.hasOwnProperty(this.state.pinnedUserId) && this.getStream(this.state.pinnedUserId, isThisUser, false)
								: View(
									{
										style: {
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'center',
											alignItems: 'center',
											width: '100%',
											height: '100%',
										}
									},
									Avatar({
										testId: 'pinnedUser-avatar',
										uri: this.userRegistry.get(this.state.pinnedUserId).avatar,
										name: BX.utils.html.htmlDecode(this.userRegistry.get(this.state.pinnedUserId).name),
										size: 180,
										backgroundColor: Utils.convertHexToColorEnum(CallUtil.userData[this.state.pinnedUserId].color),
									}),
								),
						)
					)
				),

				this.useGridView
					? View(
						{
							style: {
								flex: 1,
								width: this.getIsLandscapeOrientation() ? '22%' : '100%',
								height: this.getIsLandscapeOrientation() ? '100%' : '22%',
							},
						},
						this.getPinGridViewGrid(users, size),
					)
					: this.renderUserScrollView(scrollList, !this.getIsLandscapeOrientation(), this.getIsLandscapeOrientation() ? '100%' : '20%'),
			)
		}

		checkIsScreenshareOnEnter()
		{
			if(this.state.screenshareOnEnter === null)
			{
				for (const [userId] of this.screenshareStreams) {
					this.userRegistry.get(Number(userId)).screenState = true;
				}
				this.state.screenshareOnEnter = false;
			}
		}

		checkScreenshareAfterReconnect()
		{
			for (const [userId] of this.screenshareStreams) {
				this.userRegistry.get(Number(userId)).screenState = true;
			}
		}

		renderScreenshareLayoutLandscape()
		{
			const size = this.getIsLandscapeOrientation()
				? (this.state.gridContainerWidth * 0.22 - 5.0 - device.screen.safeArea.right)
				: this.state.gridContainerHeight * 0.22;

			this.checkIsScreenshareOnEnter();
			const screenshareList = this.getScreenshareList();
			const scrollList = this.renderUserScrollList('100%', size, 5);
			const dots = this.renderDots(screenshareList);
			const screenShareViews = this.renderScreenShareViews(screenshareList);
			const slider = this.renderSlider(screenshareList, screenShareViews);
			const screenshareWidth = this.state.isScreenshareFullScreen ? '100%' : '78%';

			return View(
				{
					style: {
						height: '100%',
						width: '100%',
						flexDirection: 'row',
					},
					onLayout: () => {
						this.state.currentGridPage = 1;
						// this.subscribeOnNewPage();
						this.resubscribeForUserScroll();
					},
				},
				this.renderMainScreenshareView(slider, dots, screenshareList, '100%', screenshareWidth, true),
				this.useGridView
					? View(
						{
							style: {
								width: '22%',
								height: '100%',
							},
						},
						this.getScreenshareGridViewGrid(size),
					)
					: this.renderUserScrollView(scrollList, false, '100%'),
			);
		}

		renderScreenshareLayout() {
			const commonOffset = device.platform === 'iOS' ? 50 : 0;
			const topOffset = device.screen.safeArea.top + commonOffset;
			// The bottom carousel container is sized to 20% of the center grid height
			// (see getScreenshareGridViewGrid + the wrapper View below), so the tile
			// side must also be based on 20% — otherwise tiles overflow the container
			// and the native GridView ends up scrolling vertically.
			const size = this.getIsLandscapeOrientation()
				? (this.state.gridContainerWidth * 0.22 - 5.0 - device.screen.safeArea.right)
				: this.state.gridContainerHeight * 0.2 - 5.0;

			this.checkIsScreenshareOnEnter();
			const screenshareList = this.getScreenshareList();
			const scrollList = this.renderUserScrollList(size, '100%');
			const dots = this.renderDots(screenshareList);
			const screenShareViews = this.renderScreenShareViews(screenshareList);
			const slider = this.renderSlider(screenshareList, screenShareViews);

			return View(
				{
					style: {
						height: '100%',
						width: '100%',
						paddingHorizontal: 5,
					},
					onLayout: () => {
						this.state.currentGridPage = 1;
						// this.subscribeOnNewPage();
						this.resubscribeForUserScroll();
						this.setState({
							isScreenshareFullScreen: false,
						});
					},
				},
			this.renderMainScreenshareView(
				slider,
				dots,
				screenshareList,
				'78%',
				'100%',
				false,
			),
			this.useGridView
				? View(
					{
						style: {
							width: '100%',
							height: '20%',
						},
					},
					this.getScreenshareGridViewGrid(size),
				)
				: this.renderUserScrollView(scrollList, true, '20%'),
		);
	}

		getScreenshareList()
		{
			return Array.from(this.screenshareStreams.keys())
				.filter(id => this.userRegistry.get(id)?.screenState)
				.map(id => ({ id: id }))
				.reverse();
		}

		renderUserScrollList(width, height, marginBottom = 0, users = this.state.displayedUsers) {
			return users.map((item, index) => (
				View(
					{
						style: {
							width,
							height,
							marginBottom,
							borderColor: item.talking && '#1BCE7B',
							marginRight: index !== this.state.displayedUsers.length - 1 ? 5 : 0,
							...styles.scrollListItem,
						},
						onClick: () => {
							this.handleSingleTap(() => this.pinUserInGrid(item.data.id));
						},
						// clickable: false,
					},
					item.screenState && View(
						{
							style: {
								...styles.pinIconBadge,
							},
						},
						Image({
							style: { width: 13, height: 13 },
							svg: { content: Icons.screenshareIcon },
						}),
					),
					this.state.panelVisible && new NameBadge({ name: item.data.name, microphoneState: item.data.microphoneState }),
					this.renderScrollItem(item),
				)
			));
		}

		renderDots(screenshareList) {
			return screenshareList.map((item, index) => (
				View(
					{
						style: {
							marginLeft: 5,
							marginRight: 5,
						}
					},
					BadgeCounter({
						testId: 'BadgeCounterDotExample',
						dot: true,
						size: BadgeCounterSize.DOT,
						design: this.state.currentPage === index ? BadgeCounterDesign.WHITE_ALERT : BadgeCounterDesign.GREY,
					})
				)
			));
		}

		toggleScreenshareFullScreen()
		{
			this.setState({
				isScreenshareFullScreen: !this.state.isScreenshareFullScreen,
			})
		}

		renderScreenShareViews(screenshareList) {
			return screenshareList.map(item => (
				View(
					{
						style: {
							objectFit: 'cover',
							backgroundResizeMode: 'cover',
							position: 'relative',
						},
						onClick: () => {
							this.handleSingleTap(() => {})
						},
					},
					this.state.panelVisible && View(
						{
							style: {
								...styles.screenshareViewBadgeContainer,
								bottom: this.getIsLandscapeOrientation() ? this.getBottomLiftPosition() : 33,
							},
						},
						Image({
							style: { width: 13, height: 13, marginLeft: 5, marginRight: 5 },
							svg: { content: Icons.screenshareIcon },
						}),
						Text({
							style: {
								fontSize: 13,
								paddingTop: 2,
								paddingBottom: 2,
								paddingRight: 10,
								color: '#fff',
							},
							text: `Экран ${this.userRegistry.get(item.id).name}`,
						}),
					),
					View(
						{
							style: {
								...styles.videoContainer,
							},
							clickable: false,
						},
						this.screenshareStreams.has(item.id) && this.getScreenStream(item.id)
					)
				)
			));
		}

		renderSlider(screenshareList, screenShareViews) {
			return Slider(
				{
					onPageChange: (page) => {
						this.setState({
							currentPage: page,
						});
						const activeScreenId = screenshareList[page].id;
						const activeScreenIndex = this.state.displayedUsers.findIndex((user) => user.data.id === activeScreenId);
						if (activeScreenIndex) {
							this.userRegistry.users = [...this.changeActiveScreenShareUser(activeScreenIndex)];
						}
						this.setState({
							activeScreenId: activeScreenId,
							displayedUsers: this.getDisplayedUsers(),
						});
						this.screenshareScrollView.scrollTo({ x: 0, y: 0, animated: true });
					},
					onLayout: () => {
						if (this.state.activeScreenId === null) {
							this.setState({
								currentPage: 0,
							});
							const activeScreenId = screenshareList[0].id;
							const activeScreenIndex = this.state.displayedUsers.findIndex((user) => user.data.id === activeScreenId)
							if (activeScreenIndex !== -1) {
								this.userRegistry.users = [...this.changeActiveScreenShareUser(activeScreenIndex)];
							}
							this.state.activeScreenId = activeScreenId;
							this.setState({
								displayedUsers: this.getDisplayedUsers(),
							});
							this.screenshareScrollView.scrollTo({ x: 0, y: 0, animated: true });
						}
					},
					onPageWillChange: (page, direction) => {
						if (page === screenShareViews.length && direction === 'right') {
							this.setState({
								isScreenshareSwipeEnabled: false,
							})
						}
						else {
							this.setState({
								isScreenshareSwipeEnabled: true,
							})
						}
					},
					style: {
						flex: 1,
						width: '100%',
						height: '100%',
					},
					swipeEnabled: this.state.isScreenshareSwipeEnabled,
				},
				...screenShareViews,
			);
		}

		getBottomLiftPosition()
		{
			return this.bottomPanelHeight() + 8;
		}

		renderMainScreenshareView(slider, dots, screenshareList, height, width, shouldShowButton) {
			return View(
				{
					style: {
						height: height,
						width: width,
						position: 'relative',
						backgroundColor: '#26FFFFFF',
						borderRadius: 10,
					},
				},
				slider,
				this.state.isRotationIconVisible && this.renderRotationIcon(),
				screenshareList.length > 1 && View(
					{
						style: {
							...styles.dotsContainer,
						},
					},
					View(
						{
							style: {
								...styles.dotsBadge,
							},
						},
						...dots,
					),
				),
				shouldShowButton && View(
					{
						style: {
							position: 'absolute',
							bottom: this.state.panelVisible ? this.getBottomLiftPosition() : 33,
							right: 8,
							zIndex: 23,
						},
						onClick: () => this.toggleScreenshareFullScreen(),
					},
					Image({
						style: { width: 24, height: 24 },
						svg: { content: this.state.isScreenshareFullScreen ? Icons.collapseFullScreen : Icons.fullScreen },
					}),
				),
			);
		}

		scrollPageUserScroll(horizontal, endDragScrollPosition)
		{
			const offset = horizontal ? ((this.state.gridContainerHeight * 0.22 + 5) * (this.state.userScrollUserPerPage - 1)) : (device.screen.height - 70);
			const diff = endDragScrollPosition - this.beginDragUserScrollPosition;

			if (diff > 0)
			{
				this.userScrollProgress += offset;
				this.userScrollPage++;
			}

			if (diff < 0)
			{
				if (this.beginDragUserScrollPosition < 50)
				{
					return;
				}
				this.userScrollProgress -= offset;
				this.userScrollPage--;
			}

			this.screenshareScrollView.scrollTo({
				x: horizontal ? this.userScrollProgress : 0,
				y: horizontal ? 0 : this.userScrollProgress,
				animated: true,
			});
			this.resubscribeForUserScroll();
			setTimeout(() => {
				this.hasScrolled = false;
			}, 1000);
		}

		resubscribeForUserScroll()
		{
			if (this.getDisplayedUserCount() === this.state.userScrollUserPerPage)
			{
				this.activeIds = this.state.displayedUsers.map(user => user.id);
			}
			else
			{
				const usersPerPage = this.state.userScrollUserPerPage + 1;
				const startIndex = this.userScrollPage * (this.state.userScrollUserPerPage - 1);
				const endIndex = startIndex + usersPerPage;

				const pageUsers = this.state.displayedUsers.slice(startIndex, endIndex);

				if (pageUsers.length < usersPerPage && this.userScrollPage > 0)
				{
					const needed = usersPerPage - pageUsers.length;
					const prevPageUsers = this.state.displayedUsers.slice(
						Math.max(0, startIndex - needed),
						startIndex
					);
					pageUsers.unshift(...prevPageUsers);
				}
				this.activeIds = pageUsers.map(user => user.id);
			}

			this.toggleSubscriptionRemoteVideo();
		}

		renderUserScrollView(scrollList, horizontal, heightOrWidth) {
			const verticalStyles = {
				flexWrap: 'wrap',
				width: '100%',
				minHeight: device.screen.height,
			};

			const horizontalStyles = {
				display: 'flex',
				flexDirection: 'row',
			};

			const showsScrollIndicators = {
				showsHorizontalScrollIndicator: false,
				showsVerticalScrollIndicator: false,
			};

			return horizontal
				? ScrollView(
					{
						ref: (ref) => {
							this.screenshareScrollView = ref;
						},
						onScrollBeginDrag: () => {
							this.beginDragUserScrollPosition = this.currentUserScrollPosition;
						},
						onScrollEndDrag: () => {
							if (!this.getIsAndroid())
							{
								const endDragScrollPosition = this.currentUserScrollPosition;
								this.scrollPageUserScroll(horizontal, endDragScrollPosition);
							}
						},
						onMomentumScrollEnd: () => {
							if (this.getIsAndroid())
							{
								this.scrollPageUserScroll(horizontal, this.currentUserScrollPosition);
								this.hasScrolled = true;
							}
						},
						onScroll: (params) => {
							this.currentUserScrollPosition = params.contentOffset.x;
							if (this.getIsAndroid() && !this.hasScrolled)
							{
								setTimeout(() => {
									if (!this.hasScrolled)
									{
										this.scrollPageUserScroll(horizontal, this.currentUserScrollPosition);
									}
								}, 1000)
								this.hasScrolled = true;
							}
						},
						onLayout: () => {
							this.userScrollProgress = 0;
							this.userScrollPage = 0;
							this.resubscribeForUserScroll();
						},
						...showsScrollIndicators,
						horizontal: horizontal,
						bounces: false,
						style: horizontal ? {
							flex: 1,
							height: heightOrWidth,
							marginTop: 5,
						} : {
							width: heightOrWidth,
						},
					},
					View(
						{
							style: horizontal ? horizontalStyles : verticalStyles,
						},
						...scrollList,
					),
				)
				: View(
					{
						style: {
							width: '20%',
							marginLeft: 5,
						},
					},
					ScrollView(
						{
							ref: (ref) => {
								this.screenshareScrollView = ref;
							},
							onScrollBeginDrag: () => {
								this.beginDragUserScrollPosition = this.currentUserScrollPosition;
							},
							onScrollEndDrag: () => {
								if (!this.getIsAndroid())
								{
									const endDragScrollPosition = this.currentUserScrollPosition;
									this.scrollPageUserScroll(horizontal, endDragScrollPosition);
								}
							},
							onScroll: (params) => {
								this.currentUserScrollPosition = params.contentOffset.y;
								if (this.getIsAndroid() && !this.hasScrolled)
								{
									setTimeout(() => {
										if (!this.hasScrolled)
										{
											this.scrollPageUserScroll(horizontal, this.currentUserScrollPosition);
										}
									}, 500);
									this.hasScrolled = true;
								}
							},
							onMomentumScrollEnd: () => {
								if (this.getIsAndroid())
								{
									this.scrollPageUserScroll(horizontal, this.currentUserScrollPosition);
									this.hasScrolled = true;
								}
							},
							onLayout: () => {
								this.userScrollProgress = 0;
								this.userScrollPage = 0;
								this.resubscribeForUserScroll();
							},
							...showsScrollIndicators,
							horizontal: horizontal,
							style: horizontal ? {
								width: '100%',
								height: heightOrWidth,
							} : {
								width: heightOrWidth,
								minHeight: device.screen.height,
							},
						},
						View(
							{
								style: horizontal ? horizontalStyles : verticalStyles,
								onClick: () => {
									this.toggleUI();
								}
							},
							...scrollList,
						),
					)
				)
		}

		renderRotationIcon()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: '44%',
						left: '44%',
						zIndex: 30,
					},
					ref: ref=> this.rotationIcon = ref,
					onLayout: () => {
						const options = {
							duration: 500,
							option: 'linear',
						};

						const transitionIn = transition(this.rotationIcon, {
							...options,
							rotate: 90,
						});

						const transitionOut = transition(this.rotationIcon, {
							...options,
							rotate: 0,
						});

						const animate = chain(
							transitionIn,
							transitionOut,
							transitionIn,
							transitionOut,
						);
						animate().then(() => {
							this.setState({
								isRotationIconVisible: false,
							});
						});
					},
				},
				Image({
					style: { width: 72, height: 72 },
					svg: { content: Icons.rotationIcon },
				}),
			)
		}

		render()
		{
			switch (this.state.status)
			{
				case 'incoming':
					return this.renderIncoming();
				case 'outgoing':
					return this.renderOutgoing();
				case 'connecting':
					return this.renderOutgoing();
				case 'call':
					return this.renderGrid();
			}
		}

		getBackground()
		{
			const suffix = this.getIsLandscapeOrientation() ? '_landscape' : '';

			return this.state.copilotEnabled
				? `${pathToExtension}img/back_highlighted${suffix}.png`
				: `${pathToExtension}img/back${suffix}.png`;
		}

		setAppActiveState(isActive)
		{
			this.setState({ isAppActive: isActive }, () => {
				this.toggleSubscriptionRemoteVideo();
			});
		}

		renderIncoming()
		{
			// `onLayout: this.redraw()` removed — it caused a feedback loop:
			// onLayout → setState({}) → re-render → onLayout → ... (53+ empty setState calls observed).
			return View(
				{
					style: {
						backgroundImage: this.getBackground(),
						backgroundResizeMode: 'cover',
						alignItems: 'center',
					},
				},
				this.state.localStream
					? this.renderLocalStream(false, this.getBottomMargin())
					: null,
				View(
					{
						style: {
							position: 'absolute',
							width: '100%',
							height: '100%',
							backgroundColor: '#464D55',
							opacity: 0.5,
						},
					},
				),
				this.renderTop({
					text: BX.message('MOBILE_CALL_LAYOUT_INCOMING_CALL'),
					svgContent: Icons.calling,
				}),
				View(
					{
						style: styles.bottomPanelContainer,
					},
					this.renderBottomPanel(),
				),
			);
		}

		renderTop(props)
		{
			const showFullHeader = (this.state.status !== 'call' && Boolean(this.state.localStream))
				|| (this.state.status === 'call' && this.state.isGroupCall)
				|| (this.state.status === 'call' && Boolean(this.state.remoteStream));

			const showCopilot = this.state.copilotAvailable
				&& this.state.status === 'call'
				&& (this.state.isGroupCall || this.state.isNativeSwitchingTypeSupported);

			return this.state.panelVisible && new CallTopPanel({
				isVisible: this.state.panelVisible,
				associatedEntityAvatar: this.state.associatedEntityAvatar,
				associatedEntityName: this.state.associatedEntityName,
				associatedEntityAvatarColor: this.state.associatedEntityAvatarColor,
				statusText: props.text,
				statusIcon: props.svgContent,
				chatCounter: this.state.chatCounter,
				recordState: this.state.recordState,
				showCopilot,
				copilotEnabled: this.state.copilotEnabled,
				showFullHeader,
				onClick: props.onClick,
				onChatClick: () => this.emit(EventName.ChatButtonClick),
				onCopilotClick: () => this.openCopilotDrawer(),
				styles: props.styles || {},
			});
		}

		renderGridTop(props)
		{
			const showCopilot = this.state.copilotAvailable
				&& this.state.status === 'call'
				&& (this.state.isGroupCall || this.state.isNativeSwitchingTypeSupported);

			return this.state.panelVisible && new CallTopPanel({
				isVisible: this.state.panelVisible,
				associatedEntityAvatar: this.state.associatedEntityAvatar,
				associatedEntityName: this.state.associatedEntityName,
				associatedEntityAvatarColor: this.state.associatedEntityAvatarColor,
				statusText: props.text,
				statusIcon: props.svgContent,
				chatCounter: this.state.chatCounter,
				recordState: this.state.recordState,
				isGroupCall: this.state.isGroupCall,
				showCopilot,
				copilotEnabled: this.state.copilotEnabled,
				showFullHeader: true,
				onClick: props.onClick,
				onChatClick: () => this.emit(EventName.ChatButtonClick),
				onCopilotClick: () => this.openCopilotDrawer(),
				styles: props.styles || {},
			});
		}

		renderOutgoing()
		{
			// `onLayout: this.redraw()` removed — see renderIncoming() for rationale (feedback loop).
			return View(
				{
					style: {
						backgroundImage: this.getBackground(),
						backgroundResizeMode: 'cover',
						alignItems: 'center',
					},
				},
				this.state.localStream
					? this.renderLocalStream(false, this.getBottomMargin())
					: View({
						style: {
							position: 'absolute',
							width: '100%',
							height: '100%',
							backgroundResizeMode: 'cover',
							backgroundBlurRadius: 6,
						},
					}),
				this.renderTop({
					text: this.state.status === 'outgoing' ? BX.message('MOBILE_CALL_LAYOUT_WAITING_FOR_ANSWER') : BX.message('MOBILE_CALL_LAYOUT_CONNECTING_TO'),
					svgContent: Icons.calling,
				}),
				View(
					{
						style: styles.bottomPanelContainer,
					},
					this.renderBottomPanel(),
				),
			);
		}

		isReconnecting()
		{
			return this.userRegistry.get(this.centralUserId).state === BX.Call.UserState.Connecting;
		}

		renderGrid()
		{
			const showLocalVideoInFrame = this.state.centralUserId !== this.userId;
			let topParams = null;
			const reconnect = {
				svgContent: Icons.calling,
				text: BX.message('MOBILE_CALL_LAYOUT_RESTORING_CONNECTION'),
			};

			if (this.state.isGroupCall)
			{
				topParams = this.state.isReconnecting ? reconnect : {
					svgContent: Icons.participants,
					onClick: () => this.openParticipantsMenu(),
					text: BX.message('MOBILE_CALL_USER_NUM_FROM_TOTAL')
							.replace('#USER_NUM#', this.getParticipants().length)
							.replace('#TOTAL_COUNT#', this.state.totalUsersCount)
				};
			}
			else
			{
				if (this.userRegistry.get(this.centralUserId).state === BX.Call.UserState.Connecting)
				{
					topParams = { ...reconnect };
				}
				else
				{
					topParams = {
						svgContent: this.state.remoteStream ? Icons.calling : null,
						text: this.userRegistry.get(this.centralUserId).workPosition !== '' ? this.userRegistry.get(this.centralUserId).workPosition : BX.message('MOBILE_CALL_LAYOUT_BITRIX24_CALL'),
					};
				}
			}

			topParams.styles = {
				backgroundColor: '#1A000000',
				backgroundBlurRadius: 10,
				paddingBottom: 10,
			};

			const panelBottomOffset = this.state.panelVisible ? 33 : 55;
			const floorRequestOffset = this.getIsLandscapeOrientation() ? panelBottomOffset : 0;
			const bottomMargin = this.getBottomMargin() + ((this.getIsLandscapeOrientation() && this.state.activeScreenId === null) ? 0 : floorRequestOffset);
			const remoteUser = (this.userRegistry?.users || []).find(
				(userModel) => userModel.id !== Number(this.userId)
					&& (userModel.state === BX.Call.UserState.Connected || userModel.state === BX.Call.UserState.Connecting)
			);
			const remoteUserId = remoteUser ? remoteUser.id : null;
			const areTwoUsers = this.getDisplayedUserCount() === 2;
			const renderRemoteUserAvatar = remoteUserId
				? this.renderCenterAvatar(
					this.userRegistry.get(remoteUserId).avatar,
					this.userRegistry.get(remoteUserId).name,
					this.state.isGroupCall ? CallUtil.userData[remoteUserId].color : this.state.associatedEntityAvatarColor
				)
				: null;

			const shouldShowStream = Boolean(this.state.remoteStream) && !this.isReconnecting();
			const shouldShowAvatar = !Boolean(this.state.remoteStream) || this.isReconnecting();

			return View(
				{
					style: {
						flex: 1,
						backgroundImage: this.getBackground(),
						backgroundResizeMode: 'cover',
					},
					clickable: true,
					onClick: () => {
						if (this.getDisplayedUserCount() === 2)
						{
							this.toggleUI();
						}
					},
					onLayout: ({ width, height }) => {
					},
				},
				this.state.centralUserVideoPaused && this.renderVideoPaused(),

				areTwoUsers && shouldShowStream && this.renderRemoteStreamByPriority(),
				areTwoUsers && shouldShowAvatar && renderRemoteUserAvatar,
				!areTwoUsers && this.renderCenterGrid(),
				areTwoUsers && Boolean(this.state.localStream) && this.renderLocalStream(showLocalVideoInFrame, bottomMargin),
				this.renderOverlay(this.renderGridTop(topParams)),
				this.renderFloorRequests(bottomMargin),
				!this.state.isGroupCall && this.renderDeviceHints(bottomMargin),
				areTwoUsers && this.state.isGroupCall && this.renderCurrentUser(this.userRegistry.get(remoteUserId), bottomMargin),
				// this.renderTestPanel(),
			);
		}

		handleSingleTap(doubleTapHandler)
		{
			const now = Date.now();

			if (this.lastTap && now - this.lastTap < 400)
			{
				if (this.singleTapTimeout)
				{
					clearTimeout(this.setState({ panelVisible: !this.state.panelVisible }));
					this.singleTapTimeout = null;
				}
				doubleTapHandler();
				this.lastTap = null;
			} else {
				this.lastTap = now;
				this.singleTapTimeout = setTimeout(() => {
					this.setState({ panelVisible: !this.state.panelVisible })
					this.singleTapTimeout = null;
				}, 200);
			}
			if (this.state.floorRequestSelf)
			{
				clearTimeout(this.inactivityTimer);
				return;
			}
			this.hideUIAfterInactivity();
		}

		bottomPanelHeight()
		{
			return this.state.panelVisible ? Math.max(getSafeArea().bottom, 10) + 82 : 0;
		}

		renderBottomPanel()
		{
			return View(
				{
					style: {
						display: this.state.panelVisible ? 'flex' : 'none',
						height: this.bottomPanelHeight(),
						paddingTop: 12,
						width: '100%',
						backgroundImageSvg: Gradients.bottom,
						backgroundResizeMode: 'stretch',
						justifyContent: 'flex-start',
						backgroundColor: '#1A000000',
						backgroundBlurRadius: 10,
					},
					clickable: false,
				},
				this.buttonContainer(),
			);
		}

		onButtonClick()
		{
			const { counter } = this.state;
			this.setState({
				counter: counter + 1,
			});
		}

		onResetClick()
		{
			this.setState({
				counter: 0,
			});
		}

		incoming()
		{
			this.setState({ status: CallStatus.incoming });
		}

		buttonContainerIncoming()
		{
			return View(
				{
					style: styles.bottomButtonsContainer,
				},
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_DECLINE_MSGVER_1'),
					Icons.buttonHangup,
					() => this.emit(EventName.DeclineButtonClick),
					'callsIncomingDeclineBtn',
				),
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_MICROPHONE_LOW_MSGVER_1'),
					(this.state.microphoneState ? Icons.buttonMic : Icons.buttonMicOff),
					() => this.emit(EventName.MicButtonClick),
					`callsButtonMic_${this.state.microphoneState ? 'on' : 'off'}`,
				),
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_CAMERA_LOW_MSGVER_1'),
					(this.state.cameraState ? Icons.buttonCamera : Icons.buttonCameraOff),
					() => this.emit(EventName.CameraButtonClick),
					`callsButtonCamera_${this.state.cameraState ? 'on' : 'off'}`,
				),
				this.renderSoundButton(),
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_ANSWER_MSGVER_1'),
					Icons.incomingAnswer,
					() => this.emit(EventName.AnswerButtonClick, [this.state.cameraState]),
					'callsIncomingAnswerBtn',
				),
			);
		}

		buttonContainer()
		{
			if (this.state.status === 'incoming')
			{
				return this.buttonContainerIncoming();
			}

			const buttonCallback = (eventName) => {
				this.emit(eventName);
				if (this.state.floorRequestSelf)
				{
					clearTimeout(this.inactivityTimer);
					return;
				}
				this.state.status === 'call' && this.hideUIAfterInactivity();
			};

			return View(
				{
					style: styles.bottomButtonsContainer,
				},
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_MICROPHONE_LOW_MSGVER_1'),
					(this.state.microphoneState ? Icons.buttonMic : Icons.buttonMicOff),
					() => buttonCallback(EventName.MicButtonClick),
					`callsButtonMic_${this.state.microphoneState ? 'on' : 'off'}`,
				),
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_CAMERA_LOW_MSGVER_1'),
					(this.state.cameraState ? Icons.buttonCamera : Icons.buttonCameraOff),
					() => {
						if (this.state.cameraBlocked)
						{
							return;
						}

						buttonCallback(EventName.CameraButtonClick)
					},
					`callsButtonCamera_${this.state.cameraState ? 'on' : 'off'}`,
					{
						icon: Icons.buttonCameraBlocked,
						value: this.state.cameraBlocked
					}
				),
				this.renderSoundButton(),
				this.isFloorRequestButtonVisible() && this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_RAISE_HAND_LOW_MSGVER_1'),
					this.state.floorRequestSelf ? Icons.buttonFloorRequestActive : Icons.buttonFloorRequestInactive,
					() => buttonCallback(EventName.FloorRequestButtonClick),
					`callsButtonFloorRequest_${this.state.cameraState ? 'on' : 'off'}`,
				),
				this.button(
					BX.message('MOBILE_CALL_LAYOUT_BUTTON_HANGUP_LOW_MSGVER_1'),
					Icons.buttonHangup,
					() => {
						buttonCallback(EventName.HangupButtonClick);
					},
				),
			);
		}

		renderTestPanel()
		{
			return DraggableView(
				{
					style: {
						position: 'absolute',
						top: 20,
						left: 20,
						width: 200,
					}
				},
				View(
					{
						style: {
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							width: '100%',
							backgroundColor: '#7F000000',
						}
					},
					this.button(
						'sendMessage',
						this.state.connectionType === 1 ? Icons.buttonCamera : Icons.buttonCameraOff,
						() => this.setState({ connectionType: this.state.connectionType === 1 ? 2 : 1 }, () => {
							this.emit(EventName.TestSwitchConnectionType)
						}),
						`callsButtonCamera_${this.state.cameraState ? 'on' : 'off'}`,
					),
					this.button(
						'switchCallType',
						this.state.connectionType === 1 ? Icons.buttonCamera : Icons.buttonCameraOff,
						() => this.setState({ connectionType: this.state.connectionType === 1 ? 2 : 1 }, () => {
							this.emit(EventName.SwitchCallType)
						}),
						`callsButtonCamera_${this.state.cameraState ? 'on' : 'off'}`,
					),
				)
			)
		}

		button(text, svgContent, click, testId, block = {})
		{
			const isLandscape = this.getIsLandscapeOrientation();
			const style = {
				...styles.bottomButton,
				...(isLandscape ? styles.bottomButtonWidthLandscape : styles.bottomButtonWidthPortrait),
			};

			return View(
				{
					testId: testId || '',
					onClick: click,
					style,
				},
				View(
					{},
					Image({
						onClick: click,
						style: styles.bottomButtonImage,
						svg: { content: block.value ? block.icon : svgContent },
						resizeMode: 'center',
					}),
				),
				Text({
					style: styles.bottomButtonText,
					text,
				}),
			);
		}

		renderSoundButton()
		{
			return this.button(
				this.getSoundDeviceTextForButton(this.state.soundOutputDevice),
				this.getSoundDeviceSVGForButton(this.state.soundOutputDevice),
				() => {
					if (CallUtil.getSdkAudioManager().showSoundOutputMenu !== false)
					{
						this.showSoundOutputMenu();
					}
				},
				`callsButtonSoundOutput_${this.state.soundOutputDevice}`,
			);
		}

		isFloorRequestButtonVisible()
		{
			return this.state.isGroupCall && this.state.status === 'call';
		}

		getBottomMargin()
		{
			return this.state.panelVisible ? this.bottomPanelHeight() + 10 : getSafeArea().bottom + 11;
		}

		renderFloorRequests(bottomMargin)
		{
			const floorRequests = this.state.floorRequestUsers.map((userModel, index) => {
				return this.renderFloorRequest(userModel, 1 - index * 0.2);
			});
			if (floorRequests.length === 0)
			{
				return null;
			}

			return View(
				{
					style: {
						position: 'absolute',
						right: 10 + getSafeArea().right,
						bottom: bottomMargin,
						zIndex: 12,
					},
					onClick: () => this.openFloorRequestsDrawer(),
				},
				...floorRequests,
			);
		}

		renderFloorRequest(userModel, opacity)
		{
			return View(
				{
					style: {
						height: 24,
						marginTop: 10,
						flexDirection: 'row',
						borderRadius: 6,
						backgroundColor: Color.accentMainWarning.toHex(opacity),
						alignItems: 'center',
					},
				},
				Image({
					style: {
						width: 20,
						height: 20,
						marginLeft: 6,
						// tintColor: Color.baseWhiteFixed.toHex(opacity),
						opacity: opacity,
					},
					svg: { content: Icons.floorRequest },
				}),
				Text({
					style: {
						marginLeft: 2,
						marginRight: 10,
						color: Color.baseWhiteFixed.toHex(opacity),
						fontSize: 13,
						fontWeight: 400,
					},
					text: userModel.name,
				}),
			);
		}

		renderCurrentUser(userModel, bottomMargin)
		{
			return View(
				{
					style: {
						left: 16 + getSafeArea().left,
						bottom: bottomMargin,
						...styles.centralUser,
					},
				},
				!userModel.cameraState && Image({
					style: { width: 20, height: 20 },
					svg: { content: Icons.userCameraOff },
				}),
				!userModel.microphoneState && Image({
					style: { width: 20, height: 20 },
					svg: { content: Icons.userMicOff },
				}),
				Text({
					style: styles.centralUserDescriptionName,
					text: userModel.name,
				}),
			);
		}

		getSoundDeviceName(deviceAlias)
		{
			switch (deviceAlias)
			{
				case 'receiver':
					return BX.message('MOBILE_CALL_SOUND_PHONE');
				case 'speaker':
					return BX.message('MOBILE_CALL_SOUND_SPEAKER');
				case 'bluetooth':
					return BX.message('MOBILE_CALL_SOUND_BLUETOOTH');
				case 'wired':
					return BX.message('MOBILE_CALL_SOUND_WIRED');
				case 'none':
					return BX.message('MOBILE_CALL_SOUND_NONE');
			}
		}

		getSoundDeviceIcon(deviceAlias)
		{
			switch (deviceAlias)
			{
				case 'speaker':
					return 'deviceSpeaker';
				case 'bluetooth':
					return 'deviceBlueTooth';
				case 'wired':
					return 'deviceWired';
				case 'receiver':
					return 'devicePhone';
				default:
					return 'devicePhone';
			}
		}

		getSoundDeviceTextForButton(deviceAlias)
		{
			switch (deviceAlias)
			{
				case 'speaker':
					return BX.message('MOBILE_CALL_SOUND_BUTTON_SPEAKER_MSGVER_1');
				case 'bluetooth':
					return BX.message('MOBILE_CALL_SOUND_BUTTON_BLUETOOTH_MSGVER_1');
				case 'wired':
					return BX.message('MOBILE_CALL_SOUND_BUTTON_WIRED_MSGVER_1');
				case 'receiver':
					return BX.message('MOBILE_CALL_SOUND_BUTTON_PHONE_MSGVER_1');
				default:
					return BX.message('MOBILE_CALL_SOUND_BUTTON_PHONE_MSGVER_1');
			}
		}

		getSoundDeviceSVGForButton(deviceAlias)
		{
			switch (deviceAlias)
			{
				case 'speaker':
					return Icons.buttonLoudSpeaker;
				case 'bluetooth':
					return Icons.buttonBluetooth;
				case 'wired':
					return Icons.buttonHeadphones;
				case 'receiver':
					return Icons.buttonPhoneSpeaker;
				default:
					return Icons.buttonPhoneSpeaker;
			}
		}

		showSoundOutputMenu()
		{
			let soundMenu;
			const menuItems = CallUtil.getSdkAudioManager().availableAudioDevices.map((deviceAlias) => {

				return {
					text: this.getSoundDeviceName(deviceAlias),
					iconClass: this.getSoundDeviceIcon(deviceAlias),
					selected: deviceAlias === CallUtil.getSdkAudioManager().currentDevice,
					onClick: () => {
						if (soundMenu)
						{
							soundMenu.close();
						}
						this.emit(EventName.SelectAudioDevice, [deviceAlias]);
					},
				};
			});
			menuItems.push({
				separator: true,
			});
			menuItems.push({
				text: BX.message('MOBILE_CALL_MENU_CANCEL'),
				color: GRAY_MENU_OPTION,
				onClick: () => {
					if (soundMenu)
					{
						soundMenu.close();
					}
				},
			});

			soundMenu = new CallMenu({
				items: menuItems,
				onClose: () => soundMenu.destroy(),
				onDestroy: () => soundMenu = null,
			});
			soundMenu.show();
		}

		showUserMenu(userId)
		{
			// todo: move userRegistry to controller maybe?
			const userModel = this.userRegistry.get(userId);
			if (!userModel)
			{
				return false;
			}
			let userMenu;
			let pinItem;
			if (this.state.pinnedUserId == userId)
			{
				pinItem = {
					text: BX.message('MOBILE_CALL_MENU_UNPIN'),
					iconClass: 'unpin',
					onClick: () => {
						if (userMenu)
						{
							userMenu.close();
						}
						this.unpinUser();
					},
				};
			}
			else
			{
				pinItem = {
					text: BX.message('MOBILE_CALL_MENU_PIN'),
					iconClass: 'pin',
					onClick: () => {
						if (userMenu)
						{
							userMenu.close();
						}
						this.pinUser(userId);
					},
				};
			}

			const menuItems = [
				{
					userModel,
					color: GRAY_MENU_OPTION,
				},
				{
					separator: true,
				},
				pinItem,
				{
					text: BX.message('MOBILE_CALL_MENU_WRITE_TO_PRIVATE_CHAT'),
					iconClass: 'chat',
					onClick: () => {
						if (userMenu)
						{
							userMenu.close();
						}
						this.emit(EventName.PrivateChatButtonClick, [userId]);
					},
				},
				{
					separator: true,
				},
				{
					text: BX.message('MOBILE_CALL_MENU_CANCEL'),
					color: GRAY_MENU_OPTION,
					onClick: () => {
						if (userMenu)
						{
							userMenu.close();
						}
					},
				},
			];

			userMenu = new CallMenu({
				items: menuItems,
				onClose: () => userMenu.destroy(),
				onDestroy: () => userMenu = null,
			});
			userMenu.show();
		}

		openParticipantsMenu()
		{
			const component = new ParticipantsList({
				avatarPath: Utils.isAvatarBlank(this.state.associatedEntityAvatar) ? '' : this.state.associatedEntityAvatar,
				avatarColor: this.state.associatedEntityAvatarColor,
				title: this.state.associatedEntityName,
				subtitle: BX.message('MOBILE_CALL_MENU_PARTICIPANTS_VIDEOCONFERENCE'),
				userList: this.getParticipants(),
			});

		const bottomSheet = new BottomSheet({ component })
			.setBackgroundColor(Color.bgContentPrimary.toHex())
			.disableOnlyMediumPosition()
			.setTopPosition(100)
		;

		component.on('onUserMenuClick', async (userId) => {
				await bottomSheet.close();
				this.showUserMenu(userId);
			});

			bottomSheet.open();
			this.b = bottomSheet;
		}

		toggleCopilotPopup()
		{
			AhaMoment.show({
				targetRef: this.ahaMomentButtonRef,
				testId: 'copilotAha',
				title: BX.message('MOBILE_CALL_COPILOT_TITLE'),
				description: BX.message('MOBILE_CALL_COPILOT_MESSAGE'),
				buttonText: BX.message('MOBILE_CALL_GOT_IT'),
				image: Image(
					{
						svg: {
							content: '<svg xmlns="http://www.w3.org/2000/svg" width="78" height="96" fill="none"><path fill="#B15EF5" d="M.062 12.26C.062 5.482 5.052.263 11.089.58L41.94 2.16c5.331.271 9.592 5.513 9.592 11.726v33.686c0 6.19-4.26 11.432-9.592 11.703l-30.85 1.491C5.053 61.061.063 55.82.063 49.041v-36.78Z" opacity=".9"/><path fill="#fff" fill-opacity=".18" fill-rule="evenodd" d="m41.939 2.861-30.85-1.559C5.417 1.01.747 5.934.747 12.26v36.736c0 6.349 4.67 11.251 10.343 10.98l30.85-1.468c5.013-.249 9-5.151 9-10.958V13.82c0-5.829-3.987-10.732-9-10.98v.022ZM11.089.58C5.053.263.063 5.505.063 12.26v36.781c0 6.778 4.99 12.02 11.027 11.726l30.85-1.491c5.331-.249 9.592-5.49 9.592-11.703V13.887c0-6.19-4.26-11.455-9.592-11.726L11.089.58Z" clip-rule="evenodd"/><path fill="#fff" fill-opacity=".9" fill-rule="evenodd" d="M27.015 42.919c5.879-.113 10.572-5.58 10.572-12.2 0-6.62-4.693-12.11-10.572-12.246-6.015-.135-10.959 5.332-10.959 12.2 0 6.869 4.967 12.359 10.96 12.246Zm-1.731-21.396c-.091-.293-.479-.316-.57 0l-1.07 3.299c-.32.949-.958 1.672-1.8 2.01l-2.963 1.22c-.273.114-.273.543 0 .656l2.962 1.242c.843.362 1.504 1.085 1.8 2.034l1.071 3.298a.294.294 0 0 0 .57 0l1.07-3.298c.297-.927.958-1.672 1.778-2.011l2.87-1.197c.251-.113.251-.52 0-.633l-2.87-1.22c-.82-.362-1.481-1.107-1.777-2.033l-1.071-3.299v-.068Zm6.129 9.534c-.046-.18-.274-.18-.32 0l-.614 1.898c-.183.543-.547.972-1.026 1.175l-1.663.7c-.16.068-.16.317 0 .362l1.663.7c.479.204.843.61 1.026 1.153l.615 1.875c.045.18.273.158.319 0l.615-1.898c.182-.542.547-.971 1.002-1.175l1.64-.7c.137-.068.137-.294 0-.362l-1.64-.677a1.765 1.765 0 0 1-1.002-1.153l-.615-1.875v-.023Z" clip-rule="evenodd"/><path fill="#fff" fill-opacity=".9" d="M42.121 31.442c1.003.045 1.777 1.039 1.64 2.191-1.207 9.24-8.133 16.56-16.723 16.832-8.59.27-17.954-8.54-17.954-19.792 0-11.251 8.184-20.179 17.954-19.746 5.903.262 8.635 2.282 11.62 5.603.752.813.66 2.17-.114 2.937-.774.746-1.936.61-2.711-.18-2.324-2.395-5.4-3.91-8.795-4-7.61-.203-13.898 6.688-13.898 15.409 0 8.72 6.311 15.634 13.898 15.43 7.587-.203 11.94-5.625 13.055-12.651.183-1.152 1.026-2.079 2.028-2.034Z"/><path fill="#35E961" fill-opacity=".74" d="M43.17 51.368c0-6.303 4.306-11.454 9.546-11.544l16.518-.25c4.83-.067 8.704 4.655 8.704 10.574v19.385c0 5.92-3.85 11.048-8.704 11.5l-16.518 1.514c-5.24.474-9.547-4.225-9.547-10.529v-20.65Z"/><path fill="#fff" fill-opacity=".18" fill-rule="evenodd" d="m69.234 40.253-16.518.27c-4.899.069-8.954 4.926-8.954 10.823v20.627c0 5.897 4.033 10.303 8.954 9.873l16.518-1.49c4.534-.407 8.157-5.242 8.157-10.778V50.171c0-5.535-3.623-9.986-8.157-9.918Zm-16.518-.43c-5.24.068-9.547 5.242-9.547 11.545v20.65c0 6.304 4.307 11.003 9.547 10.529l16.518-1.514c4.83-.452 8.704-5.58 8.704-11.5V50.148c0-5.919-3.85-10.64-8.704-10.573l-16.518.248Z" clip-rule="evenodd"/><path fill="#fff" fill-opacity=".9" d="M62.057 47.934c0-.7-.455-1.242-1.048-1.242-.592 0-1.048.587-1.048 1.288v1.242c0 .7.479 1.243 1.048 1.243.57 0 1.048-.61 1.048-1.31v-1.22ZM67.57 60.112c0 2.056-1.23 3.999-2.277 5.467-.365.52-.388 1.04-.41 1.514-.046 1.04-.069 1.875-3.874 2.124-3.85.27-3.919-.565-3.987-1.627-.023-.474-.068-.994-.433-1.468-1.094-1.379-2.301-3.209-2.301-5.332 0-4.496 3.03-8.247 6.721-8.405 3.691-.158 6.562 3.299 6.562 7.704v.023ZM57.364 72.244c0-.836.57-1.559 1.275-1.626l4.899-.34c.684-.044 1.23.588 1.23 1.424s-.546 1.536-1.23 1.604l-4.899.384c-.706.045-1.276-.587-1.276-1.423v-.023ZM53.764 49.493c.478-.452 1.14-.361 1.504.18l.638.95c.364.542.273 1.355-.183 1.807-.455.452-1.139.384-1.503-.158l-.638-.971c-.365-.543-.274-1.356.182-1.808ZM51.12 55.82c-.569-.159-1.184.27-1.32.97-.16.701.182 1.379.774 1.537l1.025.271c.57.158 1.162-.27 1.322-.971.16-.7-.182-1.379-.752-1.537l-1.025-.27h-.023ZM71.809 55.797c-.137-.656-.707-1.017-1.23-.814l-.958.362c-.546.203-.865.903-.706 1.559.137.655.706 1.016 1.23.813l.957-.361c.547-.204.866-.904.707-1.56ZM66.66 49.29c.341-.565.98-.678 1.435-.271.433.407.524 1.197.183 1.74l-.616.971c-.342.565-.98.678-1.435.271-.456-.407-.524-1.197-.182-1.762l.615-.972v.023Z"/></svg>',
						},
						style: {
							width: '100%',
							height: 78,
						},
						resizeMode: 'contain',
					},
				),
				closeButton: true,
				disableHideByOutsideClick: false,
				fadeInDuration: 100,
			});
		}

		openCopilotDrawer()
		{
			const component = new CopilotDrawer({
				copilotConnected: this.state.copilotEnabled,
				onToggleCopilot: () => {
					bottomSheet?.close();

					this.emit(EventName.ToggleCopilot, [!this.state.copilotEnabled]);
				},
			});

			const bottomSheet = new BottomSheet({ component })
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setMediumPositionHeight(600)
			;
			bottomSheet.open();
		}

		openFloorRequestsDrawer()
		{
			const component = new FloorRequestsList({
				userList: this.getFloorRequestUsers(),
				onRequestFloor: () => this.emit(EventName.FloorRequestButtonClick),
			});

			const bottomSheet = new BottomSheet({ component })
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.disableOnlyMediumPosition()
				.setTopPosition(100)
			;
			bottomSheet.open();
		}

		destroy()
		{
			this.isDestroyed = true;
			if (this.updateUserInfoTimer)
			{
				clearTimeout(this.updateUserInfoTimer);
				this.updateUserInfoTimer = null;
			}
			if (this.displayedUsersTimer)
			{
				clearTimeout(this.displayedUsersTimer);
				this.displayedUsersTimer = null;
			}
			if (this.forceRenderTimer)
			{
				clearTimeout(this.forceRenderTimer);
				this.forceRenderTimer = null;
			}
			this.videoStreams = null;
			this.state = {};

			this.emit(EventName.Destroy);
		}
	}

	BX.prop = {
		get(object, key, defaultValue)
		{
			return object && object.hasOwnProperty(key) ? object[key] : defaultValue;
		},
		getObject(object, key, defaultValue)
		{
			return object && BX.type.isPlainObject(object[key]) ? object[key] : defaultValue;
		},
		getElementNode(object, key, defaultValue)
		{
			return object && BX.type.isElementNode(object[key]) ? object[key] : defaultValue;
		},
		getArray(object, key, defaultValue)
		{
			return object && BX.type.isArray(object[key]) ? object[key] : defaultValue;
		},
		getFunction(object, key, defaultValue)
		{
			return object && BX.type.isFunction(object[key]) ? object[key] : defaultValue;
		},
		getNumber(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			let value = object[key];
			if (BX.type.isNumber(value))
			{
				return value;
			}

			value = parseFloat(value);

			return isNaN(value) ? defaultValue : value;
		},
		getInteger(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			let value = object[key];
			if (BX.type.isNumber(value))
			{
				return value;
			}

			value = parseInt(value, 10);

			return isNaN(value) ? defaultValue : value;
		},
		getBoolean(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			const value = object[key];

			return (BX.type.isBoolean(value)
					? value
					: (BX.type.isString(value) ? (value.toLowerCase() === 'true') : Boolean(value))
			);
		},
		getString(object, key, defaultValue)
		{
			if (!(object && object.hasOwnProperty(key)))
			{
				return defaultValue;
			}

			const value = object[key];

			return BX.type.isString(value) ? value : (value ? value.toString() : '');
		},
		extractDate(datetime)
		{
			if (!BX.type.isDate(datetime))
			{
				datetime = new Date();
			}

			datetime.setHours(0);
			datetime.setMinutes(0);
			datetime.setSeconds(0);
			datetime.setMilliseconds(0);

			return datetime;
		},
	};

	const blankAvatar = '/bitrix/js/im/images/blank.gif';

	function getSafeArea()
	{
		if (device.screen.safeArea)
		{
			return device.screen.safeArea;
		}

		return {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		};
	}

	CallLayout.Event = EventName;

	module.exports = {
		CallLayout,
	};
});
