<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Role;

use Bitrix\Main\Localization\Loc;

final class RoleDictionary
{
	public const ROLE_ADMINISTRATOR = 'NOTE_ADMINISTRATOR';
	public const ROLE_USER = 'NOTE_USER';

	private const ROLE_NAME_MAP = [
		self::ROLE_ADMINISTRATOR => 'NOTE_ACCESS_ROLE_NAME_ADMINISTRATOR',
		self::ROLE_USER => 'NOTE_ACCESS_ROLE_NAME_USER',
	];

	public static function getRoleName(string $code): ?string
	{
		$messageCode = self::ROLE_NAME_MAP[$code] ?? null;
		if ($messageCode === null)
		{
			return null;
		}

		return Loc::getMessage($messageCode) ?: null;
	}
}
