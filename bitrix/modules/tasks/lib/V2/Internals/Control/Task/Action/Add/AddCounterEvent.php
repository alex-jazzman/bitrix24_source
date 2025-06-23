<?php

declare(strict_types=1);


namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait\ConfigTrait;
use Bitrix\Tasks\Internals\Counter\CounterService;
use Bitrix\Tasks\Internals\Counter\Event\EventDictionary;

class AddCounterEvent
{
	use ConfigTrait;

	public function __invoke(array $fields): void
	{
		CounterService::addEvent(EventDictionary::EVENT_AFTER_TASK_ADD, $fields);
	}
}