<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;

/**
 * Single source of truth for the "portal administrator" notion in the note module.
 *
 * An administrator is either the technical super administrator (membership in group 1 /
 * CUser::IsAdmin()) OR a portal administrator of cloud Bitrix24
 * (\CBitrix24::IsPortalAdmin). The dependency on the bitrix24 module is soft: in the box
 * edition (module not installed) the check gracefully degrades to the group 1 membership.
 *
 * Every admin check in the note access layer must go through this class — no other place
 * should determine the "administrator" on its own.
 */
final class PortalAdmin
{
	private const ADMIN_GROUP_ID = 1;

	public static function isCurrentUserAdmin(): bool
	{
		return self::isAdmin((int)CurrentUser::get()->getId());
	}

	public static function isAdmin(int $userId): bool
	{
		if ($userId <= 0)
		{
			return false;
		}

		if (self::isBaseAdmin($userId))
		{
			return true;
		}

		if (
			Loader::includeModule('bitrix24')
			&& method_exists(\CBitrix24::class, 'IsPortalAdmin')
		)
		{
			return (bool)\CBitrix24::IsPortalAdmin($userId);
		}

		return false;
	}

	private static function isBaseAdmin(int $userId): bool
	{
		$currentUser = CurrentUser::get();
		if ((int)$currentUser->getId() === $userId)
		{
			return (bool)$currentUser->isAdmin();
		}

		// fallback for an arbitrary user: membership in the built-in admin group (1)
		$groups = \CUser::GetUserGroup($userId);

		return is_array($groups)
			&& in_array(self::ADMIN_GROUP_ID, array_map('intval', $groups), true);
	}
}
