import { Type } from 'main.core';

import { fullReportService } from 'timeman.provider.service.full-report-service';

const resolveMessengerHost = (): any => {
	try
	{
		if (window.top && window.top !== window && window.top.BXIM)
		{
			return window.top;
		}
	}
	catch (e)
	{
		console.error('discuss-chat: resolveMessengerHost not work');
	}

	return window;
};

export const openDiscussChat = async (reportId: number): Promise<void> => {
	const { dialogId } = await fullReportService.discuss(reportId);

	if (!Type.isStringFilled(dialogId))
	{
		throw new Error('discuss-chat: empty dialogId in response');
	}

	const messengerHost = resolveMessengerHost();

	if (Type.isFunction(messengerHost?.BXIM?.openMessenger))
	{
		messengerHost.BXIM.openMessenger(dialogId);

		return;
	}

	if (Type.isFunction(messengerHost?.BX?.MessengerCommon?.openDialog))
	{
		messengerHost.BX.MessengerCommon.openDialog(dialogId);

		return;
	}

	throw new Error('discuss-chat: messenger API not found on window');
};
