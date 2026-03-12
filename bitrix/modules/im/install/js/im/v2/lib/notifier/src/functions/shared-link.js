import { Loc } from 'main.core';

import { showNotification } from '../utils/notification';

export const SharedLinkNotifier = {
	onCopyIndividualLinkComplete()
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_SHARED_LINK_COPY_INDIVIDUAL_COMPLETE'));
	},
	onClickInvalidLinkError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CLICK_INVALID_ERROR'));
	},
	onChangeLinkComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_COMPLETE'));
	},
	onChangeLinkError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_ERROR'));
	},
};
