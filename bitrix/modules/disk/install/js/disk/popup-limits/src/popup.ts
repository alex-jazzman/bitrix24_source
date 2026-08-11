import { Loc, Tag, Type, Event } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, BaseButton, Button, ButtonSize } from 'ui.buttons';
import { InfoHelper } from 'ui.info-helper';

import '../style.css';

type ButtonCallback = (button: BaseButton, event: MouseEvent) => {};

type PopupLimitsOptions = {
	popupId: string;
	isLimitEdit?: boolean;
	submitButtonCallback?: ButtonCallback;
	increaseLimitRequestButtonCallback?: ButtonCallback;
	isCloud: boolean;
};

export class PopupLimits
{
	private readonly popupId: string;
	private readonly isLimitEdit: boolean = false;
	private readonly submitButton: Button;
	private popup: Popup | null = null;
	private increaseLimitRequestButton: Button | null = null;
	private readonly partnerButtonId: string = 'popup-limits-partner-button-';
	private isCloud: boolean;

	constructor(options: PopupLimitsOptions)
	{
		this.isCloud = options.isCloud;
		this.popupId = options.popupId || String(Math.random());
		this.partnerButtonId += String(Math.random());
		this.isLimitEdit = options.isLimitEdit === true;
		this.submitButton = this.initSubmitButton(options.submitButtonCallback);

		if (Type.isFunction(options.increaseLimitRequestButtonCallback))
		{
			this.increaseLimitRequestButton = this.initIncreaseLimitRequestButton(options.increaseLimitRequestButtonCallback);
		}
	}

	public getPopupId(): string
	{
		return this.popupId;
	}

	public getPopup(): Popup | null
	{
		return this.popup;
	}

	private renderPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="disk-popup-limits__content">
				<div class="disk-popup-limits__content_main">
					<div class="disk-popup-limits__content_text">
						${this.getText()}
					</div>
					<div class="disk-popup-limits__content_icon-box">
						<div class="disk-popup-limits__content_icon"></div>
					</div>
				</div>
				<div class="disk-popup-limits__content_footer">
					${this.submitButton.render()}
					${this.increaseLimitRequestButton?.render()}
				</div>
			</div>
		`;
	}

	private getText(): string
	{
		if (this.isCloud)
		{
			const replacements = { '[partner_link]': `<a href="#" id="${this.partnerButtonId}">`, '[/partner_link]': '</a>' };
			if (this.isLimitEdit)
			{
				return Loc.getMessage('DISK_POPUP_LIMITS_EDIT_CLOUD', replacements) ?? '';
			}

			return Loc.getMessage('DISK_POPUP_LIMITS_DOCUMENT_CREATE_CLOUD', replacements) ?? '';
		}

		if (this.isLimitEdit)
		{
			return Loc.getMessage('DISK_POPUP_LIMITS_EDIT') ?? '';
		}

		return Loc.getMessage('DISK_POPUP_LIMITS_DOCUMENT_CREATE') ?? '';
	}

	private createPopup(): Popup
	{
		this.popup = new Popup({
			id: this.popupId,
			titleBar: this.isLimitEdit
				? Loc.getMessage('DISK_POPUP_LIMITS_TITLE_EDIT') ?? ''
				: Loc.getMessage('DISK_POPUP_LIMITS_TITLE_DOCUMENT_CREATE') ?? '',
			cacheable: true,
			closeIcon: true,
			className: 'disk-popup-limits',
			content: this.renderPopupContent(),
			width: 664,
			padding: 0,
			autoHide: true,
			events: {
				onAfterPopupShow: () => this.initPartnerButton(),
				onPopupAfterClose: () => {
					this.popup?.destroy();
					this.popup = null;
				},
			},
		});

		return this.popup;
	}

	private initSubmitButton(callback: ButtonCallback | undefined): Button
	{
		return new Button({
			useAirDesign: true,
			text: this.getSubmitButtonText(),
			round: true,
			noCaps: true,
			collapsedIcon: '',
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.FILLED,
			onclick: callback ?? (() => ({})),
		});
	}

	private getSubmitButtonText(): string
	{
		if (this.isCloud)
		{
			return Loc.getMessage('DISK_POPUP_LIMITS_SUBMIT_BTN_CLOUD') ?? '';
		}

		return Loc.getMessage('DISK_POPUP_LIMITS_SUBMIT_BTN') ?? '';
	}

	private initIncreaseLimitRequestButton(callback: ButtonCallback): Button
	{
		return new Button({
			useAirDesign: true,
			text: Loc.getMessage('DISK_POPUP_LIMITS_WRITE_TO_MANAGER_BTN') ?? '',
			round: true,
			noCaps: true,
			collapsedIcon: '',
			size: ButtonSize.MEDIUM,
			style: AirButtonStyle.OUTLINE,
			onclick: callback,
		});
	}

	private initPartnerButton(): void
	{
		const partnerButton = document.getElementById(this.partnerButtonId);

		if (partnerButton !== null)
		{
			Event.bind(partnerButton, 'click', (event) => {
				event.preventDefault();

				InfoHelper.show('info_implementation_request_boost');

				this.hide();
			});
		}
	}

	show(bindElement: HTMLElement): void
	{
		if (this.popup === null)
		{
			this.createPopup();
		}

		this.popup?.setBindElement(bindElement);
		this.popup?.show();
	}

	hide(): void
	{
		this.popup?.close();
	}
}
