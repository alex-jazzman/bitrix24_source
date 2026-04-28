import { ajax, Dom, Type, Tag } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { getGlobalContext, ConditionGroup, ConditionGroupSelector, setGlobalContext, Context, Document } from 'bizproc.automation';

type ContextData = {
	DocumentType: [],
	Fields: [],
	Title: string,
}

type Field = {
	value: string,
	property: FieldProperties,
};

type FieldProperties = {
	Id: string,
	Name: string,
	Settings: {},
};

export class CrmAutomationTriggerRenderer
{
	#conditionFields: [] = [];
	#conditionField: HTMLElement = null;
	#triggerConditionField: {};
	#triggerConditionNode: HTMLElement = null;
	#conditionSelector: ConditionGroupSelector = null;

	#onNodeSettingsSaveHandler: Function;
	#onDocumentChangeHandler: Function;
	#onDocumentRemoveHandler: Function;

	constructor()
	{
		this.#setDefaultContext();

		this.#onNodeSettingsSaveHandler = this.#onNodeSettingsSave.bind(this);
		this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
		this.#onDocumentRemoveHandler = this.#onDocumentRemove.bind(this);
	}

	afterFormRender(form: HTMLFormElement): void
	{
		this.#conditionField = form.querySelector('#row_condition');
		if (Type.isNil(this.#conditionSelector))
		{
			Dom.hide(this.#conditionField);
		}

		EventEmitter.subscribe(
			'Bizproc.NodeSettings:nodeSettingsSaving',
			this.#onNodeSettingsSaveHandler,
		);
		EventEmitter.subscribe(
			'BX.UI.EntitySelector.Dialog:Item:onSelect',
			this.#onDocumentChangeHandler,
		);
		EventEmitter.subscribe(
			'BX.UI.EntitySelector.Dialog:Item:onDeselect',
			this.#onDocumentRemoveHandler,
		);
	}

	#onNodeSettingsSave(event: BaseEvent): void
	{
		const { formData } = event.getData();

		for (const property of this.#conditionFields)
		{
			const conditionGroup = ConditionGroup.createFromForm(formData, property);
			formData[property] = conditionGroup.serialize();
		}

		formData.condition = ConditionGroup.createFromForm(formData).serialize();
	}

	getControlRenderers(): object
	{
		return {
			'@trigger-condition-settings': (field) => this.#renderTriggerConditionSettings(field),
			'@condition-group-selector': (field) => this.#renderConditionGroupSelector(field),
		};
	}

	#renderTriggerConditionSettings(field: Field): HTMLElement
	{
		this.#triggerConditionField = field;

		const property = field.property;
		const settings = property.Settings;

		if (!settings)
		{
			this.#triggerConditionNode = Tag.render`<div></div>`;

			return this.#triggerConditionNode;
		}

		this.#updateContext(settings);
		this.#recreateConditionSelector(field.value);

		return this.#triggerConditionNode;
	}

	#recreateConditionSelector(value = null): void
	{
		this.#destroyConditionSelector();
		this.#conditionSelector = this.#createConditionSelector(value);
		this.#mountConditionNode(this.#conditionSelector.createNode());
	}

	#destroyConditionSelector(): void
	{
		this.#conditionSelector?.destroy();
		this.#conditionSelector = null;

		if (this.#triggerConditionNode)
		{
			Dom.remove(this.#triggerConditionNode);
			this.#triggerConditionNode = null;
		}
	}

	#mountConditionNode(node: HTMLElement): void
	{
		if (this.#triggerConditionNode)
		{
			Dom.replace(this.#triggerConditionNode, node);
		}
		else
		{
			Dom.append(node, this.#conditionField);
		}

		this.#triggerConditionNode = node;
	}

	#createConditionSelector(value = null): ConditionGroupSelector
	{
		const name = this.#triggerConditionField.property.Name;

		return new ConditionGroupSelector(
			new ConditionGroup(value),
			{
				fields: getGlobalContext().document.getFields(),
				showValuesSelector: false,
				caption: {
					head: name,
				},
				isExpanded: true,
			},
		);
	}

	#renderConditionGroupSelector(field): HTMLElement
	{
		const property = field.property;
		this.#conditionFields.push(property.Id);

		const selector = new ConditionGroupSelector(
			new ConditionGroup(field.value),
			{
				fields: property.Settings.Fields,
				fieldPrefix: property.Id,
				showValuesSelector: false,
				caption: {
					head: property.Name,
				},
				isExpanded: true,
			},
		);

		return selector.createNode();
	}

	#onDocumentChange(event: BaseEvent): void
	{
		const { item } = event.getData();

		ajax.runAction(
			'bizproc.activity.request',
			{
				data: {
					documentType: getGlobalContext().document.getRawType(),
					activity: 'CrmAutomationTrigger',
					params: {
						document: item.id,
						form_name: 'document',
					},
				},
			},
		).then((response) => {
			const data = response.data;
			if (!Type.isPlainObject(data))
			{
				return;
			}

			this.#updateContext(data);
			Dom.show(this.#conditionField);
			this.#recreateConditionSelector();
		}).catch((e) => console.error(e));
	}

	#onDocumentRemove(): void
	{
		this.#setDefaultContext();
		this.#destroyConditionSelector();
		Dom.hide(this.#conditionField);
	}

	#updateContext(data: ContextData): void
	{
		const document = new Document({
			rawDocumentType: data.DocumentType,
			documentFields: data.Fields,
			title: data.Title,
		});

		setGlobalContext(new Context({
			document,
		}));
	}

	#setDefaultContext(): void
	{
		const document = new Document({
			rawDocumentType: [
				'bizproc',
				'Bitrix\\Bizproc\\Public\\Entity\\Document\\Workflow',
				'WORKFLOW',
			],
			documentFields: [],
			title: 'document',
		});

		setGlobalContext(new Context({
			document,
		}));
	}

	destroy(): void
	{
		this.#conditionFields = [];

		EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.#onNodeSettingsSaveHandler);
		EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentRemoveHandler);
	}
}
