import { Type, Loc, Text, Dom, Tag, Runtime } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Menu } from 'main.popup';

/**
 * Standalone time picker used by `DelayIntervalSelector` to edit the "exact time"
 * (HH:MM) row. It intentionally does not extend the robot inline-selector: the
 * control only needs a dropdown of half-hour marks over a text input, so it stays
 * free of any `bizproc.automation` dependency.
 */
export class InlineTimeSelector
{
	#labelNode: HTMLElement = null;
	#inputNode: HTMLInputElement = null;

	#timeValues: [] = [];
	#timeFormat: string;

	#selector: Menu;
	#chevron: HTMLSpanElement;
	#onchange: ?Function = null;

	targetInput: ?HTMLElement = null;

	constructor(options: ?Object)
	{
		if (Type.isPlainObject(options) && Type.isFunction(options.onchange))
		{
			this.#onchange = options.onchange;
		}

		this.#fillTimeFormat();
		this.#fillTimeValues();
	}

	#fillTimeFormat()
	{
		const getFormat = (formatId) => (
			BX.Main.Date.convertBitrixFormat(Loc.getMessage(formatId)).replace(/:?\s*s/, '')
		);

		const dateFormat = getFormat('FORMAT_DATE');
		const dateTimeFormat = getFormat('FORMAT_DATETIME');
		this.#timeFormat = dateTimeFormat.replace(dateFormat, '').trim();
	}

	#fillTimeValues()
	{
		const onclick = (event, item) => {
			event.preventDefault();
			this.#inputNode.value = Text.encode(item.text);
			item.getMenuWindow().close();
			if (this.#onchange)
			{
				this.#onchange(this.#inputNode);
			}
		};

		for (let hour = 0; hour < 24; hour++)
		{
			this.#timeValues.push({
				id: hour * 60,
				text: this.#formatTime(hour, 0),
				onclick,
			}, {
				id: hour * 60 + 30,
				text: this.#formatTime(hour, 30),
				onclick,
			});
		}
	}

	#formatTime(hour, minute): string
	{
		const date = new Date();
		date.setHours(hour, minute);

		return DateTimeFormat.format(this.#timeFormat, date.getTime() / 1000);
	}

	renderTo(targetInput: Element): void
	{
		targetInput.parentNode.replaceChild(this.renderWith(targetInput), targetInput);
	}

	renderWith(targetInput: Element): HTMLElement
	{
		this.targetInput = Runtime.clone(targetInput);
		this.targetInput.setAttribute('autocomplete', 'off');
		this.targetInput.setAttribute('data-testid', 'bp-condition-time-input');

		this.#init();

		return this.#labelNode;
	}

	#init()
	{
		const { root, chevron } = Tag.render`
			<span onclick="${this.#onLabelClick.bind(this)}" style="width: 100%; position: relative">
				${this.targetInput}
				<span
					ref="chevron"
					class="ui-icon-set --chevron-down bizproc-automation-inline-time-selector-chevron"
					data-testid="bp-condition-time-chevron"
				></span>
			</span>
		`;

		this.#labelNode = root;
		this.#inputNode = this.targetInput;
		this.#chevron = chevron;
	}

	#onLabelClick(event)
	{
		this.#showTimeSelector();
		event.preventDefault();
	}

	#showTimeSelector()
	{
		if (Type.isNil(this.#selector))
		{
			this.#selector = new Menu({
				autoHide: true,
				bindElement: this.#labelNode,
				items: this.#timeValues,
				maxHeight: 230,
				width: this.#labelNode.offsetWidth || this.#labelNode.clientWidth || 100,
				events: {
					onPopupClose: () => {
						if (Dom.hasClass(this.#chevron, '--chevron-up'))
						{
							Dom.toggleClass(this.#chevron, ['--chevron-down', '--chevron-up']);
						}
					},
				},
			});
		}

		this.#selector.show();
		if (Dom.hasClass(this.#chevron, '--chevron-down'))
		{
			Dom.toggleClass(this.#chevron, ['--chevron-down', '--chevron-up']);
		}
	}
}
