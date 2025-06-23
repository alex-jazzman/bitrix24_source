<?php

declare(strict_types=1);

namespace Bitrix\HumanResources\Access\Install\AgentInstaller;

use Bitrix\HumanResources\Contract\AgentInstaller;

class InstallerFactory
{
	public const REINSTALL = -1;
	public const VERSION_0 = 0;
	public const VERSION_1 = 1;
	public const VERSION_2 = 2;
	public const VERSION_3 = 3;

	/**
	 * @return array<int, string>
	 */
	public static function getVersionMap(): array
	{
		return [
			self::REINSTALL => PermissionReInstaller::class,
			self::VERSION_0 => DefaultPermissionInstaller::class,
			self::VERSION_1 => DeputyAndHRPermissionInstaller::class,
			self::VERSION_2 => InviteAndFirePermissionInstaller::class,
			self::VERSION_3 => TeamRolesInstaller::class,
		];
	}

	public static function getInstaller(int $version): ?AgentInstaller
	{
		$installerClass = self::getVersionMap()[$version] ?? null;

		if ($installerClass && class_exists($installerClass))
		{
			return new $installerClass();
		}

		return null;
	}
}