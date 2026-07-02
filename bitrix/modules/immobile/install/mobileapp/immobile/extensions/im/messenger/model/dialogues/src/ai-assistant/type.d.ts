import { MessengerModel, PayloadData } from '../../../base';

declare type AiAssistantModelState = {
	notifyPanel: AiAssistantNotifyPanelModelState,
};

declare type AiAssistantNotifyPanelModelState ={
	isClosedNotifyPanel: boolean,
};

declare type AiAssistantModelActions = 'dialoguesModel/aiAssistantModel/setIsClosedNotifyPanel';

declare type AiAssistantModelMutation = 'updateNotifyPanel';

declare interface AiAssistantNotifyPanelUpdateData extends PayloadData, AiAssistantNotifyPanelModelState {}

declare type AiAssistantModel = MessengerModel<AiAssistantModelState>;
