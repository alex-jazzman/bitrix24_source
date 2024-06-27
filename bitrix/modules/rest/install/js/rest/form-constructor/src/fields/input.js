import { Dom, Tag, Event, Type } from 'main.core';
import { BaseField } from './base-field';

export class Input extends BaseField
{
	renderFieldContainer(): HTMLElement
	{
		const wrapper = Tag.render`
			<div class="ui-ctl-container"/>
		`;

		if (this.options.label)
		{
			const inputTitle = Tag.render`
				<div class="ui-ctl-top">
					<div class="ui-ctl-title">${this.options.label}</div>
				</div>
			`;
			Dom.append(inputTitle, wrapper);
		}

		const input = Tag.render`
			<div class="ui-ctl ui-ctl-textbox">
				<input type="text" id="${this.getId()}" class="ui-ctl-element">
			</div>
		`;
		const inputElement = input.querySelector('input');

		if (this.options.placeholder)
		{
			Dom.attr(inputElement, {
				placeholder: this.options.placeholder,
			});
		}

		if (this.options.value)
		{
			Dom.attr(inputElement, {
				value: this.options.value,
			});
		}

		Event.bind(inputElement, 'input', (event) => {
			Dom.hide(this.renderErrorsContainer());

			if (Dom.hasClass(wrapper, 'ui-ctl-warning'))
			{
				Dom.removeClass(wrapper, 'ui-ctl-warning');
			}

			if (Type.isNil(event.target.value) || event.target.value === '')
			{
				this.emit('onUnreadySave');
				this.readySave = false;
			}
			else
			{
				this.emit('onReadySave');
				this.readySave = true;
			}

			this.value = event.target.value;
		});

		Dom.append(input, wrapper);

		return wrapper;
	}
}
