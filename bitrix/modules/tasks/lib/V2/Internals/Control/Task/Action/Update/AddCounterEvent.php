<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Update;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Trait\ConfigTrait;
use Bitrix\Tasks\Internals\Counter\CounterService;
use Bitrix\Tasks\Internals\Counter\Event\EventDictionary;

class AddCounterEvent
{
	use ConfigTrait;

	public function __invoke(array $fullTaskData, array $sourceTaskData): void
	{
		if ($this->config->isSkipRecount())
		{
			return;
		}

		CounterService::addEvent(
			EventDictionary::EVENT_AFTER_TASK_UPDATE,
			[
				'OLD_RECORD' => $sourceTaskData,
				'NEW_RECORD' => $fullTaskData,
				'PARAMS' => $this->config->getByPassParameters(),
			]
		);
	}
}