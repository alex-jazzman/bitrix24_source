import { Dom } from 'main.core';
import { Text as TypographyText } from 'ui.system.typography';

import type { AgentInfoFieldType } from '../types';
import { BaseField } from './base-field';

export class AgentInfoField extends BaseField
{
	render(params: AgentInfoFieldType): void
	{
		const nameNode = TypographyText.render(
			params.name ?? '',
			{
				size: 'md',
				accent: true,
				tag: 'div',
				className: 'bizproc-ai-agents-grid-agent-name bizproc-ai-agents-one-line-height',
			},
		);

		Dom.attr(nameNode, 'data-test-id', 'bizproc-ai-agents-grid-agent-title');

		const descriptionNode = TypographyText.render(
			params.description ?? '',
			{
				size: 'xs',
				accent: false,
				tag: 'div',
				className: 'bizproc-ai-agents-grid-agent-description bizproc-ai-agents-two-lines-height',
			},
		);

		this.appendToFieldNode(nameNode);
		this.appendToFieldNode(descriptionNode);
	}
}
