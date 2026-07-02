import { Dom, Event, Tag } from 'main.core';
import { CloseIconSize, Popup, PopupManager } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import './style.css';

export const ActionPosition = {
	center: 'center',
	left: 'left',
};

export const ContentPosition = {
	center: 'center',
	left: 'left',
};

export type ActionConfiguration = {
	position: ActionConfiguration,
	actions: BaseDialogAction[],
};

export type BaseDialogAction = {
	text: string,
	style: AirButtonStyle,
	onclick: Function,
	id?: string,
};

export class BaseDialog
{
	#popup: ?Popup = null;
	#bodyElement: ?HTMLElement = null;
	#headerElement: ?HTMLElement = null;
	#titleElement: ?HTMLElement = null;
	#contentContainer: ?HTMLElement = null;
	#actionsContainer: ?HTMLElement = null;
	#buttons: Map<string, Button> = new Map();
	#options: Object;

	constructor(options: Object = {})
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

	getPopup(): ?Popup
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

	setContentAlign(align: $Values<typeof ContentPosition>): void
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
			const button = new Button({
				text: action.text,
				style: action.style,
				size: ButtonSize.LARGE,
				useAirDesign: true,
				onclick: action.onclick,
			});

			if (action.id)
			{
				this.#buttons.set(action.id, button);
			}

			Dom.append(button.render(), this.#actionsContainer);
		});
	}

	setActionsAlign(align: $Values<typeof ActionPosition>): void
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
		if (this.#popup?.closeIcon)
		{
			Dom.show(this.#popup.closeIcon);
		}
	}

	hideCloseIcon(): void
	{
		if (this.#popup?.closeIcon)
		{
			Dom.hide(this.#popup.closeIcon);
		}
	}

	getButton(id: string): ?Button
	{
		return this.#buttons.get(id) ?? null;
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
			cacheable: this.#options.cacheable,
			width: this.#options.width,
			borderRadius: 18,
			contentPadding: 0,
			padding: 0,
			events: {
				onClose: () => {
					this.#popup?.destroy();
					this.#popup = null;
					this.onClose();
				},
			},
		});

		if (popup.overlay?.element)
		{
			Event.bind(popup.overlay.element, 'click', () => this.close());
		}

		return popup;
	}

	onClose(): void
	{
		// override in subclass
	}
}
