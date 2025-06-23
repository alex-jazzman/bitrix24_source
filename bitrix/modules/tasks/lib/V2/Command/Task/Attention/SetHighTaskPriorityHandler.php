<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Attention;

use Bitrix\Tasks\V2\Internals\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateUserFields;
use Bitrix\Tasks\V2\Internals\Service\Task\UpdateService;
use Bitrix\Tasks\V2\Entity;

class SetHighTaskPriorityHandler
{
	public function __construct(
		private readonly ConsistencyResolverInterface $consistencyResolver,
		private readonly UpdateService $updateService,
	)
	{

	}

	public function __invoke(SetHighTaskPriorityCommand $command): Entity\Task
	{
		$entity = new Entity\Task(
			id: $command->taskId,
			priority: Entity\Task\Priority::High,
		);

		$config = new UpdateConfig(
			userId: $command->userId,
		);

		[$task, $fields] = $this->consistencyResolver->resolve('task.priority')->wrap(
			fn (): array => $this->updateService->update($entity, $config)
		);

		// this action is outside of consistency because it is containing nested transactions
		(new UpdateUserFields($config))($fields, $command->taskId);

		return $task;
	}
}