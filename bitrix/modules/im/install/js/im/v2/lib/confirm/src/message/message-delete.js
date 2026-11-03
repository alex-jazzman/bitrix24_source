import { Loc } from 'main.core';

import { showTwoButtonConfirm } from '../base/base';

const DELETE_EMPTY_MESSAGE_POPUP_ID = 'im-confirm-delete-empty-message';

export const showDeleteChannelPostConfirm = (): Promise<boolean> => {
	return showTwoButtonConfirm({
		title: Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_POST_TITLE'),
		text: Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_POST_TEXT'),
		firstButtonCaption: Loc.getMessage('IM_LIB_EXIT_DELETE_CHANNEL_POST_TEXT_CONFIRM'),
	});
};

export const showDeleteEmptyMessageConfirm = (): Promise<boolean> => {
	return showTwoButtonConfirm({
		title: Loc.getMessage('IM_LIB_CONFIRM_DELETE_EMPTY_MESSAGE_TITLE'),
		text: Loc.getMessage('IM_LIB_CONFIRM_DELETE_EMPTY_MESSAGE_TEXT'),
		firstButtonCaption: Loc.getMessage('IM_LIB_CONFIRM_DELETE_EMPTY_MESSAGE_CONFIRM'),
		popupId: DELETE_EMPTY_MESSAGE_POPUP_ID,
	});
};

export const showDeleteMessagesConfirm = (title: string): Promise<boolean> => {
	return showTwoButtonConfirm({
		title,
		firstButtonCaption: Loc.getMessage('IM_LIB_CONFIRM_DELETE_MESSAGES_TITLE'),
	});
};
