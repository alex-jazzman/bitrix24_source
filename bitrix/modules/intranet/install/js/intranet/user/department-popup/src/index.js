import { Type, Loc, Tag, Extension } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Popup, PopupManager } from 'main.popup';
import { AvatarRound, AvatarRoundExtranet, AvatarRoundGuest, AvatarBase } from 'ui.avatar';
import { AirButtonStyle, Button } from 'ui.buttons';
import { DepartmentControl } from 'intranet.department-control';

import './style.css';

export type DepartmentType = {
	id: string,
	name: string,
	accessCode: string,
}

export type UserDepartmentPopupType = {
	userType: string,
	userName: string,
	userPhoto: string,
	showDepartmentControl?: boolean,
	rootDepartment: DepartmentType,
	sendButtonCallback?: Function,
	closeButtonCallback?: Function,
}

export class UserDepartmentPopup
{
	#popup: Popup = null;
	#content: HTMLElement;
	#options: UserDepartmentPopupType;
	#department: DepartmentControl;
	#sendButton: ?Button;

	constructor(options: UserDepartmentPopupType)
	{
		this.#options = options;
	}

	show(): void
	{
		this.#popup = this.#createPopup();
		this.#popup.show();
	}

	#createPopup(): Popup
	{
		const popup = PopupManager.create({
			id: 'user-department-popup',
			closeIcon: false,
			autoHide: false,
			closeByEsc: true,
			padding: 0,
			width: 542,
			height: 357,
		});

		popup.setContent(this.#getPopupContent());

		return popup;
	}

	#getPopupContent(): HTMLElement
	{
		const content = this.render();

		return Tag.render`
			<div class="intranet-user-department-wrapper">
				${this.#renderCloseIcon()}
				${content}
			</div>
		`;
	}

	#renderCloseIcon(): HTMLElement
	{
		const onClick = () => {
			this.#popup.close();
		};

		return Tag.render`
			<div class="intranet-user-department__close-icon ui-icon-set --cross-30" onclick="${onClick}"></div>
		`;
	}

	render(): HTMLElement
	{
		if (!this.#content)
		{
			this.#content = this.#renderBlock();
		}

		return this.#content;
	}

	#renderBlock(): HTMLElement
	{
		const modificator = this.#getModificator();

		const departmentControl = this.#isDepartmentControlVisible()
			? Tag.render`
				<div class="intranet-user-department__department">
					${this.#getDepartmentControl().render()}
				</div>
			`
			: '';

		return Tag.render`
			<div class="intranet-user-department">
				<div class="intranet-user-department__title">
					${this.#getTitle()}
				</div>
				<div class="intranet-user-department__account">
					<div class="transfer-account transfer-account_${modificator}">
						<div class="transfer-account-avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="transfer-account-data">
							<div class="account-data__name">
								${this.#options.userName}
							</div>
							<div class="account-data__position account-data__position_${modificator}">
								${this.#getPosition()}
							</div>
						</div>
					</div>
				</div>
				${departmentControl}
				<div class="intranet-user-department__action">
					${this.#getSendButton().render()}
					${this.#getCancelButton().render()}
				</div>
			</div>
		`;
	}

	#getAvatar(): AvatarBase
	{
		const options = {
			size: 40,
			userpicPath: this.#options.userPhoto,
		};
		let avatar = null;

		switch (this.#options.userType)
		{
			case 'extranet':
				avatar = new AvatarRoundExtranet(options);
				break;
			case 'collaber':
				avatar = new AvatarRoundGuest(options);
				break;
			default:
				avatar = new AvatarRound(options);
				break;
		}

		return avatar;
	}

	#getDepartmentControl(): ?DepartmentControl
	{
		if (!this.#isDepartmentControlVisible())
		{
			return null;
		}

		if (!this.#department)
		{
			const rootDepartment = this.#options.rootDepartment;
			const description = this.#options.userType === 'visitor'
				? Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_DEPARTMENT_DESCRIPTION_EMPLOYEE')
				: Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_DEPARTMENT_DESCRIPTION');

			this.#department = new DepartmentControl({
				rootDepartment: Type.isObject(rootDepartment) ? rootDepartment : null,
				description,
			});

			this.#department.subscribe('onChange', this.#onChangeDepartments.bind(this));
		}

		return this.#department;
	}

	#getSendButton(): Button
	{
		const isDepartmentControlVisible = this.#isDepartmentControlVisible();
		const departmentControl = isDepartmentControlVisible ? this.#getDepartmentControl() : null;

		this.#sendButton ??= new Button({
			className: 'intranet-user-department__action-send',
			text: this.#getActionButtonText(),
			size: Button.Size.LARGE,
			style: '--style-filled',
			useAirDesign: true,
			noCaps: true,
			isDependOnTheme: true,
			state: !isDepartmentControlVisible || departmentControl.getValues().length > 0 ? null : Button.State.DISABLED,
			onclick: () => {
				if (this.#sendButton.getState() === Button.State.DISABLED)
				{
					return;
				}

				if (Type.isFunction(this.#options.sendButtonCallback))
				{
					const departmentIds = isDepartmentControlVisible ? departmentControl.getValues() : [];
					this.#options.sendButtonCallback(departmentIds);
					this.#popup?.destroy();
				}
			},
		});

		return this.#sendButton;
	}

	#getCancelButton(): Button
	{
		return new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_CANCEL'),
			size: Button.Size.LARGE,
			style: AirButtonStyle.OUTLINE,
			onclick: () => {
				if (Type.isFunction(this.#options.closeButtonCallback))
				{
					this.#options.closeButtonCallback();
				}
				else
				{
					this.#popup.destroy();
				}
			},
			noCaps: true,
		});
	}

	#onChangeDepartments(event: BaseEvent): void
	{
		if (!this.#isDepartmentControlVisible())
		{
			return;
		}

		const { tags } = event.data;
		const state = tags?.length > 0 ? null : Button.State.DISABLED;
		this.#getSendButton().setState(state);
	}

	#getModificator(): string
	{
		switch (this.#options.userType)
		{
			case 'visitor':
				return 'visitor';
			case 'collaber':
				return 'collaber';
			case 'integrator':
				return 'integrator';
			default:
				return 'extranet';
		}
	}

	#getTitle(): string
	{
		switch (this.#options.userType)
		{
			case 'visitor':
				return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_EMPLOYEE_TITLE');
			case 'collaber':
				return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_COLLABA_TITLE');
			case 'integrator':
				return Extension.getSettings('intranet.user.department-popup').isRenamedIntegrator === true
					? Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_INTEGRATOR_TITLE_RENAMED')
					: Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_INTEGRATOR_TITLE');
			default:
				return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_TITLE');
		}
	}

	#getPosition(): string
	{
		switch (this.#options.userType)
		{
			case 'visitor':
				return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_EMPLOYEE');
			case 'collaber':
				return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_COLLABER');
			case 'integrator':
				return Extension.getSettings('intranet.user.department-popup').isRenamedIntegrator === true
					? Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_INTEGRATOR_RENAMED')
					: Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_INTEGRATOR');
			default:
				return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_POSITION_EXTRANET');
		}
	}

	#getActionButtonText(): string
	{
		if (this.#options.userType === 'visitor')
		{
			return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_HIRE');
		}

		return Loc.getMessage('INTRANET_USER_DEPARTMENT_POPUP_TRANSFER');
	}

	#isDepartmentControlVisible(): boolean
	{
		return this.#options.showDepartmentControl !== false;
	}
}
