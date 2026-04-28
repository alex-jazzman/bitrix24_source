import { Dom, Event, Extension, Loc, Tag, Text, Type, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, Popup } from 'main.popup';
import { AirButtonStyle, Button } from 'ui.buttons';
import 'ui.feedback.partnerform';
import 'ui.icon-set.outlined';

import { PartnerDiscontinue } from 'intranet.partner-discontinue';
import { Content } from './content';

export class IntegratorContent extends Content
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div data-id="license-widget-block-partner" class="license-widget-item license-widget-item--secondary">
					<div class="license-widget-inner">
						<div class="license-widget-content">
							${this.getIcon()}
							<div class="license-widget-item-content">
								${this.getTitle()}
								${this.getDescription()}
							</div>
						</div>
						${this.getButtons()}
					</div>
				</div>
			`;
		});
	}

	getConfig(): Object
	{
		return {
			html: this.getLayout(),
			className: 'license-widget-section-with-box',
		};
	}

	getIcon(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			return Tag.render`
				<div class="license-widget-item-icon license-widget-item-icon--b24-partner">
					${
						(this.isConnected() && this.getPartnerLogo() !== '')
							? Tag.safe`<img class="license-widget-item-icon-img" src="${this.getPartnerLogo()}" alt="">`
							: ''
					}
				</div>
			`;
		});
	}

	getTitle(): HTMLElement
	{
		return this.cache.remember('title', () => {
			const isPartnerConnect = this.isConnected();
			const title = isPartnerConnect && this.getPartnerName() !== ''
				? this.#getTitleWithIntegrator()
				: this.#getTitleWithoutPartner();

			if (isPartnerConnect && this.getPartnerUrl())
			{
				Event.bind(title, 'click', async () => {
					window.open(this.getPartnerUrl(), '_blank', 'noopener,noreferrer');
				});
			}

			return title;
		});
	}

	#getTitleWithIntegrator(): HTMLElement
	{
		return Tag.render`
			<div class="license-widget-item-name --link">
				${Text.encode(this.getPartnerName())}
				<div class="license-widget-item-chevron-right">
					<div class="ui-icon-set --chevron-right"></div>
				</div>
				${this.#getHelpIcon()}
			</div>
		`;
	}

	#getTitleWithoutPartner(): HTMLElement
	{
		return Tag.render`
			<div class="license-widget-item-name">
				<span>${this.getOptions().title}</span>
				${this.#getHelpIcon()}
			</div>
		`;
	}

	#getHelpIcon(): HTMLElement
	{
		const showHelper = (event) => {
			event.stopPropagation();
			BX.Helper.show('redirect=detail&code=26952922');
		};

		return Tag.render`<span class="license-widget-item-help" onclick="${showHelper}"></span>`;
	}

	getDescription(): HTMLElement
	{
		return this.cache.remember('description', () => {
			return Tag.render`
				<div class="license-widget-option-text --flex">
					${this.getOptions().description}
				</div>
			`;
		});
	}

	getButtons(): ?HTMLElement
	{
		return this.cache.remember('button', () => {
			return this.isConnected()
				? this.#renderButtonsWithConnectedPartner()
				: this.#renderButtonsWithoutPartner();
		});
	}

	#renderButtonsWithConnectedPartner(): HTMLElement | string
	{
		const buttonConnect = Tag.render`
			<a class="license-widget-item-btn" >
				${this.getButtonTitle('connect')}
			</a>
		`;

		Event.bind(buttonConnect, 'click', async () => {
			this.#closeBasePopup();
			const params = this.getOptions().connectPartnerFormParams ?? {};
			if (BX?.Intranet?.Bitrix24?.PartnerForm?.showConnectForm)
			{
				await BX.Intranet.Bitrix24.PartnerForm.showConnectForm(params);
			}
			else
			{
				this.showInfoHelper('info_implementation_request');
			}
		});

		const buttonContainer = Tag.render`
			<div class="license-widget-item-btn-container">
				${buttonConnect}
			</div>
		`;

		if (this.isCurrentUserAdmin())
		{
			const buttonMore = Tag.render`
				<a class="license-widget-item-btn --partner-more" >
					<div class="ui-icon-set --more-m"></div>
				</a>
			`;

			const menu = this.getMoreMenu(buttonMore);
			Event.bind(buttonMore, 'click', () => {
				menu.show();
			});

			Dom.append(buttonMore, buttonContainer);
		}

		return buttonContainer;
	}

	#renderButtonsWithoutPartner(): HTMLElement
	{
		const button = Tag.render`
			<a class="license-widget-item-btn">
				${this.getButtonTitle('choose')}
			</a>
		`;

		Event.bind(button, 'click', () => {
			this.showInfoHelper('info_implementation_request');
		});

		return Tag.render`
			<div class="license-widget-item-btn-container">
				${button}
			</div>
		`;
	}

	getMoreMenu(bindElement: HTMLElement): Menu
	{
		return this.cache.remember('partner_menu', () => {
			const menu = new Menu({
				bindElement,
				cacheable: true,
				items: [
					{
						text: this.getButtonTitle('feedback'),
						onclick: () => {
							menu.close();
							this.showFeedbackForm();
						},
					},
					{
						text: this.getButtonTitle('discontinue'),
						onclick: () => {
							menu.close();
							(new PartnerDiscontinue())
								.getPopup({
									onConfirm: () => {
										this.#showDiscontinueFeedbackForm();
									},
								})
								.show();
						},
					},
				],
			});

			return menu;
		});
	}

	showFeedbackForm(): void
	{
		const presets = this.getOptions().feedbackFormPresets ?? {};

		if (!Type.isObject(presets) || Type.isArray(presets))
		{
			return;
		}

		BX.UI.Feedback.PartnerForm.showFeedback({
			id: 'partner-feedback',
			presets,
			title: Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_FEEDBACK_TITLE'),
		});
	}

	showInfoHelper(articleCode: string): void
	{
		if (BX?.UI?.InfoHelper)
		{
			BX.UI.InfoHelper.show(articleCode);

			return;
		}

		if (BX?.Helper)
		{
			BX.Helper.show(`redirect=detail&code=${articleCode}`);
		}
	}

	getButtonTitle(type: string): string
	{
		const buttons = this.getOptions().buttons ?? {};

		switch (type)
		{
			case 'connect':
				return buttons?.connect?.title;
			case 'choose':
				return buttons?.choose?.title;
			case 'feedback':
				return buttons?.menu?.feedback?.title;
			case 'discontinue':
				return buttons?.menu?.discontinue?.title;
			default:
				return '';
		}
	}

	isConnected(): boolean
	{
		return Boolean(this.getOptions().isConnected ?? this.getOptions().isPartnerConnect);
	}

	getPartnerName(): string
	{
		return this.getOptions().integratorName ?? this.getOptions().partnerName ?? '';
	}

	getPartnerUrl(): string
	{
		return this.getOptions().integratorUrl ?? this.getOptions().partnerUrl ?? '';
	}

	getPartnerLogo(): string
	{
		return this.getOptions().integratorLogo ?? this.getOptions().partnerLogo ?? '';
	}

	isCurrentUserAdmin(): boolean
	{
		return this.getOptions().isCurrentUserAdmin === true;
	}

	#closeBasePopup()
	{
		EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.LicenseWidget.Popup:openChild');
	}

	#showDiscontinueFeedbackForm(): void
	{
		const presets = this.getOptions().feedbackFormPresets ?? {};

		if (!Type.isObject(presets) || Type.isArray(presets))
		{
			return;
		}

		BX.UI.Feedback.PartnerForm.showRefusal({
			id: 'partner-refusal',
			presets,
			title: Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_FEEDBACK_TITLE'),
		});

		top.addEventListener('b24:form:send:success', (event) => {
			const rawFormId = event?.detail?.object?.identification?.id;
			if (Type.isNil(rawFormId))
			{
				return;
			}

			const formId = String(rawFormId);
			const refusalIds = this.#getRefusalFormIds();
			if (refusalIds.length === 0 || refusalIds.includes(formId))
			{
				ajax.runAction('intranet.v2.Partner.Relation.delete', {})
					.then(() => {
						this.#showSuccessDiscontinuePopup();
					})
					.catch((error) => {
						BX.UI.Notification.Center.notify({
							content: Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_ERROR'),
						});
						top.console.error(error);
					});
			}
		}, { once: true });
	}

	#getRefusalFormIds(): Array
	{
		const forms = Extension.getSettings('ui.feedback.partnerform')?.get('partnerRefusalForms');

		if (!Array.isArray(forms))
		{
			return [];
		}

		return forms
			.map((item) => item?.id)
			.filter((id) => Type.isNumber(id) || Type.isStringFilled(id))
			.map(String);
	}

	#showSuccessDiscontinuePopup(): void
	{
		const isSliderOpen = top.BX.SidePanel?.Instance?.getOpenSliders
			&& typeof top.BX.SidePanel.Instance.getOpenSliders === 'function'
			? top.BX.SidePanel.Instance.getOpenSliders().length > 0
			: false;

		if (isSliderOpen)
		{
			top.BX.Event.EventEmitter.subscribeOnce(
				'SidePanel.Slider:onCloseComplete',
				() => {
					this.#getSuccessDiscontinuePopup().show();
				},
			);
		}
		else
		{
			this.#getSuccessDiscontinuePopup().show();
		}
	}

	#getSuccessDiscontinuePopup(): Popup
	{
		return this.cache.remember('success-discontinue-popup', () => {
			const popup = new Popup({
				useAirDesign: true,
				content: this.#getSuccessDiscontinuePopupContent(),
				closeIcon: true,
				cacheable: true,
				className: 'license-widget-partner-success-discontinue-popup',
				width: 590,
				overlay: {
					opacity: 100,
					backgroundColor: 'rgba(0, 32, 78, 0.46)',
				},
				buttons: [
					new Button({
						text: Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_CHOOSE_NEW_BTN'),
						useAirDesign: true,
						style: AirButtonStyle.FILLED,
						className: 'license-widget-partner-success-discontinue-popup-choose-new-btn',
						onclick: () => {
							popup.close();
							this.showInfoHelper('info_implementation_request');
							top.BX.Event.EventEmitter.subscribeOnce('SidePanel.Slider:onCloseComplete', () => {
								location.reload();
							});
						},
					}),
					new Button({
						text: Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_CLOSE_BTN'),
						useAirDesign: true,
						style: AirButtonStyle.OUTLINE,
						onclick: () => {
							popup.close();
							location.reload();
						},
					}),
				],
			});

			return popup;
		});
	}

	#getSuccessDiscontinuePopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="license-widget-partner-success-discontinue-popup-content">
				<div class="license-widget-partner-success-discontinue-popup-content-text-wrapper">
					<div class="license-widget-partner-success-discontinue-popup-content-title">
						${Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_TITLE')}
					</div>
					<div class="license-widget-partner-success-discontinue-popup-content-description">
						${Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_DESC')}
					</div>
				</div>
				<div class="license-widget-partner-success-discontinue-popup-content-image">
				</div>
			</div>
		`;
	}
}
