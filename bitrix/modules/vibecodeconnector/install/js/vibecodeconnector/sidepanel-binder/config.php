<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Internal\Service\Catalog\OpenApp\OpenAppSettings;

$moduleLoaded = Loader::includeModule('vibecodeconnector');
$serviceLocator = ServiceLocator::getInstance();
$openAppInIframe = $moduleLoaded && $serviceLocator->get(OpenAppSettings::class)->isOpenInIframeEnabled();

return [
	'js' => './dist/sidepanel-binder.bundle.js',
	'css' => './dist/sidepanel-binder.bundle.css',
	'rel' => [
		'main.core',
		'main.sidepanel',
	],
	'settings' => [
		'openAppInIframe' => $openAppInIframe,
	],
	'skip_core' => false,
];
