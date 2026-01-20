import { ajax, Event, Reflection, Dom, Tag, Loc, Type, Runtime, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupMenu, Menu } from 'main.popup';
import StorageSelector, { StorageItem } from './storage-selector';

const namespace = Reflection.namespace('BX.Bizproc.Activity');

type Field = {
	Name: string,
	Type: string,
	FieldName: string,
	Multiple: boolean,
	Required: boolean,
};

class WriteDataStorageActivity
{
	#fieldsContainer: HTMLElement;
	#storageSelectorContainer: HTMLElement;
	#storageIdField: HTMLElement;
	#storageCodeField: HTMLElement;
	#modeField: HTMLElement;
	#addFieldButton: HTMLElement;
	#documentType: {};
	#storageFields: Field[];
	#currentValues: {};
	#fieldsMap: {};
	#systemFields: {};
	#storageItems: ?StorageItem[] = null;
	#fieldMenu: Menu;
	#dynamicStorage: boolean;
	#fieldIndex: number;
	#storageSelectorInstance: TagSelector;
	#fieldsCache: Map<any,any> = new Map();
	#onAfterFieldRendererHandler: Function | null;
	#onStorageRemoveHandler: Function | null;

	static Mode = {
		MERGE: 'mergeFields',
		REWRITE: 'rewriteFields',
	};

	static Action = {
		GET_FIELDS: 'bizproc.storage.getFieldsByStorageId',
	};

	constructor(
		options: {
			fieldsContainer: Element,
			storageSelectorContainer: Element,
			storageIdField: Element,
			storageCodeField: Element,
			modeField: Element,
			addFieldButton: Element,
			documentType: {},
			currentValues: {},
			fields: Field[],
			systemFields: Field[],
			storageItems: StorageItem[],
		},
	)
	{
		this.#fieldsContainer = options.fieldsContainer;
		this.#storageSelectorContainer = options.storageSelectorContainer;
		this.#storageIdField = options.storageIdField;
		this.#storageCodeField = options.storageCodeField;
		this.#modeField = options.modeField;
		this.#addFieldButton = options.addFieldButton;
		this.#documentType = options.documentType;
		this.#storageFields = [];
		this.#currentValues = options.currentValues;
		this.#systemFields = options.systemFields;
		this.#storageItems = Type.isArray(options.storageItems) ? options.storageItems : [];
		this.#fieldIndex = 0;
		this.#onAfterFieldRendererHandler = this.#onAfterFieldRenderer.bind(this);
		this.#onStorageRemoveHandler = this.#onStorageRemove.bind(this);

		this.#bindEvents();
		this.#configureStorageCodeField();
		this.#initializeFields(options);
		this.#renderStorageSelector();
	}

	#bindEvents(): void
	{
		Event.bind(this.#storageIdField, 'change', this.#onChangeStorageId.bind(this));
		Event.bind(this.#storageCodeField, 'change', this.#onChangeStorageCode.bind(this));
		Event.bind(this.#modeField, 'change', this.#onChangeMode.bind(this));
		Event.bind(this.#addFieldButton, 'click', this.#onAddButtonClick.bind(this));

		EventEmitter.subscribe(
			'BX.Bizproc.FieldType.onDesignerRenderControlFinished',
			this.#onAfterFieldRendererHandler,
		);

		EventEmitter.subscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);
	}

	#onStorageRemove(event): void
	{
		const storageId = Number(event.getData().storageId);

		if (storageId <= 0)
		{
			return;
		}

		this.#storageItems = this.#storageItems.filter(item => item.id !== storageId);
		this.#clearFields();
		this.#renderStorageSelector();
	}

	#onAfterFieldRenderer(event): void
	{
		const node = event.data.node;
		const textarea = node.querySelector('textarea[name="field_values[]"], textarea[name="field_keys[]"]');
		if (!textarea) return;

		const isFieldValues = textarea.name === 'field_values[]';
		const randString = Math.random().toString(36).substr(2, 9);
		const uniqueId = 'field_' + (isFieldValues ? 'values' : 'keys') + '_' + randString;

		textarea.id = uniqueId;

		const button = node.querySelector('[data-role="bp-selector-button"]');
		if (!button) return;

		const oldOnclick = button.getAttribute('onclick');
		if (oldOnclick)
		{
			const newOnclick = oldOnclick.replace(
				/BPAShowSelector\('([^']+)'(\s*,\s*[^)]+)\)/,
				"BPAShowSelector('" + uniqueId + "'$2)"
			);
			button.setAttribute('onclick', newOnclick);
		}
	}

	#configureStorageCodeField(): void
	{
		const storageCodeRow = this.#storageCodeField.closest('[data-cid="StorageCode"]');
	}

	#initializeFields(options: Object): void
	{
		const storageCodeValue = this.#storageCodeField.value;

		if (Type.isStringFilled(storageCodeValue))
		{
			this.#initializeDynamicStorageFields();
		}
		else
		{
			this.#initializeStaticStorageFields(options.fields);
		}

		const storageId = this.#getStorageId();
		if (storageId <= 0 && !Type.isStringFilled(storageCodeValue))
		{
			Dom.hide(this.#addFieldButton);
		}
	}

	#initializeDynamicStorageFields(): void
	{
		this.#dynamicStorage = true;

		for (const [fieldName, value] of Object.entries(this.#currentValues))
		{
			if (value)
			{
				this.#addDynamicStorageField(fieldName, value);
			}
		}
	}

	#initializeStaticStorageFields(fields: Field[]): void
	{
		this.#dynamicStorage = false;

		if (!Type.isArrayFilled(fields) && !Type.isArrayFilled(this.#systemFields))
		{
			return;
		}

		this.#storageFields = [...this.#systemFields, ...fields];
		this.#restoreSavedFieldValues();
	}

	#restoreSavedFieldValues(): void
	{
		for (const [fieldName, value] of Object.entries(this.#currentValues))
		{
			if (value && (!Type.isArray(value) || value.length > 0))
			{
				const field = this.#storageFields.find(item => item.FieldName === fieldName);
				if (field)
				{
					field.Value = value;
					this.#addField(field);
				}
			}
		}
	}

	async #createNewStorage(): Promise<void>
	{
		const storageData = await this.#openStorageEdit();
		if (Type.isNil(storageData))
		{
			return;
		}

		const storageId = storageData.storageId;
		const title = storageData.storageTitle ?? '';
		this.#selectNewStorage(storageId, title);
		await this.#resetFieldContainer(storageId);
	}

	async #resetFieldContainer(storageId: number): Promise<void>
	{
		const fields = await this.#getFields(storageId);
		this.#storageFields = [...this.#systemFields, ...fields];
		Dom.clean(this.#fieldsContainer);
		Dom.show(this.#addFieldButton);
	}

	async #onChangeStorageId(event): void
	{
		if (this.#dynamicStorage)
		{
			this.#storageCodeField.value = '';
		}

		this.#dynamicStorage = false;
		const storageId = this.#getStorageId();
		if (storageId <= 0)
		{
			this.#clearFields();

			return;
		}
		await this.#resetFieldContainer(storageId);
	}

	#clearFields(): void
	{
		Dom.clean(this.#fieldsContainer);
		Dom.hide(this.#addFieldButton);
	}

	#onChangeStorageCode(event): void
	{
		const storageCode = event.currentTarget.value.trim();

		if (!Type.isStringFilled(storageCode))
		{
			this.#clearFields();

			return;
		}

		if (!this.#dynamicStorage)
		{
			Dom.clean(this.#fieldsContainer);
		}

		if (this.#storageSelectorInstance)
		{
			this.#storageSelectorInstance.removeTags();
		}

		this.#dynamicStorage = true;
		Dom.show(this.#addFieldButton);
	}

	#onChangeMode(event: Event): void
	{
		const value = event.currentTarget.value;
		const row = document.querySelector('[data-cid="ItemId"]');
		if (!row)
		{
			return;
		}

		if (value === WriteDataStorageActivity.Mode.MERGE || value === WriteDataStorageActivity.Mode.REWRITE)
		{
			Dom.show(row);
		}
		else
		{
			Dom.hide(row);
		}
	}

	#openStorageEdit(): Promise
	{
		return new Promise((resolve) => {
			Runtime
				.loadExtension('bizproc.router')
				.then(({ Router }) => {
					Router.openStorageEdit({
						events: {
							onCloseComplete: (event: BX.SidePanel.Event) => {
								const slider = event.getSlider();
								const dictionary: ?BX.SidePanel.Dictionary = slider ? slider.getData() : null;
								let data = null;
								if (dictionary && dictionary.has('data'))
								{
									data = {
										storageId: dictionary.get('data').storageId || null,
										storageTitle: dictionary.get('data').storageTitle || '',
									};
								}

								resolve(data);
							},
						},
					});
				})
				.catch((e) => {
					console.error(e);
					resolve(null);
				});
		});
	}

	#selectNewStorage(storageId: number, title: string): void
	{
		const item = this.#storageSelectorInstance.addTag({
			id: storageId,
			title: title,
			entityId: 'bizproc-storage',
			link: `/bitrix/components/bitrix/bizproc.storage.item.list/?storageId=${storageId}`,
		});
	}

	#getStorageId(): ?number
	{
		return this.#storageIdField.value ? Number(this.#storageIdField.value) : null;
	}

	async #getFields(storageId: number): Promise<Field[]>
	{
		if (this.#fieldsCache.has(storageId))
		{
			return this.#fieldsCache.get(storageId);
		}

		const response = await ajax.runAction(
			WriteDataStorageActivity.Action.GET_FIELDS,
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

		return [];
	}

	#onAddButtonClick(event): void
	{
		event.preventDefault();

		if (!this.#dynamicStorage)
		{
			this.#showFieldSelectionMenu();
		}
		else
		{
			this.#showDynamicFieldSelectionMenu();
		}
	}

	#showDynamicFieldSelectionMenu(): void
	{
		const addedFieldIds = this.#getAddedFieldIds();
		const menuItems = this.#buildDynamicMenuItems(addedFieldIds);

		this.#cleanupExistingMenu();
		this.#fieldMenu = this.#createFieldMenu(menuItems);
		this.#fieldMenu.show();
	}

	#buildDynamicMenuItems(addedFieldIds: Set<string>): MenuItem[]
	{
		const writeDataActivity = this;
		const menuItems = [];

		for (const field of this.#systemFields)
		{
			if (!addedFieldIds.has(field.FieldName) && Type.isStringFilled(field.Name))
			{
				menuItems.push({
					text: Text.encode(field.Name),
					onclick()
					{
						this.popupWindow.close();
						writeDataActivity.#addDynamicStorageField(Text.encode(field.FieldName));
					},
				});
			}
		}

		menuItems.push({
			text: Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_ANOTHER_FIELD') ?? '',
			async onclick()
			{
				this.popupWindow.close();
				writeDataActivity.#addDynamicStorageField();
			},
		});

		return menuItems;
	}

	#showFieldSelectionMenu(): void
	{
		const addedFieldIds = this.#getAddedFieldIds();
		const menuItems = this.#buildMenuItems(addedFieldIds);

		this.#cleanupExistingMenu();
		this.#fieldMenu = this.#createFieldMenu(menuItems);
		this.#fieldMenu.show();
	}

	#getAddedFieldIds(): Set<string>
	{
		const fieldRows = Array.from(this.#fieldsContainer.querySelectorAll('tr[data-id]'));

		return new Set(fieldRows.map(row => row.dataset.id));
	}

	#buildMenuItems(addedFieldIds: Set<string>): MenuItem[]
	{
		const writeDataActivity = this;
		const menuItems = [{
			text: Loc.getMessage('BIZPROC_WRITE_DATA_ACTIVITY_CREATE_NEW_FIELD') ?? '',
			async onclick()
			{
				this.popupWindow.close();
				const field = await writeDataActivity.#openFieldEdit();

				if (field)
				{
					writeDataActivity.#addStorageField(field);
					writeDataActivity.#addField(field);
				}
			},
		}];

		for (const field of this.#storageFields)
		{
			const fieldId = String(field.Id);
			if (!addedFieldIds.has(fieldId) && Type.isStringFilled(field.Name))
			{
				menuItems.push({
					text: Text.encode(field.Name),
					onclick()
					{
						this.popupWindow.close();
						writeDataActivity.#addField(field);
					},
				});
			}
		}

		return menuItems;
	}

	#createFieldMenu(menuItems: MenuItem[]): Menu
	{
		return PopupMenu.create({
			id: `bp_wsa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			bindElement: this.#addFieldButton,
			autoHide: true,
			items: menuItems,
			events: {
				onPopupClose: () => {
					this.#cleanupExistingMenu();
				},
			},
		});
	}

	#createDynamicKeyField(customValue: string = ''): Field
	{
		const fieldIndex = this.#fieldIndex;
		this.#fieldIndex++;

		return {
			Id: customValue ? customValue : `dynamic_${fieldIndex}`,
			Name: '',
			FieldName: `field_keys[]`,
			Type: 'string',
			Required: false,
			AllowSelection: true,
			Value: customValue
		};
	}

	#createDynamicValueField(customValue: string = ''): Field
	{
		const fieldIndex = this.#fieldIndex;
		this.#fieldIndex++;

		return {
			Id: customValue ? customValue : `dynamic_${fieldIndex}`,
			Name: '',
			FieldName: `field_values[]`,
			Type: 'string',
			Required: false,
			AllowSelection: true,
			Value: customValue
		};
	}

	#renderDynamicFieldRow(row: HTMLTableRowElement, leftField: Field, rightField: Field): void
	{
		const leftCell = row.insertCell(-1);
		Dom.addClass(leftCell, 'dynamic-field');
		Dom.append(this.#getField(leftField, leftField.Value), leftCell);
		Dom.append(this.#getEqualSign(), row.insertCell(-1));
		Dom.append(this.#getField(rightField, rightField.Value), row.insertCell(-1));
		Dom.append(this.#getDeleteButton(row), row.insertCell(-1));
	}

	#renderSystemFieldRow(row: HTMLTableRowElement, leftField: Field, rightField: Field): void
	{
		const leftCell = row.insertCell(-1);
		Dom.addClass(leftCell, 'locked-field');
		Dom.append(this.#getField(leftField, leftField.Value), leftCell);
		Dom.append(this.#getEqualSign(), row.insertCell(-1));
		Dom.append(this.#getField(rightField, rightField.Value), row.insertCell(-1));
		Dom.append(this.#getDeleteButton(row), row.insertCell(-1));
	}

	#cleanupExistingMenu(): void
	{
		if (this.#fieldMenu && this.#fieldMenu.getId())
		{
			PopupMenu.destroy(this.#fieldMenu.getId());
			this.#fieldMenu = null;
		}
	}

	#addDynamicStorageField(key: string, value: string): void
	{
		const keyField = this.#createDynamicKeyField(key);
		const valueField = this.#createDynamicValueField(value);

		const row = this.#fieldsContainer.insertRow(-1);
		row.dataset.id = keyField.Id;

		const index = this.#systemFields.findIndex(f => f.Id === key);
		if (index !== -1)
		{
			this.#renderSystemFieldRow(row, keyField, valueField);
		}
		else
		{
			this.#renderDynamicFieldRow(row, keyField, valueField);
		}
	}

	#openFieldEdit(fieldId: ?int = null): Promise
	{
		return new Promise((resolve) => {
			Runtime
				.loadExtension('bizproc.router')
				.then(({ Router }) => {
					Router.openStorageFieldEdit({
						events: {
							onCloseComplete: (event: BX.SidePanel.Event) => {
								const slider = event.getSlider();
								const dictionary: ?BX.SidePanel.Dictionary = slider ? slider.getData() : null;
								let data = null;
								if (dictionary && dictionary.has('data'))
								{
									data = dictionary.get('data');
								}

								resolve(data);
							},
						},
						requestMethod: 'get',
						requestParams: { storageId: this.#storageIdField.value, fieldId},
					});
				})
				.catch((e) => {
					console.error(e);
					resolve(null);
				});
		});
	}

	#addStorageField(field: Field): void
	{
		this.#storageFields.push(field);
	}

	#addField(field: Field): void
	{
		const row = this.#fieldsContainer.insertRow(-1);
		row.dataset.id = field.Id;
		this.#renderFieldRow(row, field);
	}

	#editStorageField(field: Field): void
	{
		const index = this.#storageFields.findIndex(f => f.Id === field.Id);
		if (index !== -1)
		{
			this.#storageFields[index] = field;
		}
	}

	#editField(field: Field): void
	{
		const row = this.#fieldsContainer.querySelector(`tr[data-id="${field.Id}"]`);
		if (row)
		{
			Dom.clean(row);
			this.#renderFieldRow(row, field);
		}
	}

	#renderFieldRow(row: HTMLTableRowElement, field: Field): void
	{
		const leftCell = row.insertCell(-1);
		Dom.addClass(leftCell, 'static-field');
		Dom.append(this.#getSelectField(field.Name), leftCell);
		Dom.append(this.#getEqualSign(), row.insertCell(-1));
		Dom.append(this.#getField(field), row.insertCell(-1));
		const editBtn = this.#getEditButton(row, field.Id);
		if (editBtn)
		{
			Dom.append(editBtn, row.insertCell(-1));
		}
		else
		{
			row.insertCell(-1);
		}
		Dom.append(this.#getDeleteButton(row), row.insertCell(-1));
	}

	#getSelectField(name: string): HTMLSpanElement
	{
		return Tag.render`<span>${Text.encode(name)}</span>`;
	}

	#getEqualSign(): HTMLSpanElement
	{
		return Tag.render`<span>=</span>`;
	}

	#getField(field, value = null): HTMLElement
	{
		let currentValue = this.#currentValues[field.FieldName] ?? null;
		if (value)
		{
			currentValue = value;
		}

		return BX.Bizproc.FieldType.renderControl(
			this.#documentType,
			field,
			field.FieldName,
			currentValue,
			'designer',
		);
	}

	#getDeleteButton(row: HTMLElement): HTMLButtonElement
	{
		const button = Tag.render`<a href="#"><div class="ui-icon-set --cross-m"></div></a>`;

		Event.bind(
			button,
			'click',
			(event) => {
				event.preventDefault();
				Dom.remove(row);
			},
		);

		return button;
	}

	#getEditButton(row: HTMLElement, fieldId: number): ?HTMLButtonElement
	{
		const button = Tag.render`<a href="#"><div class="ui-icon-set --edit-m"></div></a>`;
		const systemFieldIds = this.#systemFields.map(item => item.Id);
		if (systemFieldIds.includes(fieldId))
		{
			return null;
		}

		Event.bind(
			button,
			'click',
			async (event) => {
				event.preventDefault();
				const field = await this.#openFieldEdit(fieldId);

				if (!field)
				{
					return;
				}

				const isDeleteAction = field.action === 'bizproc.storage.deleteField' && field.id;
				if (isDeleteAction)
				{
					this.#deleteFieldRow(Number(field.id));
					this.#storageFields = this.#storageFields.filter(f => f.Id !== Number(field.id));
				}
				else
				{
					this.#editStorageField(field);
					this.#editField(field);
				}
			},
		);

		return button;
	}

	#deleteFieldRow(fieldId: number): void
	{
		const rowToRemove = this.#fieldsContainer.querySelector(`[data-id="${fieldId}"]`);
		if (rowToRemove)
		{
			Dom.remove(rowToRemove);
		}
	}

	#renderStorageSelector(): void
	{
		this.#storageSelectorContainer.innerHTML = '';

		this.#storageSelectorInstance = new StorageSelector(this.#storageIdField, this.#storageItems ?? [], {
			onCreateNewStorageHandler: this.#createNewStorage.bind(this),
		}).getTagSelector();
		this.#storageSelectorInstance.renderTo(this.#storageSelectorContainer);
	}

	destroy(): void
	{
		this.#unbindEvents();
	}

	#unbindEvents(): void
	{
		Event.unbindAll(this.#storageIdField);
		Event.unbindAll(this.#storageCodeField);
		Event.unbindAll(this.#modeField);
		Event.unbindAll(this.#addFieldButton);

		this.#fieldsCache.clear();
		if (this.#storageSelectorInstance)
		{
			this.#storageSelectorInstance.destroy();
		}

		EventEmitter.unsubscribe(
			'BX.Bizproc.FieldType.onDesignerRenderControlFinished',
			this.#onAfterFieldRendererHandler,
		);

		EventEmitter.unsubscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);
	}
}

namespace.WriteDataStorageActivity = WriteDataStorageActivity;
