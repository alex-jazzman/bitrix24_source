import { Extension, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { UI } from 'ui.notification';
import { Dialog } from 'ui.system.dialog';
import { Input, InputDesign, InputSize } from 'ui.system.input';

import { postData } from 'humanresources.company-structure.api';

import './style.css';

export type DepartmentCreationPopupOptions = {
	parentDepartmentId?: number | string | null,
	departmentName?: ?string,
	onCreate?: ?Function,
	onCancel?: ?Function,
};

export class DepartmentCreationPopup
{
	#dialog: Dialog;
	#content: HTMLElement;
	#parentDepartmentSelector: TagSelector;
	#departmentNameInput: Input;
	#parentDepartmentSelectorContainer: HTMLElement;
	#departmentNameInputContainer: HTMLElement;
	#parentDepartmentId: ?number;
	#defaultParentDepartmentId: ?number;
	#onCreate: ?Function;
	#onCancel: ?Function;
	#createButton: Button;
	#cancelButton: Button;

	constructor(options: DepartmentCreationPopupOptions = {})
	{
		const settings = Extension.getSettings('humanresources.department-creation-popup');

		this.#defaultParentDepartmentId = this.#normalizeDepartmentId(settings.get('currentUserDepartmentId'));
		this.#onCreate = Type.isFunction(options.onCreate) ? options.onCreate : null;
		this.#onCancel = Type.isFunction(options.onCancel) ? options.onCancel : null;
		this.reset(options);
	}

	show(options: DepartmentCreationPopupOptions = {}): void
	{
		this.reset(options);
		this.#getDialog().show();
	}

	hide(): void
	{
		this.#dialog?.hide();
	}

	destroy(): void
	{
		this.#dialog?.hide();
		this.#dialog = null;
		this.#destroyContent();
	}

	reset(options: DepartmentCreationPopupOptions = {}): void
	{
		const parentDepartmentId = this.#normalizeDepartmentId(options.parentDepartmentId)
			?? this.#defaultParentDepartmentId
		;
		const departmentName = this.#normalizeDepartmentName(options.departmentName);

		if (this.#shouldRebuildContent(parentDepartmentId))
		{
			this.#destroyContent();
		}

		this.#parentDepartmentId = parentDepartmentId;
		this.#resetParentDepartmentSelector();
		this.#resetDepartmentNameInput(departmentName);
		this.#toggleCreateState(false);
	}

	#getDialog(): Dialog
	{
		if (this.#dialog)
		{
			return this.#dialog;
		}

		this.#dialog = new Dialog({
			title: Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_TITLE'),
			content: this.#getContent(),
			leftButtons: this.#getButtons(),
			width: 515,
			hasOverlay: true,
			closeByEsc: true,
			closeByClickOutside: true,
			events: {
				onHide: () => {
					this.#dialog = null;
				},
			},
		});

		return this.#dialog;
	}

	#getContent(): HTMLElement
	{
		if (this.#content)
		{
			return this.#content;
		}

		this.#parentDepartmentSelectorContainer = Tag.render`
			<div class="humanresources-department-creation-popup__selector"></div>
		`;

		this.#departmentNameInputContainer = Tag.render`
			<div class="humanresources-department-creation-popup__input">
				${this.#getDepartmentNameInput().render()}
			</div>
		`;

		this.#content = Tag.render`
			<div class="humanresources-department-creation-popup__content">
				<div class="humanresources-department-creation-popup__field">
					<div class="humanresources-department-creation-popup__field-label">
						${Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_PARENT_DEPARTMENT_TITLE')}
					</div>
					${this.#parentDepartmentSelectorContainer}
				</div>
				<div class="humanresources-department-creation-popup__field">
					${this.#departmentNameInputContainer}
				</div>
			</div>
		`;

		this.#getParentDepartmentSelector().renderTo(this.#parentDepartmentSelectorContainer);

		return this.#content;
	}

	#getButtons(): [Button, Button]
	{
		this.#createButton = new Button({
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			text: Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_CREATE_BUTTON'),
			onclick: () => {
				void this.#handleCreateClick();
			},
		});

		this.#cancelButton = new Button({
			size: ButtonSize.LARGE,
			style: AirButtonStyle.PLAIN,
			useAirDesign: true,
			text: Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_CANCEL_BUTTON'),
			onclick: () => {
				this.#handleCancelClick();
			},
		});

		return [this.#createButton, this.#cancelButton];
	}

	#getParentDepartmentSelector(): TagSelector
	{
		if (this.#parentDepartmentSelector)
		{
			return this.#parentDepartmentSelector;
		}

		const preselectedItems = this.#parentDepartmentId === null
			? []
			: [['structure-node', this.#parentDepartmentId]]
		;

		this.#parentDepartmentSelector = new TagSelector({
			multiple: false,
			showCreateButton: false,
			dialogOptions: {
				width: 425,
				height: 350,
				dropdownMode: true,
				hideOnDeselect: true,
				enableSearch: true,
				preselectedItems,
				recentTabOptions: {
					visible: false,
				},
				entities: [
					{
						id: 'structure-node',
						options: {
							selectMode: 'departmentsOnly',
							restricted: 'create',
							allowSelectRootDepartment: true,
						},
					},
				],
				events: {
					onLoad: (event) => {
						const dialog = event.getTarget();
						const departmentTab = dialog.getTab('structure-departments-tab');

						if (departmentTab)
						{
							dialog.selectTab('structure-departments-tab');
						}
					},
				},
			},
		});

		return this.#parentDepartmentSelector;
	}

	#getDepartmentNameInput(): Input
	{
		if (this.#departmentNameInput)
		{
			return this.#departmentNameInput;
		}

		this.#departmentNameInput = new Input({
			size: InputSize.Lg,
			design: InputDesign.Grey,
			stretched: true,
			label: Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_DEPARTMENT_NAME_LABEL'),
			onInput: () => {
				this.#departmentNameInput?.setError('');
			},
		});

		return this.#departmentNameInput;
	}

	async #handleCreateClick(): Promise<void>
	{
		const parentDepartmentId = this.#getSelectedParentDepartmentId();
		const departmentName = this.#getDepartmentName();

		if (!this.#validateForm(parentDepartmentId, departmentName))
		{
			return;
		}

		this.#toggleCreateState(true);

		try
		{
			const result = await postData('humanresources.api.Structure.Department.create', {
				name: departmentName,
				parentId: parentDepartmentId,
				description: null,
				userIds: [],
				moveUsersToDepartment: 0,
				createChat: 0,
				bindingChatIds: [],
				createChannel: 0,
				bindingChannelIds: [],
				createCollab: 0,
				bindingCollabIds: [],
				settings: {},
			});

			if (this.#onCreate)
			{
				await this.#onCreate(result);
			}

			this.hide();
		}
		catch (error)
		{
			const message = error?.message ?? Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_CREATE_ERROR');
			UI.Notification.Center.notify({
				content: message,
				autoHideDelay: 4000,
			});
		}
		finally
		{
			this.#toggleCreateState(false);
		}
	}

	#handleCancelClick(): void
	{
		if (this.#onCancel)
		{
			this.#onCancel();
		}

		this.hide();
	}

	#getSelectedParentDepartmentId(): ?number
	{
		const selectedItem = this.#parentDepartmentSelector?.getDialog()?.getSelectedItems()?.[0];

		return this.#normalizeDepartmentId(selectedItem?.id);
	}

	#getDepartmentName(): string
	{
		return this.#departmentNameInput?.getValue().trim() ?? '';
	}

	#resetParentDepartmentSelector(): void
	{
		const dialog = this.#getParentDepartmentSelector().getDialog();
		const parentDepartmentId = this.#parentDepartmentId;
		dialog.deselectAll();

		if (parentDepartmentId === null)
		{
			return;
		}

		const item = dialog.getItem(['structure-node', parentDepartmentId]);

		if (!item)
		{
			return;
		}

		item.select(true);
	}

	#resetDepartmentNameInput(departmentName: string = ''): void
	{
		this.#getDepartmentNameInput().setValue(departmentName);
		this.#departmentNameInput?.setError('');
	}

	#destroyContent(): void
	{
		this.#parentDepartmentSelector?.getDialog()?.destroy();
		this.#parentDepartmentSelector = null;
		this.#departmentNameInput = null;
		this.#createButton = null;
		this.#cancelButton = null;
		this.#parentDepartmentSelectorContainer = null;
		this.#departmentNameInputContainer = null;
		this.#content = null;
	}

	#validateForm(parentDepartmentId, departmentName): boolean
	{
		let isValid = true;

		if (!Type.isStringFilled(departmentName))
		{
			this.#departmentNameInput?.setError(
				Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_DEPARTMENT_NAME_ERROR'),
			);
			isValid = false;
		}

		if (!Type.isNumber(parentDepartmentId))
		{
			UI.Notification.Center.notify({
				content: Loc.getMessage('HUMANRESOURCES_DEPARTMENT_CREATION_POPUP_PARENT_DEPARTMENT_ERROR'),
				autoHideDelay: 4000,
			});
			isValid = false;
		}

		return isValid;
	}

	#toggleCreateState(isLoading): void
	{
		this.#createButton?.setWaiting(isLoading);
		this.#cancelButton?.setDisabled(isLoading);
	}

	#shouldRebuildContent(parentDepartmentId: ?number): boolean
	{
		if (!this.#parentDepartmentSelector)
		{
			return false;
		}

		if (parentDepartmentId === this.#getSelectedParentDepartmentId())
		{
			return false;
		}

		return parentDepartmentId !== null
			&& !this.#parentDepartmentSelector.getDialog().getItem(['structure-node', parentDepartmentId])
		;
	}

	#normalizeDepartmentId(departmentId): ?number
	{
		if (Type.isNumber(departmentId))
		{
			return departmentId;
		}

		if (Type.isStringFilled(departmentId) && /^-?\d+$/.test(departmentId))
		{
			return parseInt(departmentId, 10);
		}

		return null;
	}

	#normalizeDepartmentName(departmentName: ?string): string
	{
		return Type.isString(departmentName) ? departmentName.trim() : '';
	}
}
