<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

$copilotName = (new CopilotNameService())->getCopilotName();

return [
	'css' => 'dist/copilot-chat.bundle.css',
	'js' => 'dist/copilot-chat.bundle.js',
	'rel' => [
		'ai.speech-converter',
		'helper',
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.popup',
		'ui.bbcode.formatter.html-formatter',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => [
		'copilotName' => $copilotName,
	],
];
