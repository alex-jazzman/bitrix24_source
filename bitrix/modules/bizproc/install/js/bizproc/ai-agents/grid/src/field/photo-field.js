import { Dom } from 'main.core';
import { AvatarRound } from 'ui.avatar';

import { EmployeeFieldType } from '../types';
import { BaseField } from './base-field';

export class PhotoField extends BaseField
{
	render(params: EmployeeFieldType): void
	{
		const avatarOptions = {
			size: 24,
			userpicPath: params?.user?.photoUrl,
		};

		const avatar = new AvatarRound(avatarOptions);

		this.addMiniProfile(params);

		avatar?.renderTo(this.getFieldNode());

		Dom.addClass(this.getFieldNode(), 'agent-grid_user-photo');
	}

	addMiniProfile(params: EmployeeFieldType): void
	{
		Dom.attr(this.getFieldNode(), 'bx-tooltip-user-id', params?.user?.id);
		Dom.attr(this.getFieldNode(), 'bx-tooltip-context', 'b24');
	}
}
