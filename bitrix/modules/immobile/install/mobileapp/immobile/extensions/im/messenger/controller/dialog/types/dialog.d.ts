import {DialogId} from "../../../types/common";
import {DialoguesModelState} from "../../../model/types/dialogues";
import {MessengerCoreStore } from "../../../../core/types/store";
import {IServiceLocator} from "../../../lib/di/service-locator/types";

declare type DialogOpenOptions = {
	dialogId: DialogId,
	dialogTitleParams: object,
	forwardMessageId: number;
	chatType: string;
};

declare type DialogEvents = {
	chatLoad: [DialoguesModelState],
	beforeFirstPageRenderFromServer: [DialoguesModelState],
	afterFirstPageRenderFromServer: {},
}

declare interface IDialogEmitter
{
	on<T extends keyof DialogEvents>(eventName: T, handler: (...args: DialogEvents[T]) => void): this;
	emit<T extends keyof DialogEvents>(eventName: T,...args: DialogEvents[T]): Promise<void>;
}

declare type DialogLocatorServices = {
	'context-manager': ContextManager,
	'chat-service': ChatService,
	'disk-service': DiskService,
	'mention-manager': MentionManager,
	'message-renderer': MessageRenderer,
	'message-service': MessageService,
	'reply-manager': ReplyManager,
	'store': MessengerCoreStore,
	'view': DialogView,
	'emitter': DialogEmitter,
}

declare type DialogLocator = IServiceLocator<DialogLocatorServices>;