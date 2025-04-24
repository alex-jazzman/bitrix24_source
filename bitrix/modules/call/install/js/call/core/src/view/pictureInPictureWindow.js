import { Dom } from 'main.core';
import "../css/picture-in-picture-window.css"
import { Hardware } from '../hardware';
import * as Buttons from './buttons';
import {BaseEvent, EventEmitter} from 'main.core.events';
import { CallUser } from './call-user';

export class PictureInPictureWindow {
	constructor(config)
	{
		this.pictureWindow = null;
		this.template = null;
		this.userPanel = null;
		this.actionsPanel = null;

		this.buttons = {
			microphone: null,
			camera: null,
			returnToCall: null,
			stopScreen: null,
			copilot: null,
		};

		this.userModel = config.userModel;
		this.user = null;
		this.userData = config.currentUser;

		this.buttons = config.buttons || [];
		this.blockedButtons = config.blockedButtons || [];

		this.callbacks = {
			onButtonClick: BX.type.isFunction(config.onButtonClick) ? config.onButtonClick : BX.DoNothing,
			onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
		}

		this.eventEmitter = new EventEmitter(this, 'BX.Call.View');
	}

	_onButtonClick({ buttonName, event })
	{
		this.callbacks.onButtonClick({
			buttonName,
			event,
		})
	}

	setUserMedia(userId, kind, track)
	{
		const isNeededUpdateMedia = kind === 'video' || kind === 'screen';

		if (!this.user || +userId !== this.user.userModel.id || !isNeededUpdateMedia)
		{
			return;
		}

		this.user.videoTrack = track;
	};

	setStats(userId, stats)
	{
		if (!this.user || +userId !== this.user.userModel.id)
		{
			return;
		}

		this.user.showStats(stats);
	}

	setVideoRenderer(userId, mediaRenderer)
	{
		if (!this.user || +userId !== this.user.userModel.id)
		{
			return;
		}

		this.user.videoRenderer = mediaRenderer;
	}

	releaseLocalStream(userId)
	{
		if (!this.user || +userId !== this.user.userModel.id)
		{
			return;
		}

		this.user.releaseStream();
	}

	setCurrentUser(user)
	{

		if (!user)
		{
			return;
		}

		this.userData = user;
		const hasUser = !!this.user;
		const isCurrentUser = this.userData.userModel.id === this.user.userModel.id;

		if (hasUser && !isCurrentUser)
		{
			this.user.dismount();
			this.user = null;
		}

		if (!hasUser || !isCurrentUser)
		{
			this.renderUserPanel();
		}
	}

	getCurrentUserId()
	{
		return this.user?.userModel.id || null;
	}

	isButtonBlocked(buttonName)
	{
		return this.blockedButtons.includes(buttonName);
	}

	updateBlockButtons(buttonsList)
	{
		this.blockedButtons = buttonsList;
	}

	setButtons(buttonsList)
	{
		this.buttons = buttonsList;
	}

	updateButtons()
	{
		Dom.clean(this.actionsPanel);
		this.renderButtons();
	}

	renderButtons()
	{
		if (!this.actionsPanel && this.buttons.length)
		{
			this.actionsPanel = Dom.create("div", {
				props: {
					className: 'bx-call-picture-in-picture-window__actions',
				},
			});
		}

		for (let i = 0; i < this.buttons.length; i++)
		{
			switch (this.buttons[i]) {
				case "microphone":
					this.buttons.microphone = new Buttons.DeviceButton({
						class: "microphone",
						text: BX.message("IM_M_CALL_BTN_MIC"),
						enabled: !Hardware.isMicrophoneMuted,
						arrowHidden: true,
						arrowEnabled: false,
						showPointer: true, //todo
						blocked: this.isButtonBlocked("microphone"),
						showLevel: true,
						sideIcon: null,
						onClick: (event) =>
						{
							this._onButtonClick({ buttonName: "microphone", event });
						},
					});

					this.actionsPanel.appendChild(this.buttons.microphone.render());
					break;
				case "camera":
					this.buttons.camera = new Buttons.DeviceButton({
						class: "camera",
						text: BX.message("IM_M_CALL_BTN_CAMERA"),
						enabled: Hardware.isCameraOn,
						arrowHidden: true,
						blocked: this.isButtonBlocked("camera"),
						onClick: (event) => {
							this._onButtonClick({ buttonName: "camera", event });
						}
					});

					this.actionsPanel.appendChild(this.buttons.camera.render());
					break;
				case "returnToCall":
					this.buttons.returnToCall = new Buttons.SimpleButton({
						class: "go-to-call",
						backgroundClass: "bx-messenger-videocall-panel-icon-background-go-to-call",
						text: BX.message("CALL_BUTTON_GO_TO_CALL"),
						onClick: (event) => {
							this._onButtonClick({ buttonName: "returnToCall", event });
						}
					});
					this.actionsPanel.appendChild(this.buttons.returnToCall.render());
					break;
				case "stop-screen":
					this.buttons.stopScreen = new Buttons.SimpleButton({
						class: "stop-screen",
						text: BX.message("CALL_BUTTON_STOP_SCREEN"),
						blocked: this.isButtonBlocked("screen"),
						onClick: (event) => {
							this._onButtonClick({ buttonName: "stop-screen", event });
						}
					});

					this.actionsPanel.appendChild(this.buttons.stopScreen.render());
					break;
				case "copilot":
					this.buttons.copilot = new Buttons.SimpleButton({
						class: "copilot",
						backgroundClass: "bx-messenger-videocall-panel-background-copilot",
						text: BX.message("CALL_BUTTON_COPILOT_TITLE"),
						blocked: this.isButtonBlocked("copilot"),
						onClick: (event) => {
							this._onButtonClick({ buttonName: "copilot", event });
						},
						isComingSoon: !this.isCopilotFeaturesEnabled,
					});

					this.actionsPanel.appendChild(this.buttons.copilot.render());
			}
		}
	}

	renderUserPanel()
	{
		if (!this.userPanel)
		{
			this.userPanel = Dom.create("div", {
				props: {
					className: 'bx-call-picture-in-picture-window__user',
				},
			});
		}

		if (!this.user)
		{
			this.user = new CallUser({
				parentContainer: this.userPanel,
				userModel: this.userData.userModel,
				avatarBackground: this.userData.avatarBackground,
				allowPinButton: false,
				allowBackgroundItem: false,
				allowMaskItem: false,
			});
			this.user.mount(this.userPanel);
		}

		if (this.userData.previewRenderer)
		{
			this.user.videoRenderer = this.userData.previewRenderer;
		}

		if (this.userData.videoRenderer)
		{
			this.user.videoRenderer = this.userData.videoRenderer
		}

		if (this.userData.videoTrack)
		{
			this.user.videoTrack = this.userData.videoTrack
		}
	}

	render()
	{
		this.renderButtons();
		this.renderUserPanel();

		this.template = Dom.create("div", {
			props: {
				className: 'bx-call-picture-in-picture-window',
			},
		});

		if (!!this.userPanel)
		{
			this.template.appendChild(this.userPanel);
		}

		if (!!this.actionsPanel)
		{
			this.template.appendChild(this.actionsPanel);
		}
	}

	async checkAvailableAndCreate()
	{
		if (window.documentPictureInPicture?.requestWindow)
		{
			this.render();

			this.pictureWindow = await window.documentPictureInPicture.requestWindow({
				disallowReturnToOpener: true,
				width: 402,
				height: 307,
				preferInitialWindowPlacement: true,
			});

			this.pictureWindow.addEventListener('pagehide', (event) => {
				this.onClose();
			});

			this.pictureWindow.addEventListener('resize', (event) => {
				const avatarSize = this.userPanel.clientHeight * 0.45;
				const avatarTextSize = avatarSize * 0.45;

				this.userPanel.style.setProperty('--avatar-size', avatarSize + 'px');
				this.userPanel.style.setProperty('--avatar-text-size', avatarTextSize + 'px');
			});

			[...document.styleSheets].forEach((styleSheet) => {
				try {
					const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
					const style = document.createElement('style');

					style.textContent = cssRules;
					this.pictureWindow.document.head.appendChild(style);
				} catch (e) {
					const link = document.createElement('link');

					link.rel = 'stylesheet';
					link.type = styleSheet.type;
					link.media = styleSheet.media;
					link.href = styleSheet.href;
					this.pictureWindow.document.head.appendChild(link);
				}
			});

			this.pictureWindow.document.body.append(this.template);
		} else {
			this.onClose();
		}
	}

	onClose()
	{
		if (typeof this.callbacks?.onClose === 'function')
		{
			this.callbacks.onClose();
		}

		this.pictureWindow = null;
		this.template = null;
	}

	close()
	{
		if (this.pictureWindow)
		{
			this.pictureWindow.close();
		}
	}
}
