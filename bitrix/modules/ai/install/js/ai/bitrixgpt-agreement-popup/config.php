<?php

use Bitrix\Main\Application;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$zone = Application::getInstance()->getLicense()->getRegion() ?? 'en';

return [
	'css' => 'dist/bitrixgpt-agreement-popup.bundle.css',
	'js' => 'dist/bitrixgpt-agreement-popup.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.dialog',
		'ui.system.typography',
		'ui.buttons',
		'ui.notification',
	],
	'skip_core' => false,
	'settings' => [
		'zone' => $zone,
	],
];
