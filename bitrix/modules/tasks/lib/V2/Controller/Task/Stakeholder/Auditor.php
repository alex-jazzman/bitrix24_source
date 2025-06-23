<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task\Stakeholder;

use Bitrix\Tasks\V2\Command\Task\Stakeholder\SetAuditorsCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Access\Task\Auditor\Permission;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;

class Auditor extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Stakeholder.Auditor.set
	 */
	public function setAction(
		#[Permission\Update]
		Entity\Task $task,
	): ?Entity\EntityInterface
	{
		$result = (new SetAuditorsCommand(
			taskId: $task->getId(),
			auditorIds: (array)$task->auditors?->getIdList(),
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