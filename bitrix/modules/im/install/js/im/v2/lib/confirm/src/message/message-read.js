import { Loc } from 'main.core';

import { showTwoButtonConfirm } from '../base/base';

export const showReadMessagesConfirm = (text: string): Promise<boolean> => {
	return showTwoButtonConfirm({
		title: Loc.getMessage('IM_LIB_CONFIRM_READ_MESSAGES_TITLE_MSGVER_1'),
		text,
		firstButtonCaption: Loc.getMessage('IM_LIB_CONFIRM_READ_MESSAGES_TEXT_CONFIRM'),
	});
};
