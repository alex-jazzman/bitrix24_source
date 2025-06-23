<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\TaskLogRepositoryInterface;

class History extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.History.tail
	 */
	#[Prefilter\CloseSession]
	public function tailAction(
		#[Permission\Read] Entity\Task $task,
		TaskLogRepositoryInterface $historyRepository,
		int $offset = 0
	): Arrayable
	{
		return $historyRepository->tail($task->id, $offset);
	}
}
