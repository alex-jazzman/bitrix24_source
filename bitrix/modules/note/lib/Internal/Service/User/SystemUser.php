<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\User;

use Bitrix\Main\Localization\Loc;

/**
 * Sentinel descriptor for the module-owned "system" actor (userId = 0).
 *
 * Centralizes the system-user detection and exposes a stable payload that
 * resolvers can emit to the frontend in lieu of a real b_user row. Bootstrap
 * code (welcome content, future demo data) creates rows with CREATED_BY = 0;
 * never written to b_user.
 */
final class SystemUser
{
	public const ID = 0;

	public static function isSystem(int $userId): bool
	{
		return $userId === self::ID;
	}

	public static function name(): string
	{
		return (string)Loc::getMessage('NOTE_SYSTEM_USER_NAME');
	}

	public static function avatarUrl(): string
	{
		return '/bitrix/js/note/ui/assets/images/system-user-avatar.png';
	}

	/**
	 * Standard payload for any user-info object emitted to the frontend.
	 *
	 * @return array{id: int, name: string, photoUrl: string, isSystem: true}
	 */
	public static function asAuthorMeta(): array
	{
		return [
			'id' => self::ID,
			'name' => self::name(),
			'photoUrl' => self::avatarUrl(),
			'isSystem' => true,
		];
	}
}
