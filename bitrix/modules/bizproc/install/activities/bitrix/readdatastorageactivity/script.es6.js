import { Reflection, Type, Dom, Loc } from 'main.core';
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
import { StorageSelector } from 'bizproc.storage-selector';

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
	#dialog: Dialog | null;
	#storageUpdating: boolean = false;

	constructor(options)
	{
		this.#dialog = Dialog.getById('entityselector_storage_id');
		if (Type.isPlainObject(options))
		{
			this.documentType = options.documentType;
			const form = document.forms[options.formName];

			if (!Type.isNil(form))
			{
				const item = this.#dialog.selectedItems.values()?.next()?.value;
				this.currentStorageId = item?.id || 0;
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
		this.#dialog = new StorageSelector({
			dialogId: 'entityselector_storage_id',
			storageCodeInput: this.#storageCodeData.element,
			onStateChange: this.onStorageStateChange.bind(this),
		});
		this.#dialog.init();

		if (this.#storageCodeData.element)
		{
			this.renderFilterFields();
		}
	}

	onStorageStateChange(newStorageId: number): void
	{
		const isStorageRemoved = this.currentStorageId > 0 && newStorageId <= 0;
		this.currentStorageId = newStorageId;

		if (isStorageRemoved && this.#storageCodeData.returnFieldsContainer)
		{
			if (!Type.isStringFilled(this.#storageCodeData.element.value))
			{
				this.#clearStorageCodeAndValue();
			}
		}
		else
		{
			this.conditionGroup = new ConditionGroup();
			this.returnFieldsIds = [];
		}

		this.render();
	}

	onStorageIdChange(event: BaseEvent): void
	{
		if (this.#storageUpdating)
		{
			return;
		}

		const data = event.getData();
		this.currentStorageId = 0;
		if (event.type === 'bx.ui.entityselector.dialog:item:onselect')
		{
			this.currentStorageId = Number(data.item.id);
		}

		if (this.#storageCodeData.element)
		{
			this.#storageCodeData.element.value = '';
		}

		this.conditionGroup = new ConditionGroup();
		this.returnFieldsIds = [];
		this.render();
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
		window.BPAShowSelector(targetInputId, 'string', '');
	}

	renderFilterFields(): void
	{
		if (!Type.isNil(this.conditionGroup))
		{
			const selector = new ConditionGroupSelector(this.conditionGroup, {
				fields: Object.values(this.filterFieldsMap.get(this.currentStorageId) || {}),
				fieldPrefix: this.filteringFieldsPrefix,
				customSelector: Type.isFunction(window.BPAShowSelector) ? this.showFieldSelector : null,
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
			Dom.append(
				BX.Bizproc.FieldType.renderControl(
					this.documentType,
					this.returnFieldsProperty,
					this.returnFieldsProperty.FieldName,
					this.returnFieldsIds,
					'designer',
				),
				this.returnFieldsMapContainer,
			);
		}
	}
}

namespace.ReadDataStorageActivity = ReadDataStorageActivity;
