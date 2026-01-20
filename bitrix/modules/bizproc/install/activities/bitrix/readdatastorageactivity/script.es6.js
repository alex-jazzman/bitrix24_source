import { Reflection, Type, Event, Dom, Loc } from 'main.core';
import {
	Context,
	ConditionGroup,
	ConditionGroupSelector,
	Document,
	getGlobalContext,
	setGlobalContext,
} from 'bizproc.automation';

const namespace = Reflection.namespace('BX.Bizproc.Activity');

type FieldType = {
	FieldName: string,
	Type: string,
	Multiple: boolean,
	Options: ?{},
};

type StorageCodeData = {
	element: HTMLTextAreaElement,
	dependentElements: Array<HTMLElement>,

	isReturnFieldsRendered: boolean,
	returnFieldsProperty: FieldType,
	returnFieldsContainer: ?HTMLDivElement,
};

class ReadDataStorageActivity
{
	documentType: Array<string>;
	document: Document;

	storageIdSelect: HTMLSelectElement;

	#storageCodeData: StorageCodeData = {
		dependentElements: [],
		isReturnFieldsRendered: true,
	};

	storageIdDependentElements: NodeListOf<HTMLElement>;

	returnFieldsProperty: FieldType = {};
	returnFieldsMapContainer: HTMLDivElement;
	returnFieldsMap: Map<number, Map<string, object>>;
	returnFieldsIds: Array<string>;

	filterFieldsContainer: HTMLDivElement | null;
	filteringFieldsPrefix: string;
	filterFieldsMap: Map<number, object>;
	conditionGroup: ConditionGroup | undefined;

	currentStorageId: number;

	constructor(options)
	{
		if (Type.isPlainObject(options))
		{
			this.documentType = options.documentType;
			const form = document.forms[options.formName];

			if (!Type.isNil(form))
			{
				this.storageIdSelect = form.storage_id;
				this.currentStorageId = Number(this.storageIdSelect?.value || 0);
				this.storageIdDependentElements = form.querySelectorAll(
					'[data-role="bpa-sra-storage-id-dependent"]',
				);

				this.#storageCodeData.element = form.storage_code;
				this.#storageCodeData.dependentElements.push(
					...form.querySelectorAll('[data-role="bpa-sra-storage-code-dependent"]').values(),
					form.querySelector('[data-role="bpa-sra-filter-fields-container"]').closest('tr'),
				);
			}

			this.document = new Document({
				rawDocumentType: this.documentType,
				documentFields: options.documentFields,
				title: options.documentName,
			});

			this.initAutomationContext();
			this.initFilterFields(options);
			this.initReturnFields(options);

			this.render();
		}
	}

	initFilterFields(options)
	{
		this.conditionIdPrefix = 'id_bpa_sra_field_';
		this.filterFieldsContainer = document.querySelector('[data-role="bpa-sra-filter-fields-container"]');
		this.filteringFieldsPrefix = options.filteringFieldsPrefix;
		this.filterFieldsMap = new Map(
			Object.entries(options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]),
		);

		if (!Type.isNil(options.documentType))
		{
			BX.Bizproc.Automation.API.documentType = options.documentType;
		}

		this.conditionGroup = new ConditionGroup(options.conditions);
	}

	initReturnFields(options)
	{
		this.returnFieldsProperty = options.returnFieldsProperty;
		this.returnFieldsIds = Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];

		this.returnFieldsMapContainer = document.querySelector('[data-role="bpa-sra-return-fields-container"]');
		this.returnFieldsMap = new Map();
		Object.entries(options.returnFieldsMap).forEach(([storageId, fieldsMap]) => {
			this.returnFieldsMap.set(Number(storageId), new Map(Object.entries(fieldsMap)));
		});

		this.#storageCodeData.returnFieldsProperty = options.returnFieldsByStorageCodeProperty;
		this.#storageCodeData.returnFieldsContainer = document.querySelector('[data-role="bpa-sra-return-fields-by-storage-code-container"]');
	}

	initAutomationContext()
	{
		try
		{
			getGlobalContext();
		}
		catch
		{
			setGlobalContext(new Context({ document: this.document }));
		}
	}

	init(): void
	{
		if (this.storageIdSelect)
		{
			Event.bind(this.storageIdSelect, 'change', this.onStorageIdChange.bind(this));
		}

		if (this.#storageCodeData.element)
		{
			this.renderFilterFields();
			Event.bind(this.#storageCodeData.element, 'input', this.#onStorageCodeChange.bind(this));
			Event.bind(this.#storageCodeData.element, 'focus', this.#onStorageCodeChange.bind(this));
		}
	}

	onStorageIdChange(): void
	{
		this.currentStorageId = Number(this.storageIdSelect.value);
		if (this.currentStorageId > 0)
		{
			this.#clearStorageCodeAndValue();
		}

		this.conditionGroup = new ConditionGroup();
		this.returnFieldsIds = [];
		this.render();
	}

	#onStorageCodeChange(): void
	{
		if (this.currentStorageId <= 0 && this.#storageCodeData.returnFieldsContainer)
		{
			if (!Type.isStringFilled(this.#storageCodeData.element.value))
			{
				this.#clearStorageCodeAndValue();
			}

			this.render();
		}
	}

	#clearStorageCodeAndValue()
	{
		this.#storageCodeData.dependentElements.forEach((element) => Dom.hide(element));

		this.#storageCodeData.element.value = '';
		Dom.clean(this.#storageCodeData.returnFieldsContainer);
		this.#storageCodeData.isReturnFieldsRendered = false;
		this.conditionGroup = new ConditionGroup();
	}

	render(): void
	{
		this.#storageCodeData.dependentElements.forEach((element) => Dom.hide(element));

		if (Type.isNil(this.currentStorageId) || this.currentStorageId <= 0)
		{
			this.storageIdDependentElements.forEach((element) => Dom.hide(element));
			this.#renderStorageCodeFields();
		}
		else
		{
			this.storageIdDependentElements.forEach((element) => Dom.show(element));
			this.renderFilterFields();
			this.renderReturnFields();
		}
	}

	#renderStorageCodeFields()
	{
		if (Type.isStringFilled(this.#storageCodeData.element.value))
		{
			this.#storageCodeData.dependentElements.forEach((element) => Dom.show(element));
			if (!this.#storageCodeData.isReturnFieldsRendered)
			{
				this.renderFilterFields();

				Dom.clean(this.#storageCodeData.returnFieldsContainer);
				Dom.append(
					BX.Bizproc.FieldType.renderControlDesigner(
						this.documentType,
						this.#storageCodeData.returnFieldsProperty,
						this.#storageCodeData.returnFieldsProperty.FieldName,
					),
					this.#storageCodeData.returnFieldsContainer,
				);
				this.#storageCodeData.isReturnFieldsRendered = true;
			}
		}
	}

	showFieldSelector(targetInputId)
	{
		BPAShowSelector(targetInputId, 'string', '');
	}

	renderFilterFields(): void
	{
		if (!Type.isNil(this.conditionGroup))
		{
			const selector = new ConditionGroupSelector(this.conditionGroup, {
				fields: Object.values(this.filterFieldsMap.get(this.currentStorageId) || {}),
				fieldPrefix: this.filteringFieldsPrefix,
				customSelector: Type.isFunction(BPAShowSelector) ? this.showFieldSelector : null,
				caption: {
					head: Loc.getMessage('BIZPROC_SRA_FILTER_FIELDS_PROPERTY'),
					collapsed: Loc.getMessage('BIZPROC_SRA_FILTER_FIELDS_COLLAPSED_TEXT'),
				},
			});

			if (selector.modern && this.filterFieldsContainer && this.filterFieldsContainer.parentNode)
			{
				const element = (
					this.filterFieldsContainer.parentNode.firstElementChild === this.filterFieldsContainer
						? this.filterFieldsContainer.parentNode.parentNode.firstElementChild
						: this.filterFieldsContainer.parentNode.firstElementChild
				);

				Dom.clean(element);
			}

			Dom.clean(this.filterFieldsContainer);
			Dom.append(selector.createNode(), this.filterFieldsContainer);
		}
	}

	renderReturnFields(): void
	{
		const storageId = this.currentStorageId;
		const fieldsMap = this.returnFieldsMap.get(storageId);

		if (!Type.isNil(fieldsMap))
		{
			const fieldOptions = {};
			fieldsMap.forEach((field, fieldId) => {
				fieldOptions[fieldId] = field.Name;
			});
			this.returnFieldsProperty.Options = fieldOptions;

			Dom.clean(this.returnFieldsMapContainer);
			this.returnFieldsMapContainer.appendChild(
				BX.Bizproc.FieldType.renderControl(
					this.documentType,
					this.returnFieldsProperty,
					this.returnFieldsProperty.FieldName,
					this.returnFieldsIds,
					'designer',
				),
			);
		}
	}
}

namespace.ReadDataStorageActivity = ReadDataStorageActivity;
