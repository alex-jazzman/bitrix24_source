import { Dom, Loc, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';

import { Provider } from '../../engine/types';
import Util from '../../util';
import { ParticipantsPermissionSwitcher, ParticipantsPermissionSwitcherEvents } from './participants-permission-switcher';
import { ParticipantsStreamControlButton, ParticipantsStreamControlButtonEvents } from './participants-stream-control-button';

import '../../css/participants-permission-popup.css';

const doNothing = () => {};

export class ParticipantsPermissionPopup
{
	constructor(config)
	{
		this.popup = null;

		// Per-instance token keeps element ids unique when two popups coexist
		this.instanceId = Text.getRandom();

		this.elements = {
			root: null,
			roomPermissions: null,
			roomSettings: null,
			roomSettingsToggle: null,
			anchor: null,
		};

		this.roomSettingsElements = {
			mic: null,
			cam: null,
			screenshare: null,
		};

		this.callbacks = {
			turnOffAllParticipansStream:
				Type.isFunction(config.turnOffAllParticipansStream)
					? config.turnOffAllParticipansStream
					: doNothing,
			onPermissionChanged:
				Type.isFunction(config.onPermissionChanged)
					? config.onPermissionChanged
					: doNothing,
			onPermissionCollapseStateChanged:
				Type.isFunction(config.onPermissionCollapseStateChanged)
					? config.onPermissionCollapseStateChanged
					: doNothing,
			onClose:
				Type.isFunction(config.onClose)
					? config.onClose
					: doNothing,
			onOpen:
				Type.isFunction(config.onOpen)
					? config.onOpen
					: doNothing,
		};

		this.targetContainer = Type.isDomNode(config.targetContainer) ? config.targetContainer : document.body;

		this.eventEmitter = new EventEmitter(this, 'ParticipantsPermissionPopup');

		this.currentBitrixCall = Util.getCurrentBitrixCall();

		this.isShowPopup = Util.isUserControlFeatureEnabled()
			&& this.currentBitrixCall
			&& this.currentBitrixCall.provider !== Provider.Plain;
		/* &&
				!(this.currentBitrixCall.associatedEntity.type === 'chat'
				&& this.currentBitrixCall.associatedEntity.advanced['chatType'] === 'videoconf'); */

		this.isShowRoomSettings = config.showRoomSettings ?? false;

		if (
			!Util.getRoomPermissions().ScreenShareEnabled
			|| !Util.getRoomPermissions().AudioEnabled
			|| !Util.getRoomPermissions().VideoEnabled)
		{
			this.isShowRoomSettings = true;
		}

		const events = config.events ?? {};
		for (const [eventName, handler = () => {}] of Object.entries(events))
		{
			this.eventEmitter.subscribe(eventName, handler);
		}
	}

	renderSettingsElements()
	{
		this.roomSettingsElements.screenshare = ParticipantsPermissionSwitcher.create({
			typeOfSetting: 'screenshare',
			idSuffix: this.instanceId,
			settingEnabled: Util.getRoomPermissions().ScreenShareEnabled,
			label: Loc.getMessage('CALL_CONTROL_PERMISSIONS_IN_CALL_LABEL_SCREENSHARE'),
			events: {
				[ParticipantsPermissionSwitcherEvents.onSwitch]: this.onPermissionChanged.bind(this),
			},
		});
		this.roomSettingsElements.mic = ParticipantsPermissionSwitcher.create({
			typeOfSetting: 'mic',
			idSuffix: this.instanceId,
			settingEnabled: Util.getRoomPermissions().AudioEnabled,
			label: Loc.getMessage('CALL_CONTROL_PERMISSIONS_IN_CALL_LABEL_MIC'),
			events: {
				[ParticipantsPermissionSwitcherEvents.onSwitch]: this.onPermissionChanged.bind(this),
			},
		});
		this.roomSettingsElements.cam = ParticipantsPermissionSwitcher.create({
			typeOfSetting: 'cam',
			idSuffix: this.instanceId,
			settingEnabled: Util.getRoomPermissions().VideoEnabled,
			label: Loc.getMessage('CALL_CONTROL_PERMISSIONS_IN_CALL_LABEL_CAM'),
			events: {
				[ParticipantsPermissionSwitcherEvents.onSwitch]: this.onPermissionChanged.bind(this),
			},
		});

		return [
			this.roomSettingsElements.screenshare.render(),
			this.roomSettingsElements.mic.render(),
			this.roomSettingsElements.cam.render(),
		];
	}

	updateStatePermissions()
	{
		if (this.elements.roomSettings)
		{
			// capture focused switcher before renderSettingsElements() overwrites roomSettingsElements
			let focusedType = null;
			for (const [type, wrapper] of Object.entries(this.roomSettingsElements))
			{
				if (wrapper && wrapper.getSwitchNode() === document.activeElement)
				{
					focusedType = type;
					break;
				}
			}

			const settingsElements = this.renderSettingsElements();
			this.elements.roomSettings.innerHTML = '';
			this.elements.roomSettings.append(...settingsElements);

			if (focusedType)
			{
				this.roomSettingsElements[focusedType]?.focus();
			}
		}
	}

	toggleRoomSettings()
	{
		this.isShowRoomSettings = !this.isShowRoomSettings;

		if (this.isShowRoomSettings)
		{
			Dom.addClass(this.elements.roomPermissions, 'permissions-uncollapsed');
		}
		else
		{
			Dom.removeClass(this.elements.roomPermissions, 'permissions-uncollapsed');
		}

		this.elements.roomSettingsToggle?.setAttribute('aria-expanded', String(this.isShowRoomSettings));

		this.callbacks.onPermissionCollapseStateChanged(this.isShowRoomSettings);
	}

	getPopupTemplate()
	{
		const permissionsId = `bx-call-participants-permission-popup-permissions-${this.instanceId}`;
		const controlButtonsLabelId = `bx-call-participants-permission-popup-control-buttons-label-${this.instanceId}`;

		this.elements.roomSettings = Dom.create('div', {
			props: { className: 'bx-call-participants-permission-popup__permissions' },
			attrs: { id: permissionsId },
		});

		this.elements.roomSettingsToggle = Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-call-participants-permission-popup__permissions-title-wrapper',
			},
			attrs: {
				'aria-expanded': String(this.isShowRoomSettings),
				'aria-controls': permissionsId,
				'data-testid': 'participants-permission-popup-permissions-toggle',
			},
			events: {
				click: () => {
					this.toggleRoomSettings();
				},
			},
			children: [
				Dom.create('span', {
					props: { className: 'bx-call-participants-permission-popup__permissions-title' },
					text: Loc.getMessage('CALL_CONTROL_PERMISSIONS_IN_CALL_TITLE'),
				}),
				// Decorative arrow, hidden from assistive tech
				Dom.create('span', {
					props: { className: 'bx-call-participants-permission-popup__permissions-title-arrow' },
					attrs: { 'aria-hidden': 'true' },
				}),
			],
		});

		this.elements.roomPermissions = Dom.create('div', {
			props: { className: 'bx-call-participants-permission-popup__permissions-wrapper' },
			children: [
				this.elements.roomSettingsToggle,
				this.elements.roomSettings,
			],
		});

		return Dom.create('div', {
			props: { className: 'bx-call-participants-permission-popup__wrapper' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-call-participants-permission-popup__content' },
					children: [
						this.elements.roomPermissions,
						Dom.create('div', {
							props: { className: 'bx-call-participants-permission-popup__control-buttons-label' },
							attrs: { id: controlButtonsLabelId },
							text: Loc.getMessage('CALL_ADMIN_TURN_OFF_FOR_ALL_LABEL'),
						}),
						Dom.create('div', {
							props: { className: 'bx-call-participants-permission-popup__control-buttons' },
							attrs: {
								role: 'group',
								'aria-labelledby': controlButtonsLabelId,
							},
							children: [
								ParticipantsStreamControlButton.create({
									typeOfStream: 'mic',
									label: Loc.getMessage('CALL_TURN_OFF_MIC_FOR_ALL_PARTICIPANTS_MSGVER_1'),
									events: {
										[ParticipantsStreamControlButtonEvents.onTurnOffStreamForAll]:
											this.onTurnOffStreamForAll.bind(this),
									},
								}).render(),
								ParticipantsStreamControlButton.create({
									typeOfStream: 'cam',
									label: Loc.getMessage('CALL_TURN_OFF_CAM_FOR_ALL_PARTICIPANTS_MSGVER_1'),
									events: {
										[ParticipantsStreamControlButtonEvents.onTurnOffStreamForAll]:
											this.onTurnOffStreamForAll.bind(this),
									},
								}).render(),
								ParticipantsStreamControlButton.create({
									typeOfStream: 'screenshare',
									label: Loc.getMessage('CALL_TURN_OFF_SCREENSHARE_FOR_ALL_PARTICIPANTS_MSGVER_1'),
									events: {
										[ParticipantsStreamControlButtonEvents.onTurnOffStreamForAll]:
											this.onTurnOffStreamForAll.bind(this),
									},
								}).render(),
							],
						}),
					],
				}),
			],
		});
	}

	onPermissionChanged(e)
	{
		this.callbacks.onPermissionChanged(e.data);
	}

	onTurnOffStreamForAll(e)
	{
		this.callbacks.turnOffAllParticipansStream(e);
		this.close();
	}

	close()
	{
		if (this.popup)
		{
			this.popup.close();
		}
	}

	create()
	{
		const participantsButton = document.querySelector('.bx-messenger-videocall-top-button-text.callcontrol');

		if (!participantsButton)
		{
			return;
		}

		if (!this.isShowPopup)
		{
			return;
		}

		// Focus returns to the whole control, not to its inner text node.
		// tabIndex reflects effective focusability: 0 for natively focusable elements, -1 otherwise,
		// so the fallback is skipped once the control root becomes a native <button>.
		const anchor = participantsButton.closest('.bx-messenger-videocall-top-button') ?? participantsButton;
		if (anchor.tabIndex < 0)
		{
			anchor.tabIndex = -1;
		}

		this.elements.anchor = anchor;

		this.elements.root = this.getPopupTemplate();

		const settingsElements = this.renderSettingsElements();
		this.elements.roomSettings.innerHTML = '';
		this.elements.roomSettings.append(...settingsElements);

		if (this.isShowRoomSettings)
		{
			Dom.addClass(this.elements.roomPermissions, 'permissions-uncollapsed');
		}
		else
		{
			Dom.removeClass(this.elements.roomPermissions, 'permissions-uncollapsed');
		}

		this.elements.roomSettingsToggle?.setAttribute('aria-expanded', String(this.isShowRoomSettings));

		this.popup = new Popup({
			className: 'bx-call-participants-permission-popup',
			bindElement: participantsButton,
			targetContainer: this.targetContainer,
			content: this.elements.root,
			ariaLabel: Loc.getMessage('CALL_CONTROL_PERMISSIONS_IN_CALL_TITLE'),
			offsetTop: 10,
			bindOptions: {
				position: 'bottom',
			},
			autoHide: true,
			closeByEsc: true,
			angle: {
				position: 'top',
			},
			contentNoPaddings: true,
			animation: 'fading',
			events: {
				onPopupClose: () => {
					// Track focus before destroy: fading animation may defer node removal,
					// so comparing activeElement to body after destroy is unreliable.
					const focusWasInside = this.elements.root?.contains(document.activeElement);

					this.callbacks.onClose();
					this.popup.destroy();

					if (focusWasInside)
					{
						this.elements.anchor?.focus();
					}
				},
				onPopupShow: () => {
					this.callbacks.onOpen();
					this.elements.roomSettingsToggle?.focus();
				},
				onPopupDestroy: () => {
					this.popup = null;
				},
			},
		});
	}

	show()
	{
		this.create();
		this.popup?.show();
	}

	toggle()
	{
		if (!this.popup)
		{
			this.show();

			return;
		}

		this.close();
	}
}
