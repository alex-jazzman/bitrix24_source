<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Status;

use Bitrix\Tasks\V2\Internals\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateUserFields;
use Bitrix\Tasks\V2\Internals\Service\Task\StatusService;
use Bitrix\Tasks\V2\Entity;

class StartTaskHandler
{
	public function __construct(
		private readonly StatusService $statusService,
		private readonly ConsistencyResolverInterface $consistencyResolver,
	)
	{

	}

	public function __invoke(StartTaskCommand $command): Entity\Task
	{
		[$task, $fields] = $this->consistencyResolver->resolve('task.start')->wrap(
			fn () => $this->statusService->start($command->taskId, $command->config)
		);

		// this action is outside of consistency because it is containing nested transactions
		(new UpdateUserFields($command->config))($fields, $command->taskId);

		return $task;
	}
}