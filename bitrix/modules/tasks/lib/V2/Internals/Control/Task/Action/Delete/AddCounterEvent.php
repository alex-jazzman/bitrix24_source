<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete;

use Bitrix\Tasks\Internals\Counter\CounterService;
use Bitrix\Tasks\Internals\Counter\Event\EventDictionary;

class AddCounterEvent
{
	public function __invoke(array $fullTaskData): void
	{
		CounterService::addEvent(
			EventDictionary::EVENT_AFTER_TASK_DELETE,
			$fullTaskData
		);
	}
}