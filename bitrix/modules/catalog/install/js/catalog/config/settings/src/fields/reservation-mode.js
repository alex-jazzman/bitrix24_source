import { Dom, Tag, Text } from 'main.core';
import { BaseField } from 'ui.form-elements.view';

type FieldParams = {
	fieldName: string,
	setting: Object,
	value: string,
};

export default class ReservationMode extends BaseField
{
	defaultValue: string;
	#mode: FieldParams;
	#period: FieldParams;

	constructor(params)
	{
		super(params);
		this.#mode = params.mode;
		this.#period = params.period;
	}

	prefixId(): string
	{
		return 'reservation_';
	}

	renderContentField(): HTMLElement
	{
		return Tag.render`
			<div id="${this.getId()}" class="ui-section__field-selector --field-separator">
				<div class="ui-section__field-container">
					<div class="ui-section__field-inline-box">
						<label class="ui-section__field-label" for="${this.#mode.fieldName}">${this.#mode.setting.name}</label> 
						<div class="ui-section__field-inline-label-separator"></div>
						<label class="ui-section__field-label" for="${this.#period.fieldName}">${this.#period.setting.name}</label>
					</div>
					<div class="ui-section__field-inline-box">
						<div class="ui-section__field">
							<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon ui-ctl-dropdown">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								${this.#buildModeSelector()}
							</div>
						</div>
						<div class="ui-section__field-inline-separator"></div>
						<div class="ui-section__hint">
							${this.#buildPeriodInput()}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	#buildModeSelector(): HTMLElement
	{
		const options = [];
		for (const { code, name } of this.#mode.setting.values)
		{
			let selectedAttr = '';
			if (code === this.#mode.value)
			{
				selectedAttr = 'selected';
			}
			options.push(Tag.render`<option ${selectedAttr} value="${code}">${name}</option>`);
		}

		const selector = Dom.create('select', {
			attrs: {
				class: 'ui-ctl-element',
			},
			children: options,
		});

		selector.name = this.#mode.fieldName;

		return selector;
	}

	#buildPeriodInput(): HTMLElement
	{
		return Tag.render`
			<input
				value="${Text.encode(this.#period.value)}"
				name="${this.#period.fieldName}"
				type="text"
				class="ui-ctl-element"
			>
		`;
	}
}
