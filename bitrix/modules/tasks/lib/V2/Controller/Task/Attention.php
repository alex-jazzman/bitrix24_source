<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Controller\Task;

use Bitrix\Tasks\V2\Access\Task\Permission;
use Bitrix\Tasks\V2\Command\Task\Attention\MuteTaskCommand;
use Bitrix\Tasks\V2\Command\Task\Attention\PinTaskCommand;
use Bitrix\Tasks\V2\Command\Task\Attention\UnmuteTaskCommand;
use Bitrix\Tasks\V2\Command\Task\Attention\UnpinTaskCommand;
use Bitrix\Tasks\V2\Controller\BaseController;
use Bitrix\Tasks\V2\Entity;

class Attention extends BaseController
{
	/**
	 * @ajaxAction tasks.V2.Task.Attention.mute
	 */
	public function muteAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new MuteTaskCommand(
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
	 * @ajaxAction tasks.V2.Task.Attention.unmute
	 */
	public function unmuteAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new UnmuteTaskCommand(
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
	 * @ajaxAction tasks.V2.Task.Attention.pin
	 */
	public function pinAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new PinTaskCommand(
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
	 * @ajaxAction tasks.V2.Task.Attention.unpin
	 */
	public function unpinAction(
		#[Permission\Read] Entity\Task $task
	): ?bool
	{
		$result = (new UnpinTaskCommand(
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