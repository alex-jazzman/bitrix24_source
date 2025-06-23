<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task\Tracking;

use Bitrix\Tasks\Access\ActionDictionary;
use Bitrix\Tasks\V2\Access\Factory\AccessControllerTrait;
use Bitrix\Tasks\V2\Access\Factory\Type;
use Bitrix\Tasks\V2\Command\Task\Tracking\StartTimerCommand;
use Bitrix\Tasks\V2\Command\Task\Tracking\StopTimerCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Access\Task\Tracking;

class Timer extends BaseController
{
	use AccessControllerTrait;

	/**
	 * @ajaxAction tasks.V2.Task.Tracking.Timer.start
	 */
	public function startAction(
		#[Permission\Read]
		#[Tracking\Permission\Track]
		Entity\Task $task,
	): ?Entity\EntityInterface
	{
		$userId = $this->getContext()->getUserId();
		$taskId = $task->getId();

		$accessController = $this->getAccessController(Type::Task, $this->getContext());

		$result = (new StartTimerCommand(
			userId: $userId,
			taskId: $taskId,
			syncPlan: true,
			canStart: $accessController->checkByItemId(ActionDictionary::ACTION_TASK_START, $taskId),
			canRenew: $accessController->checkByItemId(ActionDictionary::ACTION_TASK_RENEW, $taskId),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}

	/**
	 * @ajaxAction tasks.V2.Task.Tracking.Timer.stop
	 */
	public function stopAction(
		#[Permission\Read]
		#[Tracking\Permission\Track]
		Entity\Task $task,
	): ?Entity\EntityInterface
	{
		$userId = $this->getContext()->getUserId();
		$taskId = $task->getId();

		$result = (new StopTimerCommand(
			userId: $userId,
			taskId: $taskId,
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}
}