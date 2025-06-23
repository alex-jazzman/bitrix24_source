<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation;

class DeleteMembers
{
	public function __invoke(array $fullTaskData): void
	{
		\CTaskMembers::DeleteAllByTaskID($fullTaskData['ID']);
	}
}