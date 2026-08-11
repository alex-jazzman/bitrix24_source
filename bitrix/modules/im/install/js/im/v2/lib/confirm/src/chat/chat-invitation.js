import { Loc } from 'main.core';

import { showTwoButtonConfirm } from '../base/base';

export const showUpdateGuestLinkConfirm = (): Promise<boolean> => {
	return showTwoButtonConfirm({
		title: Loc.getMessage('IM_LIB_CONFIRM_UPDATE_GUEST_LINK_TITLE'),
		text: Loc.getMessage('IM_LIB_CONFIRM_UPDATE_GUEST_LINK_TEXT'),
		firstButtonCaption: Loc.getMessage('IM_LIB_CONFIRM_UPDATE_GUEST_LINK_CONFIRM'),
	});
};
