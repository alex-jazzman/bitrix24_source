import {DialogId} from "../../../types/common";
import {DialoguesModelState} from "../../../model/types/dialogues";

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