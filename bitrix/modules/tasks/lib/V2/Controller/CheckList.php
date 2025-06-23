<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller;

use Bitrix\Main\Type\Contract\Arrayable;
use Bitrix\Tasks\V2\Command\CheckList\SaveCheckListCommand;
use Bitrix\Tasks\V2\Access\CheckList\Permission;
use Bitrix\Tasks\V2\Access\Task;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Repository\CheckListRepositoryInterface;

class CheckList extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.CheckList.get
	 */
	#[Prefilter\CloseSession]
	public function getAction(
		#[Task\Permission\Read] Entity\Task $task,
		CheckListRepositoryInterface $checkListRepository,
	): ?Arrayable
	{
		return $checkListRepository->getByEntity(
			$task->getId(),
			$this->getContext()->getUserId(),
			Entity\CheckList\Type::Task
		);
	}

	/**
	 * @ajaxAction tasks.V2.CheckList.save
	 */
	public function saveAction(
		#[Permission\Save]Entity\Task $task,
		CheckListRepositoryInterface $checkListRepository,
	): ?Arrayable
	{
		$result = (new SaveCheckListCommand(
			task: $task,
			updatedBy: $this->getContext()->getUserId(),
		))->run();

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $checkListRepository->getByEntity(
			$task->getId(),
			$this->getContext()->getUserId(),
			Entity\CheckList\Type::Task
		);
	}
}
