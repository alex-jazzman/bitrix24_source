import { Event, Loc, Runtime, Type, Dom, Tag } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { AirButtonStyle, Button } from 'ui.buttons';

import { type PartnerForm } from './partner-form';

import '../../css/partner-form.css';

export type ShowPartnerFormParams = {
	partnerId: string;
	partnerName: string;
	partnerUrl: string;
	forms: PartnerForm[] | null;
	messages: { [string]: string };
	partnerLogo?: string;
	publicDomain: string;
	partnerPhone?: string;
	partnerEmail?: string;
	partnerCompany?: string;
};

export async function showPartnerConnectForm(params: ShowPartnerFormParams)
{
	Loc.setMessage(params.messages);
	await showPartnerFormPopup({
		...params,
		titleBar: Loc.getMessage('INTRANET_PARTNER_POPUP_TITLE'),
		sendButtonText: Loc.getMessage('INTRANET_PARTNER_POPUP_SEND_BUTTON'),
	});
}

type ShowPartnerFormPopupOptions = {
	forms: PartnerForm[] | null;
	titleBar: string;
	sendButtonText: string;
	partnerId: string;
	partnerName: string;
	partnerUrl: string;
	partnerLogo?: string;
	partnerPhone?: string;
	partnerEmail?: string;
	partnerCompany?: string;
	arParams: Object;
	publicDomain: string;
}

async function showPartnerFormPopup(options: ShowPartnerFormPopupOptions): Popup
{
	const partnerLogo = (options.partnerLogo === '' || Type.isNil(options.partnerLogo))
		? '/bitrix/modules/intranet/install/templates/bitrix24/dist/dist/images/b24-partner__icon.svg'
		: options.partnerLogo
	;
	const partnerCardUrl = `${options.publicDomain}partners/partner/${options.partnerId}/`;

	const clipboardButton = initCopyBtn();
	const email = initEmail(clipboardButton, options);
	const phone = initPhone(clipboardButton, options);
	const partnerAbout = initAboutPartner(partnerCardUrl);

	const popupOptions: PopupOptions = {
		className: 'bitrix24-partner__popup',
		autoHide: true,
		cacheable: false,
		zIndex: 0,
		offsetLeft: 0,
		offsetTop: 0,
		width: 316,
		overlay: true,
		draggable: { restrict: true },
		closeByEsc: true,
		titleBar: Loc.getMessage('INTRANET_PARTNER_TITLE_FOR_NAME_MSGVER_2'),
		closeIcon: true,
		content: `
			<div class="bitrix24-partner__popup-content" id="b24-partner-popup-main">
				<div class="bitrix24-partner__popup-content_main">
					<div class="">
						<div class="bitrix24-partner__popup-content_partner-preview">
							<img class="bitrix24-partner__popup-content-logo" src="${Tag.safe`${encodeURI(partnerLogo)}`}" alt="">
							<div class="bitrix24-partner__popup-content_name-wrapper">
								<div class="bitrix24-partner__popup-content_name">${Tag.safe`${options.partnerName}`}</div>
								<div class="bitrix24-partner__popup-content_description">${Tag.safe`${options.partnerCompany}`}</div>
							</div>
						</div>
		
						<div>
							${email}
							${phone} 
							${partnerAbout}
						</div>
					</div>
				</div>
				<div class="bitrix24-partner__popup-content_desc">${Loc.getMessage('INTRANET_PARTNER_POPUP_DESCRIPTION_BOTTOM_MSGVER_1')}</div>
			</div>
		`,
		buttons: [
			new Button({
				style: AirButtonStyle.FILLED,
				text: options.sendButtonText,
				useAirDesign: true,
				onclick: async (button: Button) => {
					button.setClocking(true);

					const onSliderClose = () => {
						button.setClocking(false);
						top.BX.removeCustomEvent('SidePanel.Slider:onClose', onSliderClose);
					};

					top.BX.addCustomEvent('SidePanel.Slider:onClose', onSliderClose);
					await showIntegratorApplicationForm();
				},
			}).setWide(true),
		],
	};

	const popup = new Popup(popupOptions);

	popup.show();

	initCopyHandler();
}

function initCopyBtn(): ((dataCopy: string) => string)
{
	if (isNavigatorClipboardSupported())
	{
		return (dataCopy) => {
			return `
				<div class="copy-icon" type="button" data-copy="${Tag.safe`${dataCopy}`}">
					<div class="ui-icon-set --o-copy"></div>
				</div>
			`;
		};
	}

	return '';
}

function initEmail(clipboardButton, options: ShowPartnerFormPopupOptions): string
{
	if (!Type.isNil(options.partnerEmail) && options.partnerEmail !== '')
	{
		return `
			<div class="bitrix24-partner__popup-content_info-block">
				<div class="bitrix24-partner__popup-content_info-block-icon-wrapper">
					<div class="ui-icon-set --mail"></div>
				</div>
				<a
					class="bitrix24-partner__popup-content_info-block-info-value"
					href="mailto:${Tag.safe`${options.partnerEmail}`}"
				>
					${Tag.safe`${options.partnerEmail}`}
				</a>
				${Type.isFunction(clipboardButton) ? clipboardButton(options.partnerEmail) : ''}
			</div>
		`;
	}

	return '';
}

function initPhone(clipboardButton, options: ShowPartnerFormPopupOptions): string
{
	if (!Type.isNil(options.partnerPhone) && options.partnerPhone !== '')
	{
		return `
			<div class="bitrix24-partner__popup-content_info-block">
				<div class="bitrix24-partner__popup-content_info-block-icon-wrapper">
					<div class="ui-icon-set --telephony-handset-5"></div>
				</div>
				<a
					class="bitrix24-partner__popup-content_info-block-info-value"
					href="tel:${Tag.safe`${options.partnerPhone}`}"
				>
					${Tag.safe`${options.partnerPhone}`}
				</a>
				${Type.isFunction(clipboardButton) ? clipboardButton(options.partnerPhone) : ''}
			</div>
		`;
	}

	return '';
}

function initAboutPartner(partnerCardUrl): string
{
	return `
		<div class="bitrix24-partner__popup-content_info-block">
			<div class="bitrix24-partner__popup-content_info-block-icon-wrapper">
				<div class="ui-icon-set --earth-language"></div>
			</div>
			<a 
				class="bitrix24-partner__popup-content_info-block-info-value" 
				href="${encodeURI(partnerCardUrl)}" target="_blank"
			>
				${Loc.getMessage('INTRANET_PARTNER_LINK_NAME_MORE')}
			</a>
		</div>
	`;
}

function initCopyHandler()
{
	setTimeout(() => {
		if (isNavigatorClipboardSupported())
		{
			const popupContent = document.getElementById('b24-partner-popup-main');
			if (popupContent)
			{
				Event.bind(popupContent, 'click', async (e) => {
					const btn = e.target.closest('.copy-icon');
					if (btn && btn.dataset.copy)
					{
						try
						{
							await navigator.clipboard.writeText(btn.dataset.copy);
							Dom.addClass(btn, 'copied');
							BX.UI.Notification.Center.notify({
								content: Loc.getMessage('INTRANET_PARTNER_POPUP_COPIED'),
								autoHideDelay: 2500,
								useAirDesign: true,
							});
							setTimeout(() => {
								Dom.removeClass(btn, 'copied');
							}, 1000);
						}
						catch (err)
						{
							top.console.error(err);
						}
					}
				});
			}
		}
	}, 200);
}

function isNavigatorClipboardSupported(): boolean
{
	return window.isSecureContext && navigator.clipboard;
}

async function showIntegratorApplicationForm(): void
{
	const { PartnerForm } = await Runtime.loadExtension('ui.feedback.partnerform');
	const formParams = {
		id: `intranet-license-partner-form-${parseInt(Math.random() * 1000, 10)}`,
		source: 'intranet.bitrix24.partner-connect-form',
	};

	PartnerForm.show(formParams);
}
