import { ajax } from 'main.core';

// [API-02] Copilot chat creation, pinned in one place so the parameter names are testable.
//
// The type goes out as the upper-case string: im's client constant ChatType.copilot is 'copilot',
// but CreateService runs it through #prepareType() (camel→snake, upper-case) before the request.
// We call the action directly, without that service, so we upper-case it ourselves.
export const COPILOT_CHAT_TYPE = 'COPILOT';

// Universal copilot role. An invalid code is NOT rejected by im — RoleManager::getValidRoleCode()
// silently substitutes the default one — so the only way to catch a typo here is a test.
export const COPILOT_MAIN_ROLE = 'copilot_assistant';

// No `title`: CopilotChat::generateTitle() fills in a numbered name from im's own phrases.
// No `parentChatId`: the knowledge-base panel is not tied to a project chat.
export function buildCreateDialogConfig(): Object
{
	return {
		// The fields must sit inside `data`: BX.ajax.runAction sends exactly config.data, which is
		// also why im.v2.lib.rest rebuilds the config as { ...config, data: prepare(config.data) }.
		data: {
			fields: {
				type: COPILOT_CHAT_TYPE,
				copilotMainRole: COPILOT_MAIN_ROLE,
			},
		},
	};
}

export function buildDialogId(chatId: mixed): string
{
	return `chat${Number(chatId)}`;
}

/**
 * Creates a fresh copilot dialog and returns its dialogId.
 */
export async function createCopilotDialog(): Promise<string>
{
	const response = await ajax.runAction('im.v2.Chat.add', buildCreateDialogConfig());
	const chatId = Number(response?.data?.chatId ?? 0);
	if (!Number.isInteger(chatId) || chatId <= 0)
	{
		throw new Error('note.ai-chat: im.v2.Chat.add returned no chatId');
	}

	return buildDialogId(chatId);
}
