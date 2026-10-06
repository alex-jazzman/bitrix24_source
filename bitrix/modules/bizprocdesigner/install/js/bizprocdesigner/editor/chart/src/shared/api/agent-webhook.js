import { ajax } from 'main.core';

/**
 * Thin transport layer for the external AI agent webhook-token actions.
 *
 * Each function wraps ajax.runAction for the editor controller action
 * bizprocdesigner.v2.Diagram.<method>. It returns the whole parsed response
 * (like the inline call in the popup component): the caller reads
 * response.data itself and handles errors via handleResponseError.
 *
 * The client does not transform connectUrl, format the expiration, or show
 * notifications — transport only.
 */

const runAgentAction = (method: string, templateId: number): Promise => {
	return ajax.runAction(`bizprocdesigner.v2.Diagram.${method}`, {
		method: 'POST',
		json: { templateId },
	});
};

export function connectAgent(templateId: number): Promise
{
	return runAgentAction('connectAgent', templateId);
}

export function revokeAgent(templateId: number): Promise
{
	return runAgentAction('revokeAgent', templateId);
}

export function regenerateAgent(templateId: number): Promise
{
	return runAgentAction('regenerateAgent', templateId);
}

export function agentStatus(templateId: number): Promise
{
	return runAgentAction('agentStatus', templateId);
}
