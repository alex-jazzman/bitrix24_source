import { Dom, Tag } from 'main.core';
import { Loader } from 'main.loader';
import { CloseIconSize, type Popup, PopupManager } from 'main.popup';
import { type AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import './style.css';

export enum ActionPosition
{
	center = 'center',
	left = 'left',
}

export enum ContentPosition
{
	center = 'center',
	left = 'left',
}

export type ActionConfiguration = {
	position: ActionPosition;
	actions: BaseDialogAction[];
};

export type BaseDialogAction = {
	text: string;
	style: AirButtonStyle;
	onclick: () => void;
	id?: string;
};

export type BaseDialogOptions = {
	id?: string;
	title?: string;
	width?: number;
	cacheable?: boolean;
};

export type BeforeShowContentOptions<T> = {
	showLoader?: boolean;
	action: () => Promise<T> | T;
};

export class BaseDialog
{
	#popup: Popup | null = null;
	#bodyElement!: HTMLElement;
	#headerElement!: HTMLElement;
	#titleElement!: HTMLElement;
	#contentContainer!: HTMLElement;
	#actionsContainer!: HTMLElement;
	#buttons: Map<string, Button> = new Map();
	#options: Required<BaseDialogOptions>;
	#loader: Loader | null = null;

	constructor(options: BaseDialogOptions = {})
	{
		this.#options = {
			id: options.id ?? 'mail-client-dialog',
			title: options.title ?? '',
			width: options.width ?? 490,
			cacheable: options.cacheable ?? false,
		};
	}

	show(): void
	{
		if (this.#popup)
		{
			this.#popup.destroy();
			this.#popup = null;
		}

		this.#popup = this.#createPopup();
		this.#popup.show();
	}

	close(): void
	{
		this.#popup?.close();
	}

	getPopup(): Popup | null
	{
		return this.#popup;
	}

	setContent(node: HTMLElement): void
	{
		if (this.#contentContainer)
		{
			Dom.clean(this.#contentContainer);
			Dom.append(node, this.#contentContainer);
			this.#popup?.adjustPosition();
		}
	}

	setContentAlign(align: ContentPosition): void
	{
		if (!this.#contentContainer)
		{
			return;
		}

		Dom.removeClass(this.#contentContainer, 'mail__client_dialog_base-dialog_content--center');
		Dom.removeClass(this.#contentContainer, 'mail__client_dialog_base-dialog_content--left');
		Dom.addClass(this.#contentContainer, `mail__client_dialog_base-dialog_content--${align}`);
	}

	setActions(configuration: ActionConfiguration): void
	{
		Dom.clean(this.#actionsContainer);
		this.#buttons.clear();

		if (!this.#actionsContainer.parentNode)
		{
			Dom.append(this.#actionsContainer, this.#bodyElement);
		}

		this.setActionsAlign(configuration.position ?? ActionPosition.left);

		configuration.actions.forEach((action) => {
			const button = new Button(({
				text: action.text,
				style: action.style,
				size: ButtonSize.LARGE,
				useAirDesign: true,
				onclick: action.onclick,
			}) as any);

			if (action.id)
			{
				this.#buttons.set(action.id, button);
			}

			Dom.append(button.render(), this.#actionsContainer);
		});
	}

	setActionsAlign(align: ActionPosition): void
	{
		this.#actionsContainer.className = 'mail__client_dialog_base-dialog_actions';
		Dom.addClass(this.#actionsContainer, `mail__client_dialog_base-dialog_actions--${align}`);
	}

	hideActions(): void
	{
		Dom.remove(this.#actionsContainer);
		this.#buttons.clear();
	}

	setTitle(title: string): void
	{
		if (title?.length > 0)
		{
			this.#titleElement.textContent = title;

			if (!this.#headerElement.parentNode)
			{
				Dom.prepend(this.#headerElement, this.#bodyElement);
			}
		}
		else
		{
			this.#titleElement.textContent = '';
			Dom.remove(this.#headerElement);
		}
	}

	setBodyPadding(padding: string): void
	{
		if (this.#bodyElement)
		{
			Dom.style(this.#bodyElement, 'padding', padding);
		}
	}

	setWidth(width: number): void
	{
		this.#popup?.setWidth(width);
	}

	showCloseIcon(): void
	{
		const container = this.#popup?.getPopupContainer();
		if (container)
		{
			Dom.removeClass(container, 'mail__client_dialog_base-dialog--hide-close-icon');
		}
	}

	hideCloseIcon(): void
	{
		const container = this.#popup?.getPopupContainer();
		if (container)
		{
			Dom.addClass(container, 'mail__client_dialog_base-dialog--hide-close-icon');
		}
	}

	getButton(id: string): Button | null
	{
		return this.#buttons.get(id) ?? null;
	}

	showLoader(): void
	{
		const loaderTarget = Tag.render`
			<div class="mail__client_dialog_base-dialog_loader"></div>
		`;

		this.setTitle('');
		this.setContent(loaderTarget);
		this.hideActions();

		this.#loader = new Loader({ size: 60, mode: 'inline' });
		this.#loader.show(loaderTarget as any);
	}

	hideLoader(): void
	{
		this.#loader?.destroy();
		this.#loader = null;

		this.setTitle(this.#options.title);
	}

	async doBeforeShowContent<T>(options: BeforeShowContentOptions<T>): Promise<T>
	{
		const useLoader = options.showLoader ?? false;

		if (useLoader)
		{
			this.showLoader();
		}

		try
		{
			return await options.action();
		}
		finally
		{
			if (useLoader)
			{
				this.hideLoader();
			}
		}
	}

	#createPopup(): Popup
	{
		this.#titleElement = Tag.render`
			<span class="mail__client_dialog_base-dialog_title">
				${this.#options.title}
			</span>
		`;

		this.#headerElement = Tag.render`
			<div class="mail__client_dialog_base-dialog_header">
				${this.#titleElement}
			</div>
		`;

		this.#contentContainer = Tag.render`
			<div class="mail__client_dialog_base-dialog_content"></div>
		`;

		this.#actionsContainer = Tag.render`
			<div class="mail__client_dialog_base-dialog_actions"></div>
		`;

		this.#bodyElement = Tag.render`
			<div class="mail__client_dialog_base-dialog_body">
				${this.#headerElement}
				${this.#contentContainer}
				${this.#actionsContainer}
			</div>
		`;

		const popup = PopupManager.create({
			id: this.#options.id,
			className: 'mail__client_dialog_base-dialog --ui-context-content-light',
			content: this.#bodyElement,
			closeIcon: true,
			closeIconSize: CloseIconSize.LARGE,
			closeByEsc: true,
			overlay: true,
			autoHide: true,
			cacheable: this.#options.cacheable,
			width: this.#options.width,
			borderRadius: '18px',
			contentPadding: 0,
			padding: 0,
			events: {
				onClose: () => {
					this.#popup?.destroy();
					this.#popup = null;
					this.hideLoader();
					this.onClose();
				},
			},
		});

		return popup;
	}

	onClose(): void
	{
		// override in subclass
	}
}
