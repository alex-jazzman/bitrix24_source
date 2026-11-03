import {BaseField} from 'landing.ui.field.basefield';
import { Type, Event, Dom, Runtime, Tag } from 'main.core';
import {BaseEvent} from 'main.core.events';
import {fetchEventsFromOptions} from 'landing.ui.component.internal';

const NBSP = '\u00A0';
const NBSP_ENTITY_PATTERN = /&(?:amp;)*(?:nbsp|#160|#x0*a0);/gi;
const EDGE_REGULAR_WHITESPACE_PATTERN = /^[\t\n\r ]+|[\t\n\r ]+$/g;

export class TextField extends BaseField
{
	constructor(options)
	{
		super(options);
		this.setEventNamespace('BX.Landing.UI.Field.TextField');
		this.subscribeFromOptions(fetchEventsFromOptions(options));

		this.bind = this.options.bind;
		this.changeTagButton = this.options.changeTagButton;
		this.onInputHandler = Type.isFunction(this.options.onInput) ? this.options.onInput : () => {};
		this.onValueChangeHandler = Type.isFunction(this.options.onValueChange) ? this.options.onValueChange : () => {};
		this.textOnly = Type.isBoolean(this.options.textOnly) ? this.options.textOnly : false;
		if (this.textOnly)
		{
			this.input.textContent = this.decodeTextOnlyContent(this.content);
		}
		else
		{
			this.input.innerHTML = this.content;
		}

		this.#createFooter();
		this.setFooterText(this.options.footerText ?? '');

		this.onInputClick = this.onInputClick.bind(this);
		this.onInputMousedown = this.onInputMousedown.bind(this);
		this.onDocumentMouseup = this.onDocumentMouseup.bind(this);
		this.onInputInput = this.onInputInput.bind(this);
		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.onDocumentKeydown = this.onDocumentKeydown.bind(this);
		this.onInputKeydown = this.onInputKeydown.bind(this);
		this.onInputFocus = this.onInputFocus.bind(this);

		this.enableTextboxAccessibility({multiline: !this.isTextOnly()});

		Event.bind(this.input, 'click', this.onInputClick);
		Event.bind(this.input, 'mousedown', this.onInputMousedown);
		Event.bind(this.input, 'input', this.onInputInput);
		Event.bind(this.input, 'keydown', this.onInputKeydown);
		Event.bind(this.input, 'focus', this.onInputFocus);

		const editorPanel = BX.Landing.UI.Panel.EditorPanel.getInstance();
		const editorPanelDocument = editorPanel && editorPanel.layout ? editorPanel.layout.ownerDocument : null;
		if (editorPanelDocument)
		{
			Event.bind(editorPanelDocument, 'click', this.onDocumentClick);
			Event.bind(editorPanelDocument, 'keydown', this.onDocumentKeydown);
			Event.bind(editorPanelDocument, 'mouseup', this.onDocumentMouseup);
		}
	}

	createInput(): HTMLDivElement
	{
		// BaseField calls createInput() from its constructor, before this.textOnly is set:
		// text-only string content must never reach innerHTML, even for a moment.
		const isTextOnly = this.options?.textOnly === true;
		if (isTextOnly && (Type.isString(this.content) || Type.isNumber(this.content)))
		{
			const input = Tag.render`<div class="landing-ui-field-input"></div>`;
			input.textContent = this.decodeTextOnlyContent(this.content);

			return input;
		}

		return super.createInput();
	}

	onInputInput()
	{
		this.onInputHandler(this.input.innerText);
		this.onValueChangeHandler(this);

		const event = new BaseEvent({
			data: {value: this.getValue()},
			compatData: [this.getValue()],
		});

		this.emit('onChange', event);
	}

	onDocumentKeydown(event)
	{
		if (event.keyCode === 27)
		{
			if (this.isEditable())
			{
				if (this === BX.Landing.UI.Field.BaseField.currentField)
				{
					BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
				}

				this.disableEdit();
			}
		}
	}

	onInputKeydown(event)
	{
		if (event.keyCode === 13)
		{
			if (this.isTextOnly())
			{
				event.preventDefault();
			}
		}
	}

	onInputFocus()
	{
		this.enableEdit();
	}

	enableTextOnly()
	{
		this.textOnly = true;
		this.input.textContent = this.trimTextOnlyValue(this.input.innerText);
		Dom.attr(this.input, 'aria-multiline', null);
	}

	disableTextOnly()
	{
		this.textOnly = false;
		Dom.attr(this.input, 'aria-multiline', 'true');
	}

	isTextOnly()
	{
		return this.textOnly;
	}

	isContentEditable()
	{
		return this.contentEditable !== false;
	}

	onDocumentClick(event: MouseEvent): void
	{
		if (
			this.isClickInsideField(event)
			|| this.isClickInsideEditorPanel(event)
			|| this.isClickInsidePopup(event)
		)
		{
			this.fromInput = false;

			return;
		}

		if (this.isEditable() && !this.fromInput)
		{
			if (this === BX.Landing.UI.Field.BaseField.currentField)
			{
				BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
			}

			this.disableEdit();
		}

		this.fromInput = false;
	}

	isClickInsideField(event: MouseEvent): boolean
	{
		if (!event || !event.target)
		{
			return false;
		}

		return Boolean(this.input && this.input.contains(event.target));
	}

	isClickInsideEditorPanel(event: MouseEvent): boolean
	{
		if (!event || !event.target)
		{
			return false;
		}

		const editorPanel = BX.Landing.UI.Panel.EditorPanel.getInstance();

		return Boolean(editorPanel && editorPanel.layout && editorPanel.layout.contains(event.target));
	}

	isClickInsidePopup(event: MouseEvent): boolean
	{
		return Boolean(event && event.target && event.target.closest && event.target.closest('.popup-window'));
	}

	onDocumentMouseup()
	{
		setTimeout(() => {
			this.fromInput = false;
		}, 10);
	}

	onInputClick(event)
	{
		event.preventDefault();
		event.stopPropagation();
		this.fromInput = false;
	}

	onInputMousedown(event)
	{
		this.enableEdit();

		BX.Landing.UI.Tool.ColorPicker.hideAll();

		requestAnimationFrame(() => {
			if (event.target.nodeName === 'A')
			{
				const range = document.createRange();
				range.selectNode(event.target);
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(range);
			}
		});

		this.fromInput = true;

		event.stopPropagation();
	}

	enableEdit()
	{
		if (!this.isEditable())
		{
			if (this !== BX.Landing.UI.Field.BaseField.currentField && BX.Landing.UI.Field.BaseField.currentField !== null)
			{
				BX.Landing.UI.Field.BaseField.currentField.disableEdit();
			}

			BX.Landing.UI.Field.BaseField.currentField = this;

			if (!this.isTextOnly())
			{
				if (this.changeTagButton)
				{
					this.changeTagButton.onChangeHandler = this.onChangeTag.bind(this);
				}

				BX.Landing.UI.Panel.EditorPanel.getInstance().show(this.layout, null, this.changeTagButton ? [this.changeTagButton] : null);
				this.input.contentEditable = true;
			}
			else
			{
				BX.Landing.UI.Panel.EditorPanel.getInstance().hide();
				this.input.contentEditable = true;
			}

			if (!this.isContentEditable())
			{
				this.input.contentEditable = false;
			}
		}
	}

	onChangeTag(value)
	{
		this.tag = value;
	}

	disableEdit()
	{
		this.input.contentEditable = false;
	}

	isEditable()
	{
		return this.input.isContentEditable;
	}

	reset()
	{
		this.setValue('');
	}

	adjustTags(element)
	{
		if (element.lastChild && element.lastChild.nodeName === 'BR')
		{
			Dom.remove(element.lastChild);
			this.adjustTags(element);
		}

		return element;
	}

	getValue()
	{
		if (this.textOnly)
		{
			return this.input.innerText;
		}

		return this.adjustTags(Runtime.clone(this.input)).innerHTML;
	}

	isChanged(): boolean
	{
		if (this.textOnly)
		{
			const content = this.trimTextOnlyValue(this.decodeTextOnlyContent(this.content));
			const value = this.trimTextOnlyValue(this.getValue());

			return content !== value;
		}

		return super.isChanged();
	}

	setValue(value: any = '')
	{
		if (this.textOnly)
		{
			this.input.textContent = this.trimTextOnlyValue(this.decodeTextOnlyContent(value));
			this.onValueChangeHandler(this);

			const event = new BaseEvent({
				data: { value: this.getValue() },
				compatData: [this.getValue()],
			});

			this.emit('change', event);
			this.emit('onChange', event);

			return;
		}

		super.setValue(value);
	}

	#createFooter(): void
	{
		this.footer = Tag.render`<div class="landing-ui-field-bottom ui-ctl-bottom" hidden></div>`;
		Dom.append(this.footer, this.getLayout());
	}

	setFooterText(text: string): void
	{
		this.footer.innerText = text;
	}

	showFooter(): void
	{
		Dom.show(this.footer);
	}

	hideFooter(): void
	{
		Dom.hide(this.footer);
	}

	decodeTextOnlyContent(content: any): string
	{
		return String(content ?? '').replaceAll(NBSP_ENTITY_PATTERN, NBSP);
	}

	trimTextOnlyValue(content: any): string
	{
		return String(content ?? '').replaceAll(EDGE_REGULAR_WHITESPACE_PATTERN, '');
	}

	setWarningStatus(): void
	{
		Dom.addClass(this.getLayout(), 'landing-ui-field-warning');
	}

	unsetWarningStatus(): void
	{
		Dom.removeClass(this.layout, 'landing-ui-field-warning');
	}
}

export {
	TextField as Text,
};
