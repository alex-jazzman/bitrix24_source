<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation;

use Bitrix\Tasks\CheckList\Task\TaskCheckListFacade;

class DeleteChecklists
{
	public function __invoke(array $fullTaskData): void
	{
		TaskCheckListFacade::deleteByEntityIdOnLowLevel($fullTaskData['ID']);
	}
}