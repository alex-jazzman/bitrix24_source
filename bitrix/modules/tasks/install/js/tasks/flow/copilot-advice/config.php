<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-advice.bundle.css',
	'js' => 'dist/copilot-advice.bundle.js',
	'rel' => [
		'ai.copilot-chat.ui',
		'main.core',
		'tasks.flow.edit-form',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => \Bitrix\Tasks\Integration\AI\Settings::getCopilotName(),
	],
];
