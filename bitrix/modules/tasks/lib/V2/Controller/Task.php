<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Tasks\V2\Access\Service\TaskRightService;
use Bitrix\Tasks\V2\Access\Task\ActionDictionary;
use Bitrix\Tasks\V2\Command\Task\AddTaskCommand;
use Bitrix\Tasks\V2\Command\Task\DeleteTaskCommand;
use Bitrix\Tasks\V2\Command\Task\UpdateTaskCommand;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Config\AddConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Config\DeleteConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Internals\Service\Link\LinkService;
use Bitrix\Tasks\V2\Provider\TaskProvider;

class Task extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Permission\Read] Entity\Task $task,
		TaskProvider $taskProvider,
		LinkService $linkService,
		TaskRightService $taskRightService,
	): ?Arrayable
	{
		$task = $taskProvider->getTaskById($task->getId());

		if (!$task)
		{
			return null;
		}

		$link = $linkService->get($task, $this->getContext()->getUserId());
		$rights = $taskRightService->get(ActionDictionary::TASK_ACTIONS, $task->getId(), $this->getContext()->getUserId());

		return $task->cloneWith(['link' => $link, 'rights' => $rights]);
	}

	/**
	 * @restMethod tasks.V2.Task.add
	 */
	public function addAction(
		#[Permission\Add] Entity\Task $task,
		LinkService $linkService,
		TaskRightService $taskRightService,
	): ?Arrayable
	{
		$result = (new AddTaskCommand(
			task: $task,
			config: new AddConfig($this->getContext()->getUserId()))
		)->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		/** @var Entity\Task $savedTask */
		$savedTask = $result->getObject();

		$rights = $taskRightService->get(ActionDictionary::TASK_ACTIONS, $savedTask->getId(), $this->getContext()->getUserId());
		$link = $linkService->get($task, $this->getContext()->getUserId());

		return $savedTask->cloneWith(['link' => $link, 'rights' => $rights]);
	}

	/**
	 * @restMethod tasks.V2.Task.update
	 */
	public function updateAction(
		#[Permission\Update] Entity\Task $task,
		LinkService $linkService,
		TaskRightService $taskRightService,
	): ?Arrayable
	{
		$result = (new UpdateTaskCommand(
			task: $task,
			config: new UpdateConfig($this->getContext()->getUserId()))
		)->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		$rights = $taskRightService->get(ActionDictionary::TASK_ACTIONS, $task->getId(), $this->getContext()->getUserId());
		$link = $linkService->get($task, $this->getContext()->getUserId());

		/** @var Entity\Task $savedTask */
		$savedTask = $result->getObject();

		return $savedTask->cloneWith(['link' => $link, 'rights' => $rights]);
	}

	/**
	 * @restMethod tasks.V2.Task.delete
	 */
	public function deleteAction(#[Permission\Delete] Entity\Task $task): ?Arrayable
	{
		$result = (new DeleteTaskCommand(
			taskId: $task->getId(),
			config: new DeleteConfig($this->getContext()->getUserId()))
		)->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}
}
