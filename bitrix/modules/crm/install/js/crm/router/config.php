<?php

use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];
if (Loader::includeModule('crm'))
{
	$settings['isCallScoringV2Enabled'] = AIManager::isCallScoringV2Enabled();
}

return [
	'js' => '/bitrix/js/crm/router/dist/router.bundle.js',
	'rel' => [
		'main.core',
		'sidepanel',
	],
	'skip_core' => false,
	'settings' => $settings,
];
