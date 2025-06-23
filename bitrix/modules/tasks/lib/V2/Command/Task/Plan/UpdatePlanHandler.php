<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task;

use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateUserFields;
use Bitrix\Tasks\V2\Internals\Service\Task\UpdateService;

class UpdatePlanHandler
{
	public function __construct(
		private readonly ConsistencyResolverInterface $consistencyResolver,
		private readonly UpdateService $updateService,
	)
	{

	}

	public function __invoke(UpdatePlanCommand $command): Entity\Task
	{
		$entity = new Entity\Task(
			id: $command->taskId,
			startPlanTs: $command->startPlanTs,
			endPlanTs: $command->endPlanTs,
			plannedDuration: $command->duration,
		);

		[$task, $fields] = $this->consistencyResolver->resolve('task.update')->wrap(
			fn (): array => $this->updateService->update($entity, $command->config)
		);

		// this action is outside of consistency because it is containing nested transactions
		(new UpdateUserFields($command->config))($fields, $command->taskId);

		return $task;
	}
}
