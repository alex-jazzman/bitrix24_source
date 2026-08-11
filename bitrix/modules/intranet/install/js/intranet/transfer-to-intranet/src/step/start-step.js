import { Type, Loc, Tag, Extension } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import { DepartmentControl } from 'intranet.department-control';
import { AvatarRound, AvatarRoundExtranet, AvatarRoundGuest, AvatarBase } from 'ui.avatar';
import { TransferToIntranetPopup } from '../transfer-to-intranet-popup';
import type { TransferToIntranetPopupType } from '../transfer-to-intranet-popup';
import { BaseEvent } from 'main.core.events';

export class StartStep
{
	#options: TransferToIntranetPopupType;
	#content: HTMLElement;
	#department: ?DepartmentControl;
	#parent: TransferToIntranetPopup;
	#sendButton: ?Button;

	constructor(options: TransferToIntranetPopupType, parent: TransferToIntranetPopup)
	{
		this.#options = options;
		this.#parent = parent;
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
				<div class="transfer-start__department">
					${this.#getDepartmentControl().render()}
				</div>
			`
			: '';

		return Tag.render`
			<div class="transfer-start">
				<div class="transfer-start__title">
					${this.#getTitle()}
				</div>
				<div class="transfer-start__account">
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
				<div class="transfer-start__action">
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

			this.#department = new DepartmentControl({
				rootDepartment: Type.isObject(rootDepartment) ? rootDepartment : null,
				description: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_DEPARTMENT_DESCRIPTION'),
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
			className: 'transfer-start__action-send',
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

				this.#parent.emit('changestate', {
					departmentValues: isDepartmentControlVisible ? departmentControl.getValues() : [],
				});
			},
		});

		return this.#sendButton;
	}

	#getCancelButton(): Button
	{
		return new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_CANCEL'),
			size: Button.Size.LARGE,
			style: AirButtonStyle.OUTLINE,
			onclick: () => {
				this.#parent.emit('closepopup');
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
			case 'collaber':
				return Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_COLLABA_TITLE');
			case 'integrator':
				return Extension.getSettings('intranet.transfer-to-intranet').isRenamedIntegrator === true
					? Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_INTEGRATOR_TITLE_RENAMED')
					: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_INTEGRATOR_TITLE');
			default:
				return Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_TITLE');
		}
	}

	#getPosition(): string
	{
		switch (this.#options.userType)
		{
			case 'collaber':
				return Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_POSITION_COLLABER');
			case 'integrator':
				return Extension.getSettings('intranet.transfer-to-intranet').isRenamedIntegrator === true
					? Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_POSITION_INTEGRATOR_RENAMED')
					: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_POSITION_INTEGRATOR');
			default:
				return Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_POSITION_EXTRANET');
		}
	}

	#getActionButtonText(): string
	{
		return Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_TRANSFER');
	}

	#isDepartmentControlVisible(): boolean
	{
		return this.#options.showDepartmentControl !== false;
	}
}
