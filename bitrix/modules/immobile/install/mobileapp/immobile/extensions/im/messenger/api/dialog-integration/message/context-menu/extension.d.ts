import { RelatedEntityData } from '../../../dialog-opener/dialog-opener';
import { DialoguesModelState } from '../../../../model/dialogues/src/types';
import {
	IMessageMenuActionHelper,
	IMessageMenuView,
	MessageContextMenuSectionItem
} from '../../../../controller/dialog/lib/message-menu/types';

export type MessageMenuContext = {
	getDialog: () => DialoguesModelState;
	relatedEntity: RelatedEntityData;
}

export interface IMessageContextMenu {
	getDialog: () => DialoguesModelState;
	relatedEntity: RelatedEntityData;
	getActions(): Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper, options: object) => void>,
	getActionHandlers(): Record<string, (actionHelper: IMessageMenuActionHelper) => void>,
	getOrderedActions(actionHelper?: IMessageMenuActionHelper): Promise<string[]>,
	getOrderedActionTree(actionHelper?: IMessageMenuActionHelper): string|object[],
	getOrderedErrorActionTree?(): string|object[],
	getOrderedSendingActionTree?(): string|object[],
	getSection(): Record<string, MessageContextMenuSectionItem>,
	getErrorMenuSection?(): Record<string, MessageContextMenuSectionItem>,
	getSendingMenuSection?(): Record<string, MessageContextMenuSectionItem>,
}
