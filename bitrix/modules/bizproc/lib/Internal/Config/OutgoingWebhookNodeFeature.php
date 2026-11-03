<?php

declare(strict_types=1);

namespace Bitrix\Bizproc\Internal\Config;

use Bitrix\Main\Config\Option;

/**
 * The rollout flag of the outgoing webhook node: while it is off the node stays out of the catalog of
 * the designer, a node already placed in a template keeps working.
 */
final class OutgoingWebhookNodeFeature
{
	public const MODULE_ID = 'bizproc';
	public const OPTION_NAME = 'outgoing_webhook_node_available';

	private const DEFAULT_VALUE = 'N';

	public static function isEnabled(): bool
	{
		return Option::get(self::MODULE_ID, self::OPTION_NAME, self::DEFAULT_VALUE) === 'Y';
	}
}
