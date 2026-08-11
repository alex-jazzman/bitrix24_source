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
		'ai.ui.field.selectorfield',
		'main.core',
		'main.core.events',
		'ui.alerts',
		'ui.form-elements.field',
		'ui.form-elements.view',
		'ui.section',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
	],
];
