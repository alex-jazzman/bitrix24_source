import { Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { Dialog } from 'ui.system.dialog';
import { Headline, Text as TypographyText } from 'ui.system.typography';
import 'ui.design-tokens.air';

import './style.css';

declare const BX: any;

type LockPopupButton = {
	text: string;
	url?: string;
	style?: string;
	closesPopup?: boolean;
	onclick?: () => void;
};

type LockPopupOptions = {
	title?: string;
	content?: string;
	buttons?: LockPopupButton[];
	width?: number;
	hasCloseButton?: boolean;
	closeByEsc?: boolean;
	closeByClickOutside?: boolean;
	hasOverlay?: boolean;
	showIcon?: boolean;
	useQueue?: boolean;
	closeSidePanelOnClose?: boolean;
	emitOnClose?: string;
};

type PreparedLockPopupOptions = {
	title: string;
	content: string;
	buttons: LockPopupButton[];
	width: number;
	hasCloseButton: boolean;
	closeByEsc: boolean;
	closeByClickOutside: boolean;
	hasOverlay: boolean;
	showIcon: boolean;
	useQueue: boolean;
	closeSidePanelOnClose: boolean;
	emitOnClose: string;
};

const ButtonStyle = Object.freeze({
	Filled: 'filled',
	Plain: 'plain',
	Outline: 'outline',
});

export class LockPopup
{
	#options: PreparedLockPopupOptions;
	#dialog: Dialog | null = null;
	#contentContainer: HTMLElement | null = null;
	#onDone: (() => void) | null = null;

	constructor(options: LockPopupOptions = {})
	{
		const preparedOptions = {
			title: '',
			content: '',
			buttons: [],
			width: 400,
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
			showIcon: true,
			useQueue: true,
			closeSidePanelOnClose: false,
			emitOnClose: '',
			...options,
		};
		preparedOptions.buttons = Array.isArray(options.buttons) ? options.buttons : [];

		this.#options = preparedOptions as PreparedLockPopupOptions;
	}

	static show(options: LockPopupOptions = {}): LockPopup
	{
		const popup = new this(options);
		popup.show();

		return popup;
	}

	show(): void
	{
		if (this.#options.useQueue === false)
		{
			this.#showDialog();

			return;
		}

		BannerDispatcher.high.toQueue((onDone: Function) => {
			this.#onDone = () => {
				onDone();
			};
			this.#showDialog();

			return {};
		});
	}

	hide(): void
	{
		this.#dialog?.hide();
	}

	#showDialog(): void
	{
		const dialogOptions = {
			title: this.#options.hasCloseButton ? ' ' : '',
			content: this.#renderContent(),
			centerButtons: this.#createButtons(),
			hasOverlay: this.#options.hasOverlay,
			width: this.#options.width,
			hasCloseButton: this.#options.hasCloseButton,
			hasVerticalPadding: false,
			hasHorizontalPadding: false,
			closeByEsc: this.#options.closeByEsc,
			closeByClickOutside: this.#options.closeByClickOutside,
		};

		this.#dialog = new Dialog(dialogOptions);

		this.#dialog.subscribe('onShow', () => {
			this.#handleShow();
		});

		this.#dialog.subscribe('onHide', () => {
			this.#handleHide();
		});

		this.#dialog.show();
	}

	#createButtons(): Button[]
	{
		return this.#options.buttons.map((buttonOptions) => {
			const options: Partial<ButtonOptions> = {
				text: buttonOptions.text,
				size: ButtonSize.LARGE,
				style: this.#getButtonStyle(buttonOptions.style),
				useAirDesign: true,
				onclick: (): {} => {
					this.#handleButtonClick(buttonOptions);

					return {};
				},
			};

			return new Button(options as ButtonOptions);
		});
	}

	#getButtonStyle(style: string | null | undefined): string
	{
		switch (style)
		{
			case ButtonStyle.Plain:
				return AirButtonStyle.PLAIN;
			case ButtonStyle.Outline:
				return AirButtonStyle.OUTLINE;
			case ButtonStyle.Filled:
			default:
				return AirButtonStyle.FILLED;
		}
	}

	#handleButtonClick(buttonOptions: LockPopupButton): void
	{
		const { onclick, url } = buttonOptions;

		if (typeof onclick === 'function')
		{
			onclick();
		}

		if (typeof url === 'string' && url.length > 0 && window.top)
		{
			window.top.location.href = url;
		}

		if (buttonOptions.closesPopup !== false)
		{
			this.hide();
		}
	}

	#renderContent(): HTMLElement
	{
		const title = Headline.render(this.#options.title, {
			size: 'sm',
			align: 'center',
			className: 'biconnector-lock-popup__title',
		});
		const content = TypographyText.render('', {
			tag: 'div',
			size: 'md',
			align: 'center',
			className: 'biconnector-lock-popup__content',
		});
		content.innerHTML = this.#options.content;
		const textBlock = Tag.render`
			<div class="biconnector-lock-popup__text">
				${title}
				${content}
			</div>
		`;

		const contentContainer = Tag.render`
			<div class="biconnector-lock-popup">
				${this.#renderIcon()}
				${textBlock}
			</div>
		` as HTMLElement;
		this.#contentContainer = contentContainer;

		return contentContainer;
	}

	#renderIcon(): HTMLElement | string
	{
		if (this.#options.showIcon === false)
		{
			return '';
		}

		return Tag.render`<div class="biconnector-lock-popup__icon"></div>`;
	}

	#handleShow(): void
	{
		const dialogContainer = this.#contentContainer
			?.closest('.ui-system-dialog')
		;

		dialogContainer?.classList.add('biconnector-lock-popup-dialog');

		if (this.#options.hasCloseButton)
		{
			dialogContainer?.classList.add('biconnector-lock-popup-dialog--with-header');
		}
	}

	#handleHide(): void
	{
		if (this.#options.closeSidePanelOnClose && BX.SidePanel?.Instance?.isOpen())
		{
			BX.SidePanel.Instance.close();
		}

		if (Type.isStringFilled(this.#options.emitOnClose))
		{
			EventEmitter.emit(this.#options.emitOnClose);
		}

		this.#onDone?.();
		this.#onDone = null;
		this.#dialog = null;
	}
}

export class LimitLockPopup extends LockPopup {}
