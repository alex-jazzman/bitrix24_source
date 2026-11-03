import { Dom, Loc, Type, Runtime } from 'main.core';
import { Popup } from 'main.popup';
import { Utils } from 'im.v2.lib.utils';

import { AriaHasPopup } from './buttons/helpers/aria';

import './css/picture-in-picture-window.css';

const PIP_WINDOW_WIDTH = 370;
const PIP_WINDOW_HEIGHT = 215;
const PIP_MIN_HEIGHT = 80;
const PIP_MIN_WIDTH = 310;
const AVATAR_SIZE_RATIO = 0.45;
const AVATAR_TEXT_SIZE_RATIO = 0.45;
const FLOOR_REQUEST_HIDE_DELAY = 5000;
const FLOOR_REQUEST_POPUP_WIDTH = 244;
const POPUP_HORIZONTAL_OFFSET = 16;
// the window runs its own panel, so its items live in their own hook namespace
const PIP_TEST_ID_PREFIX = 'call-pip';
const FLOOR_REQUESTS_TEST_ID = `${PIP_TEST_ID_PREFIX}-floor-requests`;
const LIVE_REGION_TEST_ID = `${PIP_TEST_ID_PREFIX}-live-region`;
// the pause the emptied region is held for before the text lands, and the one the text is held for
// before the next message takes its place
const ANNOUNCEMENT_WRITE_DELAY = 100;
const ANNOUNCEMENT_HOLD_DELAY = 1500;
// a burst of raised hands outruns the region: one message takes 1.6 s, so a longer queue would still
// be naming people whose hand is already down. Past this length the names give way to a count.
const ANNOUNCEMENT_QUEUE_LIMIT = 4;
// the popup lives outside the root of the window, so the root is told about it by a class of
// its own: without it the panel collapses as soon as the focus enters the list
const POPUP_OPEN_CLASS = 'bx-call-picture-in-picture-window_popup-open';

// The order of an announced enumeration belongs to this table, not to the list that arrives: the
// list is assembled in the order the main window happens to check its buttons in. The names are
// phrases of their own: the captions of the buttons are capitalised, and the screen button of this
// window is captioned with a single word that says nothing inside a list of what is unavailable.
const BLOCKABLE_CONTROLS = [
	{ name: 'microphone', messageId: 'CALL_VIEW_PIP_CONTROL_MICROPHONE' },
	{ name: 'camera', messageId: 'CALL_VIEW_PIP_CONTROL_CAMERA' },
	{ name: 'screen', messageId: 'CALL_VIEW_PIP_CONTROL_SCREEN' },
];
const CONTROLS_SEPARATOR = ', ';

// a custom element of ui.a11y stays unupgraded in the document of the window: the registry of
// custom elements belongs to the window that declared them, so the hiding is done by styles
const VISUALLY_HIDDEN_STYLE = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	margin: '-1px',
	padding: '0',
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	whiteSpace: 'nowrap',
	border: '0',
};

/**
 * The document of a freshly requested window carries neither a language nor a name of its own.
 * Both are values of the opener, so they are put in from the outside and nothing else about the
 * window is known here.
 */
export function applyPipDocumentAttributes(targetDocument, { lang, title } = {})
{
	if (!targetDocument)
	{
		return;
	}

	if (Type.isStringFilled(lang))
	{
		targetDocument.documentElement?.setAttribute('lang', lang);
	}

	if (Type.isStringFilled(title))
	{
		// the document of the window has no <title> node at all: the browser creates one by the
		// assignment itself, and building the node by hand would leave the window unnamed
		// eslint-disable-next-line no-param-reassign -- naming the document given is the whole job
		targetDocument.title = title;
	}
}

export class PictureInPictureWindow
{
	#isClosing = false;
	#isProgrammaticClose = false;
	#blockedButtonsKey = '';
	#liveRegion = null;
	#announcementQueue = [];
	#announcementTimeoutId = null;

	constructor(config)
	{
		this.pictureWindow = null;
		this.template = null;
		this.userPanel = null;
		this.actionsPanel = null;
		this.notificationPanel = null;
		this.focusedButtonTestId = null;

		this.hardwareState = config.hardwareState;

		this.buttonNames = config.buttons || [];

		this.preferInitialWindowPlacement = config.preferInitialWindowPlacement;

		this.user = null;
		this.userData = config.currentUser;

		// the name of the call is read once, at the moment the window opens, and never followed
		this.accessibleName = config.accessibleName || '';

		this.blockedButtons = config.blockedButtons || [];
		// the state the window opened with is not an event of the window: seeding the key here is
		// what keeps the first sync from announcing a blocking that was already in place
		this.#blockedButtonsKey = this.blockedButtons.join(',');

		this.previousFloorRequestNotifications = config.floorRequestNotifications || [];

		this.callbacks = {
			onButtonClick: Type.isFunction(config.onButtonClick) ? config.onButtonClick : () => {},
			onClose: Type.isFunction(config.onClose) ? config.onClose : () => {},
		};

		this.isMinHeight = false;
		this.isMinWidth = false;

		this.floorRequestElements = {
			counter: null,
			counterValue: null,
			counterDescription: null,
			mainNotification: null,
			popup: null,
			popupTemplate: null,
		};

		this.floorRequestsList = [];
		this.floorRequestTimeout = null;
		// tells whether the focus has to be led into the list on opening, and keeps a stray mouse
		// move from collapsing a list the user works with from the keyboard
		this.floorRequestsOpenedFromKeyboard = false;
		this.floorRequestsFocusWasInside = false;

		this.onCloseHandler = this.onClose.bind(this);
		this.onResizeHandler = Runtime.throttle(this.onResize.bind(this), 100);
		this.onMouseMoveHandler = this.onMouseMove.bind(this);

		this.uiDeps = {
			Buttons: config.Buttons,
			CallUser: config.CallUser,
			FloorRequest: config.FloorRequest,
		};
	}

	#isCurrentUserId(userId)
	{
		return Boolean(this.user) && Number(userId) === Number(this.user.userModel.id);
	}

	setStats(userId, stats)
	{
		if (!this.#isCurrentUserId(userId))
		{
			return;
		}

		this.user.showStats(stats);
	}

	setVideoRenderer(userId, mediaRenderer)
	{
		if (!this.#isCurrentUserId(userId))
		{
			return;
		}

		this.user.videoRenderer = mediaRenderer;
	}

	setCurrentUser(user)
	{
		if (!user)
		{
			return;
		}

		this.userData = user;
		const isCurrentUser = this.#isCurrentUserId(this.userData.userModel.id);

		if (this.user && !isCurrentUser)
		{
			this.destroyCurrentUser();
		}

		if (!this.user || !isCurrentUser)
		{
			this.renderUserPanel();
		}
	}

	destroyCurrentUser()
	{
		if (!this.user)
		{
			return;
		}

		this.user.dismount();
		this.user.destroy();
		this.user = null;
	}

	getCurrentUserId()
	{
		return this.user?.userModel.id ?? null;
	}

	isButtonBlocked(buttonName)
	{
		return this.blockedButtons.includes(buttonName);
	}

	// The only way the blocking of the panel enters this window, and the only record of what has
	// already been announced - the key is the list the window last synced with. A change the caller
	// asks to keep quiet moves the key too, so the state and the record never drift apart.
	syncBlockButtons(buttonsList, { announce = true } = {})
	{
		const cacheKey = buttonsList.join(',');
		if (this.#blockedButtonsKey === cacheKey)
		{
			return;
		}

		const previousList = this.#blockedButtonsKey === '' ? [] : this.#blockedButtonsKey.split(',');

		this.#blockedButtonsKey = cacheKey;
		this.blockedButtons = buttonsList;

		if (announce)
		{
			this.#announceBlockedButtonsChange(previousList, buttonsList);
		}

		this.updateButtons();
	}

	// what has just changed is spoken, not what the state is: the whole list arrives on every update,
	// and naming everything blocked each time would repeat what the user has already heard. A change
	// in both directions is two announcements, and the queue of the region holds them apart.
	#announceBlockedButtonsChange(previousList, currentList)
	{
		this.#announceControls(
			'CALL_VIEW_PIP_CONTROLS_BLOCKED',
			currentList.filter((name) => !previousList.includes(name)),
		);
		this.#announceControls(
			'CALL_VIEW_PIP_CONTROLS_UNBLOCKED',
			previousList.filter((name) => !currentList.includes(name)),
		);
	}

	#announceControls(messageId, names)
	{
		const controls = BLOCKABLE_CONTROLS
			.filter((control) => names.includes(control.name))
			.map((control) => Loc.getMessage(control.messageId))
			.filter((name) => Type.isStringFilled(name))
			.join(CONTROLS_SEPARATOR);

		// nothing to name: an unchanged half of the list, or a button this window cannot speak of
		if (controls === '')
		{
			return;
		}

		this.#announce(Loc.getMessage(messageId, { '#CONTROLS#': controls }));
	}

	setButtons(buttonsList)
	{
		this.buttonNames = buttonsList;

		return this;
	}

	// the panel is rebuilt from scratch, so the focus is carried across the rebuild by the only
	// anchor that survives it: the test hook of the button
	captureFocusedButton()
	{
		this.focusedButtonTestId = null;

		const doc = this.pictureWindow?.document;
		// activeElement answers even for a document that holds no focus: without hasFocus() an
		// update would tear the focus out of whatever the user is typing in the main window
		if (!doc?.hasFocus())
		{
			return;
		}

		const active = doc.activeElement;
		if (!active || !this.actionsPanel?.contains(active))
		{
			return;
		}

		this.focusedButtonTestId = active.getAttribute('data-testid');
	}

	restoreFocusedButton()
	{
		const testId = this.focusedButtonTestId;
		this.focusedButtonTestId = null;

		if (!testId)
		{
			return false;
		}

		const node = this.actionsPanel?.querySelector(`[data-testid="${testId}"]`);
		if (!node)
		{
			return false;
		}

		node.focus();

		// focus() stays silent on a node that cannot take it, a button the mode change brought
		// back hidden for one, so the verdict is read back from the document
		return this.pictureWindow?.document?.activeElement === node;
	}

	updateButtons()
	{
		this.captureFocusedButton();
		Dom.clean(this.actionsPanel);
		this.renderButtons();
		this.restoreFocusedButton();
	}

	getButtonTextBySizePictureWindow(text)
	{
		return (this.isMinHeight || this.isMinWidth) ? '' : text;
	}

	// a small window drops the visible caption and leaves the button with no accessible name;
	// naming a button that still shows its caption would break SC 2.5.3 instead
	getButtonLabels(message)
	{
		const text = this.getButtonTextBySizePictureWindow(message);

		return text === '' ? { text, ariaLabel: message } : { text };
	}

	// Single entry point for the panel of this window: the namespace belongs to the window,
	// so it is bound here once instead of at every button
	#mountButton(ButtonClass, config)
	{
		const button = new ButtonClass({ ...config, testIdPrefix: PIP_TEST_ID_PREFIX });

		Dom.append(button.render(), this.actionsPanel);

		return button;
	}

	renderButtons()
	{
		if (!this.actionsPanel && this.buttonNames.length > 0)
		{
			// The buttons repeat the panel of the call screen down to their classes, so the
			// namespace is what tells the two panels apart, both here and in the buttons
			this.actionsPanel = Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__actions',
				},
				attrs: { 'data-testid': `${PIP_TEST_ID_PREFIX}-panel` },
			});
		}

		for (const buttonName of this.buttonNames)
		{
			switch (buttonName)
			{
				case 'microphone':
					this.#mountButton(this.uiDeps.Buttons.DeviceButton, {
						class: 'microphone',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background',
						...this.getButtonLabels(Loc.getMessage('IM_M_CALL_BTN_MIC')),
						enabled: !this.hardwareState.isMicrophoneMuted,
						arrowHidden: true,
						blocked: this.isButtonBlocked('microphone'),
						showLevel: true,
						sideIcon: null,
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'microphone', event });
						},
					});

					break;
				case 'camera':
					this.#mountButton(this.uiDeps.Buttons.DeviceButton, {
						class: 'camera',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background',
						...this.getButtonLabels(Loc.getMessage('IM_M_CALL_BTN_CAMERA')),
						enabled: this.hardwareState.isCameraOn,
						arrowHidden: true,
						blocked: this.isButtonBlocked('camera'),
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'camera', event });
						},
					});

					break;
				case 'returnToCall':
					this.#mountButton(this.uiDeps.Buttons.SimpleButton, {
						class: 'go-to-call',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background bx-messenger-videocall-panel-icon-background-go-to-call',
						...this.getButtonLabels(Loc.getMessage('CALL_BUTTON_GO_TO_CALL')),
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'returnToCall', event });
							window.focus();
						},
					});

					break;
				case 'stop-screen':
					this.#mountButton(this.uiDeps.Buttons.SimpleButton, {
						class: 'stop-screen',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background',
						...this.getButtonLabels(Loc.getMessage('CALL_BUTTON_STOP_SCREEN')),
						blocked: this.isButtonBlocked('screen'),
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'stop-screen', event });
							window.focus();
						},
					});

					break;
				default:
					break;
			}
		}
	}

	renderUserPanel()
	{
		if (!this.userPanel)
		{
			this.userPanel = Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__user',
				},
			});
		}

		if (!this.user)
		{
			this.user = new this.uiDeps.CallUser({
				parentContainer: this.userPanel,
				userModel: this.userData.userModel,
				avatarBackground: this.userData.avatarBackground,
				allowPinButton: false,
				allowBackgroundItem: false,
				allowMaskItem: false,
				alwaysShowName: true,
				flipVideo: this.userData.userModel.localUser,
				hiddenFloorRequest: true,
				hiddenRemoteParticipantButtonMenu: true,
				onClick: (event) => {
					this.callbacks.onButtonClick({ buttonName: 'returnToCall', event });
					window.focus();
				},
			});
			this.user.mount(this.userPanel);
		}

		if (this.userData.previewRenderer)
		{
			this.user.videoRenderer = this.userData.previewRenderer;
		}

		if (this.userData.videoRenderer)
		{
			this.user.videoRenderer = this.userData.videoRenderer;
		}
	}

	renderNotificationPanel()
	{
		if (!this.notificationPanel)
		{
			this.notificationPanel = Dom.create('div', {
				props: { className: 'bx-call-picture-in-picture-window__notifications bx-messenger-videocall-notification-panel' },
			});
		}
	}

	updateFloorRequestsList({ floorRequestsList, user })
	{
		if (floorRequestsList)
		{
			this.floorRequestsList = floorRequestsList.map((floorRequestsListItem) => {
				return {
					userModel: floorRequestsListItem.userModel,
					avatarBackgroundColor: floorRequestsListItem.avatarBackgroundColor,
					initials: Utils.text.getFirstLetters(floorRequestsListItem.userModel.name).toUpperCase(),
				};
			});
			this.updateFloorRequestCounter();

			return;
		}

		if (!user)
		{
			return;
		}

		const isSameUser = (el) => el.userModel.id === user.userModel.id;
		const userInFloorRequestsListIndex = this.floorRequestsList.findIndex((element) => isSameUser(element));
		const hasUserInFloorRequestsList = userInFloorRequestsListIndex !== -1;
		const isActiveFloorRequestState = user.userModel.floorRequestState;

		if (hasUserInFloorRequestsList === isActiveFloorRequestState)
		{
			return;
		}

		if (isActiveFloorRequestState)
		{
			this.floorRequestsList.push({
				userModel: user.userModel,
				avatarBackgroundColor: user.avatarBackgroundColor,
				initials: Utils.text.getFirstLetters(user.userModel.name).toUpperCase(),
			});
			this.#announceFloorRequest(user.userModel);
		}
		else
		{
			this.floorRequestsList.splice(userInFloorRequestsListIndex, 1);
		}

		this.updateFloorRequestCounter();
	}

	// the phrase is shared with the visible notification, so what is heard matches what is shown
	#announceFloorRequest(userModel)
	{
		const messageKey = userModel.gender === 'F' ? 'IM_CALL_WANTS_TO_SAY_F' : 'IM_CALL_WANTS_TO_SAY_M';

		// the name goes in as plain text: the notification wraps it into a span, and a reader would
		// pronounce both the markup and the escaped entities of an encoded name
		this.#announce(
			Loc.getMessage(messageKey, { '#NAME#': userModel.name }),
			{ floorRequest: true },
		);
	}

	updateFloorRequestCounter(withoutRenderTemplate = false)
	{
		if (this.floorRequestElements.counter)
		{
			const count = this.floorRequestsList.length;

			this.floorRequestElements.counterValue.innerText = count;
			// the digit is hidden from the reader, so the name of the button is the only place
			// carrying both the number and what it counts
			this.floorRequestElements.counterDescription.innerText = Loc.getMessage(
				'CALL_VIEW_PIP_FLOOR_REQUESTS_COUNT',
				{ '#COUNT#': count },
			);
			this.updateVisibilityFloorRequestCounter();
		}

		if (!withoutRenderTemplate)
		{
			this.updateTemplateForFloorRequestsPopup();
		}
	}

	getTemplateForFloorRequestsPopup()
	{
		const children = this.floorRequestsList.map((item, index) => {
			// initials and the ordinal repeat what the name node already says
			const avatarElement = Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__floor-request-avatar',
				},
				attrs: { 'aria-hidden': 'true' },
			});

			if (item.userModel.avatar)
			{
				Dom.style(avatarElement, '--avatar', `url('${item.userModel.avatar}')`);
			}
			else
			{
				Dom.style(avatarElement, '--avatar-color', item.avatarBackgroundColor);
				avatarElement.innerText = item.initials;
			}

			return Dom.create('li', {
				props: { className: 'bx-call-picture-in-picture-window__floor-request-item' },
				children: [
					avatarElement,
					Dom.create('div', {
						props: { className: 'bx-call-picture-in-picture-window__floor-request-name' },
						text: item.userModel.name,
					}),
					Dom.create('div', {
						props: { className: 'bx-call-picture-in-picture-window__floor-request-index' },
						attrs: { 'aria-hidden': 'true' },
						text: index + 1,
					}),
				],
			});
		});

		return Dom.create('ul', {
			props: { className: 'bx-call-picture-in-picture-window__popup-template' },
			attrs: { 'data-testid': `${FLOOR_REQUESTS_TEST_ID}-list` },
			children,
		});
	}

	updateTemplateForFloorRequestsPopup()
	{
		this.floorRequestElements.popupTemplate = this.getTemplateForFloorRequestsPopup();

		if (!this.floorRequestElements.popup)
		{
			return;
		}

		if (this.floorRequestsList.length === 0)
		{
			this.floorRequestElements.popup.close();

			return;
		}

		this.onFloorRequestsContentReplaced();
	}

	// setContent() raises no popup event, so the focus that sat on the replaced content has to be
	// carried over to the new one by hand
	onFloorRequestsContentReplaced()
	{
		const popup = this.floorRequestElements.popup;

		if (!popup?.isShown())
		{
			return;
		}

		const wasInside = this.focusIsInsideContent();

		popup.setContent(this.floorRequestElements.popupTemplate);

		const content = popup.getContentContainer();
		content.setAttribute('tabindex', '-1');
		content.setAttribute('data-testid', `${FLOOR_REQUESTS_TEST_ID}-popup`);

		if (wasInside)
		{
			content.focus();
		}
	}

	closeFloorRequestMainNotification({ withoutAdditionInList, user, withoutDismount })
	{
		if (this.floorRequestTimeout)
		{
			clearTimeout(this.floorRequestTimeout);
			this.floorRequestTimeout = null;
		}

		if (this.floorRequestElements.mainNotification && !withoutDismount)
		{
			this.floorRequestElements.mainNotification.dismount();
		}

		if (!withoutAdditionInList && user)
		{
			this.updateFloorRequestsList({ user });
		}
	}

	updateFloorRequestState({ userModel, avatarBackgroundColor })
	{
		if (
			this.floorRequestElements.mainNotification
			&& this.floorRequestElements.mainNotification.userModel
			&& this.floorRequestElements.mainNotification.userModel.id === userModel.id
			&& !userModel.floorRequestState)
		{
			this.floorRequestElements.mainNotification = null;
		}

		if (userModel.floorRequestState)
		{
			this.updateFloorRequestMainNotification({
				userModel,
				avatarBackgroundColor,
			});
		}
		else
		{
			this.updateFloorRequestsList({
				user: {
					userModel,
					avatarBackgroundColor,
				},
			});
		}
	}

	updateFloorRequestMainNotification({ userModel, avatarBackgroundColor })
	{
		if (!this.notificationPanel)
		{
			this.renderNotificationPanel();
		}

		if (this.floorRequestElements.mainNotification)
		{
			this.closeFloorRequestMainNotification({
				withoutAdditionInList: false,
				user: {
					userModel: this.floorRequestElements.mainNotification.userModel,
					avatarBackgroundColor: this.floorRequestElements.mainNotification.avatarBackgroundColor,
				},
			});
		}

		this.floorRequestElements.mainNotification = this.uiDeps.FloorRequest.create({
			userModel,
			onDestroy: () => {
				this.closeFloorRequestMainNotification({
					withoutAdditionInList: !userModel.floorRequestState,
					user: {
						userModel,
						avatarBackgroundColor,
					},
					withoutDismount: true,
				});
				this.floorRequestElements.mainNotification = null;
			},
		});

		this.floorRequestElements.mainNotification.mount(this.notificationPanel);

		this.floorRequestTimeout = setTimeout(() => {
			this.closeFloorRequestMainNotification({
				withoutAdditionInList: false,
				user: {
					userModel,
					avatarBackgroundColor,
				},
			});
		}, FLOOR_REQUEST_HIDE_DELAY);
	}

	updateVisibilityFloorRequestCounter()
	{
		const isHidden = this.floorRequestsList.length === 0;

		if (!this.floorRequestElements.counter)
		{
			this.renderFloorRequestCounter();
		}

		const hiddenClass = 'bx-call-picture-in-picture-window__floor-requests_hidden';
		const hasHiddenClass = Dom.hasClass(this.floorRequestElements.counter, hiddenClass);

		if (hasHiddenClass === isHidden)
		{
			return;
		}

		Dom.toggleClass(this.floorRequestElements.counter, hiddenClass);
	}

	onMouseMove(event)
	{
		// a list opened from the keyboard belongs to the keyboard: a mouse crossing the window
		// must not take it away
		if (!this.floorRequestElements.popup || this.floorRequestsOpenedFromKeyboard)
		{
			return;
		}

		const composedPath = event.composedPath();
		const hasClass = (element) => element.classList && (Dom.hasClass(element, 'bx-call-picture-in-picture-window__floor-requests') || Dom.hasClass(element, 'bx-call-picture-in-picture-window__popup'));
		if (composedPath.some((element) => hasClass(element)))
		{
			return;
		}

		this.floorRequestElements.popup.close();
	}

	setNewSettingForPopup()
	{
		if (!this.pictureWindow.document.body || !this.floorRequestElements.popup || !this.floorRequestElements.counter)
		{
			return;
		}

		const { clientHeight, clientWidth } = this.pictureWindow.document.body;
		const bindElement = this.floorRequestElements.counter;
		const bindElementPos = bindElement.getBoundingClientRect();
		const { bottom } = bindElementPos;
		const baseOffsetVerticalPopup = POPUP_HORIZONTAL_OFFSET / 2;
		const maxWidthPopup = clientWidth - POPUP_HORIZONTAL_OFFSET * 2;
		const widthPopup = FLOOR_REQUEST_POPUP_WIDTH <= maxWidthPopup ? FLOOR_REQUEST_POPUP_WIDTH : maxWidthPopup;
		const maxHeightPopup = clientHeight - bottom - (baseOffsetVerticalPopup * 2);

		this.floorRequestElements.popup.setOffset({
			offsetLeft: clientWidth - POPUP_HORIZONTAL_OFFSET - widthPopup,
			offsetTop: baseOffsetVerticalPopup,
		});

		this.floorRequestElements.popup.setWidth(widthPopup);
		this.floorRequestElements.popup.setMaxHeight(maxHeightPopup);
	}

	// both ways into the list build the popup, so the mouse no longer owns its creation
	ensureFloorRequestsPopup()
	{
		if (this.floorRequestElements.popup)
		{
			return this.floorRequestElements.popup;
		}

		if (this.isMinHeight)
		{
			return null;
		}

		this.updateTemplateForFloorRequestsPopup();

		this.floorRequestElements.popup = new Popup({
			className: 'bx-call-picture-in-picture-window__popup',
			bindElement: this.floorRequestElements.counter,
			targetContainer: this.pictureWindow.document.body,
			content: this.floorRequestElements.popupTemplate,
			// the counter promises aria-haspopup="dialog"; main.popup already gives its container
			// that role, and the name is the only half of the promise still missing
			ariaLabel: Loc.getMessage('CALL_VIEW_PIP_FLOOR_REQUESTS_POPUP_ARIA'),
			bindOptions: {
				position: 'top',
			},
			autoHide: true,
			closeByEsc: true,
			// the focus cycle of the list belongs to this class alone: the trap of the popup
			// activates after onPopupShow and would overrule the focus set there
			focusTrap: false,
			background: '#00428F',
			contentBackground: '#00428F',
			darkMode: true,
			contentNoPaddings: true,
			animation: 'fading',
			padding: 0,
			contentBorderRadius: '18px',
			zIndex: 11,
			events: {
				onPopupShow: () => this.onFloorRequestsPopupShow(),
				onPopupClose: () => this.onFloorRequestsPopupClose(),
				onPopupDestroy: () => this.onFloorRequestsPopupDestroy(),
			},
		});

		return this.floorRequestElements.popup;
	}

	openFloorRequestsPopup({ fromKeyboard } = {})
	{
		const popup = this.ensureFloorRequestsPopup();

		if (!popup)
		{
			return;
		}

		const wasShown = popup.isShown();

		// what the keyboard has claimed stays with it until the list closes: a mouse crossing the
		// counter of a list the user works with must not hand it back to the pointer
		this.floorRequestsOpenedFromKeyboard = this.floorRequestsOpenedFromKeyboard || fromKeyboard === true;
		this.setNewSettingForPopup();
		popup.show();
		this.setFloorRequestsExpanded(true);

		// show() returns at once on a popup that already stands open, and onPopupShow with it: the
		// keyboard would be left on the counter, with the list it just opened out of the tab order
		if (wasShown && fromKeyboard === true)
		{
			this.onFloorRequestsPopupShow();
		}
	}

	setFloorRequestsExpanded(isExpanded)
	{
		this.floorRequestElements.counter?.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

		if (!this.template)
		{
			return;
		}

		if (isExpanded)
		{
			Dom.addClass(this.template, POPUP_OPEN_CLASS);
		}
		else
		{
			Dom.removeClass(this.template, POPUP_OPEN_CLASS);
		}
	}

	onFloorRequestsPopupShow()
	{
		const content = this.floorRequestElements.popup?.getContentContainer();

		if (!content)
		{
			return;
		}

		// the list takes the focus only when it is asked to: it never joins the tab order
		content.setAttribute('tabindex', '-1');
		// the container is built by main.popup, so the hook of the list is put on it from here
		content.setAttribute('data-testid', `${FLOOR_REQUESTS_TEST_ID}-popup`);

		if (this.floorRequestsOpenedFromKeyboard)
		{
			content.focus();
		}
	}

	onFloorRequestsPopupClose()
	{
		// the fading animation defers the removal of the nodes, so where the focus was has to be
		// settled before the content is torn down
		this.floorRequestsFocusWasInside = this.focusIsInsideContent();
		this.floorRequestElements.popup.destroy();
	}

	onFloorRequestsPopupDestroy()
	{
		this.setFloorRequestsExpanded(false);

		const wasInside = this.floorRequestsFocusWasInside;

		this.floorRequestsFocusWasInside = false;
		this.floorRequestsOpenedFromKeyboard = false;
		this.floorRequestElements.popup = null;

		if (!wasInside)
		{
			return;
		}

		if (this.focusIfPossible(this.floorRequestElements.counter))
		{
			return;
		}

		// the last raised hand may have been lowered while the list was open, and then the counter
		// is gone together with it
		this.focusIfPossible(this.actionsPanel?.querySelector('button'));
	}

	focusIsInsideContent()
	{
		const content = this.floorRequestElements.popup?.getContentContainer();

		return content?.contains(this.pictureWindow?.document?.activeElement) === true;
	}

	// the counter is hidden by display: none and stays in the document, so being connected says
	// nothing about being able to take the focus: only the document knows
	focusIfPossible(node)
	{
		if (!node?.isConnected)
		{
			return false;
		}

		node.focus();

		return this.pictureWindow?.document?.activeElement === node;
	}

	renderFloorRequestCounter()
	{
		if (this.floorRequestElements.counter)
		{
			return;
		}

		// the digit alone names nothing, so it is left to the eye only
		this.floorRequestElements.counterValue = Dom.create('span', {
			attrs: { 'aria-hidden': 'true' },
		});

		// the accessible name of the counter, hidden from the eye the same way the live region is
		this.floorRequestElements.counterDescription = Dom.create('span', {
			attrs: { 'data-testid': `${FLOOR_REQUESTS_TEST_ID}-description` },
			style: VISUALLY_HIDDEN_STYLE,
		});

		this.floorRequestElements.counter = Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-call-picture-in-picture-window__floor-requests',
			},
			attrs: {
				'data-testid': FLOOR_REQUESTS_TEST_ID,
				'aria-haspopup': AriaHasPopup.Dialog,
				'aria-expanded': 'false',
			},
			children: [
				this.floorRequestElements.counterValue,
				this.floorRequestElements.counterDescription,
			],
			events: {
				mouseover: (event) => {
					event.stopPropagation();
					this.openFloorRequestsPopup({ fromKeyboard: false });
				},
				// the root of the window returns to the call on a click, and the counter sits
				// inside it: without this the keyboard would close the window instead of opening
				// the list
				click: (event) => {
					event.stopPropagation();
					this.openFloorRequestsPopup({ fromKeyboard: event.detail === 0 });
				},
			},
		});

		this.updateFloorRequestCounter(true);
	}

	render()
	{
		this.renderButtons();
		this.renderUserPanel();
		this.renderNotificationPanel();
		this.renderFloorRequestCounter();
		this.updateFloorRequestsList({
			floorRequestsList: this.previousFloorRequestNotifications,
		});

		this.template = Dom.create('div', {
			props: {
				className: 'bx-call-picture-in-picture-window',
			},
			events: {
				click: (event) => {
					this.callbacks.onButtonClick({ buttonName: 'returnToCall', event });
				},
			},
		});

		[this.userPanel, this.actionsPanel, this.notificationPanel, this.floorRequestElements.counter]
			.filter(Boolean)
			.forEach((el) => Dom.append(el, this.template));
	}

	setHeightPictureWindow()
	{
		if (!this.template)
		{
			return false;
		}

		const pictureWindowHeight = this.template.clientHeight;
		const isMinHeight = pictureWindowHeight <= PIP_MIN_HEIGHT;

		if (this.isMinHeight === isMinHeight)
		{
			return false;
		}

		if (isMinHeight && this.floorRequestElements.popup)
		{
			this.floorRequestElements.popup.close();
		}

		this.isMinHeight = isMinHeight;

		if (this.isMinHeight)
		{
			Dom.addClass(this.template, 'bx-call-picture-in-picture-window_min');
		}
		else
		{
			Dom.removeClass(this.template, 'bx-call-picture-in-picture-window_min');
		}

		return true;
	}

	setWidthPictureWindow()
	{
		if (!this.template)
		{
			return false;
		}

		const pictureWindowWidth = this.template.clientWidth;
		const isMinWidth = pictureWindowWidth <= PIP_MIN_WIDTH;

		if (this.isMinWidth === isMinWidth)
		{
			return false;
		}

		this.isMinWidth = isMinWidth;

		if (this.isMinWidth)
		{
			Dom.addClass(this.template, 'bx-call-picture-in-picture-window_thin');
		}
		else
		{
			Dom.removeClass(this.template, 'bx-call-picture-in-picture-window_thin');
		}

		return true;
	}

	setAvatarSettings()
	{
		if (!this.userPanel)
		{
			return;
		}

		const avatarSize = this.userPanel.clientHeight * AVATAR_SIZE_RATIO;
		const avatarTextSize = avatarSize * AVATAR_TEXT_SIZE_RATIO;

		Dom.style(this.userPanel, '--avatar-size', `${avatarSize}px`);
		Dom.style(this.userPanel, '--avatar-text-size', `${avatarTextSize}px`);
	}

	onResize()
	{
		this.setAvatarSettings();
		const isHeightUpdated = this.setHeightPictureWindow();
		const isWidthUpdated = this.setWidthPictureWindow();

		if (isHeightUpdated || isWidthUpdated)
		{
			this.updateButtons();
		}

		if (this.floorRequestElements.popup)
		{
			this.floorRequestElements.popup.close();
		}
	}

	toggleEvents(isActive)
	{
		const method = isActive ? 'addEventListener' : 'removeEventListener';

		if (this.pictureWindow)
		{
			this.pictureWindow[method]('pagehide', this.onCloseHandler);
			this.pictureWindow[method]('resize', this.onResizeHandler);
			this.pictureWindow[method]('mousemove', this.onMouseMoveHandler);
		}
	}

	// A live region of its own instead of the announcer of ui.a11y: that one moves its queue by
	// animation frames of the opener, and the tab this window stands in for gets none while hidden.
	#createLiveRegion()
	{
		const container = this.pictureWindow?.document?.body;

		if (this.#isClosing || !container)
		{
			return;
		}

		this.#liveRegion = Dom.create('div', {
			attrs: {
				'aria-live': 'polite',
				'aria-atomic': 'true',
				'data-testid': LIVE_REGION_TEST_ID,
			},
			style: VISUALLY_HIDDEN_STYLE,
		});

		Dom.append(this.#liveRegion, container);
	}

	/**
	 * The way in for what the view has to say while this window is open: a reader following a window
	 * of its own never gets the live region of the opener. Blocking of the panel does not come this
	 * way - it goes through syncBlockButtons(), which keeps the record of what has been spoken.
	 *
	 * @param {string} message
	 * @returns {boolean} Whether the window took the message. A window whose region is not up yet
	 * leaves the announcement to the caller instead of swallowing it.
	 */
	announceMessage(message)
	{
		return this.#announce(message);
	}

	#announce(message, { floorRequest = false } = {})
	{
		if (!this.#liveRegion || !Type.isStringFilled(message))
		{
			return false;
		}

		this.#announcementQueue.push({ text: message, floorRequest });

		if (this.#announcementQueue.length > ANNOUNCEMENT_QUEUE_LIMIT)
		{
			this.#collapseFloorRequestAnnouncements();
		}

		this.#processAnnouncements();

		return true;
	}

	// only the enumeration of names gives way, never a control that has just been taken away: by the
	// time a queued name sounds, the count of raised hands says more about the call than the name does
	#collapseFloorRequestAnnouncements()
	{
		const kept = this.#announcementQueue.filter((item) => !item.floorRequest);

		if (kept.length === this.#announcementQueue.length)
		{
			return;
		}

		const summary = Loc.getMessage('CALL_VIEW_PIP_FLOOR_REQUESTS_COUNT', {
			'#COUNT#': this.floorRequestsList.length,
		});

		this.#announcementQueue = Type.isStringFilled(summary)
			? [...kept, { text: summary, floorRequest: true }]
			: kept;
	}

	#processAnnouncements()
	{
		if (this.#announcementTimeoutId !== null || !this.#liveRegion)
		{
			return;
		}

		// a reader speaks the change of the text, not the text itself: the node is emptied first and
		// filled a tick later, and an emptied node is also what the last message leaves behind
		this.#liveRegion.textContent = '';

		if (this.#announcementQueue.length === 0)
		{
			return;
		}

		const { text } = this.#announcementQueue.shift();

		this.#scheduleAnnouncement(() => this.#writeAnnouncement(text), ANNOUNCEMENT_WRITE_DELAY);
	}

	#writeAnnouncement(message)
	{
		if (!this.#liveRegion)
		{
			return;
		}

		this.#liveRegion.textContent = message;
		this.#scheduleAnnouncement(() => this.#processAnnouncements(), ANNOUNCEMENT_HOLD_DELAY);
	}

	// the queue is moved by the timers of the window: they are the only source of ticks that keeps
	// running while the tab of the opener is hidden
	#scheduleAnnouncement(action, delay)
	{
		this.#announcementTimeoutId = this.pictureWindow?.setTimeout(() => {
			this.#announcementTimeoutId = null;
			action();
		}, delay) ?? null;
	}

	#destroyLiveRegion()
	{
		if (this.#announcementTimeoutId !== null)
		{
			this.pictureWindow?.clearTimeout(this.#announcementTimeoutId);
			this.#announcementTimeoutId = null;
		}

		this.#announcementQueue = [];

		if (this.#liveRegion)
		{
			Dom.remove(this.#liveRegion);
			this.#liveRegion = null;
		}
	}

	async checkAvailableAndCreate()
	{
		if (this.pictureWindow)
		{
			return this.pictureWindow;
		}

		this.#isClosing = false;
		this.#isProgrammaticClose = false;

		if (window.documentPictureInPicture?.requestWindow)
		{
			this.render();

			try
			{
				this.pictureWindow = await window.documentPictureInPicture.requestWindow({
					disallowReturnToOpener: true,
					width: PIP_WINDOW_WIDTH,
					height: PIP_WINDOW_HEIGHT,
					preferInitialWindowPlacement: this.preferInitialWindowPlacement,
				});

				this.toggleEvents(true);

				[...document.styleSheets].forEach((styleSheet) => {
					try
					{
						const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
						const style = document.createElement('style');
						style.textContent = cssRules;

						Dom.append(style, this.pictureWindow.document.head);
					}
					catch
					{
						const link = document.createElement('link');

						link.rel = 'stylesheet';
						link.type = styleSheet.type;
						link.media = styleSheet.media;
						link.href = styleSheet.href;

						Dom.append(link, this.pictureWindow.document.head);
					}
				});

				// the order of the three is fixed: the markup goes first because the live region
				// needs a body to live in, and the language is set before anything is announced
				this.pictureWindow.document.body.append(this.template);

				applyPipDocumentAttributes(this.pictureWindow.document, {
					lang: document.documentElement?.lang,
					title: this.accessibleName,
				});

				this.#createLiveRegion();
			}
			catch
			{
				this.onClose();
			}
		}
		else
		{
			this.onClose();
		}

		return this.pictureWindow;
	}

	onClose()
	{
		if (this.#isClosing)
		{
			return;
		}

		this.#isClosing = true;

		this.callbacks.onClose(this.#isProgrammaticClose);

		if (this.template)
		{
			Dom.remove(this.template);
		}

		this.#destroyFloorRequests();
		// the region is torn down while the window is still alive: its timers are the ones holding
		// the queue, and after close() there is nothing left to clear them with
		this.#destroyLiveRegion();
		this.destroyCurrentUser();
		this.toggleEvents(false);
		this.close();
		this.pictureWindow = null;
		this.template = null;
		this.userPanel = null;
		this.actionsPanel = null;
		this.notificationPanel = null;

		this.#isClosing = false;
		this.#isProgrammaticClose = false;
	}

	close()
	{
		if (this.pictureWindow)
		{
			this.#isProgrammaticClose = true;
			this.pictureWindow.close();
		}
	}

	#destroyFloorRequests()
	{
		if (this.floorRequestTimeout)
		{
			clearTimeout(this.floorRequestTimeout);
			this.floorRequestTimeout = null;
		}

		if (this.floorRequestElements.popup)
		{
			this.floorRequestElements.popup.destroy();
			this.floorRequestElements.popup = null;
		}

		if (this.floorRequestElements.mainNotification)
		{
			this.floorRequestElements.mainNotification.dismount();
			this.floorRequestElements.mainNotification = null;
		}

		this.floorRequestElements.counter = null;
		this.floorRequestElements.counterValue = null;
		this.floorRequestElements.counterDescription = null;
		this.floorRequestElements.popupTemplate = null;
		this.floorRequestsList = [];
		this.floorRequestsOpenedFromKeyboard = false;
		this.floorRequestsFocusWasInside = false;
	}
}
