<?php

declare(strict_types=1);


namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait\ConfigTrait;
use Bitrix\Tasks\Internals\Task\ScenarioTable;

class AddScenario
{
	use ConfigTrait;

	public function __invoke(array $fields): void
	{
		$taskId = $fields['ID'];

		if (empty($fields['SCENARIO_NAME']))
		{
			// set default scenario if none specified
			ScenarioTable::insertIgnore($taskId, [ScenarioTable::SCENARIO_DEFAULT]);
			return;
		}

		$scenarios = is_array($fields['SCENARIO_NAME']) ? $fields['SCENARIO_NAME']
			: [$fields['SCENARIO_NAME']];

		ScenarioTable::insertIgnore($taskId, $scenarios);
	}
}