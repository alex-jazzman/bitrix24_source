<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete;

use Bitrix\Tasks\Internals\Counter\CounterService;

class CollectCounter
{
	public function __invoke(array $fullTaskData): void
	{
		CounterService::getInstance()->collectData((int)$fullTaskData['ID']);
	}
}