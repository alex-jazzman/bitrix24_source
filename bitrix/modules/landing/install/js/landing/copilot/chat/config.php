<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\Services\CopilotNameService;
use Bitrix\Main\Loader;

$copilotName = '';
if (Loader::includeModule('ai'))
{
	$copilotName = (new CopilotNameService())->getCopilotName();
}

return [
	'css' => 'dist/chat.bundle.css',
	'js' => 'dist/chat.bundle.js',
	'rel' => [
		'main.core',
		'ai.copilot-chat.core',
		'ai.copilot-chat.ui',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
	],
];
