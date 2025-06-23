<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('tasks'))
{
	return [];
}

return [
	'css' => 'dist/deadline.bundle.css',
	'js' => 'dist/deadline.bundle.js',
	'rel' => [
		'tasks.v2.lib.height-transition',
		'ui.vue3.components.popup',
		'tasks.v2.provider.service.task-service',
		'main.date',
		'ui.date-picker',
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.lib.timezone',
		'tasks.v2.lib.analytics',
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'calendarSettings' => \Bitrix\Tasks\Util\Calendar::getSettings(),
	],
];
