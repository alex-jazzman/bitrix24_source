<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal;

use Bitrix\Main\Config\Option;

final class Configuration
{
	public const RECYCLE_BIN_TTL_OPTION = 'recycle_bin_ttl_days';
	public const RECYCLE_BIN_TTL_DEFAULT = 30;

	/**
	 * Days a document stays in the recycle bin before the cleanup agent hard-deletes it.
	 * -1 disables automatic cleanup (the agent self-unregisters).
	 */
	public static function getRecycleBinTtl(): int
	{
		return (int)Option::get('note', self::RECYCLE_BIN_TTL_OPTION, self::RECYCLE_BIN_TTL_DEFAULT);
	}
}
