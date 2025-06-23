<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Command\Task\UpdatePlanCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Access\Task\Plan\Permission;

class Plan extends BaseController
{
	public function updateAction(
		#[Permission\Update]
		Entity\Task $task
	): ?Entity\EntityInterface
	{
		$result = (new UpdatePlanCommand(
			taskId: $task->getId(),
			config: new UpdateConfig($this->getContext()->getUserId()),
			startPlanTs: $task->startPlanTs,
			endPlanTs: $task->endPlanTs,
			duration: $task->plannedDuration,
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}
}