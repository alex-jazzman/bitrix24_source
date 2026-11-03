import { LocalStorageKey, TabId } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';

export function getRememberedTabId(canInviteGuests: boolean): string
{
	resetRememberedGuestTab();

	const savedTab = LocalStorageManager.getInstance().get(LocalStorageKey.invitePopupTab);
	if (!canInviteGuests || !savedTab)
	{
		return TabId.employees;
	}

	return savedTab;
}

function resetRememberedGuestTab()
{
	const storage = LocalStorageManager.getInstance();
	if (storage.get(LocalStorageKey.invitePopupGuestTabReset) === true)
	{
		return;
	}

	storage.set(LocalStorageKey.invitePopupGuestTabReset, true);
	if (storage.get(LocalStorageKey.invitePopupTab) === TabId.guests)
	{
		storage.remove(LocalStorageKey.invitePopupTab);
	}
}
