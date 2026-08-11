<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal;

use Bitrix\Main\Config\Configuration;

final class Settings
{
	private static ?array $settings = null;

	public static function get(): array
	{
		if (self::$settings === null)
		{
			self::$settings = Configuration::getValue('note') ?? [];
		}

		return self::$settings;
	}

	public static function isDevMode(): bool
	{
		return (self::get()['isDevMode'] ?? false) === true;
	}
}
