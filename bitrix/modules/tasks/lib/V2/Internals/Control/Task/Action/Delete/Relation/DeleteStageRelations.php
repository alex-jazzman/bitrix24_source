<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation;

use Bitrix\Tasks\Kanban\TaskStageTable;

class DeleteStageRelations
{
	public function __invoke(array $fullTaskData): void
	{
		TaskStageTable::clearTask($fullTaskData['ID']);
	}
}