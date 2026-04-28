import { Loc, Tag } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import '../style.css';

type PopupLimitsOptions = {
	bindElement: HTMLElement,
	popupId: string;
	isLimitEdit?: boolean,
	submitButtonCallback?: () => void,
}

export class PopupLimits
{
	#bindElement: HTMLElement | null = null;
	#popup: Popup | null = null;
	#popupId: string;
	#submitButton: Button;
	isLimitEdit: boolean = false;
	submitButtonCallback: () => void = () => {};

	constructor(options: PopupLimitsOptions)
	{
		this.#popupId = options.popupId || String(Math.random());
		this.#bindElement = options.bindElement;
		this.isLimitEdit = options.isLimitEdit === true;
		this.submitButtonCallback = options.submitButtonCallback;

		this.#initSubmitButton();
	}

	getPopupId(): string
	{
		return this.#popupId;
	}

	getPopup(): Popup
	{
		return this.#popup;
	}

	#renderPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="disk-popup-limits__content">
				<div class="disk-popup-limits__content_main">
					<div class="disk-popup-limits__content_text">
						${this.isLimitEdit
							? Loc.getMessage('DISK_POPUP_LIMITS_EDIT')
							: Loc.getMessage('DISK_POPUP_LIMITS_DOCUMENT_CREATE')
						}
					</div>
					<div class="disk-popup-limits__content_icon-box">
						<div class="disk-popup-limits__content_icon"></div>
					</div>
				</div>
				<div class="disk-popup-limits__content_footer">
					${this.#submitButton.render()}
				</div>
			</div>
		`;
	}

	#createPopup(): Popup
	{
		this.#popup = new Popup({
			id: this.#popupId,
			bindElement: this.#bindElement,
			titleBar: this.isLimitEdit
				? Loc.getMessage('DISK_POPUP_LIMITS_TITLE_EDIT')
				: Loc.getMessage('DISK_POPUP_LIMITS_TITLE_DOCUMENT_CREATE'),
			cacheable: true,
			closeIcon: true,
			className: 'disk-popup-limits',
			content: this.#renderPopupContent(),
			width: 550,
			padding: 0,
			autoHide: true,
		});
	}

	#initSubmitButton(): void
	{
		this.#submitButton = new Button({
			color: AirButtonStyle.FILLED,
			useAirDesign: true,
			text: Loc.getMessage('DISK_POPUP_LIMITS_SUBMIT_BTN'),
			round: true,
			noCaps: true,
			size: ButtonSize.MEDIUM,
			onclick: this.submitButtonCallback,
		});
	}

	show(): void
	{
		if (this.#popup === null)
		{
			this.#createPopup();
		}

		this.#popup.show();
	}

	hide(): void
	{
		this.#popup?.close();
	}
}
