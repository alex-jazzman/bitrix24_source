<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Command\Task\Favorite\AddFavoriteCommand;
use Bitrix\Tasks\V2\Command\Task\Favorite\DeleteFavoriteCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;

class Favorite extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Favorite.add
	 */
	public function addAction(
		#[Permission\Read] Entity\Task $task,
	): ?bool
	{
		$result = (new AddFavoriteCommand(
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
	 * @ajaxAction tasks.V2.Task.Favorite.delete
	 */
	public function deleteAction(
		#[Permission\Read] Entity\Task $task,
	): ?bool
	{
		$result = (new DeleteFavoriteCommand(
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