<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Integration;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Trait\ConfigTrait;
use Bitrix\Tasks\Integration\CRM\TimeLineManager;

class RunCrm
{
	use ConfigTrait;

	public function __invoke(array $fullTaskData): void
	{
		TimeLineManager::get($fullTaskData['ID'])
			->setUserId($this->config->getUserId())
			->save();
	}
}