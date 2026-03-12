import { Type, Dom, Tag, Runtime, Text } from 'main.core';
import {
	Context,
	ConditionGroup,
	ConditionGroupSelector,
	Document,
	getGlobalContext,
	setGlobalContext,
} from 'bizproc.automation';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';

type PropertyOptions = {
	documentType: Array<string>;
	filteringFieldsPrefix: string;
	filterFieldsMap: Object;
	conditions: Object;
	headCaption?: string;
	collapsedCaption: string;
};

type FieldProperty = {
	Name: string;
	FieldName: string;
	Type: string;
	Required: boolean;
	AllowSelection: boolean;
	CustomType: string;
	Options: PropertyOptions;
};

type Field = {
	controlId: string;
	fieldName: string;
	property: FieldProperty;
	value: ?Object;
};

type ControlRenderers = {
	filterFields: (field: Field) => HTMLElement;
};

type StorageCodeData = {
	element: HTMLTextAreaElement,
	dependentElements: Array<HTMLElement>,
	returnFieldsContainer: ?HTMLDivElement,
};

export class ReadDataStorageActivityRenderer
{
	#form: ?HTMLFormElement = null;
	#options: ?PropertyOptions = null;

	#dialog: Dialog | null;

	#documentType: Array<string>;
	#document: Document;

	#storageCodeData: StorageCodeData = {
		dependentElements: [],
	};

	#storageIdDependentElements: NodeListOf<HTMLElement>;
	#returnFieldsMap: Map<number, Map<string, object>>;
	#returnFieldsIds: Array<string>;

	#filterFieldsContainer: HTMLDivElement | null;
	#filteringFieldsPrefix: string;
	#filterFieldsMap: Map<number, object>;
	#conditionGroup: ConditionGroup | undefined;

	#currentStorageId: number;

	getControlRenderers(): ControlRenderers
	{
		return {
			filterFields: (field: Object) => {
				this.#options = field.property.Options || {};
				this.#options.headCaption = field.property.Name || '';

				return Tag.render`
					<div data-role="bpa-sra-storage-id-dependent">
						<div data-role="bpa-sra-filter-fields-container"></div>
					</div>
				`;
			},
		};
	}

	afterFormRender(form: HTMLFormElement): void
	{
		this.#form = form;
		this.#dialog = Dialog.getById('entityselector_storage_id');

		if (Type.isPlainObject(this.#options))
		{
			this.#documentType = this.#options.documentType;

			if (!Type.isNil(this.#form))
			{
				const item = this.#dialog?.selectedItems.values()?.next()?.value;
				this.#currentStorageId = item?.id || 0;
				this.#storageIdDependentElements = form.querySelectorAll(
					'#row_return_fields, #row_filter_fields',
				);

				this.#storageCodeData.element = form.storage_code;
				this.#storageCodeData.dependentElements.push(
					...form.querySelectorAll('#row_return_fields_by_storage_code').values(),
					form.querySelector('[data-role="bpa-sra-filter-fields-container"]').closest('.node-settings-edit-box'),
				);
			}

			this.#document = new Document({
				rawDocumentType: this.#documentType,
				documentFields: [],
				title: 'document',
			});

			this.#initAutomationContext();
			this.#initFilterFields(this.#options);
			this.#initStorageSelector();
			this.#initReturnFields(this.#options);

			this.#render();

			if (this.#storageCodeData.element)
			{
				this.#renderFilterFields();
			}
		}
	}

	#initStorageSelector(): void
	{
		Runtime
			.loadExtension('bizproc.storage-selector')
			.then(({ StorageSelector }) => {
				this.#dialog = new StorageSelector({
					dialogId: 'entityselector_storage_id',
					storageCodeInput: this.#storageCodeData.element,
					onStateChange: this.#onStorageStateChange.bind(this),
				});
				this.#dialog.init();
			})
			.catch((e) => console.error(e));
	}

	#initFilterFields(options: Object): void
	{
		this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sra-filter-fields-container"]');
		this.#filteringFieldsPrefix = options.filteringFieldsPrefix;
		this.#filterFieldsMap = new Map(
			Object.entries(options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]),
		);

		this.#conditionGroup = new ConditionGroup(options.conditions);
	}

	#initReturnFields(options: Object): void
	{
		this.#returnFieldsIds = Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];
		this.#returnFieldsMap = new Map();
		Object.entries(options.returnFieldsMap).forEach(([storageId, fieldsMap]) => {
			this.#returnFieldsMap.set(Number(storageId), new Map(Object.entries(fieldsMap)));
		});
		this.#storageCodeData.returnFieldsContainer = this.#form.querySelector('#row_return_fields_by_storage_code');
	}

	#initAutomationContext(): void
	{
		try
		{
			getGlobalContext();
		}
		catch
		{
			setGlobalContext(new Context({ document: this.#document }));
		}
	}

	#onStorageStateChange(newStorageId: number): void
	{
		if (newStorageId <= 0 && this.#storageCodeData.element.value === '' && this.#storageCodeData.returnFieldsContainer)
		{
			this.#clearStorageCodeAndValue();
		}

		const isStorageDeselected = newStorageId > 0 && this.#currentStorageId === newStorageId;
		if (isStorageDeselected)
		{
			return;
		}

		this.#currentStorageId = newStorageId;
		this.#conditionGroup = new ConditionGroup();
		this.#returnFieldsIds = [];
		this.#render();
	}

	#clearStorageCodeAndValue(): void
	{
		this.#storageCodeData.dependentElements.forEach((element) => Dom.hide(element));

		this.#storageCodeData.element.value = '';
		this.#conditionGroup = new ConditionGroup();
	}

	#render(): void
	{
		this.#storageCodeData.dependentElements.forEach((element) => Dom.hide(element));

		if (Type.isNil(this.#currentStorageId) || this.#currentStorageId <= 0)
		{
			this.#storageIdDependentElements.forEach((element) => Dom.hide(element));
			this.#renderStorageCodeFields();
		}
		else
		{
			this.#storageIdDependentElements.forEach((element) => Dom.show(element));
			this.#renderFilterFields();
			this.#renderReturnFields();
		}
	}

	#renderStorageCodeFields(): void
	{
		if (Type.isStringFilled(this.#storageCodeData.element.value))
		{
			this.#storageCodeData.dependentElements.forEach((element) => Dom.show(element));
		}
	}

	#showFieldSelector(targetInputId: string): void
	{
		window.BPAShowSelector(targetInputId, 'string', '');
	}

	#renderFilterFields(): void
	{
		if (!Type.isNil(this.#conditionGroup))
		{
			const selector = new ConditionGroupSelector(this.#conditionGroup, {
				fields: Object.values(this.#filterFieldsMap.get(this.#currentStorageId) || {}),
				fieldPrefix: this.#filteringFieldsPrefix,
				customSelector: Type.isFunction(window.BPAShowSelector) ? this.#showFieldSelector : null,
				caption: {
					head: this.#options.headCaption,
					collapsed: this.#options.collapsedCaption,
				},
				isExpanded: this.#getFilterExpandedState(),
			});

			selector.subscribe('onToggleGroupViewClick', (event: BaseEvent) => {
				const data = event.getData();
				this.#saveFilterExpandedState(data.isExpanded);
			});

			Dom.clean(this.#filterFieldsContainer);
			Dom.append(selector.createNode(), this.#filterFieldsContainer);
		}
	}

	#getFilterExpandedState(): boolean
	{
		return this.#form.is_expanded?.value === 'Y';
	}

	#saveFilterExpandedState(isExpanded: boolean): void
	{
		if (this.#form.is_expanded)
		{
			this.#form.is_expanded.value = isExpanded ? 'Y' : 'N';
		}
	}

	#renderReturnFields(): void
	{
		const storageId = this.#currentStorageId;
		const fieldsMap = this.#returnFieldsMap.get(storageId);

		if (!Type.isNil(fieldsMap))
		{
			const fieldOptions = {};
			fieldsMap.forEach((field, fieldId) => {
				fieldOptions[fieldId] = field.Name;
			});
			const selectElement = this.#form.id_return_fields;
			if (!selectElement)
			{
				return;
			}

			Dom.clean(selectElement);
			for (const [value, text] of Object.entries(fieldOptions))
			{
				const isSelected = this.#returnFieldsIds?.includes(value)
					|| this.#returnFieldsIds?.includes(Number(value))
				;
				selectElement.add(
					Tag.render`
						<option value="${Text.encode(value)}" ${isSelected ? 'selected' : ''}>
							${Text.encode(text)}
						</option>
					`,
				);
			}
		}
	}
}
