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
	'js' => 'dist/core.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.vuex',
		'tasks.v2.model.epics',
		'tasks.v2.model.flows',
		'tasks.v2.model.groups',
		'tasks.v2.model.interface',
		'tasks.v2.model.stages',
		'tasks.v2.model.tasks',
		'tasks.v2.model.check-list',
		'tasks.v2.model.users',
		'tasks.v2.provider.pull.pull-manager',
	],
	'skip_core' => false,
	'settings' => (new \Bitrix\Tasks\V2\Internals\Service\Extension\Config())->getCoreSettings(),
];
