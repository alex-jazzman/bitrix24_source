<?php

declare(strict_types=1);

namespace Bitrix\Bizproc\Internal\Config;

use Bitrix\Main\Config\Option;

/**
 * While the feature is off the variable activities declare no node_action role, so neither source of the
 * action list of a node offers them.
 */
final class NodeVariableActionsFeature
{
	public const MODULE_ID = 'bizproc';
	public const OPTION_NAME = 'node_variable_actions_available';

	private const DEFAULT_VALUE = 'N';

	public static function isEnabled(): bool
	{
		return Option::get(self::MODULE_ID, self::OPTION_NAME, self::DEFAULT_VALUE) === 'Y';
	}
}
