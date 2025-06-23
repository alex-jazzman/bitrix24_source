<?php

namespace Bitrix\Crm\RepeatSale\Service;

use Bitrix\Crm\Copilot\AiQueueBuffer\Provider\QueueBufferProviderInterface;
use Bitrix\Main\Result;

final class QueueBufferProvider implements QueueBufferProviderInterface
{
	public static function getId(): int
	{
		return 1;
	}

	public function process(?array $data = null): Result
	{
		// @todo process data and move to ai_queue

		return new Result();
	}
}
