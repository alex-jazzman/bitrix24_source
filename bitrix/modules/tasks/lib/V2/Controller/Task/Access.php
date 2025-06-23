<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Access\Service\TaskRightService;
use Bitrix\Tasks\V2\Access\Task\ActionDictionary;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Controller\Prefilter;

class Access extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Access.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		Entity\Task $task,
		TaskRightService $taskRightService,
	): array
	{
		$rights = $taskRightService->get(ActionDictionary::TASK_ACTIONS, $task->getId(), $this->getContext()->getUserId());

		return [
			'taskId' => $task->getId(),
			'userId' => $this->getContext()->getUserId(),
			'rights' => $rights,
		];
	}
}