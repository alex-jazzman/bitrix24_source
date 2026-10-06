import { Core } from 'im.v2.application.core';
import { type ImModelCopilotRole, type ImModelCopilotMcpAuth } from 'im.v2.model';

const convertToReadableValue = (value: boolean): string => (value ? 'on' : 'off');

export function getCopilotContext(dialogId: string, suggestsCount: ?number = null): string
{
	const store = Core.getStore();

	const mcpAuth: ?ImModelCopilotMcpAuth = store.getters['copilot/chats/getMcpAuth'](dialogId);
	const isMcpEnabled = Boolean(mcpAuth);

	const role: ?ImModelCopilotRole = store.getters['copilot/chats/getRole'](dialogId);

	const context = {
		mcp: convertToReadableValue(isMcpEnabled),
		reasoning: convertToReadableValue(store.getters['copilot/chats/isReasoningEnabled'](dialogId)),
		webSearch: convertToReadableValue(store.getters['copilot/chats/isForceSearchEnabled'](dialogId)),
		agentMode: convertToReadableValue(store.getters['copilot/chats/isAgentModeEnabled'](dialogId)),
		role: role ? role.code : '',
	};

	if (isMcpEnabled)
	{
		context.mcpServer = mcpAuth.name;
	}

	if (suggestsCount !== null)
	{
		context.suggestsCount = suggestsCount;
	}

	return JSON.stringify(context);
}
