BX.Default.Field.Employee = function (params)
{
	this.init(params);
};

BX.Default.Field.Employee.prototype = {
	init: function (params)
	{
		this.selectorName = params.selectorName || '';
		this.isMultiple = params.isMultiple || false;
		this.fieldNameJs = params.fieldNameJs || '';
		this.selectedItems = params.selectedItems || [];

		this.initTagSelector();
	},

	initTagSelector: function ()
	{
		this.tagSelector = new BX.UI.EntitySelector.TagSelector({
			multiple: this.isMultiple,
			dialogOptions: {
				context: `entity_selector_${this.selectorName}`,
				width: 450,
				height: 300,
				preselectedItems: this.selectedItems,
				entities: [
					{
						id: 'user',
						options: {
							emailUsers: false,
							intranetUsersOnly: true,
							inviteEmployeeLink: false,
							inviteGuestLink: false,
						}
					},
					{
						id: 'structure-node',
						options: {
							selectMode: 'usersOnly',
						}
					},
				]
			},
			events: {
				onAfterTagAdd: (event) => this.onAfterTagUpdate(event),
				onAfterTagRemove: (event) => this.onAfterTagUpdate(event),
			}
		});

		this.tagSelector.renderTo(document.getElementById(`cont_${this.selectorName}`));
	},

	onAfterTagUpdate: function (event)
	{
		const tags = event.getTarget().tags;
		const ids = tags.map(tag => tag.id);

		this.setData(ids);
	},

	setData: function (values)
	{
		let valueContainer = BX(`value_${this.selectorName}`);
		let html = '';

		if (values.length > 0)
		{
			if (this.isMultiple)
			{
				for (let i = 0; i < values.length; i++)
				{
					html += `<input type="hidden" name="${this.fieldNameJs}" value="${BX.util.htmlspecialchars(values[i])}">`;
				}

			}
			else
			{
				html += `<input type="hidden" name="${this.fieldNameJs}" value="${BX.util.htmlspecialchars(values[0])}">`;
			}
		}

		if (html.length <= 0)
		{
			html = `<input type="hidden" name="${this.fieldNameJs}" value="">`
		}

		valueContainer.innerHTML = html;

		BX.defer(function ()
		{
			BX.fireEvent(valueContainer.firstChild, 'change');
		})();
	}
};