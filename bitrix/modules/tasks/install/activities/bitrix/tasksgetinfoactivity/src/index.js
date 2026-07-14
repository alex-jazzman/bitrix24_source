import { Type, Dom, Tag } from 'main.core';
import {
	Context,
	ConditionGroup,
	ConditionGroupSelector,
	Document,
	getGlobalContext,
	setGlobalContext,
} from 'bizproc.automation';

export class TasksGetInfoActivityRenderer
{
	#form = null;
	#options = null;
	#documentType = null;
	#document = null;
	#filterFieldsContainer = null;
	#filteringFieldsPrefix = '';
	#filterFields = [];
	#conditionGroup = null;
	#conditionGroupSelector = null;

	getControlRenderers()
	{
		return {
			filterFields: (field) => {
				this.#options = Type.isPlainObject(field.property.Options) ? field.property.Options : {};
				this.#options.headCaption = field.property.Name || '';

				return Tag.render`
					<div data-role="bpa-tgi-filter-fields-container"></div>
				`;
			},
		};
	}

	afterFormRender(form)
	{
		this.#form = form;
		if (!Type.isPlainObject(this.#options))
		{
			return;
		}

		this.#documentType = this.#options.documentType;
		this.#filteringFieldsPrefix = this.#options.filteringFieldsPrefix;
		this.#filterFields = Type.isArray(this.#options.filterFieldsMap) ? this.#options.filterFieldsMap : [];

		this.#document = new Document({
			rawDocumentType: this.#documentType,
			documentFields: this.#filterFields,
			title: 'document',
		});
		this.#initAutomationContext();

		this.#filterFieldsContainer = form.querySelector('[data-role="bpa-tgi-filter-fields-container"]');
		this.#conditionGroup = new ConditionGroup(this.#options.conditions);

		this.#renderFilterFields();
	}

	#initAutomationContext()
	{
		try
		{
			getGlobalContext().document.setFields(this.#filterFields);
		}
		catch
		{
			setGlobalContext(new Context({ document: this.#document }));
		}
	}

	#renderFilterFields()
	{
		if (Type.isNil(this.#filterFieldsContainer) || Type.isNil(this.#conditionGroup))
		{
			return;
		}

		this.#conditionGroupSelector = new ConditionGroupSelector(this.#conditionGroup, {
			fields: this.#filterFields,
			fieldPrefix: this.#filteringFieldsPrefix,
			caption: {
				head: this.#options.headCaption,
				collapsed: this.#options.collapsedCaption,
			},
			isExpanded: true,
		});

		Dom.clean(this.#filterFieldsContainer);
		Dom.append(this.#conditionGroupSelector.createNode(), this.#filterFieldsContainer);
	}

	destroy()
	{
	}
}
