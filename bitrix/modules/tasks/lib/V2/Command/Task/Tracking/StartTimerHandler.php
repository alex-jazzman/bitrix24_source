<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Tracking;

use Bitrix\Tasks\V2\Entity\Task\Timer;
use Bitrix\Tasks\V2\Internals\Service\Task\TimeManagementService;

class StartTimerHandler
{
	public function __construct(
		private readonly TimeManagementService $timeManagementService,
	)
	{

	}
	public function __invoke(StartTimerCommand $command): Timer
	{
		return $this->timeManagementService->startTimer(
			userId: $command->userId,
			taskId: $command->taskId,
			syncPlan: $command->syncPlan,
			canStart: $command->canStart,
			canRenew: $command->canRenew,
		);
	}
}