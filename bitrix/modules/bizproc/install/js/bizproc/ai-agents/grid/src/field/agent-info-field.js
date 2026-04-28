import { Dom } from 'main.core';
import { Text as TypographyText } from 'ui.system.typography';

import { type AgentInfoFieldType } from '../types';
import { BaseField } from './base-field';

export class AgentInfoField extends BaseField
{
	render(params: AgentInfoFieldType): void
	{
		const agentName = params.name ?? '';
		const agentDescription = params.description ?? '';

		const nameNode = this.createAgentNameNode(agentName);

		Dom.attr(nameNode, 'data-test-id', 'bizproc-ai-agents-grid-agent-title');
		Dom.attr(nameNode, 'title', agentName);

		const descriptionNode = this.createAgentDescriptionNode(agentDescription);

		Dom.attr(descriptionNode, 'title', agentDescription);

		this.appendToFieldNode(nameNode);
		this.appendToFieldNode(descriptionNode);
	}

	createAgentNameNode(agentName: string): HTMLElement
	{
		return TypographyText.render(
			agentName,
			{
				size: 'md',
				accent: true,
				tag: 'div',
				className: 'bizproc-ai-agents-grid-agent-name bizproc-ai-agents-one-line-height',
			},
		);
	}

	createAgentDescriptionNode(agentDescription: string): HTMLElement
	{
		return TypographyText.render(
			agentDescription,
			{
				size: 'xs',
				accent: false,
				tag: 'div',
				className: 'bizproc-ai-agents-grid-agent-description bizproc-ai-agents-two-lines-height',
			},
		);
	}
}
