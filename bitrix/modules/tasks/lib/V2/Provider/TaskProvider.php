<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Provider;

use Bitrix\Tasks\V2\Entity\Task;
use Bitrix\Tasks\V2\FormV2Feature;
use Bitrix\Tasks\V2\Internals\Repository\ChatRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Service\Esg\EgressInterface;

class TaskProvider
{
	public function __construct(
		private readonly TaskRepositoryInterface $taskRepository,
		private readonly ChatRepositoryInterface $chatRepository,
		private readonly EgressInterface $egressController,
	)
	{
	}

	public function getTaskById(int $taskId): Task|null
	{
		$task = $this->taskRepository->getById($taskId);

		if ($task === null)
		{
			return null;
		}

		if (FormV2Feature::isOn('miniform') && !FormV2Feature::isOn())
		{
			return $task;
		}

		if ($task->chatId === null)
		{
			$updatedTask = $this->egressController->createChatForExistingTask($task);

			$this->chatRepository->save(
				chatId: $updatedTask->chatId,
				taskId: $taskId,
			);

			return $updatedTask;
		}

		return $task;
	}
}
