import { Dom, Runtime, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import type { ButtonOptions } from 'ui.buttons';
import { Headline, Text } from 'ui.system.typography';

import 'ui.design-tokens.air';

import { NoticePopupMode } from '../../const/mode';
import {
	type NoticePopupBindElement,
	type NoticePopupButtonOptions,
	type NoticePopupButtonStyle,
	type NoticePopupOptions,
	type PreparedNoticePopupOptions,
} from '../../const/options';
import { prepareOptions, resolveButtons } from '../../lib/options/options';
import { buildAccessDeniedOptions } from '../../lib/preset/preset';

import './notice-popup.css';

type NoticePopupDialog = {
	show: () => void,
	hide: () => void,
	subscribe: (eventName: string, handler: () => void) => NoticePopupDialog,
	subscribeOnce: (eventName: string, handler: () => void) => NoticePopupDialog,
};

type NoticePopupDialogConstructor = new (options: Record<string, unknown>) => NoticePopupDialog;
type DialogExtensionExports = {
	Dialog: NoticePopupDialogConstructor,
};

const BUTTON_STYLE_MAP: Record<NoticePopupButtonStyle, string> = {
	filled: AirButtonStyle.FILLED,
	outline: AirButtonStyle.OUTLINE,
	plain: AirButtonStyle.PLAIN,
};

const DIALOG_CLASS_NAME = 'crm-notice-popup-dialog';

export class NoticePopup
{
	#options: PreparedNoticePopupOptions;
	#popover: Popup | null = null;
	#dialog: NoticePopupDialog | null = null;
	#dialogLoadPromise: Promise<NoticePopupDialog> | null = null;

	constructor(options: NoticePopupOptions = {})
	{
		this.#options = prepareOptions(options);
	}

	static show(options: NoticePopupOptions = {}): NoticePopup
	{
		const popup = new this(options);
		popup.show();

		return popup;
	}

	static showAccessDenied(bindElement: NoticePopupBindElement, overrides: NoticePopupOptions = {}): NoticePopup
	{
		return this.show({ bindElement, ...buildAccessDeniedOptions(overrides) });
	}

	show(): void
	{
		if (this.#isDialog())
		{
			void this.#showDialog();

			return;
		}

		this.#getPopover().show();
	}

	close(): void
	{
		if (this.#isDialog())
		{
			this.#dialog?.hide();
		}
		else
		{
			this.#popover?.close();
		}
	}

	#isDialog(): boolean
	{
		return this.#options.mode === NoticePopupMode.Dialog;
	}

	#getPopover(): Popup
	{
		if (!this.#popover)
		{
			const content = Tag.render`
				<div class="crm-notice-popup__content">
					${this.#renderBody()}
					<div class="crm-notice-popup__buttons"></div>
				</div>
			`;

			const buttonsContainer = content.querySelector('.crm-notice-popup__buttons');

			this.#createButtons().forEach((button) => Dom.append(button.render(), buttonsContainer as HTMLElement));
			this.#popover = new Popup({
				bindElement: this.#options.bindElement,
				content,
				className: 'crm-notice-popup',
				ariaLabel: this.#options.title,
				width: this.#options.width,
				angle: this.#options.angle,
				autoHide: this.#options.autoHide,
				closeByEsc: this.#options.closeByEsc,
				closeIcon: this.#options.closeIcon,
				cacheable: this.#options.cacheable,
				padding: 0,
				contentPadding: 0,
				events: {
					onPopupDestroy: () => {
						this.#popover = null;
					},
				},
			});
		}

		return this.#popover;
	}

	async #showDialog(): Promise<void>
	{
		const dialog = await this.#getDialog();
		dialog.show();
	}

	#getDialog(): Promise<NoticePopupDialog>
	{
		if (this.#dialog)
		{
			return Promise.resolve(this.#dialog);
		}

		this.#dialogLoadPromise ??= Runtime.loadExtension('ui.system.dialog').then((extensionExports) => {
			if (this.#dialog)
			{
				return this.#dialog;
			}

			const { Dialog } = extensionExports as unknown as DialogExtensionExports;
			const body = this.#renderBody();
			Dom.addClass(body, '--boxed');

			const dialog = new Dialog({
				content: body,
				centerButtons: this.#createButtons(),
				hasOverlay: true,
				hasVerticalPadding: false,
				hasHorizontalPadding: false,
				width: this.#options.width,
				closeByEsc: this.#options.closeByEsc,
				closeByClickOutside: this.#options.autoHide,
				hasCloseButton: this.#options.closeIcon,
			});

			dialog.subscribe('onShow', () => {
				this.#handleDialogShow(body);
			});

			dialog.subscribeOnce('onHide', () => {
				this.#dialog = null;
				this.#dialogLoadPromise = null;
			});

			this.#dialog = dialog;

			return dialog;
		});

		return this.#dialogLoadPromise;
	}

	#handleDialogShow(body: HTMLElement): void
	{
		const dialogContainer = body.closest('.ui-system-dialog') as HTMLElement | null;
		if (dialogContainer)
		{
			Dom.addClass(dialogContainer, DIALOG_CLASS_NAME);

			if (Type.isStringFilled(this.#options.title))
			{
				Dom.attr(dialogContainer, 'aria-label', this.#options.title);
			}
		}
	}

	#renderBody(): HTMLElement
	{
		return Tag.render`
			<div class="crm-notice-popup__body">
				${this.#renderIllustration()}
				<div class="crm-notice-popup__text">
					${Headline.render(this.#options.title, { size: 'md', align: 'center', className: 'crm-notice-popup__title' })}
					${Text.render(this.#options.text, { tag: 'p', size: 'lg', align: 'center', className: 'crm-notice-popup__subtitle' })}
				</div>
			</div>
		`;
	}

	#renderIllustration(): HTMLElement
	{
		const illustration = this.#options.illustration;
		const node = Tag.render`<div class="crm-notice-popup__illustration"></div>`;
		if (!Type.isStringFilled(illustration))
		{
			return node;
		}

		Dom.addClass(node, `--${illustration}`);

		return node;
	}

	#createButtons(): Button[]
	{
		return resolveButtons(this.#options).map((config: NoticePopupButtonOptions) => {
			const buttonOptions: Partial<ButtonOptions> = {
				text: config.text,
				size: ButtonSize.LARGE,
				style: config.style ? BUTTON_STYLE_MAP[config.style] : AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					this.#handleButtonClick(config);

					return {};
				},
			};

			return new Button(buttonOptions as ButtonOptions);
		});
	}

	#handleButtonClick(config: NoticePopupButtonOptions): void
	{
		if (Type.isFunction(config.onclick))
		{
			config.onclick({
				close: () => this.close(),
			});
		}

		if (config.closesPopup !== false)
		{
			this.close();
		}
	}
}
