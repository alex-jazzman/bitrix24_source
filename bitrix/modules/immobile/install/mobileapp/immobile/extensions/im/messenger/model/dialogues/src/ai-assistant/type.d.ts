import { MessengerModel, PayloadData } from '../../../base';

declare type AiAssistantModelState = {
	notifyPanel: AiAssistantNotifyPanelModelState,
	mcp: AiAssistantMCPModelState,
};

declare type AiAssistantNotifyPanelModelState ={
	isClosedNotifyPanel: boolean,
};

declare type AiAssistantMCPModelState = {
	selectedAuthId: number,
	name: string,
	iconUrl: string,
};

declare type AiAssistantModelActions = 'dialoguesModel/aiAssistantModel/setIsClosedNotifyPanel'
	| 'dialoguesModel/aiAssistantModel/setMCP';

declare type AiAssistantModelMutation = 'updateNotifyPanel' | 'updateMCP';

declare interface AiAssistantNotifyPanelUpdateData extends PayloadData, AiAssistantNotifyPanelModelState {}

declare interface AiAssistantMCPUpdateData extends PayloadData, AiAssistantMCPModelState {}

declare type AiAssistantModel = MessengerModel<AiAssistantModelState>;
