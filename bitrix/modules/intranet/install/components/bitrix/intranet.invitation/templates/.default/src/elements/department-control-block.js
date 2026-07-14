import { Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import { DepartmentControl } from 'intranet.department-control';
import { DepartmentCreationPopup } from 'humanresources.department-creation-popup';

export class DepartmentControlBlock
{
	#container: HTMLElement;
	#departmentControl: DepartmentControl;
	#canCreateDepartment: boolean;
	#createButton: Button;
	#onCreateClick: Function;
	#departmentCreationPopup: ?DepartmentCreationPopup = null;

	constructor(options = {})
	{
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
		this.#canCreateDepartment = options.canCreateDepartment === true;
		this.#onCreateClick = Type.isFunction(options.onCreateClick) ? options.onCreateClick : () => {};
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div class="intranet-invitation-block__department-control">
				<div class="intranet-invitation-block__department-control-inner">
					${this.#departmentControl?.render()}
				</div>
				${this.#renderCreateButtonContainer()}
			</div>
		`;

		return this.#container;
	}

	#renderCreateButtonContainer(): HTMLElement | string
	{
		if (!this.#canCreateDepartment || !this.#departmentControl?.canSelectDepartments())
		{
			return '';
		}

		return Tag.render`
			<div class="intranet-invitation-block__department-control-button">
				${this.#getCreateButton().render()}
			</div>
		`;
	}

	#getCreateButton(): Button
	{
		this.#createButton ??= new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CREATE_BUTTON'),
			style: AirButtonStyle.TINTED,
			size: ButtonSize.LARGE,
			icon: BX.UI.IconSet.Outline.PLUS_L,
			onclick: () => {
				this.#handleCreateDepartmentClick();
				this.#onCreateClick();
			},
		});

		return this.#createButton;
	}

	#handleCreateDepartmentClick(): void
	{
		if (!this.#canCreateDepartment || !this.#departmentControl?.canSelectDepartments())
		{
			return;
		}

		this.#departmentCreationPopup ??= new DepartmentCreationPopup({
			onCreate: async (result) => {
				this.#departmentControl.handleDepartmentCreated(result?.node);
			},
		});

		this.#departmentCreationPopup.show({
			parentDepartmentId: this.#departmentControl.getSelectedDepartmentId(),
		});
	}
}
