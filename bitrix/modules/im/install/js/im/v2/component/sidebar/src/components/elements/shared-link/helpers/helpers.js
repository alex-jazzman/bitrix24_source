import { Notifier } from 'im.v2.lib.notifier';
import { Utils } from 'im.v2.lib.utils';

export async function copySharedLink(url: string): Promise<void>
{
	try
	{
		await Utils.text.copyToClipboard(url);

		Notifier.sharedLink.onCopyIndividualLinkComplete();
	}
	catch
	{
		Notifier.onCopyLinkError();
	}
}
