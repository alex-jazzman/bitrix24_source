export type CopilotChatMessage = {
	id?: number;
	content: string;
	authorId: number;
	status?: 'sending' | 'delivered' | '';
	params?: CopilotChatMessageParams;
	dateCreated?: string;
	type?: 'default' | 'welcomeFlows' | 'welcomeSiteWithAi' | 'system' | 'buttonClickMessage';
	viewed: boolean;
};

type CopilotChatMessageParams = {
	buttons?: CopilotChatMessageButton[];
}

export type CopilotChatMessageButton = {
	id: number;
	text: string;
	isSelected: boolean;
	message: string;
}

export const CopilotChatMessageType = Object.freeze({
	DEFAULT: 'default',
	BUTTON_CLICK_MESSAGE: 'buttonClickMessage',
	WELCOME_FLOWS: 'welcomeFlows',
	WELCOME_SITE_WITH_AI: 'welcomeSiteWithAi',
	SYSTEM: 'system',
});
