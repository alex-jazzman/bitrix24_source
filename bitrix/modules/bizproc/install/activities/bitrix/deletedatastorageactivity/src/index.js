import { Tag, Dom, Type, Event, Runtime } from 'main.core';
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

export class DeleteDataStorageActivityRenderer
{
	#form: ?HTMLFormElement = null;
	#options: ?PropertyOptions = null;

	#documentType: Array<string> = [];
	#storageCodeInput: ?HTMLInputElement = null;
	#currentStorageId: number = 0;
	#currentStorageCode: string | undefined = '';
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

	afterFormRender(form: HTMLFormElement): void
	{
		this.#form = form;
		this.#dialog = Dialog.getById('entityselector_storage_id');
		if (Type.isPlainObject(this.#options))
		{
			this.#documentType = this.#options.documentType;

			if (!Type.isNil(this.#form))
			{
				this.#storageCodeInput = this.#form.storage_code;
				const item = this.#dialog?.selectedItems.values()?.next()?.value;
				this.#currentStorageId = item?.id || 0;
				this.#currentStorageCode = this.#storageCodeInput?.value || '';
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

			this.#initAutomationContext();
			this.#initFilterFields(this.#options);
			this.#initStorageSelector();

			if (this.#deleteModeSelect)
			{
				Event.bind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
			}

			this.#render();
		}
	}

	#initStorageSelector(): void
	{
		Runtime
			.loadExtension('bizproc.storage-selector')
			.then(({ StorageSelector }) => {
				this.#dialog = new StorageSelector({
					dialogId: 'entityselector_storage_id',
					storageCodeInput: this.#storageCodeInput,
					onStateChange: this.#onStorageStateChange.bind(this),
				});
				this.#dialog.init();
			})
			.catch((e) => console.error(e));
	}

	#onStorageStateChange(newStorageId: number): void
	{
		this.#currentStorageId = newStorageId;
		this.#currentStorageCode = this.#storageCodeInput?.value;
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
		if ((this.#currentStorageId > 0 || this.#currentStorageCode) && this.#currentDeleteMode === 'multiple')
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

	#initFilterFields(options: PropertyOptions): void
	{
		this.#filterFieldsContainer = this.#form.querySelector('[data-role="bpa-sda-filter-fields-container"]');
		this.#filteringFieldsPrefix = options.filteringFieldsPrefix;
		this.#filterFieldsMap = new Map(
			Object.entries(options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]),
		);

		this.#conditionGroup = new ConditionGroup(options.conditions);
	}

	destroy(): void
	{
		if (this.#deleteModeSelect)
		{
			Event.unbind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
		}
	}
}
