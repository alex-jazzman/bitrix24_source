import { Dom, Loc } from 'main.core';
import { Popup } from 'main.popup';
import { CallCloudRecord } from '../call_common_record';
import { Analytics } from 'call.lib.analytics';

import '../css/cloud-record-info-popup.css';
import Util from '../util';

export class CloudRecordInfoPopup
{
	constructor(config)
	{
		this.popup = null;
		this.popupTemplate = null;
		this.isCloudRecordFeaturesEnabled = config.isCloudRecordFeaturesEnabled;
		this.callId = config.callId;
		this.targetContainer = config.targetContainer || document.body;

		this.callbacks = {
			turnOn: BX.type.isFunction(config.turnOn) ? config.turnOn : BX.DoNothing,
			onClose: BX.type.isFunction(config.onClose) ? config.onClose : BX.DoNothing,
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
				text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_BUTTON_COMING_SOON'),
			});
		}

		return Dom.create('button', {
			props: {
				className: 'call-cloud-record-info-popup__button --primary',
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

	#setTariffTemplate()
	{
		this.popupTemplate = Dom.create('div', {
			props: { className: 'call-cloud-record-info-popup' },
			children: [
				Dom.create('div', {
					props: { className: 'call-cloud-record-info-popup__wrapper' },
					children: [
						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__icon' },
						}),

						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__text' },
							children: [
								Dom.create('div', {
									props: { className: 'call-cloud-record-info-popup__title' },
									text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_TITLE'),
								}),
								Dom.create('div', {
									props: { className: 'call-cloud-record-info-popup__subtitle' },
									text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_SUBTITLE'),
								}),
							],
						}),

						Dom.create('ul', {
							props: { className: 'call-cloud-record-info-popup__list' },
							children: [
								Dom.create('li', {
									props: { className: 'call-cloud-record-info-popup__list-item' },
									children: [
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_icon --like',
											},
										}),
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_text',
											},
											text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_LIKE'),
										}),
									],
								}),
								Dom.create('li', {
									props: { className: 'call-cloud-record-info-popup__list-item' },
									children: [
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_icon --devices',
											},
										}),
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_text',
											},
											text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_DEVICE'),
										}),
									],
								}),
								Dom.create('li', {
									props: { className: 'call-cloud-record-info-popup__list-item' },
									children: [
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_icon --cloud',
											},
										}),
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_text',
											},
											text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_TARIFF_ITEM_CLOUD'),
										}),
									],
								}),
							],
						}),
						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__action' },
							children: [
								Dom.create('button', {
									props: {
										className: 'call-cloud-record-info-popup__button --secondary',
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
								}),
							],
						}),
					],
				}),
			],
		});

		this.sendAnalytics('tariff_limit');
	}

	#setMainTemplate()
	{
		this.popupTemplate = Dom.create('div', {
			props: { className: 'call-cloud-record-info-popup' },
			children: [
				Dom.create('div', {
					props: { className: 'call-cloud-record-info-popup__wrapper' },
					children: [
						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__icon' },
						}),

						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__text' },
							children: [
								Dom.create('div', {
									props: { className: 'call-cloud-record-info-popup__title' },
									text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_TITLE'),
								}),
								Dom.create('div', {
									props: { className: 'call-cloud-record-info-popup__subtitle' },
									text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_SUBTITLE'),
								}),
							],
						}),

						Dom.create('ul', {
							props: { className: 'call-cloud-record-info-popup__list' },
							children: [
								Dom.create('li', {
									props: { className: 'call-cloud-record-info-popup__list-item' },
									children: [
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_icon --cloud',
											},
										}),
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_text',
											},
											text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_CLOUD'),
										}),
									],
								}),
								Dom.create('li', {
									props: { className: 'call-cloud-record-info-popup__list-item' },
									children: [
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_icon --like',
											},
										}),
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_text',
											},
											text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_LIKE'),
										}),
									],
								}),
								Dom.create('li', {
									props: { className: 'call-cloud-record-info-popup__list-item' },
									children: [
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_icon --devices',
											},
										}),
										Dom.create('div', {
											props: {
												className: 'call-cloud-record-info-popup__list-item_text',
											},
											text: Loc.getMessage('CALL_CLOUD_RECORD_INFO_POPUP_MAIN_ITEM_DEVICE'),
										}),
									],
								}),
							],
						}),

						Dom.create('div', {
							props: { className: 'call-cloud-record-info-popup__action' },
							children: [this.#getTemplateButton()],
						}),
					],
				}),
			],
		});
	}

	#create()
	{
		const bindElement = document.querySelector('.bx-messenger-videocall-panel-background-record');

		if (!bindElement)
		{
			return;
		}

		if (CallCloudRecord.tariffAvailable)
		{
			this.#setMainTemplate();
		}
		else
		{
			this.#setTariffTemplate();
		}

		this.popup = new Popup({
			bindElement,
			className: 'call-cloud-record-info-popup',
			targetContainer: this.targetContainer,
			content: this.popupTemplate,
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
			offsetLeft: -139,
			contentBorderRadius: '18px',
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

	show()
	{
		this.#create();
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
