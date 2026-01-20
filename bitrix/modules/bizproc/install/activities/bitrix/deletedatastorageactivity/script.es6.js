import { Reflection, Type, Event, Dom, Loc } from 'main.core';
import {
	Context,
	ConditionGroup,
	ConditionGroupSelector,
	Document,
	getGlobalContext,
	setGlobalContext,
	InlineSelector,
	Designer,
} from 'bizproc.automation';

const namespace = Reflection.namespace('BX.Bizproc.Activity');

class DeleteDataStorageActivity
{
	documentType: Array<string>;
	document: Document;

	storageIdSelect: HTMLSelectElement;
	storageCodeInput: HTMLInputElement;
	deleteModeElement: HTMLElement;

	filterFieldsContainer: HTMLDivElement | null;
	filteringFieldsPrefix: string;
	filterFieldsMap: Map<number, object>;
	conditionGroup: ConditionGroup | undefined;

	currentStorageId: number;
	currentStorageCode: ?string;

	deleteModeSelect: HTMLSelectElement;
	currentDeleteMode: string;

	constructor(options)
	{
		if (Type.isPlainObject(options))
		{
			this.documentType = options.documentType;
			const form = document.forms[options.formName];

			if (!Type.isNil(form))
			{
				this.storageIdSelect = form.storage_id;
				this.storageCodeInput = form.storage_code;
				this.currentStorageId = Number(this.storageIdSelect?.value || 0);
				this.currentStorageCode = this.storageCodeInput?.value;
				this.deleteModeElement = document.querySelector(
					'[data-role="bpa-sda-delete-mode-dependent"]',
				);

				this.deleteModeSelect = form.delete_mode;
				this.currentDeleteMode = this.deleteModeSelect?.value || '';
			}

			this.document = new Document({
				rawDocumentType: this.documentType,
				documentFields: options.documentFields,
				title: options.documentName,
			});

			this.initAutomationContext();
			this.initFilterFields(options);

			this.render();
		}
	}

	initFilterFields(options)
	{
		this.conditionIdPrefix = 'id_bpa_sra_field_';
		this.filterFieldsContainer = document.querySelector('[data-role="bpa-sda-filter-fields-container"]');
		this.filteringFieldsPrefix = options.filteringFieldsPrefix;
		this.filterFieldsMap = new Map(
			Object.entries(options.filterFieldsMap)
				.map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]),
		);

		this.conditionGroup = new ConditionGroup(options.conditions);
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
		if (this.storageCodeInput)
		{
			Event.bind(this.storageCodeInput, 'change', this.onStorageCodeChange.bind(this));
		}
		if (this.deleteModeSelect)
		{
			Event.bind(this.deleteModeSelect, 'change', this.onDeleteModeChange.bind(this));
		}
	}

	onStorageIdChange(): void
	{
		this.storageCodeInput.value = '';
		this.currentStorageId = Number(this.storageIdSelect.value);
		this.conditionGroup = new ConditionGroup();
		this.render();
	}

	onStorageCodeChange(): void
	{
		this.storageIdSelect.value = '';
		this.currentStorageCode = this.storageCodeInput?.value;
		this.conditionGroup = new ConditionGroup();
		this.render();
	}

	onDeleteModeChange(): void
	{
		this.currentDeleteMode = this.deleteModeSelect.value;
		this.conditionGroup = new ConditionGroup();
		this.render();
	}

	render(): void
	{
		if ((this.currentStorageId > 0 || this.currentStorageCode) && this.currentDeleteMode === 'multiple')
		{
			Dom.show(this.deleteModeElement);
			this.renderFilterFields();
		}
		else
		{
			Dom.hide(this.deleteModeElement);
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
					head: Loc.getMessage('BIZPROC_SDA_FILTER_FIELDS_PROPERTY'),
					collapsed: Loc.getMessage('BIZPROC_SDA_FILTER_FIELDS_COLLAPSED_TEXT'),
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
}

namespace.DeleteDataStorageActivity = DeleteDataStorageActivity;
