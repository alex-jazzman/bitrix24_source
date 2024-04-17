<?php

namespace Bitrix\Intranet\Settings;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;

class SettingsPermission
{
	const READ = 1 << 0;
	const EDIT = 1 << 2;

	private int $permissionBitwise;

	public function __construct(
		private CurrentUser $user
	)
	{
		if (
			$this->user->isAdmin() ||
			(Loader::includeModule('bitrix24') && $this->user->canDoOperation('bitrix24_config'))
		)
		{
			$this->permissionBitwise = static::READ | static::EDIT;
		}
		else
		{
			$this->permissionBitwise = 0;//static::READ;
		}
	}

	public function canRead(): bool
	{
		return $this->permissionBitwise & static::READ;
	}

	public function canEdit(): bool
	{
		return $this->permissionBitwise & static::READ;
	}

	public function getPermission(): int
	{
		return $this->permissionBitwise;
	}
}