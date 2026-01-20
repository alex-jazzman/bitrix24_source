import { Reflection, defer, fireEvent } from 'main.core';
import { TagSelector } from 'ui.entity-selector';

const namespace = Reflection.namespace('BX.Intranet.UserField');

type EmployeeEditorParams = {
	selectorName: string,
	isMultiple: boolean,
	fieldNameJs: string,
	selectedItems: Set<string, string>,
}

class EmployeeEditor
{
	selectorName: string;
	isMultiple: boolean;
	fieldNameJs: string;
	selectedItems: Set<string, string>;

	constructor(params: EmployeeEditorParams)
	{
		this.selectorName = params.selectorName || '';
		this.isMultiple = params.isMultiple === true;
		this.fieldNameJs = params.fieldNameJs || '';
		this.selectedItems = new Set(params.selectedItems || []);

		this.initTagSelector(params);
	}

	initTagSelector()
	{
		const container = document.getElementById(`cont_${this.selectorName}`);

		if (!container)
		{
			return;
		}

		(new TagSelector({
			multiple: this.isMultiple,
			dialogOptions: {
				context: `entity_selector_${this.selectorName}`,
				width: 450,
				height: 300,
				preselectedItems: [...this.selectedItems],
				entities: [
					{
						id: 'user',
						options: {
							emailUsers: false,
							intranetUsersOnly: true,
							inviteEmployeeLink: false,
							inviteGuestLink: false,
						},
					}, {
						id: 'structure-node',
						options: {
							selectMode: 'usersOnly',
						},
					},
				],
			},
			events: {
				onAfterTagAdd: (event) => this.onAfterTagUpdate(event),
				onAfterTagRemove: (event) => this.onAfterTagUpdate(event),
			},
		})).renderTo(container);
	}

	onAfterTagUpdate(event)
	{
		const tags = event.getTarget().tags;
		const ids = tags.map((tag) => tag.id);

		this.setData(ids);
	}

	setData(values)
	{
		const valueContainer = document.getElementById(`value_${this.selectorName}`);

		if (!valueContainer)
		{
			return;
		}

		let html = '';
		if (values.length > 0)
		{
			if (this.isMultiple)
			{
				for (const value of values)
				{
					html += `<input type="hidden" name="${this.fieldNameJs}" value="${BX.util.htmlspecialchars(value)}">`;
				}
			}
			else
			{
				html += `<input type="hidden" name="${this.fieldNameJs}" value="${BX.util.htmlspecialchars(values[0])}">`;
			}
		}

		if (html.length <= 0)
		{
			html = `<input type="hidden" name="${this.fieldNameJs}" value="">`;
		}
		valueContainer.innerHTML = html;

		defer(() => {
			fireEvent(valueContainer.firstChild, 'change');
		})();
	}
}

namespace.EmployeeEditor = EmployeeEditor;
