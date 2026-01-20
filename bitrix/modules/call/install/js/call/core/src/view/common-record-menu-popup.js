import { Dom, Loc } from 'main.core';
import { Popup } from 'main.popup';

import '../css/common-record-menu-popup.css';

export class CommonRecordMenuPopup
{
	#popupType;
	#state;
	#isDesktopRecord;
	constructor(config) {
		this.popup = null;
		this.popupTemplate = null;
		this.#popupType = config.popupType || 'kind'; // kind || control
		this.#state = config.state;
		this.#isDesktopRecord = config.isDesktopRecord;

		this.callbacks = {
			onStart: BX.type.isFunction(config.onStart) ? config.onStart : BX.DoNothing,
			onStop: BX.type.isFunction(config.onStop) ? config.onStop : BX.DoNothing,
			onPause: BX.type.isFunction(config.onPause) ? config.onPause : BX.DoNothing,
			onDestroy: BX.type.isFunction(config.onDestroy) ? config.onDestroy : BX.DoNothing,
			onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
		};
	}

	#getKindButtons() {
		return [
			Dom.create('div', {
				props: { className: 'call-common-record-menu-popup__button' },
				children: [
					Dom.create('span', {
						props: { className: 'call-common-record-menu-popup__button_text' },
						text: Loc.getMessage('CALL_CLOUD_RECORD_MENU_RECORD_AUDIO'),
					}),
				],
				events: {
					click: () => {
						this.callbacks.onStart('audio');
						this.close();
					},
				},
			}),
			Dom.create('div', {
				props: { className: 'call-common-record-menu-popup__button' },
				children: [
					Dom.create('span', {
						props: { className: 'call-common-record-menu-popup__button_text' },
						text: Loc.getMessage('CALL_CLOUD_RECORD_MENU_RECORD_VIDEO'),
					}),
				],
				events: {
					click: () => {
						this.callbacks.onStart('video');
						this.close();
					},
				},
			}),
		];
	}

	#getControlButtons() {
		const buttons = [];

		if (!this.#isDesktopRecord)
		{
			buttons.push(
				Dom.create('div', {
					props: { className: 'call-common-record-menu-popup__button  --destroy' },
					children: [
						Dom.create('span', {
							props: { className: 'call-common-record-menu-popup__button_text' },
							text: Loc.getMessage('CALL_CLOUD_RECORD_MENU_DESTROY_RECORD'),
						}),
						Dom.create('span', {
							props: { className: 'call-common-record-menu-popup__button_icon --destroy' },
						}),
					],
					events: {
						click: () => {
							this.callbacks.onDestroy();
							this.close();
						},
					},
				}),
			);
		}

		buttons.push(
			Dom.create('div', {
				props: { className: 'call-common-record-menu-popup__button' },
				children: [
					Dom.create('span', {
						props: { className: 'call-common-record-menu-popup__button_text' },
						text:
							this.#state === 'paused'
								? Loc.getMessage('CALL_CLOUD_RECORD_MENU_RESUME_RECORD')
								: Loc.getMessage('CALL_CLOUD_RECORD_MENU_PAUSE_RECORD'),
					}),
					Dom.create('span', {
						props: {
							className: `call-common-record-menu-popup__button_icon ${this.#state === 'paused' ? '--resume' : '--pause'}`,
						},
					}),
				],
				events: {
					click: () => {
						this.callbacks.onPause();
						this.close();
					},
				},
			}),

			Dom.create('div', {
				props: { className: 'call-common-record-menu-popup__button' },
				children: [
					Dom.create('span', {
						props: { className: 'call-common-record-menu-popup__button_text' },
						text: Loc.getMessage('CALL_CLOUD_RECORD_MENU_STOP_RECORD'),
					}),
					Dom.create('span', {
						props: { className: 'call-common-record-menu-popup__button_icon --stop' },
					}),
				],
				events: {
					click: () => {
						this.callbacks.onStop();
						this.close();
					},
				},
			}),
		);

		return buttons;
	}

	#getTemplateButtons() {
		if (this.#popupType === 'kind')
		{
			return this.#getKindButtons();
		}

		return this.#getControlButtons();
	}

	#getPopupTemplate() {
		this.popupTemplate = Dom.create('div', {
			props: { className: `call-common-record-menu-popup__wrapper --${this.#popupType}` },
			children: this.#getTemplateButtons(),
		});
	}

	#create() {
		const copilotButton = document.querySelector('.bx-messenger-videocall-panel-background-record');

		if (!copilotButton)
		{
			return;
		}

		this.#getPopupTemplate();

		this.popup = new Popup({
			className: 'call-common-record-menu-popup',
			bindElement: copilotButton,
			targetContainer: document.body,
			content: this.popupTemplate,
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
			angle: {
				position: 'bottom',
			},
			offsetLeft: 20,
			contentBorderRadius: '6px',
			events: {
				onPopupClose: () => {
					this.callbacks.onClose();
					this.popup.destroy();
				},
				onPopupDestroy: () => {
					this.popup = null;
				},
			},
		});
	}

	show() {
		this.#create();
		this.popup.show();
	}

	close() {
		if (this.popup)
		{
			this.popup.close();
		}
	}

	toggle() {
		if (!this.popup)
		{
			this.show();

			return;
		}

		this.close();
	}
}
