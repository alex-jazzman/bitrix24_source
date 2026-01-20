import { AvatarRound } from 'ui.avatar';
import { BaseField } from './base-field';
import { Tag, Text, Dom } from 'main.core';
import type { User } from './component/types';

export class EmployeeField extends BaseField
{
	render(params: User): void
	{
		const employeeFieldContainer = Tag.render`
			<div class="mailbox-grid_employee-card-container"></div>
		`;

		const avatar = this.#renderAvatar(params.avatar?.src);
		Dom.append(avatar, employeeFieldContainer);

		const fullName = this.#renderFullName(params);
		Dom.append(fullName, employeeFieldContainer);

		this.appendToFieldNode(employeeFieldContainer);
	}

	#renderAvatar(avatarPath: string): HTMLElement
	{
		const avatarOptions = {
			size: 28,
		};

		if (avatarPath)
		{
			avatarOptions.userpicPath = encodeURI(avatarPath);
		}

		const avatar = new AvatarRound(avatarOptions);
		const avatarNode = avatar.getContainer();
		Dom.addClass(avatarNode, 'mailbox-grid_owner-photo');

		return avatarNode;
	}

	#renderFullName(params: User): HTMLElement
	{
		const fullNameContainer = Tag.render`
			<div class="mailbox-grid_full-name-container">${this.#getFullNameLink(params.name, params.pathToProfile)}</div>
		`;

		if (params.position !== '')
		{
			Dom.append(this.#getPositionLabelContainer(Text.encode(params.position)), fullNameContainer);
		}

		return fullNameContainer;
	}

	#getFullNameLink(fullName: string, profileLink: string): HTMLElement
	{
		return Tag.render`
			<a class="mailbox-grid_full-name-label" href="${profileLink}">
				${Text.encode(fullName)}
			</a>
		`;
	}

	#getPositionLabelContainer(position: string): HTMLElement
	{
		return Tag.render`
			<div class="mailbox-grid_position-label">
				${Text.encode(position)}
			</div>
		`;
	}
}
