import {Reflection, Type, Event, Dom} from 'main.core';

const namespace = Reflection.namespace('BX.Crm.Activity');

class CrmChangeRelationsActivity
{
	actionTypeSelect: ?HTMLSelectElement;
	parentTypeSelect: ?HTMLSelectElement;
	parentIdInput: ?HTMLInputElement;
	parentIdTextInput: ?HTMLInputElement;
	parentIdPropertyDiv: ?HTMLElement;

	constructor(options)
	{
		if (Type.isPlainObject(options))
		{
			const form = document.forms[options.formName];

			if (!Type.isNil(form))
			{
				this.actionTypeSelect = this.getFormElement(form, 'action');
				this.parentTypeSelect = this.getFormElement(form, 'parent_type_id');
				this.parentIdInput = this.getFormElement(form, 'parent_id');
				this.parentIdTextInput = this.getFormElement(form, 'parent_id_text');
				this.parentIdPropertyDiv = this.getParentIdPropertyDiv();
			}

			this.onActionTypeChange();
		}
	}

	init(): void
	{
		if (Type.isDomNode(this.actionTypeSelect))
		{
			Event.bind(this.actionTypeSelect, 'change', this.onActionTypeChange.bind(this));
		}

		if (Type.isDomNode(this.parentTypeSelect))
		{
			Event.bind(this.parentTypeSelect, 'change', this.onParentTypeChange.bind(this));
		}
	}

	onActionTypeChange(): void
	{
		if (!Type.isDomNode(this.actionTypeSelect) || !Type.isDomNode(this.parentIdPropertyDiv))
		{
			return;
		}

		if (this.actionTypeSelect.value === 'remove')
		{
			Dom.style(this.parentIdPropertyDiv, 'visibility', 'hidden');
		}
		else
		{
			Dom.style(this.parentIdPropertyDiv, 'visibility', 'visible');
		}
	}

	onParentTypeChange(): void
	{
		if (Type.isDomNode(this.parentIdInput))
		{
			this.parentIdInput.value = '';
		}

		if (Type.isDomNode(this.parentIdTextInput))
		{
			this.parentIdTextInput.value = '';
		}
	}

	getFormElement(form: HTMLFormElement, name: string): any
	{
		const element = form.elements.namedItem(name);

		return Type.isDomNode(element) ? element : null;
	}

	getParentIdPropertyDiv(): ?HTMLElement
	{
		if (!Type.isDomNode(this.parentIdInput))
		{
			return null;
		}

		const parentElement = this.parentIdInput.parentElement;
		if (!Type.isDomNode(parentElement) || !Type.isDomNode(parentElement.parentElement))
		{
			return null;
		}

		return parentElement.parentElement;
	}
}

namespace.CrmChangeRelationsActivity = CrmChangeRelationsActivity;
