import { ajax, Dom, Type, Tag, Reflection } from 'main.core';
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

const CONDITION_FIELD_NAME = 'condition';
const DOCUMENT_FIELD_NAME = 'Document';
const DOCUMENT_ROW_ID = `row_${DOCUMENT_FIELD_NAME}`;

export class CrmAutomationTriggerRenderer
{
	#form: HTMLFormElement = null;
	#conditionFields: [] = [];
	#conditionField: HTMLElement = null;
	#triggerConditionField: {};
	#triggerConditionNode: HTMLElement = null;
	#conditionSelector: ConditionGroupSelector = null;
	#conditionValueNode: HTMLElement = null;
	#conditionObserver: MutationObserver = null;

	#onNodeSettingsSaveHandler: Function;
	#onDocumentChangeHandler: Function;
	#onDocumentRemoveHandler: Function;
	#onConditionChangeHandler: Function;

	constructor()
	{
		this.#setDefaultContext();

		this.#onNodeSettingsSaveHandler = this.#onNodeSettingsSave.bind(this);
		this.#onDocumentChangeHandler = this.#onDocumentChange.bind(this);
		this.#onDocumentRemoveHandler = this.#onDocumentRemove.bind(this);
		this.#onConditionChangeHandler = this.#syncConditionValue.bind(this);
	}

	afterFormRender(form: HTMLFormElement): void
	{
		this.#form = form;
		this.#conditionField = form.querySelector('#row_condition');
		if (Type.isNil(this.#conditionSelector))
		{
			Dom.hide(this.#conditionField);
		}

		// The panel reads the form right after this call and keeps that read as its pristine state.
		this.#syncConditionValue();
		this.#observeConditionRow();

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

		formData[CONDITION_FIELD_NAME] = this.#serializeCondition(formData);
	}

	#serializeCondition(formData: Object): Object
	{
		return ConditionGroup.createFromForm(formData).serialize();
	}

	/**
	 * Mirrors the serialized group into hidden inputs of the form, one per leaf of its value. Not a
	 * duplicate of the write in the hook above: the unified panel pays for the save with a plain DOM read
	 * of the form and raises that hook afterwards, discarding its object - a group living in the object
	 * alone reaches no request. The control transports its own rows (`condition_field[]`), never the
	 * group the property stores, so the group has to stand in the form as a value of its own.
	 */
	#syncConditionValue(): void
	{
		Dom.remove(this.#conditionValueNode);
		this.#conditionValueNode = null;

		// A node whose parameter the panel withholds carries an input of the panel under the same name.
		if (!this.#form || Type.isNil(this.#conditionSelector))
		{
			return;
		}

		this.#conditionValueNode = Tag.render`<div hidden></div>`;
		this.#renderValueInputs(
			this.#conditionValueNode,
			CONDITION_FIELD_NAME,
			this.#serializeCondition(ajax.prepareForm(this.#form).data),
		);
		Dom.append(this.#conditionValueNode, this.#form);
	}

	/**
	 * Second channel of the value: a row edited in place publishes `onChange`, while a dropped row takes
	 * its transport out of the tree and reaches no subscriber at all. Watching the row covers the second
	 * case, `onChange` covers the first.
	 */
	#observeConditionRow(): void
	{
		this.#conditionObserver?.disconnect();
		this.#conditionObserver = null;

		if (!Type.isDomNode(this.#conditionField))
		{
			return;
		}

		// The value lives in the form and outside this row, so rebuilding it raises no mutation here.
		this.#conditionObserver = new MutationObserver(() => this.#syncConditionValue());
		this.#conditionObserver.observe(this.#conditionField, { childList: true, subtree: true });
	}

	#renderValueInputs(container: HTMLElement, name: string, value: mixed): void
	{
		if (Type.isNil(value))
		{
			return;
		}

		if (Type.isArray(value) || Type.isPlainObject(value))
		{
			Object.entries(value).forEach(([key, item]) => {
				this.#renderValueInputs(container, `${name}[${key}]`, item);
			});

			return;
		}

		Dom.append(
			Dom.create('input', { attrs: { type: 'hidden', name }, props: { value: String(value) } }),
			container,
		);
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
		this.#syncConditionValue();
	}

	#destroyConditionSelector(): void
	{
		this.#conditionSelector?.unsubscribe('onChange', this.#onConditionChangeHandler);
		this.#conditionSelector?.destroy();
		this.#conditionSelector = null;

		if (this.#triggerConditionNode)
		{
			Dom.remove(this.#triggerConditionNode);
			this.#triggerConditionNode = null;
		}

		this.#syncConditionValue();
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

		const selector = new ConditionGroupSelector(
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
		selector.subscribe('onChange', this.#onConditionChangeHandler);

		return selector;
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

	/**
	 * The dialog events of `ui.entity-selector` are global, so every selector of the panel reaches both
	 * handlers. The own event is told by the dialog of the item and not by the node of the event: the
	 * removal branch carries no node at all (`item.deselect()` publishes `node: null`), while the dialog
	 * answers `getTargetNode()` with the container of the tag selector.
	 * The boundary is the row of the property `Document` and not the whole form: another selector of the
	 * same form picks something else entirely, and taking its choice for a document would rebuild the
	 * context of the trigger and drop the conditions already set up.
	 */
	#isOwnDocumentEvent(event: BaseEvent): boolean
	{
		const { item } = event.getData();
		const targetNode = item?.getDialog?.()?.getTargetNode?.();
		const documentRow = this.#form?.querySelector(`#${DOCUMENT_ROW_ID}`);

		// This handler swallows its own refusals, so an unguarded read would break it invisibly.
		if (!Type.isDomNode(documentRow) || !Type.isDomNode(targetNode))
		{
			return false;
		}

		return documentRow.contains(targetNode);
	}

	/** With no row to mount the control into, the request for its fields is spent on nobody. */
	#reactsToDocumentEvent(event: BaseEvent): boolean
	{
		return this.#isOwnDocumentEvent(event) && !Type.isNil(this.#conditionField);
	}

	#onDocumentChange(event: BaseEvent): void
	{
		if (!this.#reactsToDocumentEvent(event))
		{
			return;
		}

		const { item } = event.getData();
		const requestData = {
			documentType: getGlobalContext().document.getRawType(),
			activity: 'CrmAutomationTrigger',
			params: {
				document: item.id,
				form_name: 'document',
			},
		};

		ajax.runAction(
			'bizproc.activity.request',
			{
				// The Nodes editor names its template: the server grants the request by the right on it.
				data: Reflection.getClass('BX.Bizproc.EditorTemplateContext')?.appendTo(requestData) ?? requestData,
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

	#onDocumentRemove(event: BaseEvent): void
	{
		if (!this.#reactsToDocumentEvent(event))
		{
			return;
		}

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
		this.#form = null;
		this.#conditionFields = [];
		this.#conditionObserver?.disconnect();
		this.#conditionObserver = null;
		Dom.remove(this.#conditionValueNode);
		this.#conditionValueNode = null;

		EventEmitter.unsubscribe('Bizproc.NodeSettings:nodeSettingsSaving', this.#onNodeSettingsSaveHandler);
		EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onSelect', this.#onDocumentChangeHandler);
		EventEmitter.unsubscribe('BX.UI.EntitySelector.Dialog:Item:onDeselect', this.#onDocumentRemoveHandler);
	}
}
