<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Option\Action\Add;

use Bitrix\Main\Event;
use Bitrix\Tasks\V2\Entity;

class RunAddEvent
{
	public function __invoke(Entity\Task\UserOption $userOption): void
	{
		$event = new Event(
			'tasks',
			'onTaskUserOptionChanged',
			[
				'taskId' => $userOption->taskId,
				'userId' => $userOption->userId,
				'option' => $userOption->code,
				'added' => true,
			]
		);
		$event->send();
	}
}