<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete;

class RecountSort
{
	public function __invoke(array $fullTaskData): void
	{
		(new Async\Message\RecountSort((int)$fullTaskData['ID']))->sendByTaskId((int)$fullTaskData['ID']);
	}
}