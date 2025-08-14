import { Tag, Type, Dom } from 'main.core';
import { Dialog } from 'ui.entity-selector';
import './inline-placeholder-selector.css';
import 'ui.forms';
import { InlinePlaceholderSelectorOptions } from './inline-placeholder-selector-options';

export const InlinePlaceholderSelectorMode = {
	INPUT: 'input',
	TEXTAREA: 'textarea',
};

export class InlinePlaceholderSelector
{
	#mode: string;
	#value: string;
	#target: HTMLElement;
	#menuButton: HTMLElement;
	#dialog: Dialog;
	#inputElement: HTMLElement;
	#entityTypeId: number;

	constructor(params: InlinePlaceholderSelectorOptions)
	{
		if (!Type.isDomNode(params.target))
		{
			throw new Error('Target DOM node not found');
		}

		this.#target = params.target;
		this.#entityTypeId = Type.isInteger(params.entityTypeId) ? params.entityTypeId : 0;
		this.#mode = params.mode ?? InlinePlaceholderSelectorMode.INPUT;
		this.#value = params.value ?? '';
	}

	show()
	{
		Dom.append(this.#render(), this.#target);
	}

	getValue(): string
	{
		return this.#inputElement.value ?? '';
	}

	#getDialog(): Dialog
	{
		if (this.#dialog)
		{
			return this.#dialog;
		}

		this.#dialog = new Dialog({
			targetNode: this.#menuButton,
			multiple: false,
			showAvatars: false,
			dropdownMode: true,
			compactView: true,
			enableSearch: true,
			entities: [
				{
					id: 'placeholder',
					dynamicLoad: true,
					dynamicSearch: false,
					searchable: true,
					options: {
						entityTypeId: this.#entityTypeId,
					},
				},
			],
			events: {
				'Item:onSelect': (event: BaseEvent) => {
					const { item: selectedItem } = event.getData();
					this.#onSelect(selectedItem);
				},
			},
		});

		return this.#dialog;
	}

	#render(): HTMLElement
	{
		this.#menuButton = Tag.render`
			<span 
			onclick="${this.#openMenu.bind(this)}"
			class="crm-inline-placeholder-selector-dotted"
			></span>
		`;

		return Tag.render`
			<div class="crm-inline-placeholder-selector">
				${this.#renderFormElement()}
				${this.#menuButton}
			</div>
		`;
	}

	#renderFormElement(): HTMLElement
	{
		if (this.#mode === InlinePlaceholderSelectorMode.TEXTAREA)
		{
			this.#inputElement = Tag.render`<textarea class="ui-ctl-element" name="subject"></textarea>`;
			this.#inputElement.value = this.#value;

			return Tag.render`
				<div class="ui-ctl ui-ctl-textarea ui-ctl-no-resize ui-ctl-w100">
					${this.#inputElement}
				</div>
			`;
		}

		this.#inputElement = Tag.render`<input type="text" class="ui-ctl-element" name="subject">`;
		this.#inputElement.value = this.#value;

		return Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				${this.#inputElement}
			</div>
		`;
	}

	#openMenu()
	{
		this.#getDialog().show();
	}

	#onSelect(selectedItem)
	{
		const placeholder = `{${selectedItem.customData.get('text')}}`;

		const cursorPosition = this.#inputElement.selectionStart;
		const currentValue = this.#inputElement.value;

		this.#inputElement.value = currentValue.slice(0, cursorPosition) + placeholder + currentValue.slice(
			cursorPosition,
		);

		const newCursorPosition = cursorPosition + placeholder.length;
		this.#inputElement.setSelectionRange(newCursorPosition, newCursorPosition);

		this.#inputElement.focus();

		this.#getDialog().deselectAll();
	}
}
