import { Tag, Loc, Dom } from 'main.core';
import { Text as TypographyText } from 'ui.system.typography';

import { BaseField } from './base-field';
import { EmployeeFieldType } from '../types';
import { USER_MINI_PROFILE_ATTRIBUTES, USER_MINI_PROFILE_CONTEXT } from '../constants';

export class FullNameField extends BaseField
{
	render(params: EmployeeFieldType): void
	{
		const user = params?.user ?? {};
		const fullName = user.fullName ?? Loc.getMessage('BIZPROC_AI_AGENTS_LAUNCHED_BY_PLACEHOLDER');
		const profileLink = user.profileLink ?? null;
		const userId = user.id ?? null;

		const fullNameElement = this.#createFullNameElement(fullName, userId, profileLink);

		const container = Tag.render`
			<div class="agent-grid_full-name-container">${fullNameElement}</div>
		`;

		this.appendToFieldNode(container);
	}

	#createFullNameElement(fullName: string, userId: ?string, profileLink: ?string): HTMLElement
	{
		const typographyOptions = {
			size: 'xs',
			accent: false,
			tag: 'span',
			className: 'agent-grid_full-name-label',
		};

		const nameNode = TypographyText.render(fullName, typographyOptions);

		Dom.attr(nameNode, USER_MINI_PROFILE_ATTRIBUTES.USER_ID, userId);
		Dom.attr(nameNode, USER_MINI_PROFILE_ATTRIBUTES.CONTEXT, USER_MINI_PROFILE_CONTEXT.B24);

		if (!profileLink)
		{
			Dom.addClass(nameNode, 'agent-grid_full-name-label-placeholder');

			return nameNode;
		}

		return Tag.render`
			<a href="${profileLink}" class="agent-grid_full-name-link">
				${nameNode}
			</a>
		`;
	}
}
