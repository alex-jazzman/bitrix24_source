import { Text, Loc, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Button } from 'ui.buttons';
import { Center as NotificationCenter } from 'ui.notification';

import { DesktopApi } from 'im.v2.lib.desktop-api';
import { DesktopDownload } from 'intranet.desktop-download';

import { CallHint } from '../call_hint_popup';
import Util from '../util';
import { StartCallErrorCode, DisconnectReason } from '../engine';

const BALLOON_OFFSET_CLASS_NAME = 'bx-call-control-notification-right-offset';

/**
 * Manages in-call notification popups and hint overlays (mute, network, VPN, unsupported, etc.).
 */
export class NotificationService extends EventEmitter
{
	#callControlPanelOpen = false;

	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {HTMLElement} config.container
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, container, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.NotificationService');

		this.viewPort = viewPort;
		this.container = container;
		this.callStore = callStore ?? null;

		this.mutePopup = null;
		this.riseYouHandToTalkPopup = null;
		this.allowMutePopup = true;

		this.reconnectionBalloon = null;
		this.remoteVideoMutedBalloon = null;
		this.mediaDevicesResetStateHintBalloon = null;

		// Tracks in-flight / on-screen "user declined|busy|failed" balloons per userId
		// so a follow-up state change (e.g. Declined → Calling after a re-invite)
		// can dismiss the stale balloon instead of letting it linger 4–5s.
		this.userCallStateBalloons = new Map();
	}

	setCallControlPanelOpen(isOpen)
	{
		this.#callControlPanelOpen = isOpen;
		this.#adjustNotificationOffsets(isOpen);
	}

	/**
	 * Shows a generic notification with optional action buttons.
	 *
	 * @param {string} notificationText
	 * @param {Array} actions
	 */
	showNotification(notificationText, actions = [])
	{
		NotificationCenter.notify({
			content: Text.encode(notificationText),
			position: 'top-right',
			autoHideDelay: 5000,
			closeButton: true,
			actions,
		});
	}

	/**
	 * Shows the microphone-muted hint popup near the given element.
	 *
	 * @param {HTMLElement|null} bindElement - resolved by the controller; null when call is folded
	 */
	showMicMutedNotification(bindElement)
	{
		if (this.riseYouHandToTalkPopup || !Util.havePermissionToBroadcast('mic'))
		{
			return;
		}

		if (this.mutePopup)
		{
			this.mutePopup.close();
			this.mutePopup = null;
		}

		this.mutePopup = new CallHint({
			callFolded: !bindElement,
			bindElement,
			targetContainer: this.container,
			icon: 'mic-off',
			buttons: [this.#createUnmuteButton()],
			onClose: () => {
				this.allowMutePopup = false;
				this.mutePopup.destroy();
				this.mutePopup = null;
			},
		});
		this.mutePopup.show();
	}

	/**
	 * Shows the "raise your hand to talk" hint popup.
	 *
	 * @param {object} params
	 * @param {HTMLElement|null} params.bindElement - resolved by the controller
	 * @param {string} params.initiatorName
	 */
	showRiseYouHandToTalkNotification(params)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (this.riseYouHandToTalkPopup)
		{
			return;
		}

		if (this.mutePopup)
		{
			this.mutePopup.close();
			this.mutePopup = null;
		}

		this.riseYouHandToTalkPopup = new CallHint({
			callFolded: !params.bindElement,
			bindElement: params.bindElement,
			targetContainer: this.container,
			icon: 'mic',
			showAngle: false,
			initiatorName: params.initiatorName,
			customClassName: 'bx-call-view-popup-call-hint-rise-hand-to-talk',
			autoCloseDelay: 30 * 60 * 1000,
			customRender() {
				const handRaiseContentElement = BX.Dom.create('div', {
					props: { className: 'bx-call-view-popup-call-hint-rise-block' },
					children: [
						Loc.getMessage('CALL_ADMIN_PROHIBITED_TURN_ON_PARTICIPANTS_MICROPHONES_HINT', {
							'#INITIATOR_NAME#': this.initiatorName,
							'[hint-label]': '<div class="bx-call-view-popup-call-hint-text">',
							'[/hint-label]': '</div>',
							'#RISE_HAND_ICON#':
								'<div class="ui-btn bx-call-view-popup-call-hint-hand-raise-icon"></div>',
							'[label-or]': '<div class="bx-call-view-popup-call-hint-hand-raise-or-label">',
							'[/label-or]': '</div>',
							'#REQUEST_NOW_BUTTON#':
								'<div class = "bx-call-view-popup-call-hint-button-placeholder"></div>',
						}),
					],
				});

				const buttonPlaceholder = handRaiseContentElement.getElementsByClassName(
					'bx-call-view-popup-call-hint-button-placeholder',
				)[0];
				buttonPlaceholder.replaceWith(this.createAskSpeakButton().render());

				return handRaiseContentElement;
			},
			buttons: [],
			onClose: () => {
				this.riseYouHandToTalkPopup = null;
			},
			onAskSpeakButtonClicked: () => {
				this.emit('NotificationService::onAskSpeakButtonClicked');

				if (this.riseYouHandToTalkPopup)
				{
					this.riseYouHandToTalkPopup.close();
					this.riseYouHandToTalkPopup = null;
				}
			},
		});
		this.riseYouHandToTalkPopup.show();
	}

	/**
	 * Shows the auto-mute hint popup near the given element.
	 *
	 * @param {HTMLElement|null} bindElement - resolved by the controller; null when call is folded
	 */
	showAutoMicMuteNotification(bindElement)
	{
		if (this.mutePopup || this.riseYouHandToTalkPopup || !Util.havePermissionToBroadcast('mic'))
		{
			return;
		}

		this.mutePopup = new CallHint({
			callFolded: !bindElement,
			bindElement,
			targetContainer: this.container,
			title: Text.encode(BX.message('IM_CALL_MIC_AUTO_MUTED')),
			icon: 'mic-off',
			buttons: [this.#createUnmuteButton()],
			onClose: () => {
				this.mutePopup.destroy();
				this.mutePopup = null;
			},
		});
		this.mutePopup.show();
	}

	/**
	 * Shows the VPN-is-active notification.
	 */
	showVpnIsActiveNotification()
	{
		if (this.viewPort)
		{
			NotificationCenter.notify({
				content: Text.encode(Loc.getMessage('CALL_MESSAGE_VPN_IS_ACTIVE')),
				position: 'top-right',
				autoHideDelay: 10000,
				closeButton: true,
				category: 'vpnIsActive',
			});
		}
	}

	/**
	 * Shows a network problem notification with the given text.
	 *
	 * @param {string} notificationText
	 */
	showNetworkProblemNotification(notificationText)
	{
		NotificationCenter.notify({
			content: Text.encode(notificationText),
			position: 'top-right',
			autoHideDelay: 5000,
			closeButton: true,
			actions: [
				{
					title: BX.message('IM_M_CALL_HELP'),
					events: {
						click: (event, balloon) => {
							top.BX.Helper.show('redirect=detail&code=12723718');
							balloon.close();
						},
					},
				},
			],
		});
	}

	/**
	 * Shows the unsupported-browser/feature dialog.
	 */
	showUnsupportedNotification()
	{
		let messageBox;

		if (DesktopApi.isDesktop())
		{
			messageBox = new MessageBox({
				message: BX.message('IM_CALL_DESKTOP_TOO_OLD'),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: BX.message('IM_M_CALL_BTN_UPDATE'),
				cancelCaption: BX.message('IM_NOTIFY_CONFIRM_CLOSE'),
				onOk: () => {
					const url = DesktopDownload.getLinkForCurrentUser();
					window.open(url, 'desktopApp');

					return true;
				},
			});
		}
		else
		{
			messageBox = new MessageBox({
				message: BX.message('IM_CALL_WEBRTC_USE_CHROME_OR_DESKTOP'),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: BX.message('IM_CALL_DETAILS'),
				cancelCaption: BX.message('IM_NOTIFY_CONFIRM_CLOSE'),
				onOk: () => {
					top.BX.Helper.show('redirect=detail&code=11387752');

					return true;
				},
			});
		}

		messageBox.show();
	}

	/**
	 * Closes the active mute popup if open.
	 */
	closeMutePopup()
	{
		if (this.mutePopup)
		{
			this.mutePopup.close();
			this.mutePopup = null;
		}
	}

	/**
	 * Closes the "raise your hand to talk" popup if open.
	 */
	closeRiseYouHandToTalkPopup()
	{
		if (this.riseYouHandToTalkPopup)
		{
			this.riseYouHandToTalkPopup.close();
			this.riseYouHandToTalkPopup = null;
		}
	}

	/**
	 * Handles the call window folded event by hiding relevant notifications.
	 */
	onFolded()
	{
		this.closeMutePopup();

		if (this.riseYouHandToTalkPopup)
		{
			this.riseYouHandToTalkPopup.close();
			this.riseYouHandToTalkPopup = null;
		}
	}

	/**
	 * Returns user model from viewPort.userRegistry with fallback to callStore.
	 *
	 * @param {string|number} userId
	 * @returns {object|null}
	 */
	#getUserModel(userId)
	{
		const registryModel = this.viewPort.userRegistry?.get(userId) ?? null;
		if (registryModel)
		{
			return registryModel;
		}

		const storeUser = this.callStore?.users?.[userId] ?? null;
		if (storeUser)
		{
			return {
				name: storeUser.name || '',
				avatar: storeUser.avatar || '',
				data: {
					name: storeUser.name || '',
					gender: storeUser.gender || 'M',
				},
			};
		}

		return null;
	}

	/**
	 * Shows a styled moderation notification balloon in the top-right corner.
	 *
	 * @param {object} params
	 * @param {string} params.content - HTML content for the balloon body
	 * @param {boolean} [params.isAllow] - true for allow (green), false for disallow (red), undefined for neutral
	 * @param {string} [params.category]
	 */
	createCallControlNotify(params)
	{
		if (!this.viewPort)
		{
			return;
		}

		let balloonClassName = 'ui-notification-balloon-content bx-call-control-notification ';

		if (params.isAllow === false)
		{
			balloonClassName += 'bx-call-control-notification-disallow ';
		}
		else if (params.isAllow === true)
		{
			balloonClassName += 'bx-call-control-notification-allow ';
		}

		NotificationCenter.notify({
			content: params.content,
			position: 'top-right',
			autoHideDelay: 8000,
			category: params.category || '',
			closeButton: true,
			render() {
				const actions = this.getActions().map((action) => action.getContainer());

				return BX.create('div', {
					props: {
						className: balloonClassName,
					},
					children: [
						BX.create('div', {
							props: {
								className: 'ui-notification-balloon-message',
							},
							html: this.getContent(),
						}),
						BX.create('div', {
							props: {
								className: 'ui-notification-balloon-actions',
							},
							children: actions,
						}),
						this.isCloseButtonVisible() ? this.getCloseButton() : null,
					],
				});
			},
		});

		if (this.#callControlPanelOpen)
		{
			this.#adjustNotificationOffsets(true);
		}
	}

	/**
	 * Adds or removes the balloon offset class on all visible notification balloons.
	 * Called when the participants permission popup opens or closes.
	 *
	 * @param {boolean} add - true to add offset, false to remove
	 */
	#adjustNotificationOffsets(add)
	{
		const balloons = NotificationCenter.balloons;

		Object.values(balloons).forEach((balloon) => {
			if (add)
			{
				Dom.addClass(balloon.container, BALLOON_OFFSET_CLASS_NAME);
			}
			else
			{
				Dom.removeClass(balloon.container, BALLOON_OFFSET_CLASS_NAME);
			}
		});
	}

	/**
	 * Shows a moderation notification when a participant's stream is muted by a moderator.
	 * The notification content depends on who is muted, who is the initiator, and what stream type.
	 *
	 * @param {object} data - event.data from the participant-muted engine event
	 * @param {number} currentUserId - the local user's ID (from CallEngine.getCurrentUserId())
	 */
	showParticipantMutedNotification(data, currentUserId)
	{
		if (!data?.track?.muted)
		{
			return;
		}

		let contentIcon = 'mic';
		let contentPhrase = '';
		const initiatorUserModel = this.#getUserModel(data.fromUserId);
		const targetUserModel = this.#getUserModel(data.toUserId);
		const initiatorGender = initiatorUserModel?.data?.gender ? initiatorUserModel.data.gender.toUpperCase() : 'M';

		if (data.toUserId == currentUserId)
		{
			switch (data.track.type)
			{
				case 0: {
					contentPhrase = `CALL_CONTROL_MODERATOR_TURNED_OFF_YOUR_MIC_MSGVER_1_${initiatorGender}`;

					break;
				}

				case 1: {
					contentIcon = 'cam';
					contentPhrase = `CALL_CONTROL_MODERATOR_TURNED_OFF_YOUR_CAM_MSGVER_1_${initiatorGender}`;

					break;
				}

				case 2: {
					contentIcon = 'screenshare';
					contentPhrase = `CALL_CONTROL_MODERATOR_TURNED_OFF_YOUR_SCREENSHARE_${initiatorGender}`;

					break;
				}
			// No default
			}
		}
		else if (data.fromUserId == currentUserId)
		{
			switch (data.track.type)
			{
				case 0: {
					contentPhrase = 'CALL_CONTROL_YOU_TURNED_OFF_USER_MIC';

					break;
				}

				case 1: {
					contentIcon = 'cam';
					contentPhrase = 'CALL_CONTROL_YOU_TURNED_OFF_USER_CAM';

					break;
				}

				case 2: {
					contentIcon = 'screenshare';
					contentPhrase = 'CALL_CONTROL_YOU_TURNED_OFF_USER_SCREENSHARE';

					break;
				}
			// No default
			}
		}
		else
		{
			switch (data.track.type)
			{
				case 0: {
					contentPhrase = `CALL_CONTROL_MODERATOR_TURNED_OFF_USER_MIC_MSGVER_1_${initiatorGender}`;

					break;
				}

				case 1: {
					contentIcon = 'cam';
					contentPhrase = `CALL_CONTROL_MODERATOR_TURNED_OFF_USER_CAM_MSGVER_1_${initiatorGender}`;

					break;
				}

				case 2: {
					contentIcon = 'screenshare';
					contentPhrase = `CALL_CONTROL_MODERATOR_TURNED_OFF_USER_SCREENSHARE_${initiatorGender}`;

					break;
				}
			// No default
			}
		}

		const content =			`<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			 contentIcon
			 }-muted"></div>${
			 Text.encode(
				Util.getCustomMessage(contentPhrase, {
					gender: initiatorGender,
					initiator_name: initiatorUserModel?.data?.name || '',
					target_name: targetUserModel?.data?.name || '',
				}),
			)}`;

		this.createCallControlNotify({ content, isAllow: false });
	}

	/**
	 * Shows a moderation notification when all participants' streams of the given type are muted.
	 *
	 * @param {object} event - the engine event (e.userId, e.reason)
	 * @param {'audio'|'video'|'screenshare'} type
	 */
	showAllParticipantsMutedNotification(event, type)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (event.reason && event.reason === 'settings')
		{
			return;
		}

		const userModel = this.#getUserModel(event.userId);
		const gender = userModel?.data?.gender ? userModel.data.gender.toUpperCase() : 'M';

		const iconClass = type === 'audio' ? 'mic' : 'cam';
		const phraseMap = {
			audio: 'CALL_USER_TURNED_OFF_MIC_FOR_ALL_MSGVER_1',
			video: 'CALL_USER_TURNED_OFF_CAM_FOR_ALL_MSGVER_1',
			screenshare: 'CALL_USER_TURNED_OFF_SCREENSHARE_FOR_ALL_MSGVER_1',
		};

		const content =			`<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			 iconClass
			 }-muted"></div>${
			 Text.encode(
				Util.getCustomMessage(phraseMap[type], {
					gender,
					name: userModel?.data?.name || '',
				}),
			)}`;

		this.createCallControlNotify({ content, isAllow: false });
	}

	/**
	 * Shows a notification when the local user mutes all participants.
	 *
	 * @param {object} event - the engine event (e.data.track.type)
	 */
	showYouMuteAllNotification(event)
	{
		const typesOfMute = { 0: 'mic', 1: 'cam', 2: 'screenshare' };
		const typesOfMuteMessage = {
			0: 'CALL_YOU_TURNED_OFF_MIC_FOR_ALL_MSGVER_1',
			1: 'CALL_YOU_TURNED_OFF_CAM_FOR_ALL_MSGVER_1',
			2: 'CALL_YOU_TURNED_OFF_SCREENSHARE_FOR_ALL_MSGVER_1',
		};

		const content =	`<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			typesOfMute[event.data.track.type]
			}-muted"></div>${
			Text.encode(BX.message[typesOfMuteMessage[event.data.track.type]] || '')}`;

		this.createCallControlNotify({ content, isAllow: false });
	}

	/**
	 * Shows a notification when user's speak permission changes (allow/deny floor request response).
	 *
	 * @param {object} data - event.data (fromUserId, allow, toUserId)
	 * @param {number} currentUserId
	 */
	showPermissionsChangedNotification(data, currentUserId)
	{
		if (!this.viewPort)
		{
			return;
		}

		const initiatorUserModel = this.#getUserModel(data.fromUserId);
		const initiatorGender = initiatorUserModel?.data?.gender ? initiatorUserModel.data.gender.toUpperCase() : 'M';

		let contentPhrase = `CALL_ADMIN_ALLOWED_TURN_ON_ALL_FOR_YOU_BY_HANDRAISE_${initiatorGender}`;

		if (!data.allow)
		{
			contentPhrase = `CALL_ADMIN_NOT_ALLOWED_TURN_ON_ALL_FOR_YOU_BY_HANDRAISE_${initiatorGender}`;
		}

		const content = Text.encode(
			Util.getCustomMessage(contentPhrase, {
				gender: initiatorGender,
				initiator_name: initiatorUserModel?.data?.name || '',
			}),
		);

		if (content)
		{
			this.createCallControlNotify({ content, isAllow: data.allow });
		}

		if (this.callStore)
		{
			this.callStore.addNotification('permissionToSpeak', { userId: data.toUserId, allow: data.allow });
		}
	}

	/**
	 * Returns notification content when the local user's role changes (promoted/demoted).
	 * The caller is responsible for showing the notification (may need setTimeout for admin promotion).
	 *
	 * @param {object} data - event.data (toUserId, role)
	 * @param {number} currentUserId
	 * @returns {string|null} notification content HTML, or null if no notification needed
	 */
	getRoleChangedNotificationContent(data, currentUserId)
	{
		if (data.toUserId != currentUserId)
		{
			return null;
		}

		const newRole = data.role.toUpperCase();

		if (newRole === Util.UsersRoles.ADMIN || newRole === Util.UsersRoles.MANAGER)
		{
			return BX.message('CALL_YOU_HAVE_BEEN_APPOINTED_AS_ADMIN');
		}

		if (newRole === Util.UsersRoles.USER)
		{
			return BX.message('CALL_YOU_HAVE_BEEN_APPOINTED_AS_USER');
		}

		return null;
	}

	/**
	 * Shows a notification when room settings (mute/unmute all by admin) change.
	 *
	 * @param {object} data - event.data (eft, act, fromUserId)
	 * @param {number} currentUserId
	 */
	showRoomSettingsChangedNotification(data, currentUserId)
	{
		if (!this.viewPort)
		{
			return;
		}

		const typesOfMute = { audio: 'mic', video: 'cam', screen_share: 'screenshare' };
		let content = '';
		let isAllow = false;

		const initiatorUserModel = this.#getUserModel(data.fromUserId);
		const initiatorGender = initiatorUserModel?.data?.gender ? initiatorUserModel.data.gender.toUpperCase() : 'M';

		if (data.eft === true)
		{
			if (data.fromUserId == currentUserId)
			{
				const typesOfMuteMessage = {
					audio: 'CALL_YOU_PROHIBITED_MIC_FOR_ALL_BY_SETTINGS',
					video: 'CALL_YOU_PROHIBITED_CAM_FOR_ALL_BY_SETTINGS',
					screen_share: 'CALL_YOU_PROHIBITED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
				};

				content = `<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
					typesOfMute[data.act]
					}-muted"></div>${
					Text.encode(BX.message[typesOfMuteMessage[data.act]] || '')}`;
			}
			else
			{
				const typesOfMuteMessage = {
					audio: 'CALL_ADMIN_PROHIBITED_MIC_FOR_ALL_BY_SETTINGS',
					video: 'CALL_ADMIN_PROHIBITED_CAM_FOR_ALL_BY_SETTINGS',
					screen_share: 'CALL_ADMIN_PROHIBITED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
				};

				const contentPhrase = `${typesOfMuteMessage[data.act]}_${initiatorGender}`;

				content =					`<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
					 typesOfMute[data.act]
					 }-muted"></div>${
					 Text.encode(
						Util.getCustomMessage(contentPhrase, {
							gender: initiatorGender,
							initiator_name: initiatorUserModel?.data?.name || '',
						}),
					)}`;
			}
		}
		else
		{
			isAllow = true;

			if (data.fromUserId == currentUserId)
			{
				this.closeRiseYouHandToTalkPopup();

				const typesOfMuteMessage = {
					audio: 'CALL_YOU_ALLOWED_MIC_FOR_ALL_BY_SETTINGS',
					video: 'CALL_YOU_ALLOWED_CAM_FOR_ALL_BY_SETTINGS',
					screen_share: 'CALL_YOU_ALLOWED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
				};

				content = `<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
					typesOfMute[data.act]
					}-unmuted"></div>${
					Text.encode(BX.message[typesOfMuteMessage[data.act]] || '')}`;
			}
			else
			{
				const typesOfMuteMessage = {
					audio: 'CALL_ADMIN_ALLOWED_MIC_FOR_ALL_BY_SETTINGS',
					video: 'CALL_ADMIN_ALLOWED_CAM_FOR_ALL_BY_SETTINGS',
					screen_share: 'CALL_ADMIN_ALLOWED_SCREENSHARE_FOR_ALL_BY_SETTINGS',
				};

				const contentPhrase = `${typesOfMuteMessage[data.act]}_${initiatorGender}`;

				content =					`<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
					 typesOfMute[data.act]
					 }-unmuted"></div>${
					 Text.encode(
						Util.getCustomMessage(contentPhrase, {
							gender: initiatorGender,
							initiator_name: initiatorUserModel?.data?.name || '',
						}),
					)}`;

				if (data.act === 'audio')
				{
					this.closeRiseYouHandToTalkPopup();
				}
			}
		}

		if (content)
		{
			this.createCallControlNotify({ content, isAllow });
		}

		return { isAllow, initiatorName: initiatorUserModel?.data?.name || '' };
	}

	/**
	 * Shows a popup notifying that the local user has just joined a call room.
	 *
	 * @param {object} config
	 * @param {boolean} config.isAuto - whether the user was auto-joined
	 * @param {boolean} config.isSpeaker - whether the user joined as speaker
	 * @param {number[]} config.userIdList - list of user IDs in the room
	 * @param {number} config.localUserId - local user ID (to exclude from name list)
	 * @param {boolean} config.isFolded - whether the call window is currently folded
	 * @param {HTMLElement} config.bindElement - element to anchor the popup to
	 * @param {HTMLElement} config.externalContainer - external container when folded
	 * @param {Function} config.onLeaveRoom - callback to leave the room
	 */
	showRoomJoinedPopup(config)
	{
		if (this.roomJoinedPopup || !this.viewPort)
		{
			return;
		}

		const { isAuto, isSpeaker, userIdList, localUserId, isFolded, bindElement, externalContainer, onLeaveRoom } =			config;

		let title;

		if (isAuto)
		{
			const userNames = userIdList
				.filter((userId) => userId != localUserId)
				.map((userId) => {
					const userModel = this.#getUserModel(userId);

					return userModel?.name || '';
				});

			const usersInRoom = userNames.join(', ');

			if (isSpeaker)
			{
				title = BX.Text.encode(
					BX.message('IM_CALL_ROOM_JOINED_AUTO_SPEAKER').replace('#PARTICIPANTS_LIST#', usersInRoom),
				);
			}
			else
			{
				title = BX.Text.encode(
					BX.message('IM_CALL_ROOM_JOINED_AUTO').replace('#PARTICIPANTS_LIST#', usersInRoom),
				);
				title += `<p>${BX.Text.encode(BX.message('IM_CALL_ROOM_JOINED_P2'))}</p>`;
			}
		}
		else
		{
			title = `${BX.message('IM_CALL_ROOM_JOINED_MANUALLY')}<p>${BX.message('IM_CALL_ROOM_JOINED_P2')}</p>`;
		}

		this.roomJoinedPopup = new CallHint({
			callFolded: isFolded,
			bindElement,
			targetContainer: isFolded ? externalContainer : this.container,
			title,
			buttonsLayout: 'bottom',
			autoCloseDelay: 0,
			buttons: [
				new Button({
					baseClass: 'ui-btn',
					text: BX.message('IM_CALL_ROOM_JOINED_UNDERSTOOD'),
					size: Button.Size.EXTRA_SMALL,
					color: Button.Color.LIGHT_BORDER,
					noCaps: true,
					round: true,
					events: {
						click: () => {
							this.roomJoinedPopup.destroy();
							this.roomJoinedPopup = null;
						},
					},
				}),
				new Button({
					text: BX.message('IM_CALL_ROOM_WRONG_ROOM'),
					size: Button.Size.EXTRA_SMALL,
					color: Button.Color.LINK,
					noCaps: true,
					round: true,
					events: {
						click: () => {
							this.roomJoinedPopup.destroy();
							this.roomJoinedPopup = null;
							onLeaveRoom();
						},
					},
				}),
			],
			onClose: () => {
				this.roomJoinedPopup.destroy();
				this.roomJoinedPopup = null;
			},
		});
		this.roomJoinedPopup.show();
	}

	/**
	 * Shows a popup notifying that the mic was taken from another user.
	 *
	 * @param {object} config
	 * @param {number} config.fromUserId - user whose mic was taken
	 * @param {boolean} config.isFolded
	 * @param {HTMLElement} config.bindElement
	 * @param {HTMLElement} config.externalContainer
	 */
	showMicTakenFromPopup(config)
	{
		if (this.micTakenFromPopup || !this.viewPort)
		{
			return;
		}

		const { fromUserId, isFolded, bindElement, externalContainer } = config;
		const userModel = this.#getUserModel(fromUserId);
		const title = BX.message('IM_CALL_ROOM_MIC_TAKEN_FROM').replace('#USER_NAME#', userModel?.name || '');

		this.micTakenFromPopup = new CallHint({
			callFolded: isFolded,
			bindElement,
			targetContainer: isFolded ? externalContainer : this.container,
			title: BX.Text.encode(title),
			buttonsLayout: 'right',
			autoCloseDelay: 5000,
			buttons: [],
			onClose: () => {
				this.micTakenFromPopup.destroy();
				this.micTakenFromPopup = null;
			},
		});
		this.micTakenFromPopup.show();
	}

	/**
	 * Shows a popup notifying that the mic was taken by another user.
	 *
	 * @param {object} config
	 * @param {number} config.byUserId - user who took the mic
	 * @param {boolean} config.isFolded
	 * @param {HTMLElement} config.bindElement
	 * @param {HTMLElement} config.externalContainer
	 */
	showMicTakenByPopup(config)
	{
		if (this.micTakenByPopup || !this.viewPort)
		{
			return;
		}

		const { byUserId, isFolded, bindElement, externalContainer } = config;
		const userModel = this.#getUserModel(byUserId);

		this.micTakenByPopup = new CallHint({
			callFolded: isFolded,
			bindElement,
			targetContainer: isFolded ? externalContainer : this.container,
			title: BX.Text.encode(BX.message('IM_CALL_ROOM_MIC_TAKEN_BY').replace('#USER_NAME#', userModel?.name || '')),
			buttonsLayout: 'right',
			autoCloseDelay: 5000,
			buttons: [],
			onClose: () => {
				this.micTakenByPopup.destroy();
				this.micTakenByPopup = null;
			},
		});
		this.micTakenByPopup.show();
	}

	/**
	 * Handles call failure by showing appropriate UI.
	 *
	 * @param {object} params
	 */
	handleCallFailure({ errorCode, isHttps, viewPort })
	{
		const { errorMessage, isUnknownError } = this.getCallFailureMessage(errorCode, isHttps);

		if (viewPort)
		{
			if (isUnknownError)
			{
				viewPort.showSelfTest();
			}
			else if (errorCode === DisconnectReason.SecurityKeyChanged)
			{
				viewPort.showSecurityKeyError();
			}
			else
			{
				viewPort.showFatalError({ text: errorMessage });
			}
		}
		else
		{
			this.showNotification(errorMessage);
		}
	}

	/**
	 * Creates the unmute button shown inside the mute hint popup.
	 *
	 * @returns {BX.UI.Button}
	 */
	#createUnmuteButton()
	{
		return new BX.UI.Button({
			baseClass: 'ui-btn bx-call-view-popup-call-hint-unmute',
			text: BX.message('IM_CALL_UNMUTE_MIC'),
			size: BX.UI.Button.Size.EXTRA_SMALL,
			color: BX.UI.Button.Color.LIGHT_BORDER,
			noCaps: true,
			round: true,
			events: {
				click: () => {
					this.emit('NotificationService::onUnmuteMicButtonClicked');

					if (this.mutePopup)
					{
						this.mutePopup.destroy();
						this.mutePopup = null;
					}
				},
			},
		});
	}

	/**
	 * Maps a call failure error code to a user-facing error message.
	 *
	 * @param {string|number} errorCode
	 * @param {boolean} isHttps
	 * @returns {{ errorMessage: string, isUnknownError: boolean }}
	 */
	getCallFailureMessage(errorCode, isHttps = true)
	{
		let errorMessage = '';
		let isUnknownError = false;

		switch (errorCode)
		{
			case StartCallErrorCode.ErrorUnexpectedAnswer:
				errorMessage = Loc.getMessage('IM_CALL_ERROR_UNEXPECTED_ANSWER');
				break;

			case StartCallErrorCode.BlankAnswerWithErrorCode:
			case StartCallErrorCode.BlankAnswer:
				errorMessage = Loc.getMessage('IM_CALL_ERROR_BLANK_ANSWER');
				break;

			case StartCallErrorCode.AccessDenied:
				errorMessage = Loc.getMessage('IM_CALL_ERROR_ACCESS_DENIED');
				break;

			case StartCallErrorCode.NoWebrtc:
				errorMessage = Loc.getMessage(isHttps ? 'IM_CALL_NO_WEBRT' : 'IM_CALL_ERROR_HTTPS_REQUIRED');
				break;

			case StartCallErrorCode.UnknownError:
				isUnknownError = true;
				errorMessage = Loc.getMessage('IM_CALL_ERROR_UNKNOWN');
				break;

			case StartCallErrorCode.NetworkError:
				errorMessage = Loc.getMessage('IM_CALL_ERROR_NETWORK');
				break;

			case StartCallErrorCode.NotAllowedError:
				errorMessage = Loc.getMessage('IM_CALL_ERROR_HARDWARE_ACCESS_DENIED');
				break;

			case StartCallErrorCode.NotReadableError:
				errorMessage = Loc.getMessage('IM_CALL_ERROR_HARDWARE');
				break;

			default:
				if (errorCode === StartCallErrorCode.AuthorizeError)
				{
					errorMessage = Loc.getMessage('IM_CALL_ERROR_AUTHORIZATION');
				}
				else if (errorCode === DisconnectReason.SecurityKeyChanged)
				{
					errorMessage = Loc.getMessage('IM_CALL_ERROR_AUTHORIZATION');
				}
				else if (errorCode == 403)
				{
					errorMessage = Loc.getMessage('IM_CALL_ERROR_HARDWARE_ACCESS_DENIED');
				}
				else
				{
					isUnknownError = true;
					errorMessage = Loc.getMessage('IM_CALL_ERROR_UNKNOWN_WITH_CODE', { '#ERROR_CODE#': errorCode });
				}
		}

		return { errorMessage, isUnknownError };
	}

	/**
	 * Shows the reconnecting notification balloon if not already shown.
	 * Stores the reference internally for later dismissal.
	 */
	showReconnectingBalloon()
	{
		if (this.reconnectionBalloon)
		{
			return;
		}

		this.reconnectionBalloon = NotificationCenter.notify({
			content: Text.encode(BX.message('IM_CALL_RECONNECTING')),
			autoHide: false,
			position: 'top-right',
			closeButton: false,
		});
	}

	/**
	 * Shows a speaker mute/unmute hotkey notification.
	 *
	 * @param {boolean} isMuted - whether the speaker is now muted
	 */
	showSpeakerToggleNotification(isMuted)
	{
		NotificationCenter.notify({
			content: BX.message(isMuted ? 'IM_M_CALL_MUTE_SPEAKERS_OFF' : 'IM_M_CALL_MUTE_SPEAKERS_ON'),
			position: 'top-right',
			autoHideDelay: 3000,
			closeButton: true,
		});
	}

	/**
	 * Handles the room speaker transfer event by showing popups.
	 *
	 * @param {object} params
	 * @returns {string} initiator name
	 */
	handleTransferRoomSpeaker({ event, userId, isFolded, bindElement, externalContainer })
	{
		const isSpeaker = event.speaker == userId;
		const initiatorUserModel = this.#getUserModel(event.initiator);

		if (isSpeaker)
		{
			if (event.initiator == userId)
			{
				this.showMicTakenFromPopup({
					fromUserId: event.previousSpeaker,
					isFolded,
					bindElement,
					externalContainer,
				});
			}
		}
		else
		{
			this.showMicTakenByPopup({
				byUserId: event.speaker,
				isFolded,
				bindElement,
				externalContainer,
			});
		}

		return initiatorUserModel?.name || '';
	}

	/**
	 * Shows or hides the "participants' video is muted" balloon.
	 * Displays the balloon when video is hidden, dismisses it when video becomes visible.
	 *
	 * @param {boolean} isVideoShown
	 */
	handleRemoteParticipantVideoToggle(isVideoShown)
	{
		if (this.remoteVideoMutedBalloon)
		{
			if (isVideoShown)
			{
				this.remoteVideoMutedBalloon.close();
				this.remoteVideoMutedBalloon = null;
			}

			return;
		}

		if (!isVideoShown)
		{
			this.remoteVideoMutedBalloon = NotificationCenter.notify({
				content: Text.encode(BX.message('IM_M_CALL_REMOTE_PARTICIPANTS_VIDEO_MUTED')),
				autoHide: false,
				position: 'top-right',
				closeButton: false,
			});
		}
	}

	/**
	 * Closes the reconnecting notification balloon if it is open.
	 */
	closeReconnectingBalloon()
	{
		if (this.reconnectionBalloon)
		{
			this.reconnectionBalloon.close();
			this.reconnectionBalloon = null;
		}
	}

	/**
	 * Closes the "remote participants video is muted" balloon if it is open.
	 */
	closeRemoteVideoMutedBalloon()
	{
		if (this.remoteVideoMutedBalloon)
		{
			this.remoteVideoMutedBalloon.close();
			this.remoteVideoMutedBalloon = null;
		}
	}

	/**
	 * Shows the media devices reset state hint balloon if not already visible.
	 */
	showMediaDevicesResetStateHint()
	{
		if (this.mediaDevicesResetStateHintBalloon)
		{
			return;
		}

		this.mediaDevicesResetStateHintBalloon = NotificationCenter.notify({
			content: Text.encode(BX.message('CALL_MEDIA_DEVICES_RESET_STATE_HINT')),
			autoHide: false,
			position: 'top-right',
			closeButton: true,
		});
	}

	/**
	 * Closes the media devices reset state hint balloon if it is open.
	 */
	closeMediaDevicesResetStateHint()
	{
		if (this.mediaDevicesResetStateHintBalloon)
		{
			this.mediaDevicesResetStateHintBalloon.close();
			this.mediaDevicesResetStateHintBalloon = null;
		}
	}

	/**
	 * Shows a notification listing disconnected audio/video devices.
	 *
	 * @param {Array<{label: string}>} removedDevices
	 */
	showDevicesDetachedNotification(removedDevices)
	{
		if (removedDevices.length === 0)
		{
			return;
		}

		NotificationCenter.notify({
			content:
				`${BX.message('IM_CALL_DEVICES_DETACHED')
				}<br><ul>${
				removedDevices.map((deviceInfo) => {
					return `<li>${Text.encode(deviceInfo.label)}`;
				}).join('')
				}</ul>`,
			position: 'top-right',
			autoHideDelay: 10000,
			closeButton: true,
			actions: [
				{
					title: BX.message('IM_CALL_DEVICES_CLOSE'),
					events: {
						click: (event, balloon) => {
							balloon.close();
						},
					},
				},
			],
		});
	}

	/**
	 * Shows a notification when user media access fails.
	 *
	 * @param {object} data
	 * @param {boolean} data.fallbackMode
	 * @param {Error} data.error
	 * @param {{audio: boolean, video: boolean}} data.options
	 */
	showGetUserMediaFailedNotification(data)
	{
		let contentPhrase = '';

		if (data.error.name === 'PermissionDeniedError' || data.error.name === 'NotAllowedError')
		{
			if (data.options.audio && data.options.video)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_ALLOW_MIC_AND_CAM';
			}
			else if (data.options.audio && !data.options.video)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_ALLOW_MIC';
			}
			else if (data.options.video && !data.options.audio)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_ALLOW_CAM';
			}
		}
		else if (data.error.name === 'OverconstrainedError')
		{
			if (data.options.audio && !data.options.video)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_USING_DEFAULT_MIC';
			}
			else if (data.options.video && !data.options.audio)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_USING_DEFAULT_CAM';
			}
		}
		else if (
			data.error.name === 'NotReadableError'
			|| (data.error.name === 'AbortError' && data.error.message === 'Starting videoinput failed')
		)
		{
			if (data.options.audio && !data.options.video)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_MIC_IN_USE';
			}
			else if (data.options.video && !data.options.audio)
			{
				contentPhrase = 'CALL_DEVICE_ACCESS_DENIED_CAM_IN_USE';
			}
		}

		if (contentPhrase)
		{
			NotificationCenter.notify({
				content: Text.encode(Loc.getMessage(contentPhrase)),
				position: 'top-right',
				closeButton: true,
			});
		}
	}

	showLinkCopiedNotification(message, width = 400)
	{
		NotificationCenter.notify({
			content: message,
			autoHideDelay: 4000,
			width,
		});
	}

	/**
	 * Shows a notification when a remote user's call state changes to Declined, Failed, or Busy.
	 * Fetches user data asynchronously before showing the notification.
	 *
	 * @param {string} messageKey - BX.message key for the notification text
	 * @param {string|number} callId - call id to look up user data
	 * @param {string|number} userId - user id
	 * @param {string} [defaultGender='M'] - fallback gender for localization
	 */
	async showUserCallStateNotification(messageKey, callId, userId, defaultGender = 'M')
	{
		// Drop any pending/visible balloon for the same user before showing a new one.
		this.closeUserCallStateNotification(userId);

		const entry = { balloon: null, cancelled: false };
		this.userCallStateBalloons.set(userId, entry);

		try
		{
			const userData = await Util.getUser(callId, userId);
			if (entry.cancelled)
			{
				return;
			}

			entry.balloon = NotificationCenter.notify({
				content: Text.encode(Util.getCustomMessage(messageKey, {
					gender: userData.gender || defaultGender,
					name: userData.name,
				})),
				position: 'top-right',
				autoHideDelay: 5000,
				closeButton: true,
			});
		}
		catch (error)
		{
			console.warn('not found userData:', error);
			if (this.userCallStateBalloons.get(userId) === entry)
			{
				this.userCallStateBalloons.delete(userId);
			}
		}
	}

	/**
	 * Dismisses a user-call-state balloon (whether on-screen or still awaiting
	 * userData) — used when the user's state has moved out of the state the
	 * balloon was reporting (e.g. after a re-invite Declined → Calling).
	 *
	 * @param {string|number} userId
	 */
	closeUserCallStateNotification(userId)
	{
		const entry = this.userCallStateBalloons.get(userId);
		if (!entry)
		{
			return;
		}
		entry.cancelled = true;
		if (entry.balloon)
		{
			try
			{
				entry.balloon.close();
			}
			catch (error)
			{
				// Balloon already auto-hidden — ignore.
			}
		}
		this.userCallStateBalloons.delete(userId);
	}

	/**
	 * Releases all resources held by this service: closes all popups and balloons.
	 */
	destroy()
	{
		this.callStore = null;

		this.closeMutePopup();
		this.closeRiseYouHandToTalkPopup();

		if (this.roomJoinedPopup)
		{
			this.roomJoinedPopup.destroy();
			this.roomJoinedPopup = null;
		}

		if (this.micTakenFromPopup)
		{
			this.micTakenFromPopup.destroy();
			this.micTakenFromPopup = null;
		}

		if (this.micTakenByPopup)
		{
			this.micTakenByPopup.destroy();
			this.micTakenByPopup = null;
		}

		this.closeReconnectingBalloon();
		this.closeRemoteVideoMutedBalloon();
		this.closeMediaDevicesResetStateHint();

		this.viewPort = null;
		this.container = null;
	}
}
