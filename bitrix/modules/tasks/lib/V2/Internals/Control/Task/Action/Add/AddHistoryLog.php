<?php

declare(strict_types=1);


namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait\ConfigTrait;
use Bitrix\Tasks\V2\Internals\Control\Task\Trait\OccurredUserTrait;
use Bitrix\Tasks\UI;
use Bitrix\Tasks\Util\User;
use CTaskLog;

class AddHistoryLog
{
	use ConfigTrait;
	use OccurredUserTrait;

	public function __invoke(array $fields): void
	{
		$arLogFields = [
			"TASK_ID" => $fields['ID'],
			"USER_ID" => $this->getOccurredUserId($this->config->getUserId()),
			"CREATED_DATE" => UI::formatDateTime(User::getTime()),
			"FIELD" => "NEW",
		];

		$log = new CTaskLog();
		$log->Add($arLogFields);
	}
}