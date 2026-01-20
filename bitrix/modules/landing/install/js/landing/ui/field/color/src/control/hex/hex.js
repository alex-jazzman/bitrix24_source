import { Dom, Event, Runtime, Tag } from 'main.core';
import isHex from '../../internal/is-hex';
import ColorValue from '../../color_value';

import './css/hex.css';
import BaseControl from '../base_control/base_control';
import { BaseEvent } from 'main.core.events';
import { PageObject } from 'landing.pageobject';

export default class Hex extends BaseControl
{
	static DEFAULT_TEXT: string = '#hex';
	static DEFAULT_COLOR: string = '#000000';
	static DEFAULT_BG: string = '#eeeeee';

	constructor()
	{
		super();
		this.setEventNamespace('BX.Landing.UI.Field.Color.Hex');

		this.onInput = Runtime.debounce(this.onInput.bind(this), 300);

		this.previewMode = false;
	}

	buildLayout(): HTMLElement
	{
		Event.bind(this.getInput(), 'input', this.onInput);

		this.adjustColors(Hex.DEFAULT_COLOR, Hex.DEFAULT_BG);

		const modeClass = this.previewMode ? '--preview' : '--base';

		return Tag.render`
			<div class="landing-ui-field-color-hex ${modeClass}">
				${this.getPreview()}
				${this.getInput()}
				${this.previewMode ? this.getButton() : ''}
			</div>
		`;
	}

	getPreview(): HTMLInputElement
	{
		return this.cache.remember('preview', () => {
			return Tag.render`<div class="landing-ui-field-color-hex-preview"></div>`;
		});
	}

	getInput(): HTMLInputElement
	{
		return this.cache.remember('input', () => {
			return Tag.render`<input type="text" name="hexInput" value="${Hex.DEFAULT_TEXT}" class="landing-ui-field-color-hex-input">`;
		});
	}

	onInput(): void
	{
		let value = this.getInput().value.replaceAll(/[^\da-f]/gi, '');
		value = value.slice(0, 6);
		this.getInput().value = `#${value.toLowerCase()}`;

		if (this.getInput().value.length === 7)
		{
			this.emit('onValidInput', { value });
		}

		this.onChange();
	}

	onChange(event: ?BaseEvent)
	{
		const color = (this.getInput().value.length === 7 && isHex(this.getInput().value))
			? new ColorValue(this.getInput().value)
			: null;
		this.setValue(color);

		this.cache.delete('value');
		this.emit('onChange', { color });
	}

	adjustColors(textColor: string, bgColor: string)
	{
		if (this.previewMode === true)
		{
			Dom.style(this.getInput(), 'color', textColor);
			Dom.style(this.getButton(), 'fill', textColor);
			Dom.style(this.getInput(), 'background', 'transparent');
			Dom.style(this.getPreview(), 'display', 'none');
		}
		else
		{
			Dom.style(this.getPreview(), 'background-color', bgColor);
		}
	}

	focus(): void
	{
		if (this.getValue() === null)
		{
			this.getInput().value = '#';
		}
		this.getInput().focus();
	}

	unFocus(): void
	{
		this.getInput().blur();
	}

	getValue(): ?ColorValue
	{
		return this.cache.remember('value', () => {
			return (this.getInput().value === Hex.DEFAULT_TEXT)
				? null
				: new ColorValue(this.getInput().value);
		});
	}

	setValue(value: ?ColorValue)
	{
		// todo: set checking in always controls?
		if (this.isNeedSetValue(value))
		{
			super.setValue(value);

			if (value === null)
			{
				this.adjustColors(Hex.DEFAULT_COLOR, Hex.DEFAULT_BG);
				this.unsetActive();
			}
			else
			{
				this.adjustColors(value.getContrast().getHex(), value.getHex());
				this.setActive();
			}

			if (PageObject.getRootWindow().document.activeElement !== this.getInput())
			{
				this.getInput().value = (value === null) ? Hex.DEFAULT_TEXT : value.getHex();
			}

			this.emit('onSetValue', { color: value === null ? Hex.DEFAULT_BG : value.getHex() });
		}
	}

	setActive(): void
	{
		Dom.addClass(this.getInput(), Hex.ACTIVE_CLASS);
	}

	unsetActive(): void
	{
		Dom.removeClass(this.getInput(), Hex.ACTIVE_CLASS);
	}

	isActive(): boolean
	{
		return Dom.hasClass(this.getInput(), Hex.ACTIVE_CLASS);
	}

	setPreviewMode(preview: boolean)
	{
		this.previewMode = preview;
	}

	isPreviewMode()
	{
		return Boolean(this.previewMode);
	}

	getButton(): SVGElement
	{
		return this.cache.remember('editButton', () => {
			return Tag.render`
				<svg class="landing-ui-field-color-hex-preview-btn" width="9" height="9" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M7.108 0l1.588 1.604L2.486 7.8.896 6.194 7.108 0zM.006 8.49a.166.166 0 00.041.158.161.161 0 00.16.042l1.774-.478L.484 6.715.006 8.49z"
						fill-rule="evenodd"/>
				</svg>
			`;
		});
	}
}
