import { ajax, Extension, Type } from 'main.core';
import { AnalyticsOptions, sendData } from 'ui.analytics';
import { FeedbackFormOptions, Form } from 'ui.feedback.form';
import { InfoHelper } from 'ui.info-helper';

import { DocumentEditSessionLimit } from 'disk.onlyoffice-session-restrictions';
import { PopupLimits } from 'disk.popup-limits';
import { Factory } from 'disk.promo-boost';

import { IncreaseLimitRequest } from './increase-limit-request';
import { ChatWithManager } from './chat-with-manager';

interface PromoAction {
	type: 'slider' | 'sliderWithPopup' | 'form' | 'formWithPopup' | 'boost' | 'link';
	code: string | null;
	params: {
		[key: string]: unknown;
		url?: string;
		isNewTab?: boolean;
		increaseLimitRequest?: IncreaseLimitRequest;
		formOptions?: Pick<FeedbackFormOptions, 'id' | 'forms' | 'presets'>;
	};
}

export class OnlyOfficePromoActions
{
	private readonly action: PromoAction | null = null;
	private readonly isCreate: boolean = false;
	private readonly analytics: AnalyticsOptions | null = null;
	private documentEditSessionLimit: DocumentEditSessionLimit;
	private readonly isCloud: boolean;

	constructor(isCreate: boolean = false, analytics: AnalyticsOptions | null = null)
	{
		this.isCreate = isCreate;
		this.analytics = analytics;
		this.action = this.#getExtensionParam('action');
		this.documentEditSessionLimit = DocumentEditSessionLimit.getInstance();
		this.isCloud = this.#getExtensionParam('isCloud');
	}

	shouldShow(): boolean
	{
		return (
			this.#isActionDefined() && (this.#canEditBeRestrictedByTariff() || this.documentEditSessionLimit.isExceeded())
		);
	}

	#canEditBeRestrictedByTariff(): boolean
	{
		return !this.#getExtensionParam('canUseEditByTariff');
	}

	show(target: HTMLElement, needOverlay: boolean): void
	{
		if (!this.#isActionDefined())
		{
			return;
		}

		const actionType = this.action?.type;

		let limitReached = true;

		switch (actionType)
		{
			case 'slider':
				this.#showSlider();
				break;
			case 'sliderWithPopup':
				this.#showPopupWithSlider(target);
				break;
			case 'form':
				this.#showForm();
				break;
			case 'formWithPopup':
				this.#showPopupWithForm(target);
				break;
			case 'boost':
				this.#showBoostPromo(target, needOverlay);
				break;
			case 'link':
				this.#showPopupWithLink(target);
				break;
			default:
				limitReached = false;
				console.error(`Unknown promo action type: ${actionType}`);
		}

		if (limitReached)
		{
			this.#notifyLimitReached();
		}
	}

	#notifyLimitReached(): void
	{
		ajax.runAction('disk.api.limitEncounter.documentEditSession', {});
	}

	#isActionDefined(): boolean
	{
		return this.action !== null;
	}

	#showPopupWithSlider(target: HTMLElement): void
	{
		if (!target)
		{
			console.error('OnlyofficePromoActions: target is not defined for slider with popup action');
		}

		this.#getPopupLimitsWithSlider().show(target);

		sendData({
			tool: 'docs',
			category: 'docs',
			event: 'limit_popup_show',
			...this.analytics,
		});
	}

	#getPopupLimitsWithSlider(): PopupLimits
	{
		const chatWithManager = new ChatWithManager(
			this.isCreate,
			this.action?.params?.increaseLimitRequest || null,
		);

		const popup = new PopupLimits({
			isCloud: this.isCloud,
			popupId: String(Math.random()),
			isLimitEdit: !this.isCreate,
			submitButtonCallback: () => {
				const sliderCode = this.#showSlider();
				if (sliderCode !== '')
				{
					popup.hide();
					sendData({
						tool: 'docs',
						category: 'docs',
						event: 'limit_popup_click',
						type: `sliderId_${sliderCode}`,
						...this.analytics,
					});
				}

				return {};
			},
			...(chatWithManager.canOpen()
				? { increaseLimitRequestButtonCallback: chatWithManager.getOpenHandler() }
				: {}
			),
		});

		return popup;
	}

	#showSlider(): string
	{
		const sliderCode = this.action?.code || '';
		if (sliderCode === '')
		{
			return '';
		}

		InfoHelper.show(sliderCode);

		return sliderCode;
	}

	#showForm(): void
	{
		const formOptions = this.action?.params?.formOptions;
		if (Type.isUndefined(formOptions))
		{
			console.error('OnlyofficePromoActions: form options is required');

			return;
		}

		Form.open(formOptions);
	}

	#showPopupWithForm(target: HTMLElement): void
	{
		if (!target)
		{
			console.error('OnlyofficePromoActions: target is not defined for form with popup action');
		}

		const formOptions = this.action?.params?.formOptions;
		if (Type.isUndefined(formOptions))
		{
			console.error('OnlyofficePromoActions: form options is required');

			return;
		}

		const popupLimits = new PopupLimits({
			isCloud: this.isCloud,
			popupId: String(Math.random()),
			isLimitEdit: !this.isCreate,
			submitButtonCallback: () => {
				popupLimits.hide();
				Form.open(formOptions);

				sendData({
					tool: 'docs',
					category: 'docs',
					event: 'limit_popup_click',
					type: 'feedback',
					...this.analytics,
				});

				return {};
			},
		});

		popupLimits.show(target);
		sendData({
			tool: 'docs',
			category: 'docs',
			event: 'limit_popup_show',
			...this.analytics,
		});
	}

	#showBoostPromo(target: HTMLElement, needOverlay: boolean): void
	{
		if (target)
		{
			const widget = Factory.getSessionBoostWidget().bindTo(target);

			if (needOverlay)
			{
				widget.setOverlay();
			}

			widget.show();
		}
		else
		{
			console.error('OnlyofficePromoActions: target is not defined for boost promo action');
		}
	}

	#showPopupWithLink(target: HTMLElement): void
	{
		const url = this.action?.params?.url ?? null;

		if (!Type.isStringFilled(url))
		{
			throw new Error('invalid url');
		}

		this.#getPopupLimitsWithLink(url).show(target);

		sendData({
			tool: 'docs',
			category: 'docs',
			event: 'limit_popup_show',
			...this.analytics,
		});
	}

	#getPopupLimitsWithLink(url: string): PopupLimits
	{
		const popup = new PopupLimits({
			isCloud: this.isCloud,
			popupId: String(Math.random()),
			isLimitEdit: !this.isCreate,
			submitButtonCallback: () => {
				const isNewTab = this.action?.params?.isNewTab ?? true;
				const urlTarget = isNewTab ? '_blank' : '_self';

				popup.hide();
				window.open(url, urlTarget);

				sendData({
					tool: 'docs',
					category: 'docs',
					event: 'limit_popup_click',
					type: 'helpdesk',
					...this.analytics,
				});

				return {};
			},
		});

		return popup;
	}

	#getExtensionParam(paramName: string): any
	{
		return Extension.getSettings('disk.onlyoffice-promo-actions').get(paramName);
	}
}
