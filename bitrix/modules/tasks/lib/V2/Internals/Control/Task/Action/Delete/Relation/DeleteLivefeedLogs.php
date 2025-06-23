<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Relation;

use Bitrix\Main\Loader;
use Bitrix\Tasks\Integration\SocialNetwork\Log;

class DeleteLivefeedLogs
{
	public function __invoke(array $fullTaskData): void
	{
		if (Loader::includeModule('socialnetwork'))
		{
			Log::deleteLogByTaskId($fullTaskData['ID']);
		}
	}
}