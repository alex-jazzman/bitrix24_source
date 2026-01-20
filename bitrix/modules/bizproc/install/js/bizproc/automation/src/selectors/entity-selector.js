import { InlineSelector } from './inline-selector';

export class EntitySelector extends InlineSelector
{
	renderTo(targetInput: Element): void
	{
		this.targetInput = targetInput;
		this.menuButton = targetInput;

		this.fieldProperty = JSON.parse(targetInput.getAttribute('data-property'));
		if (!this.fieldProperty)
		{
			this.context.useSwitcherMenu = false;
		}

		this.entitySelector = BX.Bizproc.EntitySelector.decorateNode(targetInput, {tagMaxWidth: 149});
	}

	destroy(): void
	{
		super.destroy();

		if (this.entitySelector)
		{
			this.entitySelector.destroy();
			this.entitySelector = null;
		}
	}
}
