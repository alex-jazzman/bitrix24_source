<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Command\Task\Audit\UnwatchTaskCommand;
use Bitrix\Tasks\V2\Command\Task\Audit\WatchTaskCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;

class Audit extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Audit.watch
	 */
	public function watchAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new WatchTaskCommand(
			taskId: $task->getId(),
			userId: $this->getContext()->getUserId(),
			auditorId: $this->getContext()->getUserId(),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return true;
	}

	/**
	 * @ajaxAction tasks.V2.Task.Audit.unwatch
	 */
	public function unwatchAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new UnwatchTaskCommand(
			taskId: $task->getId(),
			userId: $this->getContext()->getUserId(),
			auditorId: $this->getContext()->getUserId(),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return true;
	}
}