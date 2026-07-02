<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

$copilotName = (new CopilotNameService())->getCopilotName();

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.alerts',
		'ui.section',
		'ai.ui.field.selectorfield',
		'ui.form-elements.view',
		'ui.form-elements.field',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
	],
];
