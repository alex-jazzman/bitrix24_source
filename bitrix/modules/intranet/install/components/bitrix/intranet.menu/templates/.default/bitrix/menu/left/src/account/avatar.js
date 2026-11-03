export const DEFAULT_AVATAR = '/bitrix/js/im/images/blank.gif';
export const DEFAULT_DESKTOP_AVATAR = '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2';

export function resolveAvatarUrl(account: Object): string
{
	const avatarPath = account.avatar.split(/[?#]/, 1)[0];
	if (avatarPath.endsWith(DEFAULT_AVATAR))
	{
		return DEFAULT_DESKTOP_AVATAR;
	}

	if (account.avatar.includes('http://') || account.avatar.includes('https://'))
	{
		return account.avatar;
	}

	return `${account.protocol}://${account.portal}${account.avatar}`;
}
