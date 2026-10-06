import { Dom, Event, Loc, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Utils } from 'im.v2.lib.utils';
import { Util } from 'call.core';
import { UserModelField } from './user-registry';

export class FloorRequest extends EventEmitter
{
	#onUserModelChangedHandler;

	constructor(config)
	{
		super();
		this.setEventNamespace('BX.Call.FloorRequest');

		this.userModel = config.userModel;

		this.isShowAllowPermissionButton = this.#canChangeSpeakPermission();

		this.elements = {
			root: null,
			avatar: null,
			button: null,
			close: null,
		};

		this.callbacks = {
			onAllowSpeakPermissionClicked:
				Type.isFunction(config.onAllowSpeakPermissionClicked)
					? config.onAllowSpeakPermissionClicked
					: BX.DoNothing,
			onDisallowSpeakPermissionClicked:
				Type.isFunction(config.onDisallowSpeakPermissionClicked)
					? config.onDisallowSpeakPermissionClicked
					: BX.DoNothing,
			onDestroy:
				Type.isFunction(config.onDestroy)
					? config.onDestroy
					: BX.DoNothing,
		};

		this.container = null;
		this.#onUserModelChangedHandler = this.#onUserModelChanged.bind(this);
		this.userModel.subscribe('changed', this.#onUserModelChangedHandler);
	}

	static create(config)
	{
		return new FloorRequest(config);
	}

	#canChangeSpeakPermission()
	{
		return (
			Util.isUserControlFeatureEnabled()
			&& !this.userModel.localUser
			&& !this.userModel.permissionToSpeak
			&& !Util.getRoomPermissions().AudioEnabled
			&& Util.canControlGiveSpeakPermission()
		);
	}

	mount(container)
	{
		this.container = container;
		Dom.append(this.render(), this.container);
	}

	updatePermissionButtonState()
	{
		this.isShowAllowPermissionButton = this.#canChangeSpeakPermission();

		if (!this.elements?.root)
		{
			return;
		}

		if (this.isShowAllowPermissionButton && !this.elements.button)
		{
			this.elements.button = this.createAllowPermissionButton();
			Dom.insertBefore(this.elements.button, this.elements.close);
		}
		else if (!this.isShowAllowPermissionButton && this.elements.button)
		{
			Dom.remove(this.elements.button);
			this.elements.button = null;
		}
	}

	dismount()
	{
		if (this.elements)
		{
			Dom.remove(this.elements.root);
		}

		this.destroy();
	}

	#onCloseClicked(event)
	{
		event.stopPropagation();

		if (this.isShowAllowPermissionButton)
		{
			this.callbacks.onDisallowSpeakPermissionClicked(this.userModel);
		}
		this.dismount();
	}

	dismountWithAnimation()
	{
		if (!this.elements.root)
		{
			return;
		}
		Dom.addClass(this.elements.root, 'closing');

		Event.bind(this.elements.root, 'animationend', () => this.dismount());
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		this.elements.button = this.isShowAllowPermissionButton ? this.createAllowPermissionButton() : null;
		this.elements.close = Dom.create('div', {
			props: { className: 'bx-call-view-floor-request-notification-close' },
			events: {
				click: this.#onCloseClicked.bind(this),
			},
		});

		this.elements.root = Dom.create('div', {
			props: { className: 'bx-call-view-floor-request-notification' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-call-view-floor-request-notification-icon-container' },
					children: [
						this.elements.avatar = Dom.create('div', {
							props: { className: 'bx-call-view-floor-request-notification-avatar' },
							text: '',
						}),
						Dom.create('div', {
							props: { className: 'bx-call-view-floor-request-notification-icon bx-messenger-videocall-floor-request-icon' },
						}),
					],
				}),

				this.elements.name = Dom.create('span', {
					props: { className: 'bx-call-view-floor-request-notification-text-container' },
					html: this.#buildNameHtml(),
				}),

				this.elements.button,
				this.elements.close,
			],
		});

		if (this.userModel.avatar)
		{
			Dom.style(this.elements.avatar, '--avatar', `url('${this.userModel.avatar}')`);
			this.elements.avatar.innerText = '';
		}
		else
		{
			Dom.style(this.elements.avatar, '--avatar-background', 'var(--call-view__floor-request-notification-avatar-background-color)');
			this.elements.avatar.innerText = Utils.text.getFirstLetters(this.userModel.name).toUpperCase();
		}

		return this.elements.root;
	}

	#buildNameHtml()
	{
		const messageKey = this.userModel.gender === 'F' ? 'IM_CALL_WANTS_TO_SAY_F' : 'IM_CALL_WANTS_TO_SAY_M';
		const nameSpan = `<span class ="bx-call-view-floor-request-notification-text-name">${Text.encode(this.userModel.name)}</span>`;

		return Loc.getMessage(messageKey).replace('#NAME#', nameSpan);
	}

	createAllowPermissionButton()
	{
		return new BX.UI.Button({
			baseClass: 'ui-btn ui-btn-icon-mic',
			text: Loc.getMessage('CALL_RAISE_HAND_NOTIFY_ALLOW'),
			size: BX.UI.Button.Size.EXTRA_SMALL,
			color: BX.UI.Button.Color.LIGHT_BORDER,
			noCaps: true,
			round: true,
			events: {
				click: () => {
					this.#allowPermissionHandler();
				},
			},
		}).render();
	}

	#allowPermissionHandler()
	{
		this.callbacks.onAllowSpeakPermissionClicked(this.userModel);
		this.updatePermissionButtonState();
	}

	#onUserModelChanged(event)
	{
		const { fieldName } = event.data;

		if (fieldName === UserModelField.floorRequestState && !this.userModel.floorRequestState)
		{
			this.dismountWithAnimation();
		}

		if (fieldName === UserModelField.permissionToSpeak)
		{
			this.updatePermissionButtonState();
		}

		if (this.userModel.avatar === '' && this.elements.avatar)
		{
			this.elements.avatar.innerText = Utils.text.getFirstLetters(this.userModel.name).toUpperCase();
		}

		if (this.elements.name)
		{
			this.elements.name.innerHtml = this.#buildNameHtml();
		}
	}

	destroy()
	{
		this.callbacks.onDestroy();

		this.elements = null;
		if (this.userModel)
		{
			this.userModel.unsubscribe('changed', this.#onUserModelChangedHandler);
			this.userModel = null;
		}
		this.emit('onDestroy', {});
	}
}
