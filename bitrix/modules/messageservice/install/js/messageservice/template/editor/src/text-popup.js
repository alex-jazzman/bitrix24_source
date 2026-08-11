import { Event, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup, PopupWindowManager } from 'main.popup';
import { Button, ButtonState } from 'ui.buttons';

export class TextPopup extends EventEmitter
{
	#popup: Popup = null;
	#input: HTMLInputElement = null;
	#bindElement: HTMLElement = null;
	#value: string = null;

	constructor({ bindElement, value, events = {} })
	{
		super();

		this.setEventNamespace('BX.MessageService.Template.Editor.TextPopup');

		this.#bindElement = bindElement;
		this.#value = value;

		this.subscribeFromOptions(events);
	}

	destroy(): void
	{
		this.unsubscribeAll();

		this.#popup?.destroy();
	}

	show(): void
	{
		this.#getPopup().show();
	}

	#getPopup(): Popup
	{
		if (this.#popup === null)
		{
			this.#popup = PopupWindowManager.create(
				'messageservice-template-editor-text-popup',
				this.#bindElement,
				{
					autoHide: true,
					content: this.#getContent(),
					closeByEsc: true,
					closeIcon: false,
					buttons: this.#getMenuButtons(),
					cacheable: false,
					events: {
						onShow: () => {
							this.emit('onShow');

							// Give time for input to render before setting focus.
							setTimeout(() => {
								this.#input.focus();
								this.#setCursorToEnd();
							}, 0);
						},
						onClose: this.emit.bind(this, 'onHide'),
					},
				},
			);
		}

		return this.#popup;
	}

	#getContent(): HTMLElement
	{
		const { root, input } = Tag.render`
			<div class="messageservice-template-editor-text-popup-wrapper">
				<input 
					ref="input"
					type="text" 
					value="${Text.encode(this.#value)}"
					maxlength="255"
					placeholder="${Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_SELECT_FIELD_PLACEHOLDER')}
				">
			</div>
		`;

		this.#input = input;

		this.#bindInputEvents();

		return root;
	}

	#bindInputEvents(): void
	{
		Event.bind(this.#input, 'keyup', (event: InputEvent) => {
			const button = this.#getApplyButtonInstance();
			if (!button)
			{
				return;
			}

			const { value } = event.target;
			this.#adjustButtonState(button, value);
		});
	}

	#getMenuButtons(): Button[]
	{
		return [
			this.#getApplyButton(),
			this.#getCancelButton(),
		];
	}

	#getApplyButton(): Button
	{
		const button = new Button({
			id: 'apply-button',
			text: this.#getApplyButtonText(),
			className: 'ui-btn ui-btn-xs ui-btn-primary ui-btn-round',
			onclick: () => {
				this.#onApplyButtonClick();
			},
		});

		const { value } = this.#input;
		this.#adjustButtonState(button, value);

		return button;
	}

	#adjustButtonState(button: Button, value: string): void
	{
		button.setState(
			(Type.isStringFilled(value) && Type.isStringFilled(value.trim()))
				? ButtonState.ACTIVE
				: ButtonState.DISABLED,
		);
	}

	#getApplyButtonText(): string
	{
		if (Type.isStringFilled(this.#value))
		{
			return Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_TEXT_POPUP_UPDATE');
		}

		return Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_TEXT_POPUP_ADD');
	}

	#onApplyButtonClick(): void
	{
		const button = this.#getApplyButtonInstance();
		if (button.getState() !== ButtonState.ACTIVE)
		{
			return;
		}

		const { value } = this.#input;
		this.emit('onApply', { value: value.trim() });

		this.destroy();
	}

	#getApplyButtonInstance(): Button
	{
		return this.#popup.getButton('apply-button');
	}

	#getCancelButton(): Button
	{
		return new Button({
			text: Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_TEXT_POPUP_CANCEL'),
			className: 'ui-btn ui-btn-xs ui-btn-light ui-btn-round',
			onclick: () => {
				this.destroy();
			},
		});
	}

	#setCursorToEnd(): void
	{
		const { length } = this.#input.value;

		this.#input.selectionStart = length;
		this.#input.selectionEnd = length;
	}
}
