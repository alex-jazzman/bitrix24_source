import { Tag, Text, Dom } from 'main.core';

import type { EmployeeFieldType } from '../types';
import { PhotoField } from './photo-field';
import { FullNameField } from './full-name-field';
import { BaseField } from './base-field';

export class EmployeeField extends BaseField
{
	render(params: EmployeeFieldType): void
	{
		const photoFieldId = Text.getRandom(6);
		const fullNameFieldId = Text.getRandom(6);
		this.appendToFieldNode(Tag.render`<span id="${photoFieldId}"></span>`);
		this.appendToFieldNode(Tag.render`<span class="agent-grid_full-name-wrapper" id="${fullNameFieldId}"></span>`);

		(new PhotoField({ fieldId: photoFieldId })).render(params);
		(new FullNameField({ fieldId: fullNameFieldId })).render(params);

		Dom.addClass(this.getFieldNode(), 'agent-grid_employee-card-container');

		Dom.attr(this.getFieldNode(), 'data-test-id', 'bizproc-ai-agents-grid-started-by-employee-card');
	}
}
