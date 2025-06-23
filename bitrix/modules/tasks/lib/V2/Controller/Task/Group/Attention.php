<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task\Group;

use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Command\Task\Attention\PinInGroupTaskCommand;
use Bitrix\Tasks\V2\Command\Task\Attention\UnpinInGroupTaskCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;

class Attention extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Group.Attention.pin
	 */
	public function pinAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new PinInGroupTaskCommand(
			taskId: $task->getId(),
			userId: $this->getContext()->getUserId(),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return true;
	}

	/**
	 * @ajaxAction tasks.V2.Task.Group.Attention.unpin
	 */
	public function unpinAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new UnpinInGroupTaskCommand(
			taskId: $task->getId(),
			userId: $this->getContext()->getUserId(),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return true;
	}
}