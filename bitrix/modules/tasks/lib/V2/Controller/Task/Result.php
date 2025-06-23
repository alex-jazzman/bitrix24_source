<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Controller\Prefilter;
use Bitrix\Main\Error;
use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Tasks\V2\Access\Task;
use Bitrix\Tasks\V2\Command\Task\Result\AddResultCommand;
use Bitrix\Tasks\V2\Command\Task\Result\UpdateResultCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Access\Task\Result\Permission;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Provider\TaskResultProvider;

class Result extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Result.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Permission\Read] Entity\Result $result,
		TaskResultProvider $taskResultProvider,
	): ?Arrayable
	{
		return $taskResultProvider->getResultById($result->id);
	}

	/**
	 * @ajaxAction tasks.V2.Task.Result.list
	 */
	public function listAction(
		#[Task\Permission\Read] Entity\Task $task,
		TaskResultProvider $taskResultProvider,
	): ?Arrayable
	{
		return $taskResultProvider->getTaskResults($task->id);
	}

	/**
	 * @ajaxAction tasks.V2.Task.Result.add
	 */
	public function addAction(
		#[Permission\Read] Entity\Result $result,
	): ?Arrayable
	{
		$commandResult = (new AddResultCommand(
			result: $result,
			userId: $this->getContext()->getUserId(),
		))->run();

		if (!$commandResult->isSuccess())
		{
			$this->addErrors($commandResult->getErrors());

			return null;
		}

		return $commandResult->getObject();
	}

	/**
	 * @ajaxAction tasks.V2.Task.Result.update
	 */
	public function updateAction(
		#[Permission\Update] Entity\Result $result,
	): ?Arrayable
	{
		$commandResult = (new UpdateResultCommand(
			result: $result,
			userId: $this->getContext()->getUserId(),
		))->run();

		if (!$commandResult->isSuccess())
		{
			$this->addError(new Error('Can not update task result'));

			return null;
		}

		return $commandResult->getObject();
	}
}
