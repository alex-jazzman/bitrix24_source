import {JNWidgetTitleParams } from '../../../../../../../../../mobile/dev/janative/api';
import { ForwardMessageIds } from '../../controller/dialog/lib/reply-manager/types/reply-manager';

declare type DialogOpenOptions = {
	dialogId: string,
	messageId?: string | number,
	withMessageHighlight?: boolean,
	dialogTitleParams?: DialogTitleParams, /* @deprecated */
	forwardMessageIds?: ForwardMessageIds,
	chatType?: string,
	userCode?: string, // for openlines dialog only
	fallbackUrl?: string, // for openlines dialog only
	parentWidget?: object,
	botContextData?: object,
	navigationTab?: string,
	changeMessengerTab?: boolean,
	/**
	 * the context of opening a chat
	 * @see OpenDialogContextType
	 */
	context: string,
	integrationSettings: ChatIntegrationSettings,
}

declare type DialogTitleParams = {
	name?: string,
	description?: string,
	avatar?: string,
	color?: string,
	chatType?: DialogTitleParamsChatType,
}

declare type DialogTitleParamsChatType = 'lines' | 'open'

export type ChatIntegrationSettings = {
	relatedEntity: RelatedEntityData,
	header: ChatHeaderIntegrationConfig,
	sidebar: SidebarHeaderIntegrationConfig,
	message: MessageIntegrationConfig,
};

export type ChatHeaderIntegrationConfig = {
	title: {
		params: JNWidgetTitleParams,
		controller: ChatIntegrationControllerConfig,
	},
	buttons: {
		controller: ChatIntegrationControllerConfig,
	},
};

export type SidebarHeaderIntegrationConfig = {
	enabled: false,
};

export type MessageIntegrationConfig = {
	contextMenu: {
		controller: ChatIntegrationControllerConfig,
	},
};

export type ChatIntegrationControllerConfig = {
	extensionName: string,
	className: string,
};

export type RelatedEntityData = {
	type: string,
	id: string | number,
	customData: object,
};
