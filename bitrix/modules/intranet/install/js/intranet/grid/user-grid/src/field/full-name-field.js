import { BaseField } from './base-field';
import { Dom, Tag, Loc, Text, Extension } from 'main.core';
import { Label, LabelColor } from 'ui.label';

export type FullNameFieldType = {
	fullName: string,
	profileLink: string,
	position: ?string,
	photoUrl: string,
	role: string,
	inviteStatus: string,
	isFirstAdmin: ?boolean,
	isSystemUser: ?boolean,
}

export class FullNameField extends BaseField
{
	render(params: FullNameFieldType): void
	{
		const fullNameContainer = Tag.render`
			<div class="user-grid_full-name-container">${this.#getFullNameLink(params.fullName, params.profileLink, params.userId)}</div>
		`;

		if (params.position)
		{
			Dom.append(this.#getPositionLabelContainer(Text.encode(params.position)), fullNameContainer);
		}

		switch (params.role)
		{
			case 'integrator':
				Dom.append(this.#getIntegratorBalloonContainer(), fullNameContainer);
				break;
			case 'admin':
				Dom.append(this.#getAdminBalloonContainer(params.isFirstAdmin), fullNameContainer);
				break;
			case 'extranet':
				Dom.append(this.#getExtranetBalloonContainer(), fullNameContainer);
				break;
			case 'collaber':
				Dom.append(this.#getCollaberBalloonContainer(), fullNameContainer);
				break;
			default:
				break;
		}

		if (params.isSystemUser === true)
		{
			Dom.append(this.#getSystemUserLabelContainer(), fullNameContainer);
		}

		switch (params.inviteStatus)
		{
			case 'INVITE_AWAITING_APPROVE':
				Dom.append(this.#getWaitingConfirmationLabelContainer(), fullNameContainer);
				break;
			case 'INVITED':
				Dom.append(this.#getInvitedLabelContainer(), fullNameContainer);
				break;
			default:
				break;
		}

		this.appendToFieldNode(fullNameContainer);
	}

	#getFullNameLink(fullName: string, profileLink: string, userId: number): HTMLElement
	{
		return Tag.render`
			<a 
				class="user-grid_full-name-label" 
				href="${profileLink}" 
				bx-tooltip-user-id="${userId}" 
				bx-tooltip-context="b24"
				bx-tooltip-mini-profile-direction="viewport"
			>
				${fullName}
			</a>
		`;
	}

	#getInvitedLabelContainer(): HTMLElement
	{
		const label = new Label({
			text: Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INVITATION_NOT_ACCEPTED'),
			color: LabelColor.LIGHT_BLUE,
			fill: true,
			size: Label.Size.MD,
			customClass: 'user-grid_label',
		});

		const node = label.render();
		node.dataset.testid = 'intranet-user-grid-invited-badge';

		return node;
	}

	#getWaitingConfirmationLabelContainer(): HTMLElement
	{
		const label = new Label({
			text: Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_NOT_CONFIRMED'),
			color: LabelColor.YELLOW,
			fill: true,
			size: Label.Size.MD,
			customClass: 'user-grid_label',
		});

		const node = label.render();
		node.dataset.testid = 'intranet-user-grid-waiting-confirmation-badge';

		return node;
	}

	#getSystemUserLabelContainer(): HTMLElement
	{
		const label = new Label({
			text: Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_SYSTEM_USER'),
			color: LabelColor.LIGHT,
			fill: true,
			size: Label.Size.MD,
			customClass: 'user-grid_label user-grid_system-user-label',
		});

		const node = label.render();
		node.dataset.testid = 'intranet-user-grid-system-user-badge';

		return node;
	}

	#getPositionLabelContainer(position: string): HTMLElement
	{
		return Tag.render`<div class="user-grid_position-label">${position}</div>`;
	}

	#getIntegratorBalloonContainer(): HTMLElement
	{
		return Tag.render`
			<span class="user-grid_role-label --integrator">
				${
					Extension.getSettings('intranet.grid.user-grid')?.isRenamedIntegrator === 'Y'
						? Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR_RENAMED')
						: Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_INTEGRATOR')
				}
			</span>
		`;
	}

	#getAdminBalloonContainer(isFirstAdmin): HTMLElement
	{
		if (isFirstAdmin)
		{
			return Tag.render`
				<span class="user-grid_role-label --first-admin">
					${Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_FIRST_ADMIN')}
				</span>
			`;
		}

		return Tag.render`
			<span class="user-grid_role-label --admin">
				${Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_ADMIN')}
			</span>
		`;
	}

	#getExtranetBalloonContainer(): HTMLElement
	{
		return Tag.render`
			<span class="user-grid_role-label --extranet">
				${Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_EXTRANET')}
			</span>
		`;
	}

	#getCollaberBalloonContainer(): HTMLElement
	{
		return Tag.render`
			<span class="user-grid_role-label --collaber">
				${Loc.getMessage('INTRANET_JS_CONTROL_BALLOON_COLLABER')}
			</span>
		`;
	}
}
