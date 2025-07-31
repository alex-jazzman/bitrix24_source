import { Type, Loc, Tag } from 'main.core';
import { AirButtonStyle, Button } from 'ui.buttons';
import DepartmentControl from 'intranet.department-control';
import { AvatarRound, AvatarRoundExtranet, AvatarRoundGuest, AvatarBase } from 'ui.avatar';
import { TransferToIntranetPopup } from '../transfer-to-intranet-popup';
import type { TransferToIntranetPopupType } from '../transfer-to-intranet-popup';

export class StartStep
{
	#options: TransferToIntranetPopupType;
	#content: HTMLElement;
	#department: DepartmentControl;
	#parent: TransferToIntranetPopup;

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
		const isCollaber = this.#options.userType === 'collaber';
		const modificator = isCollaber ? 'collaber' : 'extranet';
		const title = isCollaber
			? Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_COLLABA_TITLE')
			: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_TITLE');
		const position = isCollaber
			? Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_POSITION_COLLABER')
			: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_POSITION_EXTRANET');

		return Tag.render`
			<div class="transfer-start">
				<div class="transfer-start__title">
					${title}
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
								${position}
							</div>
						</div>
					</div>
				</div>
				<div class="transfer-start__department">
					${this.#getDepartmentControl().render()}
				</div>
				<div class="transfer-start__action">
					${this.#getSendButton()}
					${this.#getCancelButton()}
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

	#getDepartmentControl(): DepartmentControl
	{
		if (!this.#department)
		{
			const rootDepartment = this.#options.rootDepartment;

			this.#department = new DepartmentControl({
				rootDepartment: Type.isObject(rootDepartment) ? rootDepartment : null,
				description: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_DEPARTMENT_DESCRIPTION'),
			});
		}

		return this.#department;
	}

	#getSendButton(): HTMLElement
	{
		return new Button({

			className: 'transfer-start__action-send',
			text: Loc.getMessage('INTRANET_EXTRANET_TO_INTRANET_POPUP_TRANSFER'),
			size: Button.Size.LARGE,
			style: '--style-filled',
			useAirDesign: true,
			noCaps: true,
			isDependOnTheme: true,
			onclick: () => {
				this.#parent.emit('changestate', {
					departmentValues: this.#department.getValues(),
				});
			},
		}).render();
	}

	#getCancelButton(): HTMLElement
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
		}).render();
	}
}
