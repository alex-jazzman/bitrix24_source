import { Loc, Tag, Type } from 'main.core';

export class TitleField
{
	#defaultValue: string;
	#fieldNode: ?HTMLInputElement;

	constructor(defaultValue: string = '')
	{
		this.#defaultValue = Type.isString(defaultValue) ? defaultValue : '';
		this.#fieldNode = null;
	}

	render(): HTMLElement
	{
		return Tag.render`
			<div>
				<div class="dashboard-params-title-container">
					<div class="dashboard-params-title">
						${Loc.getMessage('DASHBOARD_EDIT_NAME')}
					</div>
				</div>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100 dashboard-title-wrapper">
					<input
						type="text"
						class="ui-ctl-element"
						id="dashboard-title-field"
					>
				</div>
			</div>
		`;
	}

	bind(rootNode: HTMLElement): void
	{
		if (!Type.isDomNode(rootNode))
		{
			return;
		}

		this.#fieldNode = rootNode.querySelector('#dashboard-title-field');
		if (Type.isDomNode(this.#fieldNode))
		{
			this.#fieldNode.value = this.#defaultValue;
		}
	}

	getValue(): string
	{
		return this.#fieldNode?.value ?? '';
	}
}
