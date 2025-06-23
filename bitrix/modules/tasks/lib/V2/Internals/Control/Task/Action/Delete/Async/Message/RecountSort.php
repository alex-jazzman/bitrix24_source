<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Async\Message;

use Bitrix\Tasks\V2\Internals\Async\AbstractBaseMessage;
use Bitrix\Tasks\V2\Internals\Async\QueueId;

class RecountSort extends AbstractBaseMessage
{
	public function __construct(
		public readonly int $taskId
	)
	{

	}

	protected function getQueueId(): QueueId
	{
		return QueueId::RecountSort;
	}

	public function jsonSerialize(): array
	{
		return [
			'taskId' => $this->taskId
		];
	}
}