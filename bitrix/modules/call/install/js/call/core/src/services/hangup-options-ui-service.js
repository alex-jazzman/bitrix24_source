import { EventEmitter } from 'main.core.events';

/**
 * Manages the hangup options context menu popup (leave call vs end for all).
 * Owns the popup instance and emits events for the controller to act on.
 */
export class HangupOptionsUiService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} config.container
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, container, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.HangupOptionsUiService');

		this.viewPort = viewPort;
		this.container = container;
		this.hangupOptionsMenu = null;
		this.callStore = callStore ?? null;
	}

	/**
	 * Shows the hangup options popup menu near the given element.
	 * Calling this method while the menu is already open will destroy it (toggle behavior).
	 *
	 * Emits:
	 * - `HangupOptionsUiService::onFinishForAll` with `callContext` when the user chooses to end the call for everyone.
	 * - `HangupOptionsUiService::onLeaveCall` with `callContext` when the user chooses to leave the call.
	 *
	 * @param {HTMLElement} bindElement - The button element to anchor the popup to.
	 * @param {object} callContext - Plain call data passed through to event subscribers.
	 * @param {string} callContext.callId
	 * @param {string} callContext.callType
	 * @param {string} callContext.chatId
	 * @param {number} callContext.callUsersCount
	 * @param {number} callContext.callLength
	 */
	show(bindElement, callContext)
	{
		if (this.hangupOptionsMenu !== null)
		{
			this.hangupOptionsMenu.destroy();

			return;
		}

		if (!bindElement)
		{
			return;
		}

		const targetNodeWidth = bindElement.offsetWidth;

		const menuItems = [
			{
				text: BX.message('CALL_M_BTN_HANGUP_OPTION_FINISH'),
				onclick: () => {
					this.emit('HangupOptionsUiService::onFinishForAll', callContext);
					this.hangupOptionsMenu?.destroy();
				},
			},
			{
				text: BX.message('CALL_M_BTN_HANGUP_OPTION_LEAVE'),
				onclick: () => {
					this.emit('HangupOptionsUiService::onLeaveCall', callContext);
					this.hangupOptionsMenu?.destroy();
				},
			},
		];

		this.hangupOptionsMenu = new BX.PopupMenuWindow({
			className: 'bx-messenger-videocall-hangup-options-container',
			background: '#00428F',
			contentBackground: '#00428F',
			darkMode: true,
			contentBorderRadius: '6px',
			borderRadius: '6px',
			angle: false,
			bindElement,
			targetContainer: this.container,
			offsetTop: -15,
			bindOptions: { position: 'top' },
			cacheable: false,
			subMenuOptions: {
				maxWidth: 450,
			},
			events: {
				onShow: (event) => {
					const popup = event.getTarget();
					popup.getPopupContainer().style.display = 'block'; // bad hack

					const offsetLeft = targetNodeWidth / 2 - popup.getPopupContainer().offsetWidth / 2;
					popup.setOffset({ offsetLeft: offsetLeft + 40, offsetTop: 0 });
					popup.setAngle({ offset: popup.getPopupContainer().offsetWidth / 2 - 17 });
				},
				onDestroy: () => {
					this.hangupOptionsMenu = null;
				},
			},
			items: menuItems,
		});

		this.hangupOptionsMenu.show();
	}

	/**
	 * Releases all resources held by this service.
	 * Destroys the popup if it is open and nulls all references.
	 */
	destroy()
	{
		this.callStore = null;

		if (this.hangupOptionsMenu !== null)
		{
			this.hangupOptionsMenu.destroy();
			this.hangupOptionsMenu = null;
		}

		this.viewPort = null;
		this.container = null;
	}
}
