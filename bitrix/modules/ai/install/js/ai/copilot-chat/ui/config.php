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
	'css' => 'dist/copilot-chat.bundle.css',
	'js' => 'dist/copilot-chat.bundle.js',
	'rel' => [
		'ui.icon-set.actions',
		'ai.speech-converter',
		'main.core.events',
		'ui.vue3',
		'ui.icon-set.main',
		'main.date',
		'ui.icon-set.api.core',
		'main.popup',
		'ui.icon-set.api.vue',
		'ui.bbcode.formatter.html-formatter',
		'helper',
		'main.loader',
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
	],
];
