<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Async\Message;

use Bitrix\Tasks\V2\Internals\Async\AbstractBaseMessage;
use Bitrix\Tasks\V2\Internals\Async\QueueId;

class UpdateDavSync extends AbstractBaseMessage
{
	public function __construct(
		public readonly array $fields,
		public readonly array $task
	)
	{

	}
	protected function getQueueId(): QueueId
	{
		return QueueId::UpdateDavSync;
	}

	public function jsonSerialize(): array
	{
		return [
			'fields' => $this->fields,
			'task' => $this->task
		];
	}
}