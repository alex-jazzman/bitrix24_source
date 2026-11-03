import { Dom, Loc } from 'main.core';
import { Popup } from 'main.popup';
import { LiveAnnouncer } from 'ui.a11y';

import { CallCloudRecord, Util } from 'call.core';
import { Analytics } from 'call.lib.analytics';

import '../css/cloud-record-info-popup.css';

export const CloudRecordInfoPopupSource = Object.freeze({
	User: 'user',
	Promo: 'promo',
});

export class CloudRecordInfoPopup
{
	#source;
	#titleCode = null;

	constructor(config)
	{
		this.popup = null;
		this.popupTemplate = null;
		this.isCloudRecordFeaturesEnabled = config.isCloudRecordFeaturesEnabled;
		this.tariffAvailable = Boolean(config.tariffAvailable);
		this.callId = config.callId;
		this.bindElement = config.bindElement;
		this.targetContainer = config.targetContainer || document.body;
		this.#source = config.source === CloudRecordInfoPopupSource.Promo
			? CloudRecordInfoPopupSource.Promo
			: CloudRecordInfoPopupSource.User;

		this.callbacks = {
			turnOn: BX.type.isFunction(config.turnOn) ? config.turnOn : BX.DoNothing,
			onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
			onDestroy: BX.type.isFunction(config.onDestroy) ? config.onDestroy : BX.DoNothing,
		};
	}

	#getTemplateButton()
	{
		if (!this.isCloudRecordFeaturesEnabled)
		{
			this.sendAnalytics('private_coming_soon');

			return Dom.create('span', {
				props: {
					className: 'call-cloud-record-info-popup__coming-soon',
				},
				attrs: {
					'data-testid': 'call-cloud-record-info-popup-coming-soon',
				},
				text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_COMING_SOON'),
			});
		}

		return Dom.create('button', {
			props: {
				type: 'button',
				className: 'call-cloud-record-info-popup__button --primary',
			},
			attrs: {
				'data-testid': 'call-cloud-record-info-popup-turn-on',
			},
			text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_TURN_ON'),
			events: {
				click: () => {
					this.callbacks.turnOn();
					this.close();
				},
			},
		});
	}

	#createBuyButton()
	{
		return Dom.create('button', {
			props: {
				type: 'button',
				className: 'call-cloud-record-info-popup__button --secondary',
			},
			attrs: {
				'data-testid': 'call-cloud-record-info-popup-buy',
			},
			children: [
				Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__button_wrapper',
					},
					children: [
						Dom.create('div', {
							props: {
								className: 'call-cloud-record-info-popup__button_icon',
							},
						}),
						Dom.create('div', {
							props: {
								className: 'call-cloud-record-info-popup__button_text',
							},
							text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_BUY'),
						}),
					],
				}),
			],
			events: {
				click: () => {
					Util.openArticle(CallCloudRecord.tariffSlider);
					this.close();
				},
			},
		});
	}

	#createTextBlock(titleCode, subtitleCode)
	{
		return Dom.create('div', {
			props: { className: 'call-cloud-record-info-popup__text' },
			children: [
				Dom.create('div', {
					props: { className: 'call-cloud-record-info-popup__title' },
					text: Loc.getMessage(titleCode),
				}),
				Dom.create('div', {
					props: { className: 'call-cloud-record-info-popup__subtitle' },
					text: Loc.getMessage(subtitleCode),
				}),
			],
		});
	}

	#createListItem({ iconModifier, messageCode })
	{
		return Dom.create('li', {
			props: { className: 'call-cloud-record-info-popup__list-item' },
			children: [
				Dom.create('div', {
					props: {
						className: `call-cloud-record-info-popup__list-item_icon ${iconModifier}`,
					},
				}),
				Dom.create('div', {
					props: {
						className: 'call-cloud-record-info-popup__list-item_text',
					},
					text: Loc.getMessage(messageCode),
				}),
			],
		});
	}

	#createTemplate({ titleCode, subtitleCode, items, action })
	{
		return Dom.create('div', {
			props: { className: 'call-cloud-record-info-popup' },
			attrs: { 'data-testid': 'call-cloud-record-info-popup' },
			children: [
				Dom.create('div', {
					props: { className: 'call-cloud-record-info-popup__wrapper' },
					children: [
						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__icon' },
						}),

						this.#createTextBlock(titleCode, subtitleCode),

						Dom.create('ul', {
							props: { className: 'call-cloud-record-info-popup__list' },
							children: items.map((item) => this.#createListItem(item)),
						}),

						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__action' },
							children: [action],
						}),
					],
				}),
			],
		});
	}

	#setTariffTemplate()
	{
		this.#titleCode = 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_TITLE';
		this.popupTemplate = this.#createTemplate({
			titleCode: this.#titleCode,
			subtitleCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_SUBTITLE',
			items: [
				{
					iconModifier: '--like',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_LIKE',
				},
				{
					iconModifier: '--devices',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_DEVICE',
				},
				{
					iconModifier: '--cloud',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_CLOUD',
				},
			],
			action: this.#createBuyButton(),
		});

		this.sendAnalytics('tariff_limit');
	}

	#setMainTemplate()
	{
		this.#titleCode = 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_TITLE';
		this.popupTemplate = this.#createTemplate({
			titleCode: this.#titleCode,
			subtitleCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_SUBTITLE',
			items: [
				{
					iconModifier: '--cloud',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_CLOUD',
				},
				{
					iconModifier: '--like',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_LIKE',
				},
				{
					iconModifier: '--devices',
					messageCode: 'CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_DEVICE',
				},
			],
			action: this.#getTemplateButton(),
		});
	}

	#create()
	{
		// a second build would leave the first popup in the DOM with its listeners and focus trap,
		// and the only reference to it lost
		if (this.popup || !this.bindElement)
		{
			return;
		}

		if (this.tariffAvailable)
		{
			this.#setMainTemplate();
		}
		else
		{
			this.#setTariffTemplate();
		}

		this.popup = new Popup({
			bindElement: this.bindElement,
			className: 'call-cloud-record-info-popup',
			targetContainer: this.targetContainer,
			content: this.popupTemplate,
			ariaLabel: Loc.getMessage(this.#titleCode),
			// The platform keeps the focus trap off by default, so the layer enables it
			// explicitly. Looping is switched off - the layer is not modal and Tab must
			// leave it back into the call window. A promo nobody asked for takes no focus
			// at all: it is announced instead.
			focusTrap: {
				looped: false,
				initialFocus: this.#source === CloudRecordInfoPopupSource.User,
			},
			bindOptions: {
				position: 'top',
			},
			autoHide: true,
			closeByEsc: true,
			background: '#1f51ae',
			borderRadius: '18px',
			contentBackground: '#0D2F70',
			darkMode: true,
			contentNoPaddings: true,
			animation: 'fading',
			width: 406,
			padding: 0,
			angle: {
				offset: 183,
				position: 'bottom',
			},
			// +7px against the former anchor: the icon background sits inside the button left padding
			offsetLeft: -132,
			contentBorderRadius: '18px',
			events: {
				onAfterPopupShow: () => this.onAfterPopupShow(),
				onPopupClose: () => {
					this.callbacks.onClose();
					this.popup.destroy();
				},
				onPopupDestroy: () => {
					this.popup = null;
					// the owner learns the layer is gone for good, which a close event alone does
					// not say: a popup destroyed without being closed emits no close at all
					this.callbacks.onDestroy();
				},
			},
		});
	}

	getPopupContainer()
	{
		return this.popup?.getPopupContainer() ?? null;
	}

	isShown()
	{
		return this.popup?.isShown() === true;
	}

	onAfterPopupShow()
	{
		this.#announcePromo();
	}

	// A layer the user did not ask for gets no focus, so the only way it reaches a screen
	// reader is a live region.
	#announcePromo()
	{
		if (this.#source !== CloudRecordInfoPopupSource.Promo)
		{
			return;
		}

		// LiveAnnouncer holds a shared queue: by the time this runs the layer may be gone
		// and the announcement would name something no longer on the screen
		if (!this.isShown())
		{
			return;
		}

		const phrase = Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_PROMO_ANNOUNCE');
		if (!phrase)
		{
			return;
		}

		// nothing the call window announces interrupts the screen reader
		LiveAnnouncer.announce(phrase, 'polite');
	}

	show()
	{
		this.#create();

		if (!this.popup)
		{
			// nothing was built, so no close event will ever come: the owner learns here that
			// the layer is done with the screen, or a queue waiting on it stalls forever
			this.callbacks.onClose();

			return;
		}

		this.popup.show();
	}

	close()
	{
		if (this.popup)
		{
			this.popup.close();
		}
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

	sendAnalytics(popupType)
	{
		Analytics.getInstance().onCloudRecordPopupShow({
			callId: this.callId,
			popupType,
		});
	}
}
