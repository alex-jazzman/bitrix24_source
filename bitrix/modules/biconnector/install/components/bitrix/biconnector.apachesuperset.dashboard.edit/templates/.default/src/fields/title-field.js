import { Dom, Loc, Tag, Type } from 'main.core';

export class TitleField
{
	#defaultValue: string;
	#fieldNode: ?HTMLInputElement;
	#labelNode: ?HTMLElement;
	#hintNode: ?HTMLElement;

	constructor(defaultValue: string = '')
	{
		this.#defaultValue = Type.isString(defaultValue) ? defaultValue : '';
		this.#fieldNode = null;
		this.#labelNode = null;
		this.#hintNode = null;
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
						data-testid="biconnector-dashboard-edit-title-field"
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
		this.#labelNode = rootNode.querySelector('.dashboard-params-title');
	}

	setHintVisible(visible: boolean): void
	{
		if (visible)
		{
			this.#showHint();
		}
		else
		{
			this.#hideHint();
		}
	}

	#showHint(): void
	{
		if (this.#hintNode || !Type.isDomNode(this.#labelNode))
		{
			return;
		}

		if (!BX?.UI?.Hint || !Type.isFunction(BX.UI.Hint.createNode))
		{
			return;
		}

		const hintText = Loc.getMessage('DASHBOARD_EDIT_TITLE_ATTACH_HINT') ?? '';
		this.#hintNode = BX.UI.Hint.createNode(hintText);
		Dom.addClass(this.#hintNode, 'dashboard-title-hint');
		Dom.append(this.#hintNode, this.#labelNode);
	}

	#hideHint(): void
	{
		if (!this.#hintNode)
		{
			return;
		}

		Dom.remove(this.#hintNode);
		this.#hintNode = null;
	}

	getValue(): string
	{
		return this.#fieldNode?.value ?? '';
	}

	setValue(value: string): void
	{
		if (this.#fieldNode)
		{
			this.#fieldNode.value = value;
		}
	}
}
