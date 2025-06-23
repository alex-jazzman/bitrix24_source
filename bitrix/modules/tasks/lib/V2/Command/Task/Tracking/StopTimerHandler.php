<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Tracking;

use Bitrix\Tasks\V2\Entity\Task\Timer;
use Bitrix\Tasks\V2\Internals\Service\Task\TimeManagementService;

class StopTimerHandler
{
	public function __construct(
		private readonly TimeManagementService $timeManagementService,
	)
	{

	}

	public function __invoke(StopTimerCommand $command): Timer
	{
		return $this->timeManagementService->stopTimer(
			userId: $command->userId,
			taskId: $command->taskId,
		);
	}
}