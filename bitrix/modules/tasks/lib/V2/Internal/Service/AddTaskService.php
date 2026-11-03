<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internal\Service;

use Bitrix\Tasks\Control\Exception\TaskNotExistsException;
use Bitrix\Tasks\V2\Internal\Entity\Task;
use Bitrix\Tasks\V2\Internal\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\V2\Internal\Service\Consistency\ConsistencyResolverInterface;
use Bitrix\Tasks\V2\Internal\Service\Task\Action\Add\AddSearchIndex;
use Bitrix\Tasks\V2\Internal\Service\Task\Action\Add\AddUserFields;
use Bitrix\Tasks\V2\Internal\Service\Task\Action\Add\Config\AddConfig;
use Bitrix\Tasks\V2\Internal\Service\Task\Action\Add\Integration\RunBizProc;
use Bitrix\Tasks\V2\Internal\Service\Task\Action\Add\Integration\RunCrm;
use Bitrix\Tasks\V2\Internal\Service\Task\AddService;

class AddTaskService
{
	public function __construct(
		private readonly AddService $addService,
		private readonly ConsistencyResolverInterface $consistencyResolver,
		private readonly TaskRepositoryInterface $taskRepository,
	)
	{
	}

	/**
	 * @throws TaskNotExistsException
	 */
	public function add(Task $task, AddConfig $config): Task
	{
		if ($config->isUseConsistency())
		{
			[$task, $fields, $fullTaskData] = $this->consistencyResolver->resolve('task.add')->wrap(
				fn (): array => $this->addService->add(
					task: $task,
					config: $config,
					deferSearchIndex: true,
				),
			);
		}
		else
		{
			[$task, $fields, $fullTaskData] = $this->addService->add(
				task: $task,
				config: $config,
				deferSearchIndex: true,
			);
		}

		try
		{
			(new AddUserFields($config))($fields);
		}
		finally
		{
			(new AddSearchIndex())($fullTaskData);
			$this->taskRepository->invalidate($task->id);
		}

		(new RunBizProc($config))($fields);

		$this->taskRepository->invalidate($task->id);

		(new RunCrm($config))($fields);

		$this->taskRepository->invalidate($task->id);

		$task = $this->taskRepository->getById($task->id);

		if ($task === null)
		{
			throw new TaskNotExistsException();
		}

		return $task;
	}
}
