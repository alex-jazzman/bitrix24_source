<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Async\Message;

use Bitrix\Tasks\V2\Internals\Async\AbstractBaseMessage;
use Bitrix\Tasks\V2\Internals\Async\QueueId;

class AddDavSync extends AbstractBaseMessage
{
	public function __construct(
		public readonly array $fields
	)
	{

	}

	public function jsonSerialize(): array
	{
		return [
			'fields' => $this->fields
		];
	}

	protected function getQueueId(): QueueId
	{
		return QueueId::AddDavSync;
	}
}