import { Dom, Loc, Type, Runtime } from 'main.core';
import { Popup } from 'main.popup';
import { Utils } from 'im.v2.lib.utils';

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

export class PictureInPictureWindow
{
	#isClosing: boolean = false;
	#isProgrammaticClose: boolean = false;
	#blockedButtonsKey = '';

	constructor(config)
	{
		this.pictureWindow = null;
		this.template = null;
		this.userPanel = null;
		this.actionsPanel = null;
		this.notificationPanel = null;

		this.hardwareState = config.hardwareState;

		this.buttonNames = config.buttons || [];
		this.buttonInstances = {
			microphone: null,
			camera: null,
			returnToCall: null,
			stopScreen: null,
			copilot: null,
		};

		this.preferInitialWindowPlacement = config.preferInitialWindowPlacement;

		this.user = null;
		this.userData = config.currentUser;

		this.blockedButtons = config.blockedButtons || [];

		this.previousFloorRequestNotifications = config.floorRequestNotifications || [];

		this.callbacks = {
			onButtonClick: Type.isFunction(config.onButtonClick) ? config.onButtonClick : () => {},
			onClose: Type.isFunction(config.onClose) ? config.onClose : () => {},
		};

		this.isMinHeight = false;
		this.isMinWidth = false;

		this.floorRequestElements = {
			counter: null,
			mainNotification: null,
			popup: null,
			popupTemplate: null,
		};

		this.floorRequestsList = [];
		this.floorRequestTimeout = null;

		this.onCloseHandler = this.onClose.bind(this);
		this.onResizeHandler = Runtime.throttle(this.onResize.bind(this), 100);
		this.onMouseMoveHandler = this.onMouseMove.bind(this);

		this.uiDeps = {
			Buttons: config.Buttons,
			CallUser: config.CallUser,
			FloorRequest: config.FloorRequest,
		};
	}

	#isCurrentUserId(userId): boolean
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

	getCurrentUserId(): number | null
	{
		return this.user?.userModel.id ?? null;
	}

	isButtonBlocked(buttonName: string): boolean
	{
		return this.blockedButtons.includes(buttonName);
	}

	syncBlockButtons(buttonsList: string[]): void
	{
		const cacheKey = buttonsList.join(',');
		if (this.#blockedButtonsKey === cacheKey)
		{
			return;
		}

		this.#blockedButtonsKey = cacheKey;
		this.blockedButtons = buttonsList;
		this.updateButtons();
	}

	updateBlockButtons(buttonsList: string[]): this
	{
		this.blockedButtons = buttonsList;

		return this;
	}

	setButtons(buttonsList: string[]): this
	{
		this.buttonNames = buttonsList;

		return this;
	}

	updateButtons()
	{
		Dom.clean(this.actionsPanel);
		this.renderButtons();
	}

	getButtonTextBySizePictureWindow(text: string): string
	{
		return (this.isMinHeight || this.isMinWidth) ? '' : text;
	}

	renderButtons()
	{
		if (!this.actionsPanel && this.buttonNames.length > 0)
		{
			this.actionsPanel = Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__actions',
				},
			});
		}

		for (const buttonName of this.buttonNames)
		{
			switch (buttonName)
			{
				case 'microphone':
					this.buttonInstances.microphone = new this.uiDeps.Buttons.DeviceButton({
						class: 'microphone',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background',
						text: this.getButtonTextBySizePictureWindow(Loc.getMessage('IM_M_CALL_BTN_MIC')),
						enabled: !this.hardwareState.isMicrophoneMuted,
						arrowHidden: true,
						arrowEnabled: false,
						showPointer: true,
						blocked: this.isButtonBlocked('microphone'),
						showLevel: true,
						sideIcon: null,
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'microphone', event });
						},
					});

					Dom.append(this.buttonInstances.microphone.render(), this.actionsPanel);

					break;
				case 'camera':
					this.buttonInstances.camera = new this.uiDeps.Buttons.DeviceButton({
						class: 'camera',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background',
						text: this.getButtonTextBySizePictureWindow(Loc.getMessage('IM_M_CALL_BTN_CAMERA')),
						enabled: this.hardwareState.isCameraOn,
						arrowHidden: true,
						blocked: this.isButtonBlocked('camera'),
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'camera', event });
						},
					});

					Dom.append(this.buttonInstances.camera.render(), this.actionsPanel);

					break;
				case 'returnToCall':
					this.buttonInstances.returnToCall = new this.uiDeps.Buttons.SimpleButton({
						class: 'go-to-call',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background bx-messenger-videocall-panel-icon-background-go-to-call',
						text: this.getButtonTextBySizePictureWindow(Loc.getMessage('CALL_BUTTON_GO_TO_CALL')),
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'returnToCall', event });
							window.focus();
						},
					});

					Dom.append(this.buttonInstances.returnToCall.render(), this.actionsPanel);

					break;
				case 'stop-screen':
					this.buttonInstances.stopScreen = new this.uiDeps.Buttons.SimpleButton({
						class: 'stop-screen',
						backgroundClass: 'bx-call-picture-in-picture-window__button-background',
						text: this.getButtonTextBySizePictureWindow(Loc.getMessage('CALL_BUTTON_STOP_SCREEN')),
						blocked: this.isButtonBlocked('screen'),
						onClick: (event) => {
							event.stopPropagation();
							this.callbacks.onButtonClick({ buttonName: 'stop-screen', event });
							window.focus();
						},
					});

					Dom.append(this.buttonInstances.stopScreen.render(), this.actionsPanel);

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
		}
		else
		{
			this.floorRequestsList.splice(userInFloorRequestsListIndex, 1);
		}

		this.updateFloorRequestCounter();
	}

	updateFloorRequestCounter(withoutRenderTemplate = false)
	{
		if (this.floorRequestElements.counter)
		{
			this.floorRequestElements.counter.innerText = this.floorRequestsList.length;
			this.updateVisibilityFloorRequestCounter();
		}

		if (!withoutRenderTemplate)
		{
			this.updateTemplateForFloorRequestsPopup();
		}
	}

	getTemplateForFloorRequestsPopup(): HTMLElement | HTMLBodyElement
	{
		const children = this.floorRequestsList.map((item, index) => {
			const avatarElement = Dom.create('div', {
				props: {
					className: 'bx-call-picture-in-picture-window__floor-request-avatar',
				},
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
						text: index + 1,
					}),
				],
			});
		});

		return Dom.create('div', {
			props: { className: 'bx-call-picture-in-picture-window__popup-template' },
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

		this.floorRequestElements.popup.setContent(this.floorRequestElements.popupTemplate);
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
		if (!this.floorRequestElements.popup)
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

	renderFloorRequestCounter()
	{
		if (this.floorRequestElements.counter)
		{
			return;
		}

		this.floorRequestElements.counter = Dom.create('div', {
			props: {
				className: 'bx-call-picture-in-picture-window__floor-requests',
			},
			text: this.floorRequestsList.length,
			events: {
				mouseover: (event) => {
					event.stopPropagation();

					if (!this.floorRequestElements.popup && !this.isMinHeight)
					{
						this.updateTemplateForFloorRequestsPopup();
						this.floorRequestElements.popup = new Popup({
							className: 'bx-call-picture-in-picture-window__popup',
							bindElement: this.floorRequestElements.counter,
							targetContainer: this.pictureWindow.document.body,
							content: this.floorRequestElements.popupTemplate,
							bindOptions: {
								position: 'top',
							},
							autoHide: true,
							closeByEsc: true,
							background: '#00428F',
							contentBackground: '#00428F',
							darkMode: true,
							contentNoPaddings: true,
							animation: 'fading',
							padding: 0,
							contentBorderRadius: '18px',
							zIndex: 11,
							events: {
								onPopupClose: () => {
									this.floorRequestElements.popup.destroy();
								},
								onPopupDestroy: () => {
									this.floorRequestElements.popup = null;
								},
							},
						});
					}

					if (this.floorRequestElements.popup)
					{
						this.setNewSettingForPopup();
						this.floorRequestElements.popup.show();
					}
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

	setHeightPictureWindow(): boolean
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

	setWidthPictureWindow(): boolean
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

	async checkAvailableAndCreate(): Promise<?Window>
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

				this.pictureWindow.document.body.append(this.template);
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
		this.floorRequestElements.popupTemplate = null;
		this.floorRequestsList = [];
	}
}
