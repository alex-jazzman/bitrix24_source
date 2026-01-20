import { Type, Dom, Event, Loc } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';

import './style.css';

export class StorageEdit
{
	static instance: ?StorageEdit = null;
	formNode: ?HTMLElement = null;
	tabContainer: HTMLElement;
	tabs: Map<string, Element> = new Map();

	constructor(options: {
		formName: string,
		tabContainer: ?HTMLElement,
	})
	{
		if (Type.isPlainObject(options))
		{
			if (options.formName)
			{
				this.formNode = document.querySelector(`form[data-role="${options.formName}"]`);
			}

			if (Type.isElementNode(options.tabContainer))
			{
				this.tabContainer = options.tabContainer;
			}
		}

		this.init();
		StorageEdit.instance = this;
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
			const tabs = this.tabContainer.querySelectorAll('.bizproc-storage-edit-tab');
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
		const saveButtonNode = this.formNode.querySelector(
			'.main-user-field-edit-buttons #ui-button-panel-save',
		);
		if (saveButtonNode)
		{
			Dom.removeClass(saveButtonNode, 'ui-btn-wait');
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
				Loc.getMessage('BIZPROC_STORAGE_EDIT_CONFIRM_MESSAGE') ?? '',
				(messageBox) => {
					this.runAction(
						'bizproc.storage.delete',
						{ id: fields.id },
						'BIZPROC_STORAGE_EDIT_DELETE_MESSAGE',
						messageBox,
					);
				},
				Loc.getMessage('BIZPROC_STORAGE_EDIT_CONFIRM_MESSAGE_OK') ?? '',
			);

			return;
		}

		const action = isUpdate ? 'bizproc.storage.update' : 'bizproc.storage.add';

		this.runAction(
			action,
			{ storageType: fields },
			'BIZPROC_STORAGE_EDIT_SAVE_MESSAGE',
		);
	}

	#collectFormFields(): Record<string, any>
	{
		const formData = new FormData(this.formNode);
		const fields: Record<string, any> = {};

		for (const [key, value] of formData.entries())
		{
			fields[key] = value;
		}

		return fields;
	}

	runAction(action: string, data: Object, successMessageCode: string, messageBox?: any): void
	{
		BX.ajax.runAction(action, { data })
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

					const slider = BX.SidePanel.Instance.getTopSlider();
					if (slider)
					{
						const dictionary: BX.SidePanel.Dictionary = slider.getData();
						dictionary.set(
							'data',
							{
								storageId: response.data.id,
								storageTitle: response.data.title,
							},
						);
						slider.close();
					}
				}

				this.resetSaveButton();
			})
			.catch((error) => {
				MessageBox.alert(error.errors.pop().message);
				this.resetSaveButton();
			});
	}

	showTab(tabNameToShow: string)
	{
		[...this.tabs.keys()].forEach((tabName: string) => {
			if (tabName === tabNameToShow)
			{
				Dom.addClass(this.tabs.get(tabName), 'bizproc-storage-edit-tab-current');
			}
			else
			{
				Dom.removeClass(this.tabs.get(tabName), 'bizproc-storage-edit-tab-current');
			}
		});
	}

	static handleLeftMenuClick(tabName: string)
	{
		if (this.instance)
		{
			this.instance.showTab(tabName);
		}
	}

	static showStorageFieldList(storageId: number): void
	{
		BX.Runtime
			.loadExtension('bizproc.router')
			.then(({ Router }) => {
				const slider = BX.SidePanel.Instance.getTopSlider(); // TODO temp logic
				slider?.close();

				if (Router?.openStorageFieldList)
				{
					Router.openStorageFieldList({
						requestMethod: 'get',
						requestParams: { storageId },
					});
				}
				else
				{
					console.warn('Router or openStorageFieldList method not available');
				}
			})
			.catch((e) => console.error(e));
	}
}
