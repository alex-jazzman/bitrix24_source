import { type ChatTypeItem } from 'im.v2.const';
import { Notifier } from 'im.v2.lib.notifier';
import { Utils } from 'im.v2.lib.utils';

export async function copySharedLink(url: string, chatType: ChatTypeItem): Promise<void>
{
	try
	{
		await Utils.text.copyToClipboard(url);

		Notifier.sharedLink.onCopyIndividualLinkComplete(chatType);
	}
	catch
	{
		Notifier.onCopyLinkError();
	}
}
