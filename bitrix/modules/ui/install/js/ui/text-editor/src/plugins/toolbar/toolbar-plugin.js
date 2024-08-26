import Toolbar from '../../toolbar/toolbar';
import BasePlugin from '../base-plugin';

export class ToolbarPlugin extends BasePlugin
{
	#toolbar: Toolbar = null;

	static getName(): string
	{
		return 'Toolbar';
	}

	getToolbar(): Toolbar
	{
		return this.#toolbar;
	}

	afterInit(): void
	{
		this.#toolbar = new Toolbar(this.getEditor(), this.getEditor().getOption('toolbar'));
		if (!this.#toolbar.isEmpty())
		{
			this.#toolbar.renderTo(this.getEditor().getToolbarContainer());
		}
	}

	destroy(): void
	{
		super.destroy();
		this.#toolbar.destroy();
	}
}
