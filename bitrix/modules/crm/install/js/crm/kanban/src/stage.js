export class Stage
{
	renderTo = null;
	items = null;
	layout = {
		container: null,
		items: null,
		more: null,
	};

	constructor(options)
	{
		this.renderTo = options.renderTo;

		this.bindEvents();
	}

	bindEvents()
	{
		BX.addCustomEvent('kanban.grid:onitemdragstart', this.hideParentBlock.bind(this));
		BX.addCustomEvent('kanban.grid:onitemdragstop', this.unhideParentBlock.bind(this));
	}

	hideParentBlock()
	{
		this.renderTo.style.opacity = '0';
		this.renderTo.style.transition = '.2s';
		this.renderTo.style.pointerEvents = 'none';
	}

	unhideParentBlock()
	{
		this.renderTo.style.opacity = '';
		this.renderTo.style.transition = '';
		this.renderTo.style.pointerEvents = '';
	}

	render()
	{
	}

	getStageContainer()
	{
		if (this.layout.container)
		{
			return this.layout.container;
		}

		this.layout.container = BX.create('div', {
			props: {
				className: 'crm-kanban-stahe',
			},
		});

		return this.layout.container;
	}
}
