<?php

use Bitrix\Main\Application;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$zone = Application::getInstance()->getLicense()->getRegion() ?? 'en';
$copilotName = (new CopilotNameService())->getCopilotName();

return [
	'css' => 'dist/copilot-agreement.bundle.css',
	'js' => 'dist/copilot-agreement.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.notification',
		'ai.engine',
	],
	'skip_core' => false,
	'settings' => [
		'zone' => $zone,
		'copilotName' => $copilotName,
	]
];
