<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Integration\AI\AIManager;
use Bitrix\Main\Loader;

$langAdditional = [];
if (Loader::includeModule('crm'))
{
	$langAdditional['COPILOT_NAME'] = AIManager::getCopilotName();
}

return [
	'js' => 'dist/name-service.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'lang_additional' => $langAdditional,
];
