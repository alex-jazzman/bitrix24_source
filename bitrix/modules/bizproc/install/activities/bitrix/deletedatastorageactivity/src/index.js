import { Tag, Dom, Type, Event, Runtime } from 'main.core';
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

export class DeleteDataStorageActivityRenderer
{
	#form: ?HTMLFormElement = null;
	#options: ?PropertyOptions = null;

	#documentType: Array<string> = [];
	#currentStorageId: string = '';
	#deleteModeElement: ?HTMLElement = null;
	#deleteModeSelect: ?HTMLSelectElement = null;
	#currentDeleteMode: string = '';
	#document: ?Document = null;
	#conditionGroup: ?ConditionGroup = null;
	#filterFieldsContainer: ?HTMLElement = null;
	#filteringFieldsPrefix: string = '';
	#filterFieldsMap: Map<number, any> = new Map();
	#onDeleteModeChangeHandler: ?Function;
	#dialog: ?Dialog;
	#conditionGroupSelector: ?ConditionGroupSelector = null;
	#storageBlocks: Array<Object> = [];

	constructor()
	{
		this.#onDeleteModeChangeHandler = this.#onDeleteModeChange.bind(this);
	}

	getControlRenderers(): ControlRenderers
	{
		return {
			filterFields: (field: Object) => {
				this.#options = field.property.Options || {};
				this.#options.headCaption = field.property.Name;

				return Tag.render`
					<div data-role="bpa-sda-delete-mode-dependent">
						<div data-role="bpa-sda-filter-fields-container"></div>
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

				this.#deleteModeElement = this.#form.querySelector(
					'[data-role="bpa-sda-delete-mode-dependent"]',
				);

				this.#deleteModeSelect = this.#form.delete_mode;
				this.#currentDeleteMode = this.#deleteModeSelect?.value || '';
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
				this.#render();
			});

			this.#initAutomationContext();
			this.#initStorageSelector(StorageSelector);

			if (this.#deleteModeSelect)
			{
				Event.bind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
			}

			this.#render();
		}
	}

	#initStorageSelector(StorageSelector): void
	{
		const dialogId = 'entityselector_storage_id';
		this.#dialog = new StorageSelector({
			dialogId,
			onStateChange: this.#onStorageStateChange.bind(this),
			initialValue: this.#currentStorageId,
			storageCodeInput: this.#form?.querySelector('[name="storage_code"]'),
		});
		this.#dialog.init();
	}

	#onStorageStateChange(newStorageId: string): void
	{
		if (this.#currentStorageId !== String(newStorageId))
		{
			this.#currentStorageId = String(newStorageId);
			this.#conditionGroupSelector = null;
			this.#conditionGroup = new ConditionGroup();
		}
		this.#render();
	}

	#onDeleteModeChange(): void
	{
		this.#currentDeleteMode = this.#deleteModeSelect.value;
		this.#render();
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

	#showFieldSelector(targetInputId: string): void
	{
		window.BPAShowSelector(targetInputId, 'string', '');
	}

	#render(): void
	{
		if (this.#currentStorageId && this.#currentDeleteMode === 'multiple')
		{
			Dom.show(this.#deleteModeElement);
			this.#renderFilterFields();
		}
		else
		{
			Dom.hide(this.#deleteModeElement);
		}
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

	#initFilterFields(options: PropertyOptions, mapStorageBlocksToFilterFields: Function): void
	{
		this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sda-filter-fields-container"]');
		this.#filteringFieldsPrefix = options.filteringFieldsPrefix;
		this.#filterFieldsMap = new Map(
			Object.entries(options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]),
		);

		this.#filterFieldsMap = mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);

		this.#conditionGroup = new ConditionGroup(options.conditions);
		this.#conditionGroupSelector = null;
	}

	destroy(): void
	{
		if (this.#deleteModeSelect)
		{
			Event.unbind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
		}

		if (this.#dialog)
		{
			this.#dialog.destroy();
			this.#dialog = null;
		}
	}
}
