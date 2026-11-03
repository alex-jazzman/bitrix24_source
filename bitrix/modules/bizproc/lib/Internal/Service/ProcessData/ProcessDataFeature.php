<?php

declare(strict_types=1);

namespace Bitrix\Bizproc\Internal\Service\ProcessData;

use Bitrix\Main\Config\Option;

final class ProcessDataFeature
{
	public const MODULE_ID = 'bizproc';
	public const OPTION_NAME = 'process_data_enabled';

	public static function isEnabled(): bool
	{
		return Option::get(self::MODULE_ID, self::OPTION_NAME, 'N') === 'Y';
	}
}
