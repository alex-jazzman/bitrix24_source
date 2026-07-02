import { Dom, Tag, Type, Event, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { FieldRowRenderer } from './field-row-renderer';
import { FieldMenu } from './field-menu';

import { Action } from './types';
import type { StorageField, WriteFieldsOptions } from './types';

export class WriteFieldsManager
{
	#form: HTMLFormElement;
	#writeFieldsOptions: WriteFieldsOptions;
	#documentType: Array<string>;
	#currentStorageId: string;
	#storageBlocks: Array<Object> = [];

	#fieldsContainer: ?HTMLElement = null;
	#storageIdField: ?HTMLInputElement = null;
	#addFieldButton: ?HTMLElement = null;
	#createFieldButton: ?HTMLElement = null;
	#outerBlock: ?HTMLElement = null;
	#storageFields: StorageField[] = [];
	#currentValues: Object = {};
	#fieldsCache: Map<string, StorageField[]> = new Map();
	#writeFieldsMap: Map<string, StorageField[]> = new Map();

	#fieldRowRenderer: ?FieldRowRenderer = null;
	#fieldMenu: ?FieldMenu = null;

	#onAddButtonClickHandler: Function;
	#onCreateButtonClickHandler: Function;
	#onAfterFieldRendererHandler: Function;
	#onStorageRemoveHandler: Function;

	constructor({
		form,
		writeFieldsOptions,
		documentType,
		currentStorageId,
		storageBlocks,
	}: {
		form: HTMLFormElement;
		writeFieldsOptions: WriteFieldsOptions;
		documentType: Array<string>;
		currentStorageId: string;
		storageBlocks: Array<Object>;
	})
	{
		this.#form = form;
		this.#writeFieldsOptions = writeFieldsOptions;
		this.#documentType = documentType;
		this.#currentStorageId = currentStorageId;
		this.#storageBlocks = storageBlocks || [];

		this.#onAddButtonClickHandler = this.#onAddButtonClick.bind(this);
		this.#onCreateButtonClickHandler = this.#onCreateButtonClick.bind(this);
		this.#onAfterFieldRendererHandler = this.#onAfterFieldRenderer.bind(this);
		this.#onStorageRemoveHandler = this.#onStorageRemove.bind(this);
	}

	setStorageBlocks(blocks: Array<Object>): void
	{
		this.#storageBlocks = blocks || [];
		this.#populateDynamicStorageWriteFields();
	}

	init(): void
	{
		if (!Type.isPlainObject(this.#writeFieldsOptions))
		{
			return;
		}

		const block = this.#form.querySelector('[data-role="bpa-write-fields-block"]');
		const fieldsContainer = block?.querySelector('#fieldsContainer');
		const addFieldButton = block?.querySelector('#add_field');
		const createFieldButton = block?.querySelector('#create_field');
		const outerBlock = block?.querySelector('[data-role="bpa-write-fields-outer"]');
		const storageIdField = this.#form.storage_id ?? this.#form.querySelector('[name="storage_id"]');

		if (!fieldsContainer || !addFieldButton || !outerBlock || !storageIdField)
		{
			return;
		}

		this.#fieldsContainer = fieldsContainer;
		this.#storageIdField = storageIdField;
		this.#addFieldButton = addFieldButton;
		this.#createFieldButton = createFieldButton;
		this.#outerBlock = outerBlock;
		this.#currentValues = this.#writeFieldsOptions.currentFieldValues || {};

		this.#fieldRowRenderer = new FieldRowRenderer({
			documentType: this.#documentType,
			currentValues: this.#currentValues,
			getStorageIdValue: () => this.#currentStorageId || this.#storageIdField?.value,
			onFieldEdited: (field) => {
				this.#editStorageField(field);
				this.#editField(field);
				this.#fieldsCache.delete(this.#currentStorageId);
			},
			onFieldDeleted: (fieldId) => {
				this.#deleteFieldRow(fieldId);
				this.#storageFields = this.#storageFields.filter((f) => f.Id !== fieldId);
				this.#fieldsCache.delete(this.#currentStorageId);
			},
			onRowRemoved: () => {
				Dom.show(this.#addFieldButton);
			},
		});

		this.#fieldMenu = new FieldMenu({
			addFieldButton: this.#addFieldButton,
			fieldsContainer: this.#fieldsContainer,
			getStorageFields: () => this.#storageFields,
			onAddStaticField: (field) => {
				this.#addStorageField(field);
				this.#addField(field);
			},
		});

		this.#bindEvents();

		this.#writeFieldsMap = new Map(
			Object.entries(this.#writeFieldsOptions.writeFieldsMap || {})
				.map(([storageId, fields]) => [String(storageId), fields]),
		);

		this.#populateDynamicStorageWriteFields();

		const initialFields = this.#writeFieldsMap.get(this.#currentStorageId) || [];
		this.#initializeFields(initialFields);
	}

	async onStorageChange(newStorageId: string): Promise<void>
	{
		this.#currentStorageId = newStorageId;

		if (!this.#fieldsContainer)
		{
			return;
		}

		if (Number(newStorageId) > 0)
		{
			if (this.#createFieldButton)
			{
				Dom.show(this.#createFieldButton);
			}

			await this.#resetFieldContainer(newStorageId);
		}
		else if (Type.isStringFilled(newStorageId))
		{
			const dynamicFields = this.#getDynamicStorageFields(newStorageId);

			if (this.#createFieldButton)
			{
				Dom.hide(this.#createFieldButton);
			}

			Dom.clean(this.#fieldsContainer);
			this.#storageFields = [...dynamicFields];
			this.#restoreSavedFieldValues();
			Dom.show(this.#addFieldButton);
			Dom.show(this.#outerBlock);
		}
		else
		{
			this.#clearWriteFields();
		}
	}

	destroy(): void
	{
		if (this.#addFieldButton)
		{
			Event.unbind(this.#addFieldButton, 'click', this.#onAddButtonClickHandler);
		}

		if (this.#createFieldButton)
		{
			Event.unbind(this.#createFieldButton, 'click', this.#onCreateButtonClickHandler);
		}

		this.#fieldsCache.clear();

		EventEmitter.unsubscribe(
			'BX.Bizproc.FieldType.onDesignerRenderControlFinished',
			this.#onAfterFieldRendererHandler,
		);

		EventEmitter.unsubscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);

		if (this.#fieldMenu)
		{
			this.#fieldMenu.destroy();
		}
	}

	#bindEvents(): void
	{
		Event.bind(this.#addFieldButton, 'click', this.#onAddButtonClickHandler);

		if (this.#createFieldButton)
		{
			Event.bind(this.#createFieldButton, 'click', this.#onCreateButtonClickHandler);
		}

		EventEmitter.subscribe(
			'BX.Bizproc.FieldType.onDesignerRenderControlFinished',
			this.#onAfterFieldRendererHandler,
		);

		EventEmitter.subscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);
	}

	#initializeFields(fields: StorageField[]): void
	{
		if (Number(this.#currentStorageId) > 0)
		{
			this.#initializeStaticStorageFields(fields);
		}
		else if (Type.isStringFilled(this.#currentStorageId))
		{
			const dynamicFields = this.#getDynamicStorageFields(this.#currentStorageId);
			const mergedFields = this.#mergeDynamicFieldsWithSavedValues(dynamicFields);

			if (this.#createFieldButton)
			{
				Dom.hide(this.#createFieldButton);
			}

			this.#initializeStaticStorageFields(mergedFields);
		}

		if (!this.#currentStorageId || this.#currentStorageId === '0')
		{
			Dom.hide(this.#outerBlock);
		}
	}

	#initializeStaticStorageFields(fields: StorageField[]): void
	{
		if (!Type.isArrayFilled(fields))
		{
			return;
		}

		this.#storageFields = [...fields];
		this.#restoreSavedFieldValues();
	}

	#restoreSavedFieldValues(): void
	{
		for (const [fieldName, value] of Object.entries(this.#currentValues))
		{
			if (!Type.isNil(value) && (!Type.isArray(value) || value.length > 0))
			{
				const field = this.#storageFields.find((item) => item.FieldName === fieldName);
				if (field)
				{
					field.Value = value;
					this.#addField(field);
				}
			}
		}
	}

	async #resetFieldContainer(storageId: string): Promise<void>
	{
		const fields = await this.#getFields(storageId);
		if (this.#currentStorageId !== storageId)
		{
			return;
		}

		this.#storageFields = [...fields];
		Dom.clean(this.#fieldsContainer);
		Dom.show(this.#addFieldButton);
		Dom.show(this.#outerBlock);
	}

	#clearWriteFields(): void
	{
		Dom.clean(this.#fieldsContainer);
		Dom.hide(this.#outerBlock);
	}

	#getStorageId(): ?string
	{
		return this.#storageIdField.value || null;
	}

	async #getFields(storageId: string): Promise<StorageField[]>
	{
		if (this.#fieldsCache.has(storageId))
		{
			return this.#fieldsCache.get(storageId);
		}

		try
		{
			const response = await ajax.runAction(
				Action.GET_FIELDS,
				{
					data: {
						storageId,
						format: true,
					},
				},
			);

			if (response.status === 'success')
			{
				this.#fieldsCache.set(storageId, response.data);

				return response.data;
			}
		}
		catch (error)
		{
			console.error('Failed to load storage fields', error);
		}

		return [];
	}

	#getDynamicStorageFields(storageCode: string): StorageField[]
	{
		const block = this.#storageBlocks.find(
			(b) => b.activity?.Properties?.StorageCode === storageCode,
		);

		return (block?.activity?.Properties?.SelectedFields || []).map((field) => ({
			Id: field.code,
			Name: field.name,
			FieldName: field.code,
			Type: field.type,
			Multiple: field.multiple === true || field.multiple === 'Y',
			Required: field.mandatory === true || field.mandatory === 'Y',
			Options: field.settings || {},
			AllowSelection: true,
		}));
	}

	#mergeDynamicFieldsWithSavedValues(dynamicFields: StorageField[]): StorageField[]
	{
		const knownFieldNames = new Set(
			dynamicFields.map((f) => f.FieldName),
		);

		const extraFields = [];
		for (const fieldName of Object.keys(this.#currentValues))
		{
			if (!knownFieldNames.has(fieldName))
			{
				extraFields.push({
					Id: fieldName,
					Name: fieldName,
					FieldName: fieldName,
					Type: 'string',
					Required: false,
					AllowSelection: true,
				});
			}
		}

		return [...dynamicFields, ...extraFields];
	}

	#populateDynamicStorageWriteFields(): void
	{
		for (const block of this.#storageBlocks)
		{
			const properties = block.activity?.Properties;
			if (!properties?.StorageCode || !Type.isArrayFilled(properties.SelectedFields))
			{
				continue;
			}

			const dynamicFields = properties.SelectedFields.map((field) => ({
				Id: field.code,
				Name: field.name,
				FieldName: field.code,
				Type: field.type,
				Multiple: field.multiple === true || field.multiple === 'Y',
				Required: field.mandatory === true || field.mandatory === 'Y',
				Options: field.settings || {},
				AllowSelection: true,
			}));

			this.#writeFieldsMap.set(String(properties.StorageCode), dynamicFields);
		}
	}

	#addStorageField(field: StorageField): void
	{
		const exists = this.#storageFields.some((f) => f.Id === field.Id);
		if (!exists)
		{
			this.#storageFields.push(field);
		}
	}

	#addField(field: StorageField): void
	{
		const row = Tag.render`<div data-id="${field.Id}" class="bizproc-write-activity__field"></div>`;
		Dom.append(row, this.#fieldsContainer);
		this.#fieldRowRenderer.renderStaticFieldRow(row, field);

		const addedFieldIds = new Set(
			[...this.#fieldsContainer.querySelectorAll('[data-id]')].map((el) => String(el.dataset.id)),
		);
		const notAddedFields = this.#storageFields.filter((f) => !addedFieldIds.has(String(f.Id)));
		if (notAddedFields.length === 0)
		{
			Dom.hide(this.#addFieldButton);
		}
	}

	#editStorageField(field: StorageField): void
	{
		const index = this.#storageFields.findIndex((f) => f.Id === field.Id);
		if (index !== -1)
		{
			this.#storageFields[index] = field;
		}
	}

	#editField(field: StorageField): void
	{
		const row = this.#fieldsContainer.querySelector(`[data-id="${CSS.escape(String(field.Id))}"]`);
		if (row)
		{
			Dom.clean(row);
			this.#fieldRowRenderer.renderStaticFieldRow(row, field);
		}
	}

	#deleteFieldRow(fieldId: number): void
	{
		const rowToRemove = this.#fieldsContainer.querySelector(`[data-id="${CSS.escape(String(fieldId))}"]`);
		if (rowToRemove)
		{
			Dom.remove(rowToRemove);
		}
	}

	#onAddButtonClick(event): void
	{
		event.preventDefault();
		this.#fieldMenu.show();
	}

	async #onCreateButtonClick(event): Promise<void>
	{
		event.preventDefault();
		const field = await this.#fieldRowRenderer.openFieldEdit();

		if (field)
		{
			this.#fieldsCache.delete(this.#currentStorageId);
			this.#addStorageField(field);
			this.#addField(field);
		}
	}

	#onAfterFieldRenderer(event): void
	{
		const node = event.data.node;
		const textarea = node.querySelector('textarea[name^="field_values_"], textarea[name="field_keys[]"]');
		if (!textarea)
		{
			return;
		}

		const isFieldValues = textarea.name.startsWith('field_values_');
		const randString = Math.random().toString(36).slice(2, 11);
		const uniqueId = `field_${isFieldValues ? 'values' : 'keys'}_${randString}`;

		textarea.id = uniqueId;

		const button = node.querySelector('[data-role="bp-selector-button"]');
		if (!button)
		{
			return;
		}

		const oldOnclick = button.getAttribute('onclick');
		if (oldOnclick)
		{
			const newOnclick = oldOnclick.replace(
				/BPAShowSelector\('([^']+)'(\s*,\s*[^)]+)\)/,
				`BPAShowSelector('${uniqueId}'$2)`,
			);
			button.setAttribute('onclick', newOnclick);
		}
	}

	#onStorageRemove(event): void
	{
		const storageId = Number(event.getData().storageId);
		if (storageId <= 0)
		{
			return;
		}

		const currentStorageId = this.#getStorageId();
		if (currentStorageId === String(storageId))
		{
			this.#storageIdField.value = '';
			this.#clearWriteFields();
		}
	}
}
