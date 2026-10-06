import { Type, Text, Tag } from 'main.core';
import { InlineSelector } from './inline-selector';
import { SelectorContext } from 'bizproc.automation';
import { InlineTimeSelector as TimePicker } from 'bizproc.condition';

export class InlineTimeSelector extends InlineSelector
{
	#showDottedSelector: boolean;

	constructor(props: { context: SelectorContext, showValuesSelector: boolean })
	{
		super(props);

		this.#showDottedSelector = Type.isNil(props.showValuesSelector) ? true : Text.toBoolean(props.showValuesSelector);
	}

	renderWith(targetInput: Element): HTMLElement
	{
		const picker = new TimePicker();
		const labelNode = picker.renderWith(targetInput);

		this.targetInput = picker.targetInput;
		this.targetInput.setAttribute('autocomplete', 'off');

		this.parseTargetProperties();
		this.replaceOnWrite = true;

		if (this.#showDottedSelector === false)
		{
			return labelNode;
		}

		this.menuButton = Tag.render`
			<span
				onclick="${this.openMenu.bind(this)}"
				class="bizproc-automation-popup-select-dotted"
			></span>
		`;

		return Tag.render`
			<div class="bizproc-automation-popup-select">
				${labelNode}
				${this.menuButton}
			</div>
		`;
	}
}
