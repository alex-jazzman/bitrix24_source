<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task\Stakeholder;

use Bitrix\Tasks\V2\Command\Task\Stakeholder\DelegateCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Access\Task\Responsible\Permission;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;

class Responsible extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Stakeholder.Responsible.delegate
	 */
	public function delegateAction(
		#[Permission\Delegate]
		Entity\Task $task,
	): ?Entity\EntityInterface
	{
		$result = (new DelegateCommand(
			taskId: $task->getId(),
			responsibleId: (int)$task->responsible?->getId(),
			config: new UpdateConfig($this->getContext()->getUserId()),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getObject();
	}
}