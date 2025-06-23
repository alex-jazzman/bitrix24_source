<?php

namespace Bitrix\Crm\Copilot\AiQueueBuffer\Provider;

use Bitrix\Crm\RepeatSale;

final class Factory
{
	public static function getProvider(int $providerId): ?QueueBufferProviderInterface
	{
		return match ($providerId)
		{
			RepeatSale\Service\QueueBufferProvider::getId() => new RepeatSale\Service\QueueBufferProvider(),
			default => null
		};
	}
}
