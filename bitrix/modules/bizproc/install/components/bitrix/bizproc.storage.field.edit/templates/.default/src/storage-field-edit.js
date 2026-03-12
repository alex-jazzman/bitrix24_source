import { Type, Dom, Event, Loc, Reflection, ajax } from 'main.core';
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
		const formPrepared = ajax.prepareForm(this.formNode);
		if (!formPrepared || !formPrepared.data)
		{
			return;
		}
		const { data } = formPrepared;
		const isUpdate = data.id > 0;
		const isRemove = eventName === 'remove';

		if (isRemove)
		{
			MessageBox.confirm(
				Loc.getMessage('BIZPROC_STORAGE_FIELD_EDIT_CONFIRM_MESSAGE') ?? '',
				(messageBox) => {
					this.sendForm(
						'bizproc.v2.StorageField.delete',
						{ id: data.id },
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

		let action = isUpdate ? 'bizproc.v2.StorageField.update' : 'bizproc.v2.StorageField.add';
		let successMessageCode = 'BIZPROC_STORAGE_FIELD_EDIT_SAVE_MESSAGE';
		if (this.skipSave)
		{
			action = 'bizproc.v2.StorageField.getPreparedForm';
			successMessageCode = 'BIZPROC_STORAGE_FIELD_EDIT_ADD_MESSAGE';
		}

		data.format = true;

		this.sendForm(
			action,
			data,
			successMessageCode,
		);
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
						const fieldData = (action === 'bizproc.v2.StorageField.delete')
							? { id: data?.id || null, action }
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

	getSettingsContainer(): ?Element
	{
		this.container = this.formNode;
		if (this.container && !this.settingsContainer)
		{
			this.settingsContainer = this.container.querySelector(
				'[data-role="bizproc-storage-field-settings-container"]',
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
