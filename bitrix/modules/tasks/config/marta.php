<?php

use Bitrix\Tasks\V2\Internal\Integration\AiAssistant\Service\Agent\TasksOnboardingAgent;
use Bitrix\Tasks\V2\Internal\Integration\AiAssistant\Service\ToolSet\TasksToolSet;

return [
	'value' => [
		'agents' => [
			TasksOnboardingAgent::class,
		],
		'toolSets' => [
			TasksToolSet::class,
		],
	],
	'readonly' => true,
];
