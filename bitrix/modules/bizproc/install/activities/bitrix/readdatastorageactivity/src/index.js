import { Type, Dom, Tag, Text, Runtime } from 'main.core';
import {
	Context,
	ConditionGroup,
	ConditionGroupSelector,
	Document,
	getGlobalContext,
	setGlobalContext,
} from 'bizproc.automation';
import { EventEmitter, BaseEvent } from 'main.core.events';

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

export class ReadDataStorageActivityRenderer
{
	#form: ?HTMLFormElement = null;
	#options: ?PropertyOptions = null;

	#dialog: Dialog | null;

	#documentType: Array<string>;
	#document: Document;

	#storageIdDependentElements: NodeListOf<HTMLElement>;

	#returnFieldsMap: Map<string, Map<string, object>> = new Map();
	#returnFieldsIds: Array<string> = [];
	#systemReturnFields: Map<string, object> = new Map();

	#filterFieldsContainer: HTMLDivElement | null = null;
	#filteringFieldsPrefix: string = '';
	#filterFieldsMap: Map<string, object> = new Map();
	#conditionGroup: ConditionGroup | null = null;
	#conditionGroupSelector: ?ConditionGroupSelector = null;

	#currentStorageId: string = '';
	#storageBlocks: Array<Object> = [];

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

	async afterFormRender(form: HTMLFormElement): void
	{
		const { StorageSelector, mapStorageBlocksToFilterFields, resolveCurrentStorageId } = await Runtime
			.loadExtension('bizproc.storage-selector');

		this.#form = form;

		if (Type.isPlainObject(this.#options))
		{
			this.#documentType = this.#options.documentType;

			if (!Type.isNil(this.#form))
			{
				this.#currentStorageId = resolveCurrentStorageId(this.#form);

				this.#storageIdDependentElements = form.querySelectorAll(
					'#row_return_fields, #row_filter_fields',
				);
			}

			this.#document = new Document({
				rawDocumentType: this.#documentType,
				documentFields: [],
				title: 'document',
			});

			EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', (event: BaseEvent) => {
				const { blocks } = event.getData();
				this.#storageBlocks = (blocks || []).filter(
					(block) => block.activity?.Type === 'CreateStorageNode',
				);

				this.#initFilterFields(this.#options, mapStorageBlocksToFilterFields);
				this.#initReturnFields(this.#options);
				this.#render();
			});

			this.#initAutomationContext();
			this.#initStorageSelector(StorageSelector);

			this.#render();
		}
	}

	#initStorageSelector(StorageSelector): void
	{
		this.#dialog = new StorageSelector({
			dialogId: 'entityselector_storage_id',
			onStateChange: this.#onStorageStateChange.bind(this),
			initialValue: this.#currentStorageId,
			storageCodeInput: this.#form?.querySelector('[name="storage_code"]'),
		});
		this.#dialog.init();
	}

	#initFilterFields(options: Object, mapStorageBlocksToFilterFields: Function): void
	{
		this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sra-filter-fields-container"]');
		this.#filteringFieldsPrefix = options.filteringFieldsPrefix;
		this.#filterFieldsMap = new Map(
			Object.entries(options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]),
		);

		this.#filterFieldsMap = mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);

		this.#conditionGroup = new ConditionGroup(options.conditions);
		this.#conditionGroupSelector = null;
	}

	#initReturnFields(options: Object): void
	{
		this.#returnFieldsIds = Type.isArray(options.returnFieldsIds) ? options.returnFieldsIds : [];

		const storageInput = this.#form.querySelector('input[name="storage_id"]');
		const storageIdValue = storageInput?.value || '';
		if (!storageIdValue || storageIdValue === '0')
		{
			const inputs = this.#form.querySelectorAll('[name="return_fields_by_storage_code[]"]');
			const values = [...inputs]
				.map((input) => input.value)
				.filter(Boolean)
			;
			if (values.length > 0)
			{
				this.#returnFieldsIds = values;
			}
		}

		this.#returnFieldsMap = new Map();
		Object.entries(options.returnFieldsMap).forEach(([storageId, fieldsMap]) => {
			this.#returnFieldsMap.set(String(storageId), new Map(Object.entries(fieldsMap)));
		});

		this.#systemReturnFields = new Map();
		if (Type.isPlainObject(options.systemReturnFields))
		{
			Object.entries(options.systemReturnFields).forEach(([fieldId, field]) => {
				this.#systemReturnFields.set(String(fieldId), { Name: field.Name });
			});
		}

		this.#populateDynamicStorageReturnFields();
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

	#populateDynamicStorageReturnFields(): void
	{
		for (const block of this.#storageBlocks)
		{
			const properties = block.activity?.Properties;
			if (!properties?.StorageCode || !Type.isArrayFilled(properties.SelectedFields))
			{
				continue;
			}

			const fieldsMap = new Map(this.#systemReturnFields);
			for (const field of properties.SelectedFields)
			{
				fieldsMap.set(String(field.code), { Name: field.name });
			}

			this.#returnFieldsMap.set(String(properties.StorageCode), fieldsMap);
		}
	}

	#onStorageStateChange(newStorageId: string): void
	{
		if (this.#currentStorageId !== String(newStorageId))
		{
			this.#currentStorageId = String(newStorageId);
			this.#conditionGroupSelector = null;
			this.#conditionGroup = new ConditionGroup();
			this.#returnFieldsIds = [];
		}

		this.#render();
	}

	#render(): void
	{
		if (!this.#currentStorageId || this.#currentStorageId === '0')
		{
			this.#storageIdDependentElements?.forEach((element) => Dom.hide(element));
		}
		else
		{
			this.#storageIdDependentElements?.forEach((element) => Dom.show(element));
			this.#renderFilterFields();
			this.#renderReturnFields();
		}
	}

	#showFieldSelector(targetInputId: string): void
	{
		window.BPAShowSelector(targetInputId, 'string', '');
	}

	#renderFilterFields(): void
	{
		if (!Type.isNil(this.#conditionGroup) && Type.isNil(this.#conditionGroupSelector))
		{
			this.#conditionGroupSelector = new ConditionGroupSelector(this.#conditionGroup, {
				fields: Object.values(this.#filterFieldsMap.get(this.#currentStorageId) || {}),
				fieldPrefix: this.#filteringFieldsPrefix,
				customSelector: Type.isFunction(window.BPAShowSelector) ? this.#showFieldSelector : null,
				caption: {
					head: this.#options.headCaption,
					collapsed: this.#options.collapsedCaption,
				},
				isExpanded: this.#getFilterExpandedState(),
			});

			this.#conditionGroupSelector.subscribe('onToggleGroupViewClick', (event: BaseEvent) => {
				const data = event.getData();
				this.#saveFilterExpandedState(data.isExpanded);
			});

			Dom.clean(this.#filterFieldsContainer);
			Dom.append(this.#conditionGroupSelector.createNode(), this.#filterFieldsContainer);
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

	destroy(): void
	{
		if (this.#dialog)
		{
			this.#dialog.destroy();
			this.#dialog = null;
		}
	}

	#renderReturnFields(): void
	{
		const storageId = this.#currentStorageId;
		const fieldsMap = this.#returnFieldsMap?.get(storageId);

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
