import { Type, Dom, Event, Loc, Reflection, ajax, Runtime } from 'main.core';
import { Button, ButtonManager } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Loader } from 'main.loader';

import './style.css';

export class StorageFieldEdit
{
	static instance: ?StorageFieldEdit = null;
	formNode: ?Element = null;
	tabContainer: Element;
	errorsContainer: ?Element = null;
	tabs: Map<string, Element> = new Map();
	container: Element = null;
	inputs: Map = new Map();
	settingsTable: ?Element = null;
	saveButton: ?Button = null;
	deleteButton: ?Button = null;
	skipSave: boolean = false;

	constructor(options: {
		formName: string,
		tabContainer: ?Element,
		skipSave: boolean,
	})
	{
		this.inputs = new Map();

		if (Type.isPlainObject(options))
		{
			if (options.formName)
			{
				this.formNode = document.querySelector(`form[data-role="${options.formName}"]`);
				const saveButtonNode = this.formNode.querySelector('#ui-button-panel-save');
				if (saveButtonNode)
				{
					this.saveButton = ButtonManager.createFromNode(saveButtonNode);
				}
				const deleteButtonNode = this.formNode.querySelector('#ui-button-panel-remove');
				if (deleteButtonNode)
				{
					this.deleteButton = ButtonManager.createFromNode(deleteButtonNode);
				}
			}

			if (Type.isElementNode(options.tabContainer))
			{
				this.tabContainer = options.tabContainer;
			}

			if (Type.isDomNode(options.errorsContainer))
			{
				this.errorsContainer = options.errorsContainer;
			}

			if (options.skipSave)
			{
				this.skipSave = options.skipSave;
			}
		}

		this.init();
		StorageFieldEdit.instance = this;
	}

	init(): void
	{
		if (!this.formNode)
		{
			return;
		}

		const userTypeIdSelector = this.getInput('type');
		if (userTypeIdSelector)
		{
			Event.bind(userTypeIdSelector, 'change', this.handleUserTypeChange.bind(this));
		}

		Event.bind(this.formNode, 'submit', (event: Event) => {
			event.preventDefault();
			const eventName = event.submitter?.name;
			this.onHandleSubmitForm(eventName);
		});

		this.fillTabs();
	}

	fillTabs(): void
	{
		if (this.tabContainer)
		{
			const tabs = this.tabContainer.querySelectorAll('.bizproc-storage-field-edit-tab');
			tabs.forEach((tabNode: HTMLDivElement) => {
				if (tabNode.dataset.tab)
				{
					this.tabs.set(tabNode.dataset.tab, tabNode);
				}
			});
		}
	}

	resetSaveButton(): void
	{
		if (this.saveButton)
		{
			Dom.removeClass(this.saveButton.getContainer(), 'ui-btn-wait');
		}
	}

	resetRemoveButton(): void
	{
		if (this.deleteButton)
		{
			Dom.removeClass(this.deleteButton.getContainer(), 'ui-btn-wait');
		}
	}

	onHandleSubmitForm(eventName: string): void
	{
		const fields = this.#collectFormFields();
		const isUpdate = fields.id > 0;
		const isRemove = eventName === 'remove';

		if (isRemove)
		{
			MessageBox.confirm(
				Loc.getMessage('BIZPROC_STORAGE_FIELD_EDIT_CONFIRM_MESSAGE') ?? '',
				(messageBox) => {
					this.sendForm(
						'bizproc.storage.deleteField',
						{ id: fields.id },
						'BIZPROC_STORAGE_FIELD_EDIT_DELETE_MESSAGE',
						messageBox,
					);
				},
				Loc.getMessage('BIZPROC_STORAGE_FIELD_EDIT_CONFIRM_MESSAGE_OK') ?? '',
				(messageBox) => {
					messageBox.close();
					this.resetRemoveButton();
				},
			);

			return;
		}

		let action = isUpdate ? 'bizproc.storage.updateField' : 'bizproc.storage.addField';
		let successMessageCode = 'BIZPROC_STORAGE_FIELD_EDIT_SAVE_MESSAGE';
		const data = { field: fields };
		if (this.skipSave)
		{
			action = 'bizproc.storage.getPreparedForm';
			successMessageCode = 'BIZPROC_STORAGE_FIELD_EDIT_ADD_MESSAGE'
		}

		data.format = true;

		this.sendForm(
			action,
			data,
			successMessageCode,
		);
	}

	#collectFormFields(): Record<string, any>
	{
		const disabledElements = this.formNode.querySelectorAll('[disabled]');
		disabledElements.forEach((el) => {
			el.removeAttribute('disabled');
		});

		const formData = new FormData(this.formNode);
		const fields: Record<string, any> = {};

		const checkboxes = this.formNode.querySelectorAll('input[type="checkbox"]');
		checkboxes.forEach((checkbox) => {
			if (!checkbox.checked)
			{
				formData.set(checkbox.name, 'N');
			}
		});

		for (const [key, value] of formData.entries())
		{
			this.#setNestedValue(fields, key, value);
		}

		disabledElements.forEach((el) => {
			el.setAttribute('disabled', 'disabled');
		});

		return fields;
	}

	#setNestedValue(obj: Object, key: string, value): void
	{
		const keys = key.match(/[^[\]]+/g);
		if (!keys)
		{
			return;
		}

		let current = obj;
		for (let i = 0; i < keys.length - 1; i++)
		{
			const part = keys[i];
			if (!current[part] || !Type.isObject(current[part]))
			{
				current[part] = {};
			}
			current = current[part];
		}

		current[keys[keys.length - 1]] = value;
	}

	sendForm(action: string, data: Object, successMessageCode: string, messageBox?: any): void
	{
		ajax.runAction(action, { data })
			.then((response) => {
				if (response.data)
				{
					top.BX.UI.Notification.Center.notify({
						content: Loc.getMessage(successMessageCode) ?? '',
					});

					const idNode = this.formNode.querySelector('input[name="id"]');
					if (idNode && response.data.id)
					{
						idNode.value = response.data.id;
					}

					if (messageBox)
					{
						messageBox.close();
					}

					this.reloadListSlider();

					const slider = BX.SidePanel.Instance.getTopSlider();
					if (slider)
					{
						const dictionary: BX.SidePanel.Dictionary = slider.getData();
						const fieldData = (action === 'bizproc.storage.deleteField')
							? { id: data?.id || null, action: action }
							: response.data
						;
						dictionary.set(
							'data',
							fieldData,
						);
						slider.close();
					}
				}

				this.resetSaveButton();
			})
			.catch((error) => {
				const message = error.errors?.[0]?.message || 'Unknown error';
				MessageBox.alert(message);
				this.resetSaveButton();
			});
	}

	reloadListSlider(): void
	{
		const slider = this.getSlider();
		if (slider)
		{
			BX.SidePanel.Instance.postMessage(slider, 'storage-field-list-update');
		}
	}

	getSlider(): ?BX.SidePanel.Slider
	{
		if (Reflection.getClass('BX.SidePanel'))
		{
			return BX.SidePanel.Instance.getSliderByWindow(window);
		}

		return null;
	}

	showTab(tabNameToShow: string)
	{
		[...this.tabs.keys()].forEach((tabName: string) => {
			if (tabName === tabNameToShow)
			{
				Dom.addClass(this.tabs.get(tabName), 'bizproc-storage-field-edit-tab-current');
			}
			else
			{
				Dom.removeClass(this.tabs.get(tabName), 'bizproc-storage-field-edit-tab-current');
			}
		});
	}

	handleUserTypeChange(): void
	{
		const userTypeId = this.getSelectedUserTypeId();
		if (!userTypeId)
		{
			return;
		}

		// TODO render default value
	}

	getSettingsContainer(): ?Element
	{
		this.container = this.formNode;
		if (this.container && !this.settingsContainer)
		{
			this.settingsContainer = this.container.querySelector(
				'[data-role="bizproc-storage-field-settings-container"]'
			);
		}

		return this.settingsContainer;
	}

	getSelectedUserTypeId(): ?string
	{
		const option = this.getSelectedOption('type');
		if (option)
		{
			return option.value;
		}

		return null;
	}

	getSelectedOption(inputName: string): ?HTMLOptionElement
	{
		const input = this.getInput(inputName);
		if (input)
		{
			const options = [...input.querySelectorAll('option')];
			const index = input.selectedIndex;

			return options[index];
		}

		return null;
	}

	adjustVisibility(): void
	{
		const settingsTable = this.getSettingsTable();
		const settingsTab = document.querySelector('[data-role="tab-settings"]');

		if (!settingsTable || !settingsTab)
		{
			return;
		}

		if (settingsTable.childElementCount <= 0)
		{
			Dom.hide(settingsTab);
		}
		else
		{
			Dom.show(settingsTab);
		}
		const userTypeId = this.getSelectedUserTypeId();
		if (userTypeId === 'boolean')
		{
			this.changeInputVisibility('multiple', 'none');
			this.changeInputVisibility('mandatory', 'none');
		}
		else
		{
			this.changeInputVisibility('multiple', 'block');
			this.changeInputVisibility('mandatory', 'block');
		}
	}

	changeInputVisibility(inputName: string, display: string): void
	{
		const input = this.getInput(inputName);
		if (input && input.parentElement && input.parentElement.parentElement)
		{
			if (display === 'block')
			{
				Dom.show(input.parentElement.parentElement);
			}
			else
			{
				Dom.hide(input.parentElement.parentElement);
			}
		}
	}

	getInput(name: string): ?Element
	{
		if (this.formNode)
		{
			const input = this.formNode.querySelector(`[name="${name}"]`);
			if (input)
			{
				this.inputs.set(name, input);
			}
		}

		return this.inputs.get(name);
	}

	showErrors(errors: string[]): void
	{
		let text = '';
		errors.forEach((message) => {
			text += message;
		});
		if (Type.isDomNode(this.errorsContainer))
		{
			this.errorsContainer.innerText = text;
			Dom.show(this.errorsContainer.parentElement);
		}
		else
		{
			console.error(text);
		}
	}

	getLoader(): Loader
	{
		if (!this.loader)
		{
			this.loader = new Loader({ size: 150 });
		}

		return this.loader;
	}

	startProgress()
	{
		this.isProgress = true;
		if (!this.getLoader().isShown())
		{
			this.getLoader().show(this.container);
		}
		this.hideErrors();
	}

	stopProgress()
	{
		this.isProgress = false;
		this.getLoader().hide();
		setTimeout(() => {
			this.saveButton.setWaiting(false);
			this.resetSaveButton();
			if (this.deleteButton)
			{
				this.deleteButton.setWaiting(false);
				this.resetRemoveButton();
			}
		}, 200);
	}

	hideErrors()
	{
		if (Type.isDomNode(this.errorsContainer))
		{
			this.errorsContainer.innerText = '';
			Dom.hide(this.errorsContainer.parentElement);
		}
	}

	static handleLeftMenuClick(tabName: string): void
	{
		if (this.instance)
		{
			this.instance.showTab(tabName);
		}
	}
}
