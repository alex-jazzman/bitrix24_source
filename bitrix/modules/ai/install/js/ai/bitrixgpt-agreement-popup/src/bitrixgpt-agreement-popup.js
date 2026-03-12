import { Type, Loc, Extension, Tag, ajax, Page } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { Text } from 'ui.system.typography';
import { Button } from 'ui.buttons';
import { UI } from 'ui.notification';

import './css/bitrixgpt-agreement-popup.css';

let isAgreementPopupShown = false;

export type BitrixGptAgreementPopupMessages = {
	title: string,
	text1: string,
	text2: string,
	accept: string,
	decline: string,
	skip: string,
	skipError: string,
	acceptError: string,
	declineError: string,
};

export type BitrixGptAgreementPopupOptions = {
	attempt: number,
	showLimit?: number,
	showSkip?: boolean,
};

export function showBitrixGptAgreementPopup(options: BitrixGptAgreementPopupOptions): void
{
	if (isAgreementPopupShown)
	{
		return;
	}

	if (
		!Type.isPlainObject(options)
		|| !Type.isNumber(options.attempt)
	)
	{
		return;
	}

	isAgreementPopupShown = true;

	const messages: BitrixGptAgreementPopupMessages = {
		title: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_TITLE'),
		text1: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_TEXT_1'),
		text2: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_TEXT_2', {
			'#LINK#': `<a href="${getAgreementLink()}" target="_blank" rel="noopener noreferrer">`,
			'#/LINK#': '</a>',
		}),
		accept: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_ACCEPT'),
		decline: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_DECLINE'),
		skip: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_SKIP'),
		skipError: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_SKIP_ERROR'),
		acceptError: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_ACCEPT_ERROR'),
		declineError: Loc.getMessage('AI_BITRIXGPT_AGREEMENT_POPUP_DECLINE_ERROR'),
	};

	const { attempt, showLimit } = options;
	const showSkip =
		options.showSkip === true
		|| (
			options.showSkip !== false
			&& Type.isNumber(showLimit)
			&& attempt < showLimit
		);

	let dialog: ?Dialog = null;

	const notifyError = (defaultMessage, response) => {
		let message = defaultMessage;
		if (response?.errors?.[0]?.message)
		{
			message = response.errors[0].message;
		}

		if (UI?.Notification?.Center)
		{
			UI.Notification.Center.notify({ content: message });
		}
		else
		{
			alert(message);
		}
	};

	const requestAction = (action, errorMessage, button, callback) => {
		if (button)
		{
			button.setWaiting(true);
		}

		ajax.runAction(action)
			.then(() => {
				dialog?.hide();

				if (Type.isFunction(callback))
				{
					callback();
				}
			})
			.catch((response) => {
				notifyError(errorMessage, response);
			})
			.finally(() => {
				if (button)
				{
					button.setWaiting(false);
				}
			});
	};

	const buttons = [];

	buttons.push(new Button({
		text: messages.accept,
		useAirDesign: true,
		style: Button.AirStyle.OUTLINE,
		onclick: (button) => {
			requestAction(
				'ai.bitrixgptagreement.accept',
				messages.acceptError,
				button,
				() => {
					Page.reload();
				},
			);
		},
	}));

	buttons.push(new Button({
		text: messages.decline,
		useAirDesign: true,
		style: Button.AirStyle.OUTLINE,
		onclick: (button) => {
			requestAction(
				'ai.bitrixgptagreement.decline',
				messages.declineError,
				button,
				() => {
					Page.reload();
				},
			);
		},
	}));

	if (showSkip && Type.isStringFilled(messages.skip))
	{
		buttons.push(new Button({
			text: messages.skip,
			useAirDesign: true,
			style: Button.AirStyle.OUTLINE,
			onclick: (button) => {
				requestAction(
					'ai.bitrixgptagreement.skip',
					messages.skipError,
					button,
				);
			},
		}));
	}

	const text1 = Text.render(messages.text1, {
		tag: 'p',
		align: 'center',
		size: 'md',
		className: 'ai__bitrixgpt-agreement-popup-text',
	});
	const text2 = Text.render(messages.text2, {
		tag: 'p',
		align: 'center',
		size: 'md',
		className: 'ai__bitrixgpt-agreement-popup-text',
	});
	text2.innerHTML = messages.text2;

	const content = Tag.render`
		<div class="ai__bitrixgpt-agreement-popup-content">
			<div class="ai__bitrixgpt-agreement-popup-img"></div>
			${text1}
			${text2}
		</div>
	`;

	dialog = new Dialog({
		title: messages.title,
		content,
		rightButtons: buttons,
		hasOverlay: true,
		closeByClickOutside: false,
		hasCloseButton: false,
		closeByEsc: false,
		width: 492,
	});

	dialog.show();
}

const getAgreementLink = (): string =>
{
	const zone = Extension.getSettings('ai.bitrixgpt-agreement-popup').zone;

	const linksByZone =
	{
		ru: 'https://www.bitrix24.ru/about/agreement.php',
		kz: 'https://www.bitrix24.kz/about/agreement.php',
		by: 'https://www.bitrix24.by/about/agreement.php',
		en: 'https://www.bitrix24.com/about/agreement.php',
	};

	return linksByZone[zone] || linksByZone.en;
};
