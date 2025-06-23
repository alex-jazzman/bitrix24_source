<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteChecklists;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteFavorite;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteFiles;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteLivefeedLogs;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteParameters;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteResults;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteSearchIndex;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteSort;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteStageRelations;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteTags;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteTemplateDependencies;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteTopics;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteUserFields;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteUserOptions;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation\DeleteViews;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Trait\ConfigTrait;

class FullDeleteRelations
{
	use ConfigTrait;

	public function __invoke(array $fullTaskData): void
	{
		if ($this->config->getRuntime()->isMovedToRecyclebin())
		{
			return;
		}

		(new DeleteFiles())($fullTaskData);
		(new DeleteTags())($fullTaskData);
		(new DeleteFavorite())($fullTaskData);
		(new DeleteSort())($fullTaskData);
		(new DeleteUserOptions())($fullTaskData);
		(new DeleteStageRelations())($fullTaskData);
		(new DeleteChecklists())($fullTaskData);
		(new DeleteResults($this->config))($fullTaskData);
		(new DeleteViews())($fullTaskData);
		(new DeleteParameters())($fullTaskData);
		(new DeleteSearchIndex())($fullTaskData);
		(new DeleteTemplateDependencies())($fullTaskData);
		(new DeleteTopics())($fullTaskData);
		(new DeleteUserFields())($fullTaskData);
		(new DeleteLivefeedLogs())($fullTaskData);
	}
}
