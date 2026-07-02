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
	'css' => 'dist/bitrixgpt-agreement-popup.bundle.css',
	'js' => 'dist/bitrixgpt-agreement-popup.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.dialog',
		'ui.system.typography',
		'ui.buttons',
		'ui.notification',
		'ui.banner-dispatcher',
	],
	'skip_core' => false,
	'settings' => [
		'zone' => $zone,
		'copilotName' => $copilotName,
	],
];
