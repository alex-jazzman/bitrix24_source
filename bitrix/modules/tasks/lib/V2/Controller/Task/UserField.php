<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Controller\Prefilter;
use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\TaskUserFieldsRepository;

class UserField extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.UserField.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Permission\Read] Entity\Task $task,
		TaskUserFieldsRepository $fieldsRepository,
	): Entity\UserFieldCollection
	{
		return $fieldsRepository->getByTaskId($task->getId());
	}
}
