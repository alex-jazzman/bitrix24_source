<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Update;

use Bitrix\Tasks\Internals\Counter\CounterService;

class CollectCounter
{
	public function __invoke(int $taskId): void
	{
		CounterService::getInstance()->collectData($taskId);
	}
}