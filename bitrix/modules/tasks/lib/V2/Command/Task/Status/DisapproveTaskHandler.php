<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Status;

use Bitrix\Tasks\V2\Entity\Task;
use Bitrix\Tasks\V2\Internals\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateUserFields;
use Bitrix\Tasks\V2\Internals\Service\Task\StatusService;

class DisapproveTaskHandler
{
	public function __construct(
		private readonly StatusService $statusService,
		private readonly ConsistencyResolverInterface $consistencyResolver,
	)
	{

	}

	public function __invoke(DisapproveTaskCommand $command): Task
	{
		[$task, $fields] = $this->consistencyResolver->resolve('task.status')->wrap(
			fn () => $this->statusService->disapprove($command->taskId, $command->config)
		);

		// this action is outside of consistency because it is containing nested transactions
		(new UpdateUserFields($command->config))($fields, $command->taskId);

		return $task;
	}
}