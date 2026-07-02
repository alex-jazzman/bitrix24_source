import { Tag, Text, Dom } from 'main.core';
import { AvatarRound } from 'ui.avatar';

import { BaseField } from './base-field';
import { type User } from './types';

export class EmployeeField extends BaseField
{
	render(params: User): void
	{
		const employeeFieldContainer = Tag.render`
			<div class="passwordless-grid_employee-card-container"></div>
		`;

		const avatar = this.#renderAvatar(params.avatar?.src);
		Dom.append(avatar, employeeFieldContainer);

		const fullName = this.#renderFullName(params);
		Dom.append(fullName, employeeFieldContainer);

		this.appendToFieldNode(employeeFieldContainer);
	}

	#renderAvatar(avatarPath?: string): HTMLElement
	{
		const avatarOptions: { size: number; userpicPath?: string } = {
			size: 28,
		};

		if (avatarPath)
		{
			avatarOptions.userpicPath = encodeURI(avatarPath);
		}

		const avatar = new AvatarRound(avatarOptions);
		const avatarNode = avatar.getContainer();
		Dom.addClass(avatarNode, 'passwordless-grid_owner-photo');

		return avatarNode;
	}

	#renderFullName(params: User): HTMLElement
	{
		const fullNameContainer = Tag.render`
			<div class="passwordless-grid_full-name-container">${this.#getFullNameLink(params.name, params.pathToProfile)}</div>
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
			<a class="passwordless-grid_full-name-label" href="${encodeURI(profileLink)}">
				${Text.encode(fullName)}
			</a>
		`;
	}

	#getPositionLabelContainer(position: string): HTMLElement
	{
		return Tag.render`
			<div class="passwordless-grid_position-label">
				${Text.encode(position)}
			</div>
		`;
	}
}
