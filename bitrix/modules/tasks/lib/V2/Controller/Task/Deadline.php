<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Main\Error;
use Bitrix\Tasks\V2\Access\Task\Deadline\Permission;
use Bitrix\Tasks\V2\Command\Task\Deadline\UpdateDeadlineCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;

class Deadline extends BaseController
{
	/**
	 * @ajaxAction tasks.v2.Task.Deadline.update
	 */
	public function updateAction(
		#[Permission\Update]
		Entity\Task $task
	): ?Entity\EntityInterface
	{
		$result = (new UpdateDeadlineCommand(
			taskId: $task->getId(),
			deadlineTs: $task->deadlineTs,
			config: new UpdateConfig($this->getContext()->getUserId()))
		)->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}
}
