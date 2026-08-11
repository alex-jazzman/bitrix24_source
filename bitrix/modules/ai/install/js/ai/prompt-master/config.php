<?php

use Bitrix\Main\Loader;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$currentUserId = null;
$language = 'en';
$copilotName = (new CopilotNameService())->getCopilotName();

if (Loader::includeModule('ai'))
{
	$language = \Bitrix\AI\Facade\User::getUserLanguage();
	$currentUserId = Bitrix\AI\Facade\User::getCurrentUserId();
}

return [
	'css' => 'dist/prompt-master.bundle.css',
	'js' => 'dist/prompt-master.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.alerts',
		'ui.analytics',
		'ui.buttons',
		'ui.entity-selector',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.main',
		'ui.vue3',
		'ui.vue3.components.hint',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
	'settings' => [
		'userId' => Bitrix\AI\Facade\User::getCurrentUserId(),
		'language' => $language,
		'copilotName' => $copilotName,
	]
];
