import { getCurrentInstance } from 'ui.vue3';

export type MessageId = string;
export type Replacements = string;

export type GetMessage = (messageId: MessageId, replacements: Replacements) => string;

export type UseLoc = {
	getMessage: GetMessage,
};

export function useLoc(): UseLoc
{
	const app = getCurrentInstance()?.appContext.app;
	const bitrix = app?.config?.globalProperties?.$bitrix ?? null;

	return {
		getMessage: (messageId: MessageId, replacements: Replacements): string => {
			return bitrix?.Loc?.getMessage(messageId, replacements);
		},
	};
}
