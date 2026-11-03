import { Text, Loc, Dom, Runtime, Type } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Button } from 'ui.buttons';
import { Center as NotificationCenter } from 'ui.notification';

import { DesktopApi } from 'im.v2.lib.desktop-api';

import { CallHint, CallHintScenario } from '../view/call-hint';
import Util from '../util';
import { StartCallErrorCode, DisconnectReason } from '../engine';
import { getRoomSettingsPhrase, getUserMediaFailurePhrase } from './notification-phrases';

const BALLOON_OFFSET_CLASS_NAME = 'bx-call-control-notification-right-offset';

// Client-side fallback of Util.getCallConnectionErrorCode: an internal analytics label,
// never a code to show the user.
const CLIENT_UNCLASSIFIED_ERROR_CODE = 'CLIENT_UNCLASSIFIED';

/**
 * Manages in-call notification popups and hint overlays (mute, network, VPN, unsupported, etc.).
 */
export class NotificationService
{
	#callControlPanelOpen = false;

	// Both live next to `allowMutePopup` and only guard the push-to-talk trigger: the hint is offered
	// once per call, and not at all once the user has managed to hold the key. Nothing is stored
	// beyond the lifetime of the service.
	#pushToTalkHintShown = false;
	#pushToTalkUsed = false;

	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {HTMLElement} config.container
	 * @param {Function} [config.onAskSpeakButtonClicked] - `() => void`, the floor-request hint button
	 * @param {Function} [config.onUnmuteMicButtonClicked] - `() => void`, the mute hint unmute button
	 */
	constructor({ viewPort, container, onAskSpeakButtonClicked, onUnmuteMicButtonClicked })
	{
		this.viewPort = viewPort;
		this.container = container;
		this.callbacks = {
			onAskSpeakButtonClicked,
			onUnmuteMicButtonClicked,
		};

		this.mutePopup = null;
		this.riseYouHandToTalkPopup = null;
		this.allowMutePopup = true;

		this.reconnectionBalloon = null;
		this.localRecordStartFailedBalloon = null;
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
		this.#notify({
			content: Text.encode(notificationText),
			position: 'top-right',
			autoHideDelay: 5000,
			closeButton: true,
			actions,
		});
	}

	/**
	 * Shows the refused local record start. The balloon has no auto hide: a lost record matters
	 * too much to disappear on its own, so the user closes it. A repeated refusal replaces the
	 * previous balloon instead of stacking one more on top of it.
	 */
	showLocalRecordStartFailed()
	{
		this.closeLocalRecordStartFailedBalloon();

		this.localRecordStartFailedBalloon = this.#notify({
			content: Text.encode(Loc.getMessage('CALL_ERROR_LOCAL_RECORD_START_FAILED')),
			position: 'top-right',
			autoHide: false,
			closeButton: true,
		});
	}

	/**
	 * Closes the refused local record start balloon if it is open.
	 */
	closeLocalRecordStartFailedBalloon()
	{
		if (this.localRecordStartFailedBalloon)
		{
			this.localRecordStartFailedBalloon.close();
			this.localRecordStartFailedBalloon = null;
		}
	}

	/**
	 * Shows the microphone-muted hint popup near the given element.
	 *
	 * @param {HTMLElement|null} bindElement - resolved by the controller; null when call is folded
	 * @returns {boolean} whether the hint was shown; the mutual exclusions can turn the show down
	 */
	showMicMutedNotification(bindElement)
	{
		if (this.riseYouHandToTalkPopup || !Util.havePermissionToBroadcast('mic'))
		{
			return false;
		}

		if (this.mutePopup)
		{
			this.mutePopup.close();
			this.mutePopup = null;
		}

		// the callback belongs to this very hint: a stale one must not drop a newer popup
		const hint = CallHint.notification({
			scenario: CallHintScenario.MicMuted,
			callFolded: !bindElement,
			bindElement,
			targetContainer: this.container,
			icon: 'mic-off',
			showSpaceHint: true,
			buttons: [this.#createUnmuteButton(() => hint.close())],
			onClose: () => {
				this.allowMutePopup = false;

				if (this.mutePopup === hint)
				{
					this.mutePopup = null;
				}
			},
		});

		this.mutePopup = hint;
		hint.show();

		return true;
	}

	/**
	 * Second trigger of the same hint: a short press that led to nothing, so the hold threshold is
	 * explained right where the user has just tried and failed.
	 *
	 * @param {HTMLElement|null} bindElement - resolved by the controller; null when call is folded
	 */
	showPushToTalkHint(bindElement)
	{
		if (this.#pushToTalkHintShown || this.#pushToTalkUsed)
		{
			return;
		}

		// the single show per call is spent on a hint that appeared, not on one the exclusions dropped
		this.#pushToTalkHintShown = this.showMicMutedNotification(bindElement);
	}

	/**
	 * Push-to-talk has opened the microphone, so there is nothing left to explain.
	 */
	onPushToTalkUsed()
	{
		this.#pushToTalkUsed = true;
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

		const hint = CallHint.notification({
			scenario: CallHintScenario.FloorRequest,
			callFolded: !params.bindElement,
			bindElement: params.bindElement,
			targetContainer: this.container,
			icon: 'mic',
			showAngle: false,
			initiatorName: params.initiatorName,
			customClassName: 'bx-call-view-popup-call-hint-rise-hand-to-talk',
			customRender() {
				// the phrase carries layout placeholders, so it becomes markup first and takes the name
				// only afterwards
				const markup = Loc.getMessage('CALL_ADMIN_PROHIBITED_TURN_ON_PARTICIPANTS_MICROPHONES_HINT', {
					'[hint-label]': '<div class="bx-call-view-popup-call-hint-text" data-testid="call-hint-text">',
					'[/hint-label]': '</div>',
					'#RISE_HAND_ICON#':
						'<div class="ui-btn bx-call-view-popup-call-hint-hand-raise-icon"'
						+ ' data-testid="call-hint-hand-raise-icon"></div>',
					'[label-or]': '<div class="bx-call-view-popup-call-hint-hand-raise-or-label">',
					'[/label-or]': '</div>',
					'#REQUEST_NOW_BUTTON#':
						'<div class = "bx-call-view-popup-call-hint-button-placeholder"></div>',
				});

				const handRaiseContentElement = Dom.create('div', {
					props: { className: 'bx-call-view-popup-call-hint-rise-block' },
					attrs: { 'data-testid': 'call-hint-message' },
					children: [
						// a replacer function, so a placeholder or a $-pattern the user put in their own
						// name stays text instead of turning into markup
						markup.replaceAll('#INITIATOR_NAME#', () => Text.encode(this.initiatorName)),
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
				if (this.riseYouHandToTalkPopup === hint)
				{
					this.riseYouHandToTalkPopup = null;
				}
			},
			onAskSpeakButtonClicked: () => {
				this.callbacks?.onAskSpeakButtonClicked?.();
				hint.close();
			},
		});

		this.riseYouHandToTalkPopup = hint;
		hint.show();
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

		const hint = CallHint.notification({
			scenario: CallHintScenario.AutoMicMute,
			callFolded: !bindElement,
			bindElement,
			targetContainer: this.container,
			title: Text.encode(Loc.getMessage('IM_CALL_MIC_AUTO_MUTED')),
			icon: 'mic-off',
			showSpaceHint: true,
			buttons: [this.#createUnmuteButton(() => hint.close())],
			onClose: () => {
				if (this.mutePopup === hint)
				{
					this.mutePopup = null;
				}
			},
		});

		this.mutePopup = hint;
		hint.show();
	}

	/**
	 * Shows the VPN-is-active notification.
	 */
	showVpnIsActiveNotification()
	{
		if (this.viewPort)
		{
			this.#notify({
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
		this.#notify({
			content: Text.encode(notificationText),
			position: 'top-right',
			autoHideDelay: 5000,
			closeButton: true,
			actions: [
				{
					title: Loc.getMessage('IM_M_CALL_HELP'),
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
		const messageBox = DesktopApi.isDesktop()
			? new MessageBox({
				message: Loc.getMessage('IM_CALL_DESKTOP_TOO_OLD'),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: Loc.getMessage('IM_M_CALL_BTN_UPDATE'),
				cancelCaption: Loc.getMessage('IM_NOTIFY_CONFIRM_CLOSE'),
				onOk: async () => {
					const { DesktopDownload } = await Runtime.loadExtension('intranet.desktop-download');
					const url = DesktopDownload.getLinkForCurrentUser();
					window.open(url, 'desktopApp');

					return true;
				},
			})
			: new MessageBox({
				message: Loc.getMessage('IM_CALL_WEBRTC_USE_CHROME_OR_DESKTOP'),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: Loc.getMessage('IM_CALL_DETAILS'),
				cancelCaption: Loc.getMessage('IM_NOTIFY_CONFIRM_CLOSE'),
				onOk: () => {
					top.BX.Helper.show('redirect=detail&code=11387752');

					return true;
				},
			});

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
	 * Tells whether two participant ids name the same user.
	 * An id reaches the service as a number from the engine and as its string form from the media
	 * server, so both sides go to a number before they meet. A nil id is the one value a number
	 * cannot carry: it names the same user only as another nil one.
	 *
	 * @param {string|number|null|undefined} left
	 * @param {string|number|null|undefined} right
	 * @returns {boolean}
	 */
	#isSameUser(left, right)
	{
		if (Type.isNil(left) || Type.isNil(right))
		{
			return Type.isNil(left) && Type.isNil(right);
		}

		return Number(left) === Number(right);
	}

	/**
	 * Returns user model from viewPort.userRegistry.
	 *
	 * @param {string|number} userId
	 * @returns {object|null}
	 */
	#getUserModel(userId)
	{
		return this.viewPort.userRegistry?.get(userId) ?? null;
	}

	/**
	 * The only point where the service reaches the platform notification centre.
	 * Options go through untouched, the balloon comes back untouched: every default, every
	 * stored reference and the balloon offset stay with the caller that owns them.
	 *
	 * @param {object} options
	 * @returns {object} the balloon the centre returns
	 */
	#notify(options)
	{
		return NotificationCenter.notify(options);
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

		this.#notify({
			content: params.content,
			position: 'top-right',
			autoHideDelay: 8000,
			category: params.category || '',
			closeButton: true,
			render() {
				const actions = this.getActions().map((action) => action.getContainer());

				return Dom.create('div', {
					props: {
						className: balloonClassName,
					},
					attrs: { 'data-testid': 'call-notification-moderation' },
					children: [
						Dom.create('div', {
							props: {
								className: 'ui-notification-balloon-message',
							},
							html: this.getContent(),
						}),
						Dom.create('div', {
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

		if (this.#isSameUser(data.toUserId, currentUserId))
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

				// an unknown stream type leaves the phrase key empty, and so it stays
				default: {
					break;
				}
			}
		}
		else if (this.#isSameUser(data.fromUserId, currentUserId))
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

				default: {
					break;
				}
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

				default: {
					break;
				}
			}
		}

		const phrase = Util.getCustomMessage(contentPhrase, {
			gender: initiatorGender,
			initiator_name: initiatorUserModel?.data?.name || '',
			target_name: targetUserModel?.data?.name || '',
		});

		const content = `<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			contentIcon}-muted"></div>${Text.encode(phrase)}`;

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

		const phrase = Util.getCustomMessage(phraseMap[type], {
			gender,
			name: userModel?.data?.name || '',
		});

		const content = `<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			iconClass}-muted"></div>${Text.encode(phrase)}`;

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

		// reading through hasMessage: getMessage writes an empty string into the dictionary on a miss
		const phraseKey = typesOfMuteMessage[event.data.track.type];

		const content =	`<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			typesOfMute[event.data.track.type]
			}-muted"></div>${
			Text.encode(Loc.hasMessage(phraseKey) ? Loc.getMessage(phraseKey) : '')}`;

		this.createCallControlNotify({ content, isAllow: false });
	}

	/**
	 * Shows a notification when user's speak permission changes (allow/deny floor request response).
	 *
	 * Unlike its neighbours, this one takes no currentUserId: nothing here ever read it. Which
	 * participant the event is addressed to is decided on the media server side and is not
	 * checked in this repository.
	 *
	 * @param {object} data - event.data (fromUserId, allow, toUserId)
	 */
	showPermissionsChangedNotification(data)
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
		if (!this.#isSameUser(data.toUserId, currentUserId))
		{
			return null;
		}

		const newRole = data.role.toUpperCase();

		if (newRole === Util.UsersRoles.ADMIN || newRole === Util.UsersRoles.MANAGER)
		{
			return Loc.getMessage('CALL_YOU_HAVE_BEEN_APPOINTED_AS_ADMIN');
		}

		if (newRole === Util.UsersRoles.USER)
		{
			return Loc.getMessage('CALL_YOU_HAVE_BEEN_APPOINTED_AS_USER');
		}

		return null;
	}

	/**
	 * Shows a notification when room settings (mute/unmute all by admin) change.
	 *
	 * @param {object} data - event.data (eft, act, fromUserId)
	 * @param {number} currentUserId
	 * @returns {{ isAllow: boolean, initiatorName: string }|undefined} what both controllers read:
	 *   whether the change allows and who made it; undefined on the early exit, which shows nothing
	 */
	showRoomSettingsChangedNotification(data, currentUserId)
	{
		if (!this.viewPort)
		{
			// spelled out for consistent-return: the early exit gives the controllers no result, and
			// that is the contract
			// eslint-disable-next-line unicorn/no-useless-undefined
			return undefined;
		}

		const initiatorUserModel = this.#getUserModel(data.fromUserId);
		const initiatorGender = initiatorUserModel?.data?.gender ? initiatorUserModel.data.gender.toUpperCase() : 'M';
		const isOwnInitiator = this.#isSameUser(data.fromUserId, currentUserId);

		const { phraseKey, iconSuffix, isAllow, usesGenderChannel } = getRoomSettingsPhrase({
			eft: data.eft,
			act: data.act,
			isOwnInitiator,
			initiatorGender,
		});

		// the skew between the two branches is kept as is: my own change closes the hint whatever the
		// device, an administrator's closes it for the microphone alone
		if (isAllow && (isOwnInitiator || data.act === 'audio'))
		{
			this.closeRiseYouHandToTalkPopup();
		}

		let phrase = '';

		if (usesGenderChannel)
		{
			phrase = Util.getCustomMessage(phraseKey, {
				gender: initiatorGender,
				initiator_name: initiatorUserModel?.data?.name || '',
			});
		}
		// reading through hasMessage: getMessage writes an empty string into the dictionary on a miss
		else if (Loc.hasMessage(phraseKey))
		{
			phrase = Loc.getMessage(phraseKey);
		}

		const content = `<div class="bx-call-view-participants-control-stream-notify-icon bx-call-view-${
			iconSuffix}"></div>${Text.encode(phrase)}`;

		this.createCallControlNotify({ content, isAllow });

		return { isAllow, initiatorName: initiatorUserModel?.data?.name || '' };
	}

	/**
	 * Shows a popup notifying that the local user has just joined a call room.
	 *
	 * @param {object} config
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

		const { isSpeaker, userIdList, localUserId, isFolded, bindElement, externalContainer, onLeaveRoom } = config;

		const otherUserIds = userIdList.filter((userId) => !this.#isSameUser(userId, localUserId));

		const userNames = otherUserIds.map((userId) => {
			const userModel = this.#getUserModel(userId);

			return userModel?.name || '';
		});

		const usersInRoom = userNames.join(', ');

		// the live region cuts the announcement off at 160 characters, and a roster of names passes
		// that on the third participant: the announcement counts them, the shown text still lists them
		const announceText = Loc.getMessage(
			isSpeaker ? 'CALL_HINT_ROOM_JOINED_ANNOUNCE_SPEAKER' : 'CALL_HINT_ROOM_JOINED_ANNOUNCE',
			{ '#COUNT#': otherUserIds.length },
		);

		const roomJoinedPhrase = Text.encode(
			Loc.getMessage(isSpeaker ? 'IM_CALL_ROOM_JOINED_AUTO_SPEAKER' : 'IM_CALL_ROOM_JOINED_AUTO')
				.replace('#PARTICIPANTS_LIST#', () => usersInRoom),
		);

		// the speaker gets the phrase alone, everyone else gets a second paragraph after it
		const title = isSpeaker
			? roomJoinedPhrase
			: `${roomJoinedPhrase}<p>${Text.encode(Loc.getMessage('IM_CALL_ROOM_JOINED_P2'))}</p>`;

		const hint = CallHint.dialog({
			scenario: CallHintScenario.RoomJoined,
			callFolded: isFolded,
			bindElement,
			targetContainer: isFolded ? externalContainer : this.container,
			title,
			announceText,
			buttonsLayout: 'bottom',
			buttons: [
				new Button({
					baseClass: 'ui-btn',
					text: Loc.getMessage('IM_CALL_ROOM_JOINED_UNDERSTOOD'),
					size: Button.Size.EXTRA_SMALL,
					color: Button.Color.LIGHT_BORDER,
					noCaps: true,
					round: true,
					dataset: { testid: 'call-hint-room-joined-understood-btn' },
					events: {
						// the buttons are the most common way out of the dialog, so they close it the
						// same way Escape does - otherwise focus is left behind in <body>
						click: () => hint.close(),
					},
				}),
				new Button({
					text: Loc.getMessage('IM_CALL_ROOM_WRONG_ROOM'),
					size: Button.Size.EXTRA_SMALL,
					color: Button.Color.LINK,
					noCaps: true,
					round: true,
					dataset: { testid: 'call-hint-room-joined-leave-btn' },
					events: {
						click: () => {
							hint.close();
							onLeaveRoom();
						},
					},
				}),
			],
			onClose: () => {
				if (this.roomJoinedPopup === hint)
				{
					this.roomJoinedPopup = null;
				}
			},
		});

		this.roomJoinedPopup = hint;
		hint.show();
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
		const title = Loc.getMessage('IM_CALL_ROOM_MIC_TAKEN_FROM').replace('#USER_NAME#', () => userModel?.name || '');

		const hint = CallHint.notification({
			scenario: CallHintScenario.MicTakenFrom,
			callFolded: isFolded,
			bindElement,
			targetContainer: isFolded ? externalContainer : this.container,
			title: Text.encode(title),
			buttonsLayout: 'right',
			buttons: [],
			onClose: () => {
				if (this.micTakenFromPopup === hint)
				{
					this.micTakenFromPopup = null;
				}
			},
		});

		this.micTakenFromPopup = hint;
		hint.show();
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

		const hint = CallHint.notification({
			scenario: CallHintScenario.MicTakenBy,
			callFolded: isFolded,
			bindElement,
			targetContainer: isFolded ? externalContainer : this.container,
			title: Text.encode(
				Loc.getMessage('IM_CALL_ROOM_MIC_TAKEN_BY').replace('#USER_NAME#', () => userModel?.name || ''),
			),
			buttonsLayout: 'right',
			buttons: [],
			onClose: () => {
				if (this.micTakenByPopup === hint)
				{
					this.micTakenByPopup = null;
				}
			},
		});

		this.micTakenByPopup = hint;
		hint.show();
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
	 * @param {Function} closeHint - closes the hint this button belongs to
	 * @returns {Button}
	 */
	#createUnmuteButton(closeHint)
	{
		return new Button({
			baseClass: 'ui-btn bx-call-view-popup-call-hint-unmute',
			text: Loc.getMessage('IM_CALL_UNMUTE_MIC'),
			size: Button.Size.EXTRA_SMALL,
			color: Button.Color.LIGHT_BORDER,
			noCaps: true,
			round: true,
			dataset: { testid: 'call-hint-unmute-btn' },
			events: {
				click: () => {
					this.callbacks?.onUnmuteMicButtonClicked?.();
					// closing rather than destroying: destroy() sends no close event, so the owner
					// would never learn about it and the focus of the pressed button would land in body
					closeHint();
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

			case CLIENT_UNCLASSIFIED_ERROR_CODE:
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
				else if (Number(errorCode) === 403)
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

		this.reconnectionBalloon = this.#notify({
			content: Text.encode(Loc.getMessage('IM_CALL_RECONNECTING')),
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
		this.#notify({
			content: Loc.getMessage(isMuted ? 'IM_M_CALL_MUTE_SPEAKERS_OFF' : 'IM_M_CALL_MUTE_SPEAKERS_ON'),
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
		const isSpeaker = this.#isSameUser(event.speaker, userId);
		const initiatorUserModel = this.#getUserModel(event.initiator);

		if (isSpeaker)
		{
			if (this.#isSameUser(event.initiator, userId))
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
			this.remoteVideoMutedBalloon = this.#notify({
				content: Text.encode(Loc.getMessage('IM_M_CALL_REMOTE_PARTICIPANTS_VIDEO_MUTED')),
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

		this.mediaDevicesResetStateHintBalloon = this.#notify({
			content: Text.encode(Loc.getMessage('CALL_MEDIA_DEVICES_RESET_STATE_HINT')),
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

		this.#notify({
			content:
				`${Loc.getMessage('IM_CALL_DEVICES_DETACHED')
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
					title: Loc.getMessage('IM_CALL_DEVICES_CLOSE'),
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
		const contentPhrase = getUserMediaFailurePhrase({
			errorName: data.error.name,
			errorMessage: data.error.message,
			options: data.options,
		});

		if (contentPhrase)
		{
			this.#notify({
				content: Text.encode(Loc.getMessage(contentPhrase)),
				position: 'top-right',
				closeButton: true,
			});
		}
	}

	showLinkCopiedNotification(message, width = 400)
	{
		this.#notify({
			content: message,
			autoHideDelay: 4000,
			width,
		});
	}

	/**
	 * Shows a notification when a remote user's call state changes to Declined, Failed, or Busy.
	 * Fetches user data asynchronously before showing the notification.
	 *
	 * @param {string} messageKey - Loc message key for the notification text
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

			entry.balloon = this.#notify({
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
			console.error('[Call] Failed to fetch user data for a call state notification', error);

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
			catch
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
		this.closeLocalRecordStartFailedBalloon();
		this.closeRemoteVideoMutedBalloon();
		this.closeMediaDevicesResetStateHint();

		this.viewPort = null;
		this.container = null;
		this.callbacks = null;
	}
}
